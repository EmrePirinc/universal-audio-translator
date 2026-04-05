// Universal Audio Translator — Offscreen Document
// WBS 1.2.3 — Ses yakalama + Gemini WebSocket bağlantısı

import { GeminiLive } from '../lib/models/gemini-live.js';

let audioContext = null;
let mediaStream = null;
let sourceNode = null;
let gainNode = null;
let workletNode = null;
let model = null;

// Service worker'dan mesajları dinle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'START_CAPTURE':
      startCapture(message.streamId, message.config)
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true; // async response

    case 'STOP_CAPTURE':
      stopCapture();
      sendResponse({ success: true });
      break;

    case 'SET_GAIN':
      if (gainNode) {
        gainNode.gain.value = message.value;
      }
      sendResponse({ success: true });
      break;
  }
});

async function startCapture(streamId, config) {
  console.log('[Offscreen] Starting capture with streamId:', streamId);

  // 1. Tab ses akışını al
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId,
      },
    },
  });

  // 2. AudioContext oluştur (16kHz — Gemini'nin beklediği format)
  audioContext = new AudioContext({ sampleRate: 16000 });

  // 3. Kaynak node
  sourceNode = audioContext.createMediaStreamSource(mediaStream);

  // 4. GainNode — orijinal ses kontrolü
  gainNode = audioContext.createGain();
  gainNode.gain.value = 1.0; // varsayılan: orijinal ses açık

  // 5. Ses yolu: Source → GainNode → Destination (kullanıcı duyar)
  sourceNode.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // 6. AudioWorklet yükle
  await audioContext.audioWorklet.addModule('../lib/audio-processor.js');
  workletNode = new AudioWorkletNode(audioContext, 'audio-translator-processor');

  // 7. Source → Worklet (PCM çıkarma)
  sourceNode.connect(workletNode);

  // 8. Gemini bağlantısını kur
  model = new GeminiLive();

  model.onTranslation((text, isFinal) => {
    // Çeviri metnini service worker'a gönder
    chrome.runtime.sendMessage({
      type: 'TRANSLATION',
      text,
      isFinal,
    });
  });

  model.onAudio((base64Audio) => {
    chrome.runtime.sendMessage({
      type: 'AUDIO_DATA',
      data: base64Audio,
    });
  });

  model.onError((error) => {
    console.error('[Offscreen] Model error:', error);
    chrome.runtime.sendMessage({
      type: 'ERROR',
      message: error.message,
    });
  });

  await model.connect({
    apiKey: config.apiKey,
    targetLanguage: config.targetLanguage,
    model: config.selectedModel,
    voiceName: config.voiceName || 'Kore',
    responseModalities: ['TEXT'],
    customDictionary: config.customDictionary || [],
  });

  // 9. Worklet'ten gelen PCM chunk'ları Gemini'ye gönder
  workletNode.port.onmessage = (event) => {
    if (event.data.type === 'pcm_chunk') {
      const base64 = arrayBufferToBase64(event.data.data);
      model.sendAudio(base64);
    }
  };

  console.log('[Offscreen] Capture started, sending audio to Gemini');
}

function stopCapture() {
  console.log('[Offscreen] Stopping capture');

  if (model) {
    model.disconnect();
    model = null;
  }

  if (workletNode) {
    workletNode.disconnect();
    workletNode = null;
  }

  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }

  if (gainNode) {
    gainNode.disconnect();
    gainNode = null;
  }

  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
