// Universal Audio Translator — Popup
// WBS 1.6.2

import { getSettings, updateSettings } from '../lib/settings.js';

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await getSettings();

  // ─── DOM Elements ───
  const apiKeySection = document.getElementById('api-key-section');
  const inputApiKey = document.getElementById('input-api-key');
  const btnSaveKey = document.getElementById('btn-save-key');
  const apiKeyStatus = document.getElementById('api-key-status');
  const btnToggle = document.getElementById('btn-toggle');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const selectModel = document.getElementById('select-model');
  const selectLanguage = document.getElementById('select-language');
  const toggleSubtitle = document.getElementById('toggle-subtitle');
  const sliderSize = document.getElementById('slider-size');
  const sizeValue = document.getElementById('size-value');
  const btnSave = document.getElementById('btn-save');
  const btnSettings = document.getElementById('btn-settings');

  // ─── Init UI from Settings ───
  if (!settings.apiKeys.gemini) {
    apiKeySection.style.display = 'block';
  }

  selectModel.value = settings.selectedModel;
  selectLanguage.value = settings.targetLanguage;
  toggleSubtitle.checked = settings.subtitleEnabled;
  sliderSize.value = settings.subtitleFontSize;
  sizeValue.textContent = `${settings.subtitleFontSize}px`;

  // Mevcut durumu kontrol et
  const status = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
  updateUI(status?.isCapturing || false);

  // ─── Event Handlers ───

  // API Key kaydet
  btnSaveKey.addEventListener('click', async () => {
    const key = inputApiKey.value.trim();
    if (!key) {
      apiKeyStatus.textContent = 'API key boş olamaz';
      apiKeyStatus.style.color = '#ef4444';
      return;
    }
    await updateSettings({ apiKeys: { ...settings.apiKeys, gemini: key } });
    apiKeyStatus.textContent = 'Kaydedildi!';
    apiKeyStatus.style.color = '#22c55e';
    setTimeout(() => { apiKeySection.style.display = 'none'; }, 1000);
  });

  // Başlat/Durdur
  btnToggle.addEventListener('click', async () => {
    const currentSettings = await getSettings();
    if (!currentSettings.apiKeys.gemini) {
      apiKeySection.style.display = 'block';
      apiKeyStatus.textContent = 'Önce API key girin';
      apiKeyStatus.style.color = '#ef4444';
      return;
    }

    const status = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
    if (status?.isCapturing) {
      const result = await chrome.runtime.sendMessage({ type: 'STOP' });
      if (result?.success) updateUI(false);
    } else {
      updateUI('connecting');
      const result = await chrome.runtime.sendMessage({ type: 'START' });
      if (result?.success) {
        updateUI(true);
      } else {
        updateUI(false);
        statusText.textContent = result?.error || 'Hata oluştu';
        statusDot.className = 'status-dot error';
      }
    }
  });

  // Boyut slider
  sliderSize.addEventListener('input', () => {
    sizeValue.textContent = `${sliderSize.value}px`;
  });

  // Kaydet
  btnSave.addEventListener('click', async () => {
    await updateSettings({
      selectedModel: selectModel.value,
      targetLanguage: selectLanguage.value,
      subtitleEnabled: toggleSubtitle.checked,
      subtitleFontSize: parseInt(sliderSize.value),
    });
    btnSave.textContent = 'Kaydedildi!';
    setTimeout(() => { btnSave.textContent = 'Kaydet'; }, 1500);
  });

  // Ayarlar
  btnSettings.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // ─── UI Güncelle ───
  function updateUI(capturing) {
    if (capturing === 'connecting') {
      btnToggle.textContent = 'Bağlanıyor...';
      btnToggle.disabled = true;
      statusDot.className = 'status-dot connecting';
      statusText.textContent = 'Bağlanıyor...';
      return;
    }

    btnToggle.disabled = false;
    if (capturing) {
      btnToggle.textContent = 'Durdur';
      btnToggle.classList.add('active');
      statusDot.className = 'status-dot active';
      statusText.textContent = 'Aktif — çeviri yapılıyor';
    } else {
      btnToggle.textContent = 'Başlat';
      btnToggle.classList.remove('active');
      statusDot.className = 'status-dot';
      statusText.textContent = 'Hazır';
    }
  }
});
