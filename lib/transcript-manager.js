// Universal Audio Translator — Transcript Manager
// WBS 1.10 — Transkript biriktirme, özet oluşturma, not sistemi, dışa aktarma

export class TranscriptManager {
  constructor() {
    this._entries = []; // [{ timestamp, text, speaker }]
    this._notes = [];   // [{ timestamp, text }]
    this._startTime = null;
  }

  start() {
    this._startTime = Date.now();
    this._entries = [];
    this._notes = [];
  }

  addEntry(text) {
    if (!this._startTime) this.start();

    const elapsed = Date.now() - this._startTime;
    const timestamp = formatTimestamp(elapsed);

    // Konuşmacı tespiti
    const speakerMatch = text.match(/^Speaker\s*(\d):\s*/i);
    const speaker = speakerMatch ? `Speaker ${speakerMatch[1]}` : null;
    const cleanText = speakerMatch ? text.replace(speakerMatch[0], '') : text;

    this._entries.push({ timestamp, elapsed, text: cleanText, speaker });
  }

  addNote(text) {
    const elapsed = this._startTime ? Date.now() - this._startTime : 0;
    const timestamp = formatTimestamp(elapsed);
    this._notes.push({ timestamp, elapsed, text });
  }

  removeNote(index) {
    this._notes.splice(index, 1);
  }

  getNotes() {
    return [...this._notes];
  }

  getFullTranscript() {
    return this._entries
      .map((e) => `[${e.timestamp}] ${e.speaker ? e.speaker + ': ' : ''}${e.text}`)
      .join('\n');
  }

  getEntriesCount() {
    return this._entries.length;
  }

  // ─── Özet için transkript metnini döndür ───
  getTranscriptForSummary() {
    return this._entries.map((e) => e.text).join(' ');
  }

  // ─── Dışa Aktarma: SRT ───
  exportSRT() {
    return this._entries
      .map((e, i) => {
        const startMs = e.elapsed;
        const endMs = i + 1 < this._entries.length ? this._entries[i + 1].elapsed : startMs + 3000;
        return `${i + 1}\n${formatSRTTime(startMs)} --> ${formatSRTTime(endMs)}\n${e.speaker ? e.speaker + ': ' : ''}${e.text}\n`;
      })
      .join('\n');
  }

  // ─── Dışa Aktarma: TXT ───
  exportTXT() {
    let output = `Universal Audio Translator — Çeviri Transkripti\nTarih: ${new Date().toLocaleString('tr-TR')}\n${'─'.repeat(50)}\n\n`;

    output += this._entries
      .map((e) => `[${e.timestamp}] ${e.speaker ? e.speaker + ': ' : ''}${e.text}`)
      .join('\n');

    if (this._notes.length > 0) {
      output += `\n\n${'─'.repeat(50)}\nNotlar:\n`;
      output += this._notes
        .map((n) => `[${n.timestamp}] ${n.text}`)
        .join('\n');
    }

    return output;
  }

  // ─── Dışa Aktarma: HTML (PDF için) ───
  exportHTML() {
    const entries = this._entries
      .map((e) => `<p><strong>[${e.timestamp}]</strong> ${e.speaker ? `<em>${e.speaker}:</em> ` : ''}${escapeHtml(e.text)}</p>`)
      .join('\n');

    const notes = this._notes.length > 0
      ? `<h2>Notlar</h2>\n` + this._notes.map((n) => `<p><strong>[${n.timestamp}]</strong> ${escapeHtml(n.text)}</p>`).join('\n')
      : '';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Çeviri Transkripti</title>
<style>
body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
h1 { color: #7c3aed; } h2 { color: #6d28d9; margin-top: 32px; }
p { margin: 8px 0; } strong { color: #374151; } em { color: #2563eb; }
hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
.meta { color: #6b7280; font-size: 14px; }
</style>
</head>
<body>
<h1>Çeviri Transkripti</h1>
<p class="meta">Tarih: ${new Date().toLocaleString('tr-TR')} | Toplam: ${this._entries.length} satır</p>
<hr>
${entries}
${notes ? '<hr>' + notes : ''}
</body>
</html>`;
  }

  // ─── Dosya İndirme ───
  download(format) {
    let content, mimeType, extension;

    switch (format) {
      case 'srt':
        content = this.exportSRT();
        mimeType = 'text/srt';
        extension = 'srt';
        break;
      case 'txt':
        content = this.exportTXT();
        mimeType = 'text/plain';
        extension = 'txt';
        break;
      case 'pdf':
        content = this.exportHTML();
        mimeType = 'text/html';
        extension = 'html'; // Kullanıcı tarayıcıda Print→PDF yapabilir
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation_${new Date().toISOString().slice(0, 10)}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// ─── Helpers ───

function formatTimestamp(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  return `${pad(h)}:${pad(m % 60)}:${pad(s % 60)}`;
}

function formatSRTTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const msRem = ms % 1000;
  return `${pad(h)}:${pad(m % 60)}:${pad(s % 60)},${String(msRem).padStart(3, '0')}`;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
