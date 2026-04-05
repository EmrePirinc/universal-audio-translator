// Universal Audio Translator — Base Model Interface
// WBS 1.3.1 — Tüm AI model provider'ları bu sınıfı extend eder

export class BaseModel {
  constructor() {
    this._state = 'disconnected'; // disconnected | connecting | connected | error
    this._onTranslation = null;
    this._onAudio = null;
    this._onError = null;
  }

  get state() {
    return this._state;
  }

  isConnected() {
    return this._state === 'connected';
  }

  /** @param {object} config — { apiKey, targetLanguage, model, voiceName, responseModalities, customDictionary } */
  async connect(config) {
    throw new Error('connect() must be implemented by subclass');
  }

  /** @param {string} base64Chunk — base64-encoded 16-bit PCM audio */
  sendAudio(base64Chunk) {
    throw new Error('sendAudio() must be implemented by subclass');
  }

  disconnect() {
    throw new Error('disconnect() must be implemented by subclass');
  }

  /** @param {function} callback — (text: string, isFinal: boolean) */
  onTranslation(callback) {
    this._onTranslation = callback;
  }

  /** @param {function} callback — (base64Audio: string) */
  onAudio(callback) {
    this._onAudio = callback;
  }

  /** @param {function} callback — (error: Error) */
  onError(callback) {
    this._onError = callback;
  }
}
