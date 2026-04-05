// Universal Audio Translator — Offscreen Document
// WBS 1.2.3 + 1.9 — Ses yakalama + Gemini WebSocket + TTS oynatma
// Port tabanlı iletişim (service worker ile)

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

// Service worker'a port ile bağlan
const port = chrome.runtime.connect({ name: 'offscreen' });
log('[Offscreen] Port connected to service worker');

// Port üzerinden mesajları dinle
port.onMessage.addListener((message) => {
  log('[Offscreen] Message received:', message.type);
  try {
    switch (message.type) {
      case 'START_CAPTURE':
        startCapture(message.streamId, message.config);
        break;
      case 'STOP_CAPTURE':
        stopCapture();
        break;
      case 'SET_GAIN':
        if (gainNode) gainNode.gain.value = message.value;
        break;
      case 'SET_DISPLAY_MODE':
        setDisplayMode(message.mode);
        break;
    }
  } catch (err) {
    log('[Offscreen] ERROR: Message handler error:', err);
    port.postMessage({ type: 'CAPTURE_FAILED', error: err.message });
  }
});

function log(...args) {
  console.log(...args);
  try { port.postMessage({ type: 'LOG', message: args.join(' ') }); } catch(e) {}
}

async function startCapture(streamId, config) {
  log('[Offscreen] Starting capture');
  displayMode = config.displayMode || 'subtitles_only';

  try {
    // 1. Tab ses akışını al
    log('[Offscreen] Step 1: getUserMedia...');
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId,
        },
      },
    });
    log('[Offscreen] Step 1 OK: MediaStream acquired');

    // 2. AudioContext (16kHz)
    audioContext = new AudioContext({ sampleRate: 16000 });
    log('[Offscreen] Step 2 OK: AudioContext created');

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
    const workletUrl = chrome.runtime.getURL('lib/audio-processor.js');
    log('[Offscreen] Step 3: Loading AudioWorklet...');
    await audioContext.audioWorklet.addModule(workletUrl);
    workletNode = new AudioWorkletNode(audioContext, 'audio-translator-processor');
    sourceNode.connect(workletNode);
    log('[Offscreen] Step 3 OK: AudioWorklet loaded');

    // 8. responseModalities
    const responseModalities = displayMode === 'subtitles_only' ? ['TEXT'] : ['AUDIO', 'TEXT'];

    // 9. Gemini bağlantısı
    log('[Offscreen] Step 4: Connecting to Gemini...');
    model = new GeminiLive();

    model.onTranslation((text, isFinal) => {
      port.postMessage({ type: 'TRANSLATION', text, isFinal });
    });

    model.onAudio((base64Audio) => {
      if (displayMode !== 'subtitles_only') {
        enqueueTTS(base64Audio);
      }
    });

    model.onError((error) => {
      log('[Offscreen] ERROR: Model error:', error);
      port.postMessage({ type: 'ERROR', message: error.message });
    });

    await model.connect({
      apiKey: config.apiKey,
      targetLanguage: config.targetLanguage,
      model: config.selectedModel,
      voiceName: config.voiceName || 'Kore',
      responseModalities,
      customDictionary: config.customDictionary || [],
    });
    log('[Offscreen] Step 4 OK: Gemini connected!');

    // 10. PCM → Gemini
    workletNode.port.onmessage = (event) => {
      if (event.data.type === 'pcm_chunk') {
        model.sendAudio(arrayBufferToBase64(event.data.data));
      }
    };

    log('[Offscreen] Capture started, mode:', displayMode);
    port.postMessage({ type: 'CAPTURE_STARTED' });

  } catch (err) {
    log('[Offscreen] ERROR: Capture failed:', err);
    port.postMessage({ type: 'CAPTURE_FAILED', error: err.message });
  }
}

// ─── TTS Oynatma ───

function enqueueTTS(base64Audio) {
  ttsQueue.push(base64Audio);
  if (!isTTSPlaying) playNextTTS();
}

async function playNextTTS() {
  if (ttsQueue.length === 0) {
    isTTSPlaying = false;
    if (displayMode === 'subtitles_audio' && gainNode) {
      gainNode.gain.setTargetAtTime(0.1, audioContext.currentTime, 0.3);
    }
    return;
  }

  isTTSPlaying = true;
  const base64 = ttsQueue.shift();

  try {
    if (displayMode === 'subtitles_audio' && gainNode) {
      gainNode.gain.setTargetAtTime(0.05, audioContext.currentTime, 0.1);
    }

    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    const audioBuffer = audioContext.createBuffer(1, float32.length, 16000);
    audioBuffer.getChannelData(0).set(float32);

    const bufferSource = audioContext.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.connect(ttsGainNode);
    bufferSource.onended = () => playNextTTS();
    bufferSource.start();
  } catch (err) {
    log('[Offscreen] ERROR: TTS playback error:', err);
    playNextTTS();
  }
}

// ─── Ses Karıştırma ───

function setDisplayMode(mode) {
  displayMode = mode;
  applyGainForMode();
}

function applyGainForMode() {
  if (!gainNode) return;
  switch (displayMode) {
    case 'mute_translated': gainNode.gain.value = 0.0; break;
    case 'subtitles_audio': gainNode.gain.value = 0.1; break;
    default: gainNode.gain.value = 1.0; break;
  }
}

// ─── Stop & Cleanup ───

function stopCapture() {
  log('[Offscreen] Stopping capture');
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

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
