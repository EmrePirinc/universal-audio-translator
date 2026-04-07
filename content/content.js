// Universal Audio Translator — Content Script
// WBS 1.5 — Altyazı overlay + Video üstü buton + Floating baloncuk

(function () {
  'use strict';

  // ─── State ───
  let isActive = false;
  let subtitleContainer = null;
  let shadowRoot = null;
  let controlButton = null;
  let floatingBubble = null;
  let floatingPanel = null;

  // Transcript & Notes (WBS 1.10)
  const transcriptEntries = [];
  const notes = [];
  let sessionStartTime = null;

  // ─── 1.5.1 Altyazı Overlay Sistemi ───

  function createSubtitleOverlay() {
    if (shadowRoot) return;

    const host = document.createElement('div');
    host.id = 'uat-subtitle-host';
    shadowRoot = host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = `
      .uat-subtitle {
        position: fixed;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        max-width: 80vw;
        background: rgba(0, 0, 0, 0.85);
        color: #fff;
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 20px;
        font-family: Arial, sans-serif;
        z-index: 2147483647;
        text-align: center;
        pointer-events: none;
        transition: opacity 0.3s ease;
        line-height: 1.5;
        max-height: 30vh;
        overflow-y: auto;
      }
      .uat-subtitle.hidden {
        opacity: 0;
        pointer-events: none;
      }
      .uat-subtitle.visible {
        opacity: 1;
      }
      /* Çift dilli altyazı */
      .uat-original {
        font-size: 0.8em;
        color: rgba(255,255,255,0.6);
        margin-bottom: 4px;
        font-style: italic;
      }
      .uat-translation {
        color: #fff;
      }
      /* Konuşmacı renkleri */
      .uat-speaker-1 { color: #60a5fa; }
      .uat-speaker-2 { color: #34d399; }
      .uat-speaker-3 { color: #fbbf24; }
      .uat-speaker-4 { color: #f87171; }
      .uat-speaker-5 { color: #a78bfa; }
    `;

    subtitleContainer = document.createElement('div');
    subtitleContainer.className = 'uat-subtitle hidden';

    shadowRoot.appendChild(style);
    shadowRoot.appendChild(subtitleContainer);
    document.body.appendChild(host);
  }

  function showSubtitle(text, originalText) {
    if (!subtitleContainer) createSubtitleOverlay();

    // Konuşmacı renk kodlaması
    const coloredText = colorSpeakers(text);

    if (originalText) {
      // Çift dilli mod: üst orijinal, alt çeviri
      subtitleContainer.innerHTML = `
        <div class="uat-original">${escapeHtml(originalText)}</div>
        <div class="uat-translation">${coloredText}</div>
      `;
    } else {
      subtitleContainer.innerHTML = `<div class="uat-translation">${coloredText}</div>`;
    }

    subtitleContainer.className = 'uat-subtitle visible';
  }

  function colorSpeakers(text) {
    // "Speaker 1:", "Speaker 2:" vb. etiketlerini renklendir
    return escapeHtml(text).replace(
      /Speaker\s*(\d):/gi,
      (match, num) => `<span class="uat-speaker-${num}">Speaker ${num}:</span>`
    );
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function hideSubtitle() {
    if (subtitleContainer) {
      subtitleContainer.className = 'uat-subtitle hidden';
    }
  }

  // ─── 1.5.2 Video Üstü Kontrol Butonu ───

  function findVideoPlayer() {
    // YouTube
    const ytPlayer = document.querySelector('.html5-video-player');
    if (ytPlayer) return { player: ytPlayer, type: 'youtube' };

    // Genel HTML5 video
    const video = document.querySelector('video');
    if (video) return { player: video.parentElement, type: 'generic' };

    return null;
  }

  function createControlButton() {
    if (controlButton) return;

    const playerInfo = findVideoPlayer();
    if (!playerInfo) return;

    controlButton = document.createElement('div');
    controlButton.id = 'uat-control-btn';
    controlButton.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
      </svg>
    `;

    Object.assign(controlButton.style, {
      position: 'absolute',
      bottom: '60px',
      right: '10px',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'rgba(100, 100, 100, 0.7)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: '2147483646',
      transition: 'background 0.3s',
      border: 'none',
    });

    controlButton.title = 'Çeviriyi Başlat';

    controlButton.addEventListener('click', toggleTranslation);
    controlButton.addEventListener('mouseenter', () => {
      controlButton.style.transform = 'scale(1.1)';
    });
    controlButton.addEventListener('mouseleave', () => {
      controlButton.style.transform = 'scale(1)';
    });

    // Player'a ekle
    const parent = playerInfo.player;
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
    parent.appendChild(controlButton);
  }

  function updateControlButton(active) {
    if (!controlButton) return;
    if (active) {
      controlButton.style.background = 'rgba(34, 197, 94, 0.9)';
      controlButton.title = 'Çeviriyi Durdur';
    } else {
      controlButton.style.background = 'rgba(100, 100, 100, 0.7)';
      controlButton.title = 'Çeviriyi Başlat';
    }
  }

  // ─── 1.5.3 Floating Ayar Baloncuğu ───

  function createFloatingBubble() {
    if (floatingBubble) return;

    floatingBubble = document.createElement('div');
    floatingBubble.id = 'uat-floating-bubble';
    floatingBubble.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
      </svg>
    `;

    Object.assign(floatingBubble.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: '#7c3aed',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: '2147483645',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      transition: 'transform 0.2s',
    });

    floatingBubble.addEventListener('click', togglePanel);
    floatingBubble.addEventListener('mouseenter', () => {
      floatingBubble.style.transform = 'scale(1.1)';
    });
    floatingBubble.addEventListener('mouseleave', () => {
      floatingBubble.style.transform = 'scale(1)';
    });

    document.body.appendChild(floatingBubble);
  }

  function togglePanel() {
    if (floatingPanel) {
      floatingPanel.remove();
      floatingPanel = null;
      return;
    }

    floatingPanel = document.createElement('div');
    floatingPanel.id = 'uat-floating-panel';

    Object.assign(floatingPanel.style, {
      position: 'fixed',
      bottom: '80px',
      right: '20px',
      width: '320px',
      maxHeight: '500px',
      background: '#1a1a2e',
      color: '#fff',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      zIndex: '2147483645',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '14px',
      overflow: 'hidden',
    });

    floatingPanel.innerHTML = `
      <div style="padding:16px;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center">
        <strong>Universal Translator</strong>
        <span id="uat-panel-close" style="cursor:pointer;opacity:0.5;font-size:18px">&times;</span>
      </div>
      <div style="padding:16px;max-height:420px;overflow-y:auto">
        <!-- Durum & Kontrol -->
        <div style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between">
          <span id="uat-panel-status" style="font-size:13px;color:${isActive ? '#22c55e' : '#666'}">${isActive ? 'Aktif' : 'Pasif'}</span>
          <button id="uat-panel-toggle" style="padding:8px 16px;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;color:#fff;background:${isActive ? '#ef4444' : '#22c55e'}">
            ${isActive ? 'Durdur' : 'Başlat'}
          </button>
        </div>

        <!-- Özet (WBS 1.10.2) -->
        <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:12px;margin-top:8px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <strong style="font-size:13px;opacity:0.7">Özet</strong>
            <button id="uat-btn-summary" style="padding:4px 10px;border:none;border-radius:4px;background:#7c3aed;color:#fff;font-size:11px;cursor:pointer">Özet Oluştur</button>
          </div>
          <div id="uat-summary-area" style="font-size:12px;color:rgba(255,255,255,0.6);min-height:30px;max-height:120px;overflow-y:auto">
            ${transcriptEntries.length > 0 ? transcriptEntries.length + ' satır çeviri mevcut' : 'Henüz çeviri yok'}
          </div>
        </div>

        <!-- Not Ekleme (WBS 1.10.3) -->
        <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:12px;margin-top:12px">
          <strong style="font-size:13px;opacity:0.7">Notlar</strong>
          <div style="display:flex;gap:6px;margin-top:6px">
            <input id="uat-note-input" type="text" placeholder="Not ekle..." style="flex:1;padding:6px 10px;border:1px solid rgba(255,255,255,0.15);border-radius:4px;background:rgba(255,255,255,0.05);color:#fff;font-size:12px;outline:none">
            <button id="uat-btn-add-note" style="padding:6px 10px;border:none;border-radius:4px;background:#22c55e;color:#fff;font-size:11px;cursor:pointer">+</button>
          </div>
          <div id="uat-notes-list" style="margin-top:6px;font-size:11px;color:rgba(255,255,255,0.5);max-height:100px;overflow-y:auto"></div>
        </div>

        <!-- İndir (WBS 1.10.4) -->
        <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:12px;margin-top:12px;display:flex;gap:6px">
          <button class="uat-dl-btn" data-format="srt" style="flex:1;padding:6px;border:1px solid rgba(255,255,255,0.15);border-radius:4px;background:transparent;color:#fff;font-size:11px;cursor:pointer">SRT</button>
          <button class="uat-dl-btn" data-format="txt" style="flex:1;padding:6px;border:1px solid rgba(255,255,255,0.15);border-radius:4px;background:transparent;color:#fff;font-size:11px;cursor:pointer">TXT</button>
          <button class="uat-dl-btn" data-format="html" style="flex:1;padding:6px;border:1px solid rgba(255,255,255,0.15);border-radius:4px;background:transparent;color:#fff;font-size:11px;cursor:pointer">PDF</button>
        </div>
      </div>
    `;

    document.body.appendChild(floatingPanel);

    // Event listeners
    floatingPanel.querySelector('#uat-panel-close').addEventListener('click', () => {
      floatingPanel.remove();
      floatingPanel = null;
    });

    floatingPanel.querySelector('#uat-panel-toggle').addEventListener('click', toggleTranslation);

    // Özet oluştur
    floatingPanel.querySelector('#uat-btn-summary').addEventListener('click', async () => {
      const area = floatingPanel.querySelector('#uat-summary-area');
      if (transcriptEntries.length === 0) {
        area.textContent = 'Henüz çeviri yok, önce çeviriyi başlatın.';
        return;
      }
      area.textContent = 'Özet oluşturuluyor...';
      // Service worker'a özet isteği gönder
      const result = await chrome.runtime.sendMessage({
        type: 'REQUEST_SUMMARY',
        transcript: transcriptEntries.map((e) => e.text).join(' '),
      });
      area.textContent = result?.summary || 'Özet oluşturulamadı.';
    });

    // Not ekle
    floatingPanel.querySelector('#uat-btn-add-note').addEventListener('click', () => {
      const input = floatingPanel.querySelector('#uat-note-input');
      const text = input.value.trim();
      if (!text) return;
      const elapsed = sessionStartTime ? Date.now() - sessionStartTime : 0;
      notes.push({ timestamp: formatTime(elapsed), text });
      input.value = '';
      renderNotes();
    });

    // İndir butonları
    floatingPanel.querySelectorAll('.uat-dl-btn').forEach((btn) => {
      btn.addEventListener('click', () => downloadTranscript(btn.dataset.format));
    });

    renderNotes();
  }

  function renderNotes() {
    if (!floatingPanel) return;
    const list = floatingPanel.querySelector('#uat-notes-list');
    if (!list) return;
    if (notes.length === 0) {
      list.innerHTML = '<div style="padding:4px 0">Henüz not yok</div>';
      return;
    }
    list.innerHTML = notes.map((n, i) =>
      `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
        <span>[${n.timestamp}] ${escapeHtml(n.text)}</span>
        <span class="uat-del-note" data-i="${i}" style="cursor:pointer;color:#ef4444">&times;</span>
      </div>`
    ).join('');
    list.querySelectorAll('.uat-del-note').forEach((btn) => {
      btn.addEventListener('click', () => {
        notes.splice(+btn.dataset.i, 1);
        renderNotes();
      });
    });
  }

  function downloadTranscript(format) {
    if (transcriptEntries.length === 0) return;

    let content, mimeType, ext;
    const date = new Date().toISOString().slice(0, 10);

    if (format === 'srt') {
      content = transcriptEntries.map((e, i) => {
        const startMs = e.elapsed;
        const endMs = i + 1 < transcriptEntries.length ? transcriptEntries[i + 1].elapsed : startMs + 3000;
        return `${i + 1}\n${fmtSRT(startMs)} --> ${fmtSRT(endMs)}\n${e.text}\n`;
      }).join('\n');
      mimeType = 'text/srt'; ext = 'srt';
    } else if (format === 'txt') {
      content = `Çeviri Transkripti — ${new Date().toLocaleString('tr-TR')}\n${'─'.repeat(40)}\n\n`;
      content += transcriptEntries.map((e) => `[${e.timestamp}] ${e.text}`).join('\n');
      if (notes.length > 0) {
        content += `\n\n${'─'.repeat(40)}\nNotlar:\n`;
        content += notes.map((n) => `[${n.timestamp}] ${n.text}`).join('\n');
      }
      mimeType = 'text/plain'; ext = 'txt';
    } else {
      content = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Transkript</title>
<style>body{font-family:Arial;max-width:800px;margin:40px auto;line-height:1.6}h1{color:#7c3aed}p{margin:6px 0}strong{color:#374151}</style></head><body>
<h1>Çeviri Transkripti</h1><p style="color:#6b7280">${new Date().toLocaleString('tr-TR')}</p><hr>`;
      content += transcriptEntries.map((e) => `<p><strong>[${e.timestamp}]</strong> ${escapeHtml(e.text)}</p>`).join('\n');
      content += '</body></html>';
      mimeType = 'text/html'; ext = 'html';
    }

    const blob = new Blob([content], { type: mimeType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `translation_${date}.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function fmtSRT(ms) {
    const s = Math.floor(ms / 1000); const m = Math.floor(s / 60); const h = Math.floor(m / 60);
    return `${pad(h)}:${pad(m % 60)}:${pad(s % 60)},${String(ms % 1000).padStart(3, '0')}`;
  }
  function formatTime(ms) {
    const s = Math.floor(ms / 1000); const m = Math.floor(s / 60); const h = Math.floor(m / 60);
    return `${pad(h)}:${pad(m % 60)}:${pad(s % 60)}`;
  }
  function pad(n) { return String(n).padStart(2, '0'); }

  // ─── Toggle Çeviri ───

  async function toggleTranslation() {
    if (isActive) {
      const response = await chrome.runtime.sendMessage({ type: 'STOP' });
      if (response?.success) {
        isActive = false;
        updateControlButton(false);
        hideSubtitle();
        updatePanelState();
      }
    } else {
      const response = await chrome.runtime.sendMessage({ type: 'START' });
      if (response?.success) {
        isActive = true;
        updateControlButton(true);
        updatePanelState();
      } else {
        console.error('[UAT] Start failed:', response?.error);
      }
    }
  }

  function updatePanelState() {
    if (!floatingPanel) return;
    const status = floatingPanel.querySelector('#uat-panel-status');
    const btn = floatingPanel.querySelector('#uat-panel-toggle');
    if (status) {
      status.textContent = isActive ? 'Aktif' : 'Pasif';
      status.style.color = isActive ? '#22c55e' : '#666';
    }
    if (btn) {
      btn.textContent = isActive ? 'Durdur' : 'Başlat';
      btn.style.background = isActive ? '#ef4444' : '#22c55e';
    }
  }

  // ─── 1.5.6 Mesaj Dinleme ───

  chrome.runtime.onMessage.addListener((message) => {
    console.log('[UAT] Content script received:', message.type, message.text?.substring(0, 50) || '');
    switch (message.type) {
      case 'SHOW_SUBTITLE':
        showSubtitle(message.text, message.originalText || null);
        // Transkripte kaydet
        if (!sessionStartTime) sessionStartTime = Date.now();
        transcriptEntries.push({
          timestamp: formatTime(Date.now() - sessionStartTime),
          elapsed: Date.now() - sessionStartTime,
          text: message.text,
        });
        break;

      case 'HIDE_SUBTITLE':
        hideSubtitle();
        break;

      case 'UPDATE_SETTINGS':
        // Ayar değişikliklerini uygula
        break;
    }
  });

  // ─── Init ───

  function init() {
    console.log('[UAT] Content script loaded');
    createSubtitleOverlay();
    createFloatingBubble();

    // Video player'ı ara, bulunca buton ekle
    const observer = new MutationObserver(() => {
      if (!controlButton && findVideoPlayer()) {
        createControlButton();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Hemen de dene
    if (findVideoPlayer()) {
      createControlButton();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
