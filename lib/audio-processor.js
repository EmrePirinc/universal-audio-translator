// Universal Audio Translator — AudioWorklet Processor
// WBS 1.2.1 — Float32 → Int16 PCM dönüşümü, 16kHz downsampling, chunk'lama

class AudioTranslatorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._bufferSize = 4000; // 250ms @ 16kHz = 4000 samples
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0]; // Mono kanal

    // Float32 → Int16 PCM dönüşümü
    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      this._buffer.push(s < 0 ? s * 0x8000 : s * 0x7FFF);
    }

    // Buffer dolduğunda chunk gönder
    while (this._buffer.length >= this._bufferSize) {
      const chunk = this._buffer.splice(0, this._bufferSize);
      const int16Array = new Int16Array(chunk.length);
      for (let i = 0; i < chunk.length; i++) {
        int16Array[i] = Math.round(chunk[i]);
      }

      // ArrayBuffer'ı port üzerinden gönder
      this.port.postMessage(
        { type: 'pcm_chunk', data: int16Array.buffer },
        [int16Array.buffer]
      );
    }

    return true; // Processor'ı canlı tut
  }
}

registerProcessor('audio-translator-processor', AudioTranslatorProcessor);
