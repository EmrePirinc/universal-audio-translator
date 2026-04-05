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
    `;

    subtitleContainer = document.createElement('div');
    subtitleContainer.className = 'uat-subtitle hidden';

    shadowRoot.appendChild(style);
    shadowRoot.appendChild(subtitleContainer);
    document.body.appendChild(host);
  }

  function showSubtitle(text) {
    if (!subtitleContainer) createSubtitleOverlay();
    subtitleContainer.textContent = text;
    subtitleContainer.className = 'uat-subtitle visible';
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
      <div style="padding:16px">
        <div style="margin-bottom:12px">
          <label style="display:block;margin-bottom:4px;opacity:0.7;font-size:12px">Durum</label>
          <span id="uat-panel-status" style="color:${isActive ? '#22c55e' : '#666'}">${isActive ? 'Aktif' : 'Pasif'}</span>
        </div>
        <button id="uat-panel-toggle" style="width:100%;padding:10px;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;color:#fff;background:${isActive ? '#ef4444' : '#22c55e'}">
          ${isActive ? 'Durdur' : 'Başlat'}
        </button>
      </div>
    `;

    document.body.appendChild(floatingPanel);

    // Event listeners
    floatingPanel.querySelector('#uat-panel-close').addEventListener('click', () => {
      floatingPanel.remove();
      floatingPanel = null;
    });

    floatingPanel.querySelector('#uat-panel-toggle').addEventListener('click', toggleTranslation);
  }

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
    switch (message.type) {
      case 'SHOW_SUBTITLE':
        showSubtitle(message.text);
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
