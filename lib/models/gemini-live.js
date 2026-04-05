// Universal Audio Translator — Gemini Live API Client
// WBS 1.3.2

import { BaseModel } from './base-model.js';

const WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

export class GeminiLive extends BaseModel {
  constructor() {
    super();
    this._ws = null;
    this._config = null;
    this._reconnectAttempts = 0;
    this._maxReconnectAttempts = 3;
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
      console.log('[Gemini] Connecting to WebSocket...');

      // 15 saniye timeout
      this._connectTimeout = setTimeout(() => {
        console.error('[Gemini] Connection timeout (15s)');
        if (this._ws) { this._ws.close(); this._ws = null; }
        this._state = 'error';
        reject(new Error('Gemini connection timeout (15s)'));
      }, 15000);

      this._ws = new WebSocket(url);

      this._ws.onopen = () => {
        console.log('[Gemini] WebSocket connected, sending setup...');
        this._sendSetup();
      };

      this._ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._handleMessage(data, resolve);
        } catch (err) {
          console.error('[Gemini] Failed to parse message:', err);
        }
      };

      this._ws.onerror = (event) => {
        clearTimeout(timeout);
        console.error('[Gemini] WebSocket error:', event);
        this._state = 'error';
        const err = new Error('WebSocket connection error');
        if (this._onError) this._onError(err);
        reject(err);
      };

      this._ws.onclose = (event) => {
        console.log('[Gemini] WebSocket closed:', event.code, event.reason);
        if (this._state === 'connected') {
          this._tryReconnect();
        }
      };
    });
  }

  _sendSetup() {
    const model = this._config.model || 'models/gemini-3.1-flash-live-preview';
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

    this._ws.send(JSON.stringify(setupMsg));
  }

  _handleMessage(data, resolveConnect) {
    // Setup tamamlandı
    if (data.setupComplete) {
      console.log('[Gemini] Setup complete, ready for audio');
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
        // Sonraki ses chunk'larını beklemeye devam
      }
    }
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
    if (this._ws) {
      this._ws.onclose = null; // Reconnect tetiklemesin
      this._ws.close();
      this._ws = null;
    }
  }

  _tryReconnect() {
    if (this._reconnectAttempts >= this._maxReconnectAttempts) {
      console.error('[Gemini] Max reconnect attempts reached');
      this._state = 'error';
      if (this._onError) {
        this._onError(new Error('Connection lost after 3 reconnect attempts'));
      }
      return;
    }

    this._reconnectAttempts++;
    const delay = Math.pow(2, this._reconnectAttempts) * 1000; // 2s, 4s, 8s
    console.log(`[Gemini] Reconnecting in ${delay}ms (attempt ${this._reconnectAttempts}/${this._maxReconnectAttempts})`);

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
