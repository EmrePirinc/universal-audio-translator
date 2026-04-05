// Universal Audio Translator — Options Page
// WBS 1.7.5

import { getSettings, updateSettings } from '../lib/settings.js';

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await getSettings();

  // ─── Sidebar Navigasyon ───
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
      document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
      item.classList.add('active');
      document.getElementById(`page-${item.dataset.page}`).classList.add('active');
    });
  });

  // ─── Temel Ayarlar ───
  const skipSameLang = document.getElementById('opt-skip-same-lang');
  const emailNotif = document.getElementById('opt-email-notifications');
  const dualSubs = document.getElementById('opt-dual-subtitles');

  skipSameLang.checked = settings.skipSameLanguage;
  emailNotif.checked = settings.emailNotifications;
  dualSubs.checked = settings.dualSubtitles;

  // Altyazı önceliği
  document.querySelector(`input[name="subtitle-priority"][value="${settings.subtitlePriority}"]`).checked = true;
  updateRadioStyles('subtitle-priority');

  // Auto-save for toggles
  skipSameLang.addEventListener('change', () => save({ skipSameLanguage: skipSameLang.checked }));
  emailNotif.addEventListener('change', () => save({ emailNotifications: emailNotif.checked }));
  dualSubs.addEventListener('change', () => save({ dualSubtitles: dualSubs.checked }));

  document.querySelectorAll('input[name="subtitle-priority"]').forEach((r) => {
    r.addEventListener('change', () => {
      save({ subtitlePriority: r.value });
      updateRadioStyles('subtitle-priority');
    });
  });

  // ─── Altyazı Stili ───
  const fontFamily = document.getElementById('opt-font-family');
  const fontSize = document.getElementById('opt-font-size');
  const fontSizeVal = document.getElementById('opt-font-size-val');
  const fontColor = document.getElementById('opt-font-color');
  const bgColor = document.getElementById('opt-bg-color');
  const bgOpacity = document.getElementById('opt-bg-opacity');
  const bgOpacityVal = document.getElementById('opt-bg-opacity-val');
  const preview = document.getElementById('subtitle-preview');

  fontFamily.value = settings.subtitleFontFamily;
  fontSize.value = settings.subtitleFontSize;
  fontSizeVal.textContent = `${settings.subtitleFontSize}px`;
  fontColor.value = settings.subtitleColor;

  // Background: parse rgba
  const bgMatch = settings.subtitleBackground.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (bgMatch) {
    bgColor.value = rgbToHex(+bgMatch[1], +bgMatch[2], +bgMatch[3]);
  }
  const opMatch = settings.subtitleBackground.match(/([\d.]+)\)$/);
  bgOpacity.value = opMatch ? Math.round(parseFloat(opMatch[1]) * 100) : 80;
  bgOpacityVal.textContent = `${bgOpacity.value}%`;

  document.querySelector(`input[name="subtitle-position"][value="${settings.subtitlePosition}"]`).checked = true;
  updateRadioStyles('subtitle-position');

  function updatePreview() {
    const hex = bgColor.value;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const a = bgOpacity.value / 100;

    preview.style.fontFamily = fontFamily.value;
    preview.style.fontSize = `${fontSize.value}px`;
    preview.style.color = fontColor.value;
    preview.style.background = `rgba(${r},${g},${b},${a})`;
  }
  updatePreview();

  function saveSubtitleStyle() {
    const hex = bgColor.value;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const a = bgOpacity.value / 100;

    save({
      subtitleFontFamily: fontFamily.value,
      subtitleFontSize: parseInt(fontSize.value),
      subtitleColor: fontColor.value,
      subtitleBackground: `rgba(${r},${g},${b},${a})`,
      subtitlePosition: document.querySelector('input[name="subtitle-position"]:checked').value,
    });
  }

  fontFamily.addEventListener('change', () => { updatePreview(); saveSubtitleStyle(); });
  fontSize.addEventListener('input', () => {
    fontSizeVal.textContent = `${fontSize.value}px`;
    updatePreview();
  });
  fontSize.addEventListener('change', saveSubtitleStyle);
  fontColor.addEventListener('input', () => { updatePreview(); saveSubtitleStyle(); });
  bgColor.addEventListener('input', () => { updatePreview(); saveSubtitleStyle(); });
  bgOpacity.addEventListener('input', () => {
    bgOpacityVal.textContent = `${bgOpacity.value}%`;
    updatePreview();
  });
  bgOpacity.addEventListener('change', saveSubtitleStyle);
  document.querySelectorAll('input[name="subtitle-position"]').forEach((r) => {
    r.addEventListener('change', () => {
      saveSubtitleStyle();
      updateRadioStyles('subtitle-position');
    });
  });

  // ─── Devre Dışı Siteler ───
  const siteInput = document.getElementById('opt-site-url');
  const btnAddSite = document.getElementById('btn-add-site');
  const siteError = document.getElementById('site-error');
  const sitesList = document.getElementById('disabled-sites-list');

  function renderSites(sites) {
    sitesList.innerHTML = '';
    if (sites.length === 0) {
      sitesList.innerHTML = '<p class="empty-text">Henüz devre dışı site eklenmemiş.</p>';
      return;
    }
    sites.forEach((site, i) => {
      const el = document.createElement('div');
      el.className = 'site-item';
      el.innerHTML = `<span>${site}</span><button class="btn-remove" data-index="${i}">&times;</button>`;
      sitesList.appendChild(el);
    });

    sitesList.querySelectorAll('.btn-remove').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const s = await getSettings();
        s.disabledSites.splice(+btn.dataset.index, 1);
        await save({ disabledSites: s.disabledSites });
        renderSites(s.disabledSites);
      });
    });
  }
  renderSites(settings.disabledSites);

  btnAddSite.addEventListener('click', async () => {
    const url = siteInput.value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!url) {
      siteError.textContent = 'URL boş olamaz';
      return;
    }
    const s = await getSettings();
    if (s.disabledSites.includes(url)) {
      siteError.textContent = 'Bu site zaten listede';
      return;
    }
    s.disabledSites.push(url);
    await save({ disabledSites: s.disabledSites });
    renderSites(s.disabledSites);
    siteInput.value = '';
    siteError.textContent = '';
  });

  // ─── API Anahtarları ───
  const keyGemini = document.getElementById('opt-key-gemini');
  const keyOpenai = document.getElementById('opt-key-openai');
  const keyDeepseek = document.getElementById('opt-key-deepseek');
  const keyClaude = document.getElementById('opt-key-claude');

  keyGemini.value = settings.apiKeys.gemini || '';
  keyOpenai.value = settings.apiKeys.openai || '';
  keyDeepseek.value = settings.apiKeys.deepseek || '';
  keyClaude.value = settings.apiKeys.claude || '';

  function saveKeys() {
    save({
      apiKeys: {
        gemini: keyGemini.value.trim(),
        openai: keyOpenai.value.trim(),
        deepseek: keyDeepseek.value.trim(),
        claude: keyClaude.value.trim(),
      },
    });
  }

  [keyGemini, keyOpenai, keyDeepseek, keyClaude].forEach((inp) => {
    inp.addEventListener('change', saveKeys);
  });

  // Göster/Gizle toggle
  document.querySelectorAll('.toggle-visibility').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (target.type === 'password') {
        target.type = 'text';
        btn.textContent = 'Gizle';
      } else {
        target.type = 'password';
        btn.textContent = 'Göster';
      }
    });
  });

  // ─── Helpers ───
  async function save(partial) {
    await updateSettings(partial);
  }

  function updateRadioStyles(name) {
    document.querySelectorAll(`input[name="${name}"]`).forEach((r) => {
      r.closest('.radio-option').classList.toggle('selected', r.checked);
    });
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  }
});
