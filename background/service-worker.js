// Universal Audio Translator — Service Worker
// WBS 1.4 — Orkestrasyon, tabCapture, offscreen yönetimi, mesaj routing, keep-alive

import { getSettings } from '../lib/settings.js';

let isCapturing = false;
let activeTabId = null;
let offscreenPort = null;

console.log('[UAT] Service worker loaded');

// ─── Offscreen Port Bağlantısı ───
// Offscreen document açıldığında bağlantı kurar
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'offscreen') {
    console.log('[UAT] Offscreen port connected');
    offscreenPort = port;

    port.onMessage.addListener((message) => {
      switch (message.type) {
        case 'TRANSLATION':
          forwardToContentScript({
            type: 'SHOW_SUBTITLE',
            text: message.text,
            isFinal: message.isFinal,
          });
          break;
        case 'AUDIO_DATA':
          break;
        case 'LOG':
          console.log('[OFFSCREEN]', message.message);
          break;
        case 'ERROR':
          console.error('[UAT] Error from offscreen:', message.message);
          updateBadge('error');
          break;
        case 'CAPTURE_STARTED':
          console.log('[UAT] Capture started successfully');
          isCapturing = true;
          updateBadge('active');
          startKeepAlive();
          break;
        case 'CAPTURE_FAILED':
          console.error('[UAT] Capture failed:', message.error);
          isCapturing = false;
          updateBadge('error');
          break;
      }
    });

    port.onDisconnect.addListener(() => {
      console.log('[UAT] Offscreen port disconnected');
      offscreenPort = null;
    });
  }
});

// ─── Popup/Content Script Mesajları ───
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'START':
      // Hemen yanıt ver, işi arka planda yap (popup kapanabilir)
      sendResponse({ success: true, pending: true });
      handleStart().catch((e) => {
        console.error('[UAT] Start error:', e);
        updateBadge('error');
      });
      return false;

    case 'STOP':
      sendResponse({ success: true, pending: true });
      handleStop().catch((e) => console.error('[UAT] Stop error:', e));
      return false;

    case 'GET_STATUS':
      sendResponse({ isCapturing, activeTabId });
      return false;
  }
});

// ─── Start ───
async function handleStart() {
  // Önceki her şeyi tamamen temizle
  await cleanupAll();

  const settings = await getSettings();
  if (!settings.apiKeys.gemini) {
    console.error('[UAT] Gemini API key girilmemiş');
    updateBadge('error');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    console.error('[UAT] Aktif sekme bulunamadı');
    updateBadge('error');
    return;
  }
  activeTabId = tab.id;
  updateBadge('connecting');

  // 1. ÖNCE offscreen document oluştur ve port bağlantısını bekle
  console.log('[UAT] Adım 1: Offscreen document oluşturuluyor...');
  await chrome.offscreen.createDocument({
    url: 'offscreen/offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Tab audio capture for translation',
  });

  await waitForOffscreenPort(5000);
  if (!offscreenPort) {
    console.error('[UAT] Offscreen port bağlanamadı');
    updateBadge('error');
    return;
  }
  console.log('[UAT] Adım 1 OK: Offscreen hazır');

  // 2. SONRA stream ID al (offscreen hazır olduktan sonra)
  console.log('[UAT] Adım 2: Stream ID alınıyor...');
  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: activeTabId });
  console.log('[UAT] Adım 2 OK: Stream ID alındı');

  // 3. Offscreen'e capture başlat
  console.log('[UAT] Adım 3: Capture başlatılıyor...');
  offscreenPort.postMessage({
    type: 'START_CAPTURE',
    streamId,
    config: {
      apiKey: settings.apiKeys.gemini,
      targetLanguage: settings.targetLanguage,
      selectedModel: settings.selectedModel,
      voiceName: getActiveVoiceName(settings),
      customDictionary: settings.customDictionary || [],
      displayMode: settings.displayMode || 'subtitles_only',
    },
  });
  console.log('[UAT] Adım 3 OK: START_CAPTURE gönderildi, yanıt bekleniyor...');
}

async function cleanupAll() {
  console.log('[UAT] Cleanup başlatılıyor...');
  isCapturing = false;
  activeTabId = null;
  offscreenPort = null;
  stopKeepAlive();

  try {
    if (await chrome.offscreen.hasDocument()) {
      await chrome.offscreen.closeDocument();
      // Doküman kapanınca stream'ler de serbest kalır
      await new Promise((r) => setTimeout(r, 500));
    }
  } catch (e) {}
  console.log('[UAT] Cleanup tamamlandı');
}

// ─── Stop ───
async function handleStop() {
  if (offscreenPort) {
    try { offscreenPort.postMessage({ type: 'STOP_CAPTURE' }); } catch (e) {}
  }
  forwardToContentScript({ type: 'HIDE_SUBTITLE' });
  await cleanupAll();
  updateBadge('idle');
  return { success: true };
}

// ─── Helpers ───

function waitForOffscreenPort(timeoutMs) {
  return new Promise((resolve) => {
    if (offscreenPort) { resolve(); return; }
    const start = Date.now();
    const check = setInterval(() => {
      if (offscreenPort || Date.now() - start > timeoutMs) {
        clearInterval(check);
        resolve();
      }
    }, 100);
  });
}

function forwardToContentScript(message) {
  if (activeTabId) {
    chrome.tabs.sendMessage(activeTabId, message).catch(() => {});
  }
}

function startKeepAlive() {
  chrome.alarms.create('keep-alive', { periodInMinutes: 0.4 });
}
function stopKeepAlive() {
  chrome.alarms.clear('keep-alive');
}
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keep-alive' && isCapturing) { /* keep alive */ }
});

function updateBadge(state) {
  const map = {
    active: { text: 'ON', color: '#22c55e' },
    connecting: { text: '...', color: '#eab308' },
    error: { text: '!', color: '#ef4444' },
    idle: { text: '', color: '#666' },
  };
  const s = map[state] || map.idle;
  chrome.action.setBadgeText({ text: s.text });
  if (s.text) chrome.action.setBadgeBackgroundColor({ color: s.color });
}

function getActiveVoiceName(settings) {
  const c = settings.characters?.find((c) => c.id === settings.activeCharacterId);
  return c?.voiceName || 'Kore';
}
