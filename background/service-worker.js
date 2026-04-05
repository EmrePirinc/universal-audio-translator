// Universal Audio Translator — Service Worker
// WBS 1.4 — Orkestrasyon, tabCapture, offscreen yönetimi, mesaj routing, keep-alive

import { getSettings } from '../lib/settings.js';

// Global state
let isCapturing = false;
let activeTabId = null;

console.log('[UAT] Service worker loaded');

// ─── Mesaj Yönlendirme ───

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Offscreen'e gönderilen mesajları service worker işlemesin
  if (message._target === 'offscreen') return;

  switch (message.type) {
    case 'START':
      handleStart().then((result) => sendResponse(result));
      return true;

    case 'STOP':
      handleStop().then((result) => sendResponse(result));
      return true;

    case 'TRANSLATION':
      // Offscreen'den gelen çeviri → aktif sekmedeki content script'e ilet
      forwardToContentScript({
        type: 'SHOW_SUBTITLE',
        text: message.text,
        isFinal: message.isFinal,
      });
      break;

    case 'AUDIO_DATA':
      // TTS verisi — Faz 3'te implement edilecek
      break;

    case 'ERROR':
      console.error('[UAT] Error from offscreen:', message.message);
      updateBadge('error');
      forwardToContentScript({
        type: 'ERROR',
        message: message.message,
      });
      break;

    case 'GET_STATUS':
      sendResponse({ isCapturing, activeTabId });
      break;
  }
});

// ─── Start/Stop ───

async function handleStart() {
  try {
    // Önceki oturum varsa önce temizle
    if (isCapturing) {
      await handleStop();
    }

    const settings = await getSettings();

    if (!settings.apiKeys.gemini) {
      return { success: false, error: 'Gemini API key girilmemiş. Popup\'tan API key girin.' };
    }

    // Aktif sekmeyi bul
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      return { success: false, error: 'Aktif sekme bulunamadı.' };
    }
    activeTabId = tab.id;

    // Önceki offscreen document varsa kaldır (stream temizlemek için)
    try {
      const hasDoc = await chrome.offscreen.hasDocument();
      if (hasDoc) {
        await chrome.offscreen.closeDocument();
      }
    } catch (e) {
      // Doküman yoksa hata vermesi normal
    }

    // tabCapture ile stream ID al
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: activeTabId });

    // Offscreen document oluştur
    await ensureOffscreenDocument();

    // Offscreen'e capture başlat komutu gönder
    // Not: sendMessage offscreen'e ulaşması için kısa gecikme gerekebilir
    const response = await sendToOffscreen({
      type: 'START_CAPTURE',
      streamId,
      config: {
        apiKey: settings.apiKeys.gemini,
        targetLanguage: settings.targetLanguage,
        selectedModel: settings.selectedModel,
        voiceName: getActiveVoiceName(settings),
        customDictionary: settings.customDictionary,
        displayMode: settings.displayMode,
      },
    });

    if (response?.success) {
      isCapturing = true;
      updateBadge('active');
      startKeepAlive();
      return { success: true };
    } else {
      return { success: false, error: response?.error || 'Capture başlatılamadı.' };
    }
  } catch (err) {
    console.error('[UAT] Start error:', err);
    return { success: false, error: err.message };
  }
}

async function handleStop() {
  try {
    // Offscreen'e durdurma komutu gönder
    try {
      await sendToOffscreen({ type: 'STOP_CAPTURE' });
    } catch (e) {
      // Offscreen zaten kapalı olabilir
    }

    // Offscreen document'ı kapat (stream'i serbest bırakır)
    try {
      const hasDoc = await chrome.offscreen.hasDocument();
      if (hasDoc) {
        await chrome.offscreen.closeDocument();
      }
    } catch (e) {
      // Zaten kapalı
    }

    isCapturing = false;
    activeTabId = null;
    updateBadge('idle');
    stopKeepAlive();

    // Content script'e altyazıyı gizle
    forwardToContentScript({ type: 'HIDE_SUBTITLE' });

    return { success: true };
  } catch (err) {
    console.error('[UAT] Stop error:', err);
    isCapturing = false;
    return { success: false, error: err.message };
  }
}

// ─── Offscreen Document Yönetimi ───

async function ensureOffscreenDocument() {
  const existing = await chrome.offscreen.hasDocument();
  if (!existing) {
    await chrome.offscreen.createDocument({
      url: 'offscreen/offscreen.html',
      reasons: ['USER_MEDIA'],
      justification: 'Tab audio capture and AI model communication',
    });
  }
}

// ─── Content Script'e Mesaj Gönderme ───

function forwardToContentScript(message) {
  if (activeTabId) {
    chrome.tabs.sendMessage(activeTabId, message).catch(() => {
      // Sekme kapatılmış olabilir
    });
  }
}

// ─── Keep-Alive ───

function startKeepAlive() {
  chrome.alarms.create('keep-alive', { periodInMinutes: 0.4 }); // ~25 saniye
}

function stopKeepAlive() {
  chrome.alarms.clear('keep-alive');
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keep-alive' && isCapturing) {
    // Service worker'ı canlı tut
  }
});

// ─── Badge Yönetimi ───

function updateBadge(state) {
  switch (state) {
    case 'active':
      chrome.action.setBadgeText({ text: 'ON' });
      chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
      break;
    case 'error':
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
      break;
    case 'idle':
    default:
      chrome.action.setBadgeText({ text: '' });
      break;
  }
}

// ─── Offscreen'e Mesaj Gönderme ───

async function sendToOffscreen(message) {
  // Offscreen document'ın yüklenmesini bekle
  await new Promise((r) => setTimeout(r, 300));

  return new Promise((resolve) => {
    // target: offscreen olarak işaretli mesaj gönder
    message._target = 'offscreen';
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[UAT] Offscreen message error:', chrome.runtime.lastError.message);
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response);
      }
    });
  });
}

// ─── Yardımcılar ───

function getActiveVoiceName(settings) {
  const activeChar = settings.characters.find((c) => c.id === settings.activeCharacterId);
  return activeChar?.voiceName || 'Kore';
}
