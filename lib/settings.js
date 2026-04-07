// Universal Audio Translator — Settings Manager
// WBS 1.8.1

const DEFAULT_SETTINGS = {
  // API & Model
  apiKeys: { gemini: '', openai: '', deepseek: '', claude: '' },
  selectedModel: 'gemini-2.0-flash-live-001',

  // Çeviri
  targetLanguage: 'tr',
  skipSameLanguage: false,
  subtitlePriority: 'ai', // 'ai' | 'platform'

  // Görüntüleme
  displayMode: 'subtitles_only', // 'mute_translated' | 'subtitles_audio' | 'subtitles_only'
  timingMode: 'realtime', // 'realtime' | 'paragraph'
  subtitleEnabled: true,
  dualSubtitles: false,

  // Altyazı Stili
  subtitleFontSize: 20,
  subtitleFontFamily: 'Arial',
  subtitleColor: '#FFFFFF',
  subtitleBackground: 'rgba(0,0,0,0.8)',
  subtitlePosition: 'bottom', // 'bottom' | 'top'

  // Karakter/Ses
  characters: [{ id: 1, name: 'Varsayılan', voiceName: 'Kore' }],
  activeCharacterId: 1,

  // Üyelik
  membershipPlan: 'free', // 'free' | 'monthly' | 'yearly'
  membershipExpiry: null,
  balance: 0,

  // Diğer
  emailNotifications: true,
  disabledSites: [],
  customDictionary: [],
};

/**
 * Tüm ayarları oku. Eksik ayarlar varsayılanlarla doldurulur.
 * @returns {Promise<object>}
 */
// Eski/geçersiz model isimlerini güncel isme dönüştür
const MODEL_MIGRATION = {
  'gemini-3.1-flash-live-preview': 'gemini-2.0-flash-live-001',
  'gemini-2.5-flash-native-audio': 'gemini-2.0-flash-live-001',
};

export async function getSettings() {
  const stored = await chrome.storage.local.get('settings');
  const settings = { ...DEFAULT_SETTINGS, ...(stored.settings || {}) };

  // Model ismi migration
  if (MODEL_MIGRATION[settings.selectedModel]) {
    settings.selectedModel = MODEL_MIGRATION[settings.selectedModel];
    await chrome.storage.local.set({ settings });
  }

  return settings;
}

/**
 * Ayarları kısmi güncelle (merge).
 * @param {object} partial — güncellenecek alanlar
 * @returns {Promise<object>} — güncellenmiş tam ayarlar
 */
export async function updateSettings(partial) {
  const current = await getSettings();
  const updated = { ...current, ...partial };
  await chrome.storage.local.set({ settings: updated });
  return updated;
}

/**
 * Varsayılan ayarlara sıfırla.
 * @returns {Promise<object>}
 */
export async function resetSettings() {
  await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  return { ...DEFAULT_SETTINGS };
}

/**
 * Ayar değişikliklerini dinle.
 * @param {function} callback — (newSettings, changedKeys) parametreleriyle çağrılır
 * @returns {function} — dinlemeyi durdurmak için çağrılacak fonksiyon
 */
export function onSettingsChanged(callback) {
  const listener = (changes) => {
    if (changes.settings) {
      const newVal = changes.settings.newValue || {};
      const oldVal = changes.settings.oldValue || {};
      const changedKeys = Object.keys(newVal).filter(
        (k) => JSON.stringify(newVal[k]) !== JSON.stringify(oldVal[k])
      );
      if (changedKeys.length > 0) {
        callback({ ...DEFAULT_SETTINGS, ...newVal }, changedKeys);
      }
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

export { DEFAULT_SETTINGS };
