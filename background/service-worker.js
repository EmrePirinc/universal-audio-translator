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
      handleStart()
        .then((r) => sendResponse(r))
        .catch((e) => sendResponse({ success: false, error: e.message }));
      return true;

    case 'STOP':
      handleStop()
        .then((r) => sendResponse(r))
        .catch((e) => sendResponse({ success: false, error: e.message }));
      return true;

    case 'GET_STATUS':
      sendResponse({ isCapturing, activeTabId });
      return false;
  }
});

// ─── Start ───
async function handleStart() {
  if (isCapturing) {
    await handleStop();
  }

  const settings = await getSettings();
  if (!settings.apiKeys.gemini) {
    return { success: false, error: 'Gemini API key girilmemiş.' };
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    return { success: false, error: 'Aktif sekme bulunamadı.' };
  }
  activeTabId = tab.id;

  // Eski offscreen'i kapat
  try {
    if (await chrome.offscreen.hasDocument()) {
      await chrome.offscreen.closeDocument();
    }
  } catch (e) {}

  // Stream ID al
  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: activeTabId });

  // Yeni offscreen document oluştur
  await chrome.offscreen.createDocument({
    url: 'offscreen/offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Tab audio capture for translation',
  });

  // Port bağlantısını bekle (offscreen document yüklenince bağlanır)
  await waitForOffscreenPort(3000);

  if (!offscreenPort) {
    return { success: false, error: 'Offscreen document bağlanamadı.' };
  }

  // Offscreen'e capture başlat komutu gönder (port üzerinden)
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

  return { success: true };
}

// ─── Stop ───
async function handleStop() {
  if (offscreenPort) {
    try { offscreenPort.postMessage({ type: 'STOP_CAPTURE' }); } catch (e) {}
  }

  try {
    if (await chrome.offscreen.hasDocument()) {
      await chrome.offscreen.closeDocument();
    }
  } catch (e) {}

  offscreenPort = null;
  isCapturing = false;
  activeTabId = null;
  updateBadge('idle');
  stopKeepAlive();
  forwardToContentScript({ type: 'HIDE_SUBTITLE' });
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
