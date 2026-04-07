// Universal Audio Translator — Gemini Live API Client
// WBS 1.3.2

import { BaseModel } from './base-model.js';

const WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

export class GeminiLive extends BaseModel {
  constructor(logger) {
    super();
    this._ws = null;
    this._config = null;
    this._reconnectAttempts = 0;
    this._maxReconnectAttempts = 3;
    this._log = logger || ((...args) => console.log(...args));
  }

  async connect(config) {
    this._config = config;
    this._state = 'connecting';
    this._reconnectAttempts = 0;

    return this._openWebSocket();
  }

  _openWebSocket() {
    return new Promise((resolve, reject) => {
      const url = `${WS_BASE}?key=${this._config.apiKey}`;
      this._log('[Gemini] Connecting to:', url.replace(/key=.*/, 'key=***'));

      // 15 saniye timeout
      this._connectTimeout = setTimeout(() => {
        const state = this._ws ? this._ws.readyState : 'no ws';
        this._log('[Gemini] Connection timeout (15s). WS readyState:', state);
        if (this._ws) { this._ws.close(); this._ws = null; }
        this._state = 'error';
        reject(new Error('Gemini connection timeout (15s). WS state: ' + state));
      }, 15000);

      try {
        this._ws = new WebSocket(url);
        this._log('[Gemini] WebSocket created, readyState:', this._ws.readyState);
      } catch (e) {
        this._log('[Gemini] WebSocket creation failed:', e.message);
        clearTimeout(this._connectTimeout);
        reject(new Error('WebSocket creation failed: ' + e.message));
        return;
      }

      this._ws.onopen = () => {
        this._log('[Gemini] WebSocket OPEN! Sending setup...');
        this._sendSetup();
      };

      this._ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._handleMessage(data, resolve);
        } catch (err) {
          this._log('[Gemini] Failed to parse message:', err.message);
        }
      };

      this._ws.onerror = (event) => {
        clearTimeout(this._connectTimeout);
        this._log('[Gemini] WebSocket error event fired. Type:', event.type);
        this._state = 'error';
        const err = new Error('WebSocket connection error');
        if (this._onError) this._onError(err);
        reject(err);
      };

      this._ws.onclose = (event) => {
        this._log('[Gemini] WebSocket CLOSED. Code:', event.code, 'Reason:', event.reason, 'Clean:', event.wasClean);
        if (this._state === 'connected') {
          this._tryReconnect();
        }
      };
    });
  }

  _sendSetup() {
    const model = this._config.model || 'models/gemini-2.0-flash-live-001';
    const targetLang = this._config.targetLanguage || 'Turkish';
    const voiceName = this._config.voiceName || 'Kore';
    const responseModalities = this._config.responseModalities || ['TEXT'];

    let systemText = `You are a real-time audio translator. Listen to the audio input and translate everything you hear into ${targetLang}. Output ONLY the translated text, nothing else. Preserve the original meaning, tone, and nuance. If multiple speakers are present, prefix each line with "Speaker 1:", "Speaker 2:", etc.`;

    // Özel sözlük varsa ekle
    if (this._config.customDictionary && this._config.customDictionary.length > 0) {
      const dictEntries = this._config.customDictionary
        .map((d) => `"${d.source}" → "${d.target}"`)
        .join(', ');
      systemText += `\n\nAlways use these specific translations: ${dictEntries}`;
    }

    const setupMsg = {
      setup: {
        model: model.startsWith('models/') ? model : `models/${model}`,
        generationConfig: {
          responseModalities,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
        systemInstruction: {
          parts: [{ text: systemText }],
        },
      },
    };

    this._log('[Gemini] Sending setup:', JSON.stringify(setupMsg).substring(0, 200) + '...');
    this._ws.send(JSON.stringify(setupMsg));
  }

  _handleMessage(data, resolveConnect) {
    // Hata yanıtı kontrolü
    if (data.error) {
      this._log('[Gemini] API Error:', JSON.stringify(data.error));
      this._state = 'error';
      if (this._connectTimeout) { clearTimeout(this._connectTimeout); this._connectTimeout = null; }
      const err = new Error('Gemini API error: ' + (data.error.message || JSON.stringify(data.error)));
      if (this._onError) this._onError(err);
      if (resolveConnect) resolveConnect(); // reject yerine resolve çünkü Promise zaten settled olmuş olabilir
      return;
    }

    // Setup tamamlandı
    if (data.setupComplete) {
      this._log('[Gemini] Setup complete, ready for audio');
      this._state = 'connected';
      this._reconnectAttempts = 0;
      if (this._connectTimeout) { clearTimeout(this._connectTimeout); this._connectTimeout = null; }
      if (resolveConnect) resolveConnect();
      return;
    }

    // Server content — çeviri yanıtı
    if (data.serverContent) {
      const parts = data.serverContent?.modelTurn?.parts;
      if (parts) {
        for (const part of parts) {
          // Metin yanıtı
          if (part.text && this._onTranslation) {
            this._log('[Gemini] Translation received:', part.text.substring(0, 100));
            this._onTranslation(part.text, true);
          }
          // Ses yanıtı (TTS)
          if (part.inlineData && this._onAudio) {
            this._onAudio(part.inlineData.data);
          }
        }
      }

      // Turn tamamlandı
      if (data.serverContent?.turnComplete) {
        this._log('[Gemini] Turn complete');
      }
      return;
    }

    // Bilinmeyen mesaj tipi
    this._log('[Gemini] Unknown message type:', JSON.stringify(data).substring(0, 200));
  }

  sendAudio(base64Chunk) {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const msg = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Chunk,
          },
        ],
      },
    };

    this._ws.send(JSON.stringify(msg));
  }

  disconnect() {
    this._state = 'disconnected';
    if (this._connectTimeout) { clearTimeout(this._connectTimeout); this._connectTimeout = null; }
    if (this._ws) {
      this._ws.onclose = null; // Reconnect tetiklemesin
      this._ws.close();
      this._ws = null;
    }
  }

  _tryReconnect() {
    if (this._reconnectAttempts >= this._maxReconnectAttempts) {
      this._log('[Gemini] Max reconnect attempts reached');
      this._state = 'error';
      if (this._onError) {
        this._onError(new Error('Connection lost after 3 reconnect attempts'));
      }
      return;
    }

    this._reconnectAttempts++;
    const delay = Math.pow(2, this._reconnectAttempts) * 1000; // 2s, 4s, 8s
    this._log(`[Gemini] Reconnecting in ${delay}ms (attempt ${this._reconnectAttempts}/${this._maxReconnectAttempts})`);

    setTimeout(() => {
      if (this._state !== 'disconnected') {
        this._state = 'connecting';
        this._openWebSocket().catch(() => {
          this._tryReconnect();
        });
      }
    }, delay);
  }
}
