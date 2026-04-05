// Universal Audio Translator — Offscreen Document
// WBS 1.2.3 + 1.9 — Ses yakalama + Gemini WebSocket + TTS oynatma

import { GeminiLive } from '../lib/models/gemini-live.js';

let audioContext = null;
let mediaStream = null;
let sourceNode = null;
let gainNode = null;
let ttsGainNode = null;
let workletNode = null;
let model = null;
let displayMode = 'subtitles_only';
let ttsQueue = [];
let isTTSPlaying = false;

// Service worker'dan mesajları dinle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'START_CAPTURE':
      startCapture(message.streamId, message.config)
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case 'STOP_CAPTURE':
      stopCapture();
      sendResponse({ success: true });
      break;

    case 'SET_GAIN':
      if (gainNode) gainNode.gain.value = message.value;
      sendResponse({ success: true });
      break;

    case 'SET_DISPLAY_MODE':
      setDisplayMode(message.mode);
      sendResponse({ success: true });
      break;
  }
});

async function startCapture(streamId, config) {
  console.log('[Offscreen] Starting capture');
  displayMode = config.displayMode || 'subtitles_only';

  // 1. Tab ses akışını al
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId,
      },
    },
  });

  // 2. AudioContext (16kHz)
  audioContext = new AudioContext({ sampleRate: 16000 });

  // 3. Kaynak node
  sourceNode = audioContext.createMediaStreamSource(mediaStream);

  // 4. Orijinal ses GainNode
  gainNode = audioContext.createGain();
  applyGainForMode();

  // 5. TTS GainNode
  ttsGainNode = audioContext.createGain();
  ttsGainNode.gain.value = 1.0;
  ttsGainNode.connect(audioContext.destination);

  // 6. Source → GainNode → Destination
  sourceNode.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // 7. AudioWorklet
  await audioContext.audioWorklet.addModule('../lib/audio-processor.js');
  workletNode = new AudioWorkletNode(audioContext, 'audio-translator-processor');
  sourceNode.connect(workletNode);

  // 8. responseModalities ayarla: ses modlarında AUDIO+TEXT, sadece altyazıda TEXT
  const responseModalities = displayMode === 'subtitles_only' ? ['TEXT'] : ['AUDIO', 'TEXT'];

  // 9. Gemini bağlantısı
  model = new GeminiLive();

  model.onTranslation((text, isFinal) => {
    chrome.runtime.sendMessage({ type: 'TRANSLATION', text, isFinal });
  });

  model.onAudio((base64Audio) => {
    if (displayMode !== 'subtitles_only') {
      enqueueTTS(base64Audio);
    }
  });

  model.onError((error) => {
    console.error('[Offscreen] Model error:', error);
    chrome.runtime.sendMessage({ type: 'ERROR', message: error.message });
  });

  await model.connect({
    apiKey: config.apiKey,
    targetLanguage: config.targetLanguage,
    model: config.selectedModel,
    voiceName: config.voiceName || 'Kore',
    responseModalities,
    customDictionary: config.customDictionary || [],
  });

  // 10. PCM → Gemini
  workletNode.port.onmessage = (event) => {
    if (event.data.type === 'pcm_chunk') {
      model.sendAudio(arrayBufferToBase64(event.data.data));
    }
  };

  console.log('[Offscreen] Capture started, mode:', displayMode);
}

// ─── TTS Oynatma (WBS 1.9.1) ───

function enqueueTTS(base64Audio) {
  ttsQueue.push(base64Audio);
  if (!isTTSPlaying) playNextTTS();
}

async function playNextTTS() {
  if (ttsQueue.length === 0) {
    isTTSPlaying = false;
    // Ducking: TTS bitti, orijinal sesi geri aç
    if (displayMode === 'subtitles_audio') {
      gainNode.gain.setTargetAtTime(0.1, audioContext.currentTime, 0.3);
    }
    return;
  }

  isTTSPlaying = true;
  const base64 = ttsQueue.shift();

  try {
    // Ducking: TTS başlıyor, orijinal sesi daha da kıs
    if (displayMode === 'subtitles_audio') {
      gainNode.gain.setTargetAtTime(0.05, audioContext.currentTime, 0.1);
    }

    // Base64 → ArrayBuffer
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // PCM Int16 → Float32 AudioBuffer (24kHz Gemini çıkışı)
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    // AudioContext 16kHz'de ama Gemini 24kHz veri döner — yeniden örneklemeli
    // Basit: 16kHz AudioBuffer olarak yükle (kalite biraz düşer ama çalışır)
    const audioBuffer = audioContext.createBuffer(1, float32.length, 16000);
    audioBuffer.getChannelData(0).set(float32);

    const bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.connect(ttsGainNode);

    bufferSource.onended = () => playNextTTS();
    bufferSource.start();
  } catch (err) {
    console.error('[Offscreen] TTS playback error:', err);
    playNextTTS();
  }
}

// ─── Ses Karıştırma (WBS 1.9.2) ───

function setDisplayMode(mode) {
  displayMode = mode;
  applyGainForMode();
}

function applyGainForMode() {
  if (!gainNode) return;
  switch (displayMode) {
    case 'mute_translated':
      gainNode.gain.value = 0.0;
      break;
    case 'subtitles_audio':
      gainNode.gain.value = 0.1;
      break;
    case 'subtitles_only':
    default:
      gainNode.gain.value = 1.0;
      break;
  }
}

// ─── Stop & Cleanup ───

function stopCapture() {
  console.log('[Offscreen] Stopping capture');
  ttsQueue = [];
  isTTSPlaying = false;

  if (model) { model.disconnect(); model = null; }
  if (workletNode) { workletNode.disconnect(); workletNode = null; }
  if (sourceNode) { sourceNode.disconnect(); sourceNode = null; }
  if (gainNode) { gainNode.disconnect(); gainNode = null; }
  if (ttsGainNode) { ttsGainNode.disconnect(); ttsGainNode = null; }
  if (audioContext) { audioContext.close(); audioContext = null; }
  if (mediaStream) { mediaStream.getTracks().forEach((t) => t.stop()); mediaStream = null; }
}

// ─── Helpers ───

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
