# Universal Audio Translator — Proje Görev Ağacı (WBS)

## WBS Metodolojisi

**Standart:** PMI WBS + 8/80 Kuralı + Vertical Slicing  
**Ayrıştırma Seviyesi:** 5 seviye (1.0 → 1.1 → 1.1.1 → 1.1.1.1 → 1.1.1.1.1)  
**En küçük birim kriteri:** 4-8 saat iş, tek dosya/fonksiyon, AI ile tek oturumda kodlanabilir  
**100% Kuralı:** Her alt seviye toplamı, üst seviyenin %100'ünü kapsar  

---

## 1.0 UNIVERSAL AUDIO TRANSLATOR

### 1.1 PROJE ALTYAPISI

#### 1.1.1 Geliştirme Ortamı
- 1.1.1.1 Git repo oluşturma ve .gitignore ✅
- 1.1.1.2 Dizin yapısı oluşturma (background/, offscreen/, content/, popup/, options/, lib/, icons/) ✅
- 1.1.1.3 CLAUDE.md proje kuralları dosyası

#### 1.1.2 Manifest Konfigürasyonu
- 1.1.2.1 manifest.json — Manifest V3 temel yapı ✅
- 1.1.2.2 Permissions tanımı (tabCapture, offscreen, activeTab, storage)
- 1.1.2.3 Host permissions (Gemini API endpoint)
- 1.1.2.4 Content scripts tanımı (matches, js, css)
- 1.1.2.5 Background service worker tanımı (type: module)
- 1.1.2.6 Action popup ve icons tanımı
- 1.1.2.7 Options page tanımı

#### 1.1.3 İkon ve Görsel Varlıklar
- 1.1.3.1 icon16.png tasarımı
- 1.1.3.2 icon48.png tasarımı
- 1.1.3.3 icon128.png tasarımı

---

### 1.2 ÇEKİRDEK SES YAKALAMA SİSTEMİ

#### 1.2.1 AudioWorklet İşlemcisi (`lib/audio-processor.js`)
- 1.2.1.1 AudioWorkletProcessor sınıfı oluşturma
- 1.2.1.2 Float32 → Int16 PCM dönüşüm fonksiyonu
- 1.2.1.3 Sample rate dönüşümü (48kHz → 16kHz downsampling)
- 1.2.1.4 Buffer biriktirme ve chunk boyutu belirleme (250ms chunk)
- 1.2.1.5 process() metodu — ses verisini MessagePort üzerinden gönderme
- 1.2.1.6 registerProcessor() çağrısı

#### 1.2.2 Offscreen Document HTML (`offscreen/offscreen.html`)
- 1.2.2.1 Minimal HTML yapısı
- 1.2.2.2 offscreen.js script import

#### 1.2.3 Offscreen Ses Yakalama (`offscreen/offscreen.js`)
- 1.2.3.1 Service worker'dan mesaj dinleme (chrome.runtime.onMessage)
- 1.2.3.2 START_CAPTURE mesajı işleme
  - 1.2.3.2.1 navigator.mediaDevices.getUserMedia() ile tab stream alma
  - 1.2.3.2.2 AudioContext oluşturma (sampleRate: 16000)
  - 1.2.3.2.3 MediaStreamSource oluşturma
  - 1.2.3.2.4 AudioWorkletNode yükleme ve bağlama
  - 1.2.3.2.5 GainNode oluşturma (orijinal ses kontrolü)
  - 1.2.3.2.6 Ses yolu bağlama: Source → GainNode → Destination
  - 1.2.3.2.7 AudioWorklet → Offscreen arası MessagePort kurma
- 1.2.3.3 PCM chunk'ları base64'e encode etme
- 1.2.3.4 Gemini WebSocket'e chunk gönderme (gemini-live.js kullanarak)
- 1.2.3.5 STOP_CAPTURE mesajı işleme
  - 1.2.3.5.1 AudioContext kapatma
  - 1.2.3.5.2 MediaStream track'leri durdurma
  - 1.2.3.5.3 WebSocket bağlantısını kapatma
- 1.2.3.6 SET_GAIN mesajı işleme (orijinal ses volume)
- 1.2.3.7 Gemini'den gelen çeviri metnini service worker'a iletme
- 1.2.3.8 Hata yakalama ve service worker'a raporlama

---

### 1.3 AI MODEL ENTEGRASYONU

#### 1.3.1 Model Arayüz Soyutlaması (`lib/models/base-model.js`)
- 1.3.1.1 BaseModel sınıfı tanımlama
- 1.3.1.2 connect(config) metodu — abstract
- 1.3.1.3 sendAudio(base64Chunk) metodu — abstract
- 1.3.1.4 onTranslation(callback) metodu — callback kayıt
- 1.3.1.5 onAudio(callback) metodu — TTS ses callback
- 1.3.1.6 onError(callback) metodu — hata callback
- 1.3.1.7 disconnect() metodu — abstract
- 1.3.1.8 isConnected() metodu — bağlantı durumu

#### 1.3.2 Gemini Live API Client (`lib/models/gemini-live.js`) — FAZ 1
- 1.3.2.1 GeminiLive sınıfı (extends BaseModel)
- 1.3.2.2 connect() implementasyonu
  - 1.3.2.2.1 WebSocket URL oluşturma (wss://generativelanguage.googleapis.com/ws/...)
  - 1.3.2.2.2 WebSocket bağlantısı açma
  - 1.3.2.2.3 onopen → setup mesajı gönderme
  - 1.3.2.2.4 Setup mesajı oluşturma (model, systemInstruction, generationConfig)
  - 1.3.2.2.5 System instruction'a hedef dil ve sözlük enjekte etme
  - 1.3.2.2.6 responseModalities ayarı (TEXT veya TEXT+AUDIO)
  - 1.3.2.2.7 speechConfig ve voiceConfig ayarı
- 1.3.2.3 sendAudio() implementasyonu
  - 1.3.2.3.1 realtimeInput mesajı oluşturma
  - 1.3.2.3.2 mediaChunks array'i ile base64 PCM gönderme
  - 1.3.2.3.3 mimeType: "audio/pcm;rate=16000" header
- 1.3.2.4 onmessage handler
  - 1.3.2.4.1 setupComplete yanıtı algılama
  - 1.3.2.4.2 serverContent.modelTurn.parts parsing
  - 1.3.2.4.3 Text part'ları → onTranslation callback'e yönlendirme
  - 1.3.2.4.4 InlineData (audio) part'ları → onAudio callback'e yönlendirme
  - 1.3.2.4.5 turnComplete event algılama
- 1.3.2.5 onerror handler → onError callback
- 1.3.2.6 onclose handler → otomatik yeniden bağlanma mantığı
- 1.3.2.7 disconnect() implementasyonu — WebSocket kapatma
- 1.3.2.8 Bağlantı durumu yönetimi (connecting, connected, disconnected, error)

#### 1.3.3 OpenAI Realtime API Client (`lib/models/openai-realtime.js`) — FAZ 4
- 1.3.3.1 OpenAIRealtime sınıfı (extends BaseModel)
- 1.3.3.2 connect() — WebSocket bağlantısı
- 1.3.3.3 sendAudio() — audio append mesajı
- 1.3.3.4 onmessage handler — response parsing
- 1.3.3.5 disconnect()

#### 1.3.4 DeepSeek API Client (`lib/models/deepseek.js`) — FAZ 4
- 1.3.4.1 DeepSeek sınıfı (extends BaseModel)
- 1.3.4.2 connect() — REST/WebSocket bağlantısı
- 1.3.4.3 sendAudio() — ses gönderme
- 1.3.4.4 Yanıt parsing
- 1.3.4.5 disconnect()

#### 1.3.5 Claude API Client (`lib/models/claude.js`) — FAZ 4
- 1.3.5.1 ClaudeAPI sınıfı (extends BaseModel)
- 1.3.5.2 connect() — API bağlantısı
- 1.3.5.3 sendAudio() — ses gönderme
- 1.3.5.4 Yanıt parsing
- 1.3.5.5 disconnect()

---

### 1.4 ARKA PLAN SERVİS WORKER'I

#### 1.4.1 Service Worker Temel Yapı (`background/service-worker.js`)
- 1.4.1.1 ES module import'ları (settings.js)
- 1.4.1.2 Global state yönetimi (activeTabId, isCapturing, currentModel)

#### 1.4.2 Sekme Ses Yakalama Yönetimi
- 1.4.2.1 chrome.tabCapture.getMediaStreamId() çağrısı
- 1.4.2.2 Aktif sekme ID'si alma (chrome.tabs.query)
- 1.4.2.3 Stream ID'yi offscreen document'a gönderme

#### 1.4.3 Offscreen Document Yönetimi
- 1.4.3.1 chrome.offscreen.hasDocument() kontrolü
- 1.4.3.2 chrome.offscreen.createDocument() — reason: USER_MEDIA
- 1.4.3.3 Offscreen document lifecycle yönetimi

#### 1.4.4 Mesaj Yönlendirme
- 1.4.4.1 chrome.runtime.onMessage listener
- 1.4.4.2 Popup → Service Worker mesajları (START, STOP, SETTINGS_UPDATE)
- 1.4.4.3 Offscreen → Service Worker mesajları (TRANSLATION, AUDIO, ERROR)
- 1.4.4.4 Service Worker → Content Script mesajları (SHOW_SUBTITLE, HIDE_SUBTITLE)
- 1.4.4.5 chrome.tabs.sendMessage ile aktif sekmeye mesaj gönderme

#### 1.4.5 Keep-Alive Mekanizması
- 1.4.5.1 chrome.alarms.create() — 25 saniyelik periyodik alarm
- 1.4.5.2 chrome.alarms.onAlarm listener — ping/pong
- 1.4.5.3 Aktif oturum yoksa alarm temizleme

#### 1.4.6 Extension Badge Yönetimi
- 1.4.6.1 chrome.action.setBadgeText() — durum gösterme
- 1.4.6.2 chrome.action.setBadgeBackgroundColor() — renk (yeşil/kırmızı/gri)
- 1.4.6.3 Durum geçişleri: IDLE → CONNECTING → ACTIVE → ERROR

---

### 1.5 CONTENT SCRIPT & UI BİLEŞENLERİ

#### 1.5.1 Altyazı Overlay Sistemi (`content/content.js` — Altyazı bölümü)
- 1.5.1.1 Shadow DOM host element oluşturma
- 1.5.1.2 Shadow root oluşturma (mode: closed)
- 1.5.1.3 Altyazı container div oluşturma
  - 1.5.1.3.1 Fixed pozisyon, bottom: 40px, z-index: 2147483647
  - 1.5.1.3.2 Arka plan: rgba(0,0,0,0.8), border-radius: 8px
  - 1.5.1.3.3 Font: kullanıcı ayarlarından (varsayılan 20px Arial)
- 1.5.1.4 Altyazı metin güncelleme fonksiyonu
- 1.5.1.5 Çift dilli altyazı desteği (üst: orijinal, alt: çeviri)
- 1.5.1.6 Konuşmacı renk kodlaması (Konuşmacı 1: mavi, 2: yeşil, vb.)
- 1.5.1.7 Fade-in/fade-out CSS animasyonu
- 1.5.1.8 Altyazı göster/gizle toggle fonksiyonu
- 1.5.1.9 Altyazı boyut değiştirme fonksiyonu (dinamik)
- 1.5.1.10 Altyazı pozisyon değiştirme (üst/alt)

#### 1.5.2 Video Üstü Kontrol Butonu (`content/content.js` — Buton bölümü)
- 1.5.2.1 Video player tespit fonksiyonu
  - 1.5.2.1.1 YouTube player tespiti (document.querySelector('.html5-video-player'))
  - 1.5.2.1.2 Udemy player tespiti
  - 1.5.2.1.3 Coursera player tespiti
  - 1.5.2.1.4 Genel HTML5 <video> element tespiti
  - 1.5.2.1.5 MutationObserver ile dinamik yüklenen video tespiti
- 1.5.2.2 Yeşil kontrol butonu oluşturma
  - 1.5.2.2.1 SVG ikon tasarımı (çeviri/mikrofon ikonu)
  - 1.5.2.2.2 Hover tooltip ("Çeviriyi Başlat/Durdur")
  - 1.5.2.2.3 Aktif durum (yeşil) / pasif durum (gri) CSS
  - 1.5.2.2.4 Video player kontrol çubuğuna enjeksiyon
- 1.5.2.3 Buton tıklama event handler
  - 1.5.2.3.1 chrome.runtime.sendMessage(START_CAPTURE)
  - 1.5.2.3.2 Durum toggle (aktif ↔ pasif)
  - 1.5.2.3.3 Animasyon (pulse efekti aktifken)

#### 1.5.3 Floating Ayar Baloncuğu (`content/content.js` — Baloncuk bölümü)
- 1.5.3.1 Floating baloncuk ikonu (sağ alt köşe)
  - 1.5.3.1.1 Draggable pozisyon
  - 1.5.3.1.2 Tıklama ile panel açma/kapama
- 1.5.3.2 Baloncuk panel içeriği
  - 1.5.3.2.1 Üst bar: uygulama adı + kapat butonu
  - 1.5.3.2.2 Model seçimi dropdown
  - 1.5.3.2.3 Hedef dil dropdown
  - 1.5.3.2.4 Altyazı toggle switch
  - 1.5.3.2.5 Altyazı boyut slider (range input)
  - 1.5.3.2.6 Görüntüleme modu seçimi (3 seçenek)
  - 1.5.3.2.7 Çift dilli altyazı toggle
  - 1.5.3.2.8 Karakter/ses seçimi dropdown
  - 1.5.3.2.9 "Kaydet" butonu
- 1.5.3.3 Özet paneli
  - 1.5.3.3.1 "Özet Oluştur" butonu
  - 1.5.3.3.2 Özet metin alanı (scrollable)
  - 1.5.3.3.3 "Not Ekle" butonu + input alanı
  - 1.5.3.3.4 Notlar listesi (zaman damgalı)
  - 1.5.3.3.5 "İndir" butonu (SRT/TXT/PDF dropdown)
- 1.5.3.4 Panel CSS stilleri
  - 1.5.3.4.1 Shadow DOM izolasyonu
  - 1.5.3.4.2 Slide-in animasyonu
  - 1.5.3.4.3 Responsive genişlik

#### 1.5.4 Kelime Tıklama & Sözlük Tooltip (`content/content.js` — Sözlük bölümü) — FAZ 5
- 1.5.4.1 Altyazı kelimelerine tıklama event delegasyonu
- 1.5.4.2 Kelime seçme ve highlight
- 1.5.4.3 Sözlük API çağrısı (free dictionary API)
- 1.5.4.4 Tooltip oluşturma (anlam, telaffuz, örnek cümle)
- 1.5.4.5 "Kelime Listesine Ekle" butonu
- 1.5.4.6 Kelime listesi yönetimi (chrome.storage)

#### 1.5.5 Content Script Stilleri (`content/content.css`)
- 1.5.5.1 Altyazı overlay stilleri
- 1.5.5.2 Video kontrol butonu stilleri
- 1.5.5.3 Floating baloncuk stilleri
- 1.5.5.4 Tooltip stilleri
- 1.5.5.5 Animasyon keyframes

#### 1.5.6 Mesaj Dinleme
- 1.5.6.1 chrome.runtime.onMessage listener
- 1.5.6.2 SHOW_SUBTITLE mesajı → altyazı güncelle
- 1.5.6.3 HIDE_SUBTITLE mesajı → altyazı gizle
- 1.5.6.4 UPDATE_SETTINGS mesajı → UI güncelle
- 1.5.6.5 Devre dışı site kontrolü (settings'den oku, sayfa URL'si kontrol)

---

### 1.6 POPUP UI

#### 1.6.1 Popup HTML Yapısı (`popup/popup.html`)
- 1.6.1.1 Üst bar: logo + "Universal Translator" + versiyon + üyelik badge (taç ikonu + kalan gün)
- 1.6.1.2 Ayarlar dişli ikonu + profil ikonu
- 1.6.1.3 Model seçimi dropdown (ikon + model adı + üyelik durumu etiketi)
- 1.6.1.4 Hedef dil seçimi dropdown
- 1.6.1.5 Başlat/Durdur butonu
- 1.6.1.6 Altyazı bölümü: toggle switch + "Boyut" slider
- 1.6.1.7 Karakter bölümü: "Karakterler" başlık + "+" butonu + karakter listesi
- 1.6.1.8 Her karakter satırı: numara + dropdown + silme (X) butonu
- 1.6.1.9 "Kaydet" butonu (alt kısım, tam genişlik)
- 1.6.1.10 API key giriş bölümü (ilk kullanımda görünür)

#### 1.6.2 Popup Mantığı (`popup/popup.js`)
- 1.6.2.1 DOMContentLoaded → ayarları yükle (settings.js)
- 1.6.2.2 Model dropdown doldurma
  - 1.6.2.2.1 Üyelik durumuna göre model listesi filtreleme
  - 1.6.2.2.2 Her modele ikon + "(Üyelere ücretsiz)" / "(Pahalı)" etiketi
  - 1.6.2.2.3 Kısıtlı modellere tıklamada uyarı
- 1.6.2.3 Dil dropdown doldurma (24+ dil, ISO kodları)
- 1.6.2.4 Başlat/Durdur butonu event handler
  - 1.6.2.4.1 chrome.runtime.sendMessage(START/STOP)
  - 1.6.2.4.2 Buton durumu güncelleme (renk, metin)
- 1.6.2.5 Altyazı toggle event handler
- 1.6.2.6 Boyut slider event handler (oninput → anlık önizleme)
- 1.6.2.7 Karakter ekleme/silme/seçme event handler'ları
- 1.6.2.8 Kaydet butonu → chrome.storage.local.set()
- 1.6.2.9 Ayarlar ikonu → chrome.runtime.openOptionsPage()
- 1.6.2.10 Durum göstergesi güncelleme (aktif/pasif/hata)
- 1.6.2.11 API key kaydetme ve doğrulama

#### 1.6.3 Popup Stilleri (`popup/popup.css`)
- 1.6.3.1 Genel layout (width: 360px, min-height: 480px)
- 1.6.3.2 Üst bar stilleri (gradient, badge)
- 1.6.3.3 Dropdown stilleri (model ikonları ile)
- 1.6.3.4 Toggle switch CSS
- 1.6.3.5 Slider CSS
- 1.6.3.6 Buton stilleri (primary, secondary, danger)
- 1.6.3.7 Karakter listesi stilleri
- 1.6.3.8 Responsive ve dark theme

---

### 1.7 OPTIONS SAYFASI (AYARLAR)

#### 1.7.1 Options HTML Yapısı (`options/options.html`)
- 1.7.1.1 Sol sidebar navigasyon (Temel Ayarlar, Altyazı Stili, Devre Dışı Siteler)
- 1.7.1.2 Sağ içerik alanı (router-style sayfa değişimi)

#### 1.7.2 Temel Ayarlar Sayfası
- 1.7.2.1 E-posta bildirimleri toggle
- 1.7.2.2 Aynı dilde çeviriyi atla toggle
- 1.7.2.3 Altyazı Çeviri Önceliği radio butonları
  - 1.7.2.3.1 "Eklenti AI Tanımlı Altyazılar" seçeneği
  - 1.7.2.3.2 "Platform Yerleşik Altyazıları" seçeneği
- 1.7.2.4 API key yönetimi (Gemini, OpenAI, DeepSeek, Claude)
  - 1.7.2.4.1 Her API için ayrı input + göster/gizle toggle
  - 1.7.2.4.2 "Bağlantıyı Test Et" butonu

#### 1.7.3 Altyazı Stili Sayfası
- 1.7.3.1 Font ailesi seçimi dropdown
- 1.7.3.2 Font boyutu input (number + slider)
- 1.7.3.3 Yazı rengi color picker
- 1.7.3.4 Arka plan rengi color picker + opaklık slider
- 1.7.3.5 Pozisyon seçimi (üst/alt radio)
- 1.7.3.6 Kenarlık ve gölge toggle'ları
- 1.7.3.7 Canlı önizleme alanı

#### 1.7.4 Devre Dışı Siteler Sayfası
- 1.7.4.1 Site URL input + "Ekle" butonu
- 1.7.4.2 Devre dışı site listesi (URL + "Sil" butonu)
- 1.7.4.3 URL validation

#### 1.7.5 Options Mantığı (`options/options.js`)
- 1.7.5.1 Sidebar navigasyon (tıklama → sayfa göster/gizle)
- 1.7.5.2 Ayarları yükleme (chrome.storage.local.get)
- 1.7.5.3 Her değişiklikte otomatik kaydetme
- 1.7.5.4 API key test fonksiyonu
- 1.7.5.5 Devre dışı site CRUD işlemleri

#### 1.7.6 Options Stilleri (`options/options.css`)
- 1.7.6.1 Sol sidebar stili (aktif/pasif navigasyon)
- 1.7.6.2 Form elemanları stilleri
- 1.7.6.3 Color picker stilleri
- 1.7.6.4 Önizleme alanı stilleri

---

### 1.8 AYAR YÖNETİMİ

#### 1.8.1 Settings Modülü (`lib/settings.js`)
- 1.8.1.1 DEFAULT_SETTINGS sabiti tanımlama
- 1.8.1.2 getSettings() — chrome.storage.local.get ile tüm ayarları oku
- 1.8.1.3 updateSettings(partial) — mevcut ayarlarla merge et ve kaydet
- 1.8.1.4 resetSettings() — varsayılanlara döndür
- 1.8.1.5 onSettingsChanged(callback) — chrome.storage.onChanged listener
- 1.8.1.6 Ayar migration fonksiyonu (versiyon geçişlerinde)

#### 1.8.2 Üyelik Modülü (`lib/membership.js`) — FAZ 4
- 1.8.2.1 MembershipManager sınıfı
- 1.8.2.2 checkMembership() — plan ve bitiş tarihi kontrol
- 1.8.2.3 getAvailableModels() — üyelik durumuna göre model listesi
- 1.8.2.4 canUseModel(modelId) — model erişim kontrolü
- 1.8.2.5 getRemainingDays() — kalan gün hesaplama
- 1.8.2.6 checkBalance(modelId) — bakiye kontrolü (premium modeller)
- 1.8.2.7 deductBalance(amount) — bakiye düşürme

---

### 1.9 SES ÇIKIŞI & TTS SİSTEMİ — FAZ 3

#### 1.9.1 TTS Ses Oynatma (offscreen.js içinde)
- 1.9.1.1 Gemini'den gelen base64 PCM audio decode etme
- 1.9.1.2 PCM → AudioBuffer dönüşümü (24kHz, 16-bit)
- 1.9.1.3 AudioBufferSourceNode oluşturma ve oynatma
- 1.9.1.4 TTS GainNode oluşturma (TTS volume kontrolü)
- 1.9.1.5 Ses kuyruğu yönetimi (sıralı oynatma, önceki bitince sonraki)

#### 1.9.2 Ses Karıştırma
- 1.9.2.1 Orijinal ses GainNode.gain değeri ayarlama
- 1.9.2.2 TTS ses GainNode.gain değeri ayarlama
- 1.9.2.3 Mod bazlı gain ayarları:
  - 1.9.2.3.1 mute_translated: orijinal=0.0, TTS=1.0
  - 1.9.2.3.2 subtitles_audio: orijinal=0.1, TTS=1.0
  - 1.9.2.3.3 subtitles_only: orijinal=1.0, TTS=0.0
- 1.9.2.4 Ducking efekti (TTS konuşurken orijinali kıs, bitince geri aç)

---

### 1.10 VİDEO ÖZETİ & NOT SİSTEMİ — FAZ 3

#### 1.10.1 Transkript Biriktirme
- 1.10.1.1 Çevrilmiş metin buffer'ı (tüm oturum boyunca biriktir)
- 1.10.1.2 Zaman damgası ile metin eşleştirme
- 1.10.1.3 Konuşmacı etiketleriyle birlikte saklama

#### 1.10.2 Özet Oluşturma
- 1.10.2.1 Biriken transkripti Gemini'ye gönderme (ayrı prompt)
- 1.10.2.2 System instruction: "Bu transkriptin ana noktalarını 5-10 madde olarak özetle"
- 1.10.2.3 Özet metnini floating baloncukta gösterme

#### 1.10.3 Not Sistemi
- 1.10.3.1 Not ekleme fonksiyonu (zaman damgası + metin)
- 1.10.3.2 Notları chrome.storage.local'e kaydetme
- 1.10.3.3 Notları listeleme ve silme

#### 1.10.4 Dışa Aktarma
- 1.10.4.1 SRT formatına dönüştürme (sıra no, zaman kodu, metin)
- 1.10.4.2 TXT formatına dönüştürme (düz metin + zaman damgaları)
- 1.10.4.3 PDF formatına dönüştürme (basit HTML → print/PDF)
- 1.10.4.4 Blob oluşturma ve download link tetikleme

---

### 1.11 SÖZLÜK & TERİM YÖNETİMİ — FAZ 4

#### 1.11.1 Özel Sözlük CRUD
- 1.11.1.1 Terim ekleme (kaynak terim → hedef terim)
- 1.11.1.2 Terim düzenleme
- 1.11.1.3 Terim silme
- 1.11.1.4 chrome.storage.local'de JSON olarak saklama
- 1.11.1.5 1000 terim limit kontrolü

#### 1.11.2 Sözlük → Prompt Entegrasyonu
- 1.11.2.1 Sözlüğü Gemini system instruction'a ekleme
- 1.11.2.2 Format: "Şu terimleri her zaman şöyle çevir: X→Y, A→B"
- 1.11.2.3 Sözlük boyutu optimizasyonu (token limiti aşmama)

---

### 1.12 ÇEVİRİ GEÇMİŞİ — FAZ 4

#### 1.12.1 IndexedDB Altyapısı
- 1.12.1.1 IndexedDB veritabanı oluşturma ("TranslatorDB")
- 1.12.1.2 Object store oluşturma ("translations")
- 1.12.1.3 Index tanımlama (date, url, language)

#### 1.12.2 Geçmiş CRUD
- 1.12.2.1 Çeviri kaydı ekleme (tarih, URL, kaynak dil, hedef dil, transkript)
- 1.12.2.2 Kayıtları listeleme (sayfalama ile)
- 1.12.2.3 Kayıt silme
- 1.12.2.4 Full-text arama
- 1.12.2.5 500 kayıt limit kontrolü (eski kayıtları temizle)

---

### 1.13 KARAKTER/SES SİSTEMİ — FAZ 5

#### 1.13.1 Karakter Yönetimi
- 1.13.1.1 Karakter oluşturma (isim + Gemini voice seçimi)
- 1.13.1.2 Gemini ses seçenekleri listesi (Kore, Puck, Charon, Fenrir, Aoede, vb.)
- 1.13.1.3 Karakter düzenleme
- 1.13.1.4 Karakter silme
- 1.13.1.5 Aktif karakter seçimi
- 1.13.1.6 Karakter değişiminde Gemini voiceConfig güncelleme

---

### 1.14 HATA YÖNETİMİ & DAYANIKLILIK — FAZ 6

#### 1.14.1 Otomatik Yeniden Bağlanma
- 1.14.1.1 WebSocket kopma algılama
- 1.14.1.2 Exponential backoff ile yeniden deneme (1s, 2s, 4s, max 3 deneme)
- 1.14.1.3 Başarısız olursa kullanıcıya hata bildirimi

#### 1.14.2 Offscreen Document Recovery
- 1.14.2.1 Service worker'da offscreen document ping/pong
- 1.14.2.2 Yanıt gelmezse yeniden oluşturma

#### 1.14.3 Kullanıcı Bildirimleri
- 1.14.3.1 Toast notification sistemi (content script'te)
- 1.14.3.2 Hata türüne göre mesajlar (API limiti, bağlantı hatası, geçersiz key)

---

### 1.15 İLERİ ÖZELLİKLER — FAZ 7

#### 1.15.1 Toplu Video Çevirisi (Kuyruk Sistemi)
- 1.15.1.1 URL kuyruk yapısı (array)
- 1.15.1.2 Sıralı sekme açma ve çevirme
- 1.15.1.3 İlerleme göstergesi
- 1.15.1.4 Tamamlanan çevirileri geçmişe kaydetme

#### 1.15.2 Çevrimdışı Mod / Yerel Model
- 1.15.2.1 Whisper.cpp WASM build
- 1.15.2.2 WebAssembly modül yükleme
- 1.15.2.3 Yerel transkripsiyon pipeline
- 1.15.2.4 Çeviri için basit yerel model veya cache

---

### 1.16 TEST & KALİTE GÜVENCESİ

#### 1.16.1 Manuel Test
- 1.16.1.1 chrome://extensions üzerinden yükleme testi
- 1.16.1.2 YouTube çeviri testi
- 1.16.1.3 Udemy çeviri testi
- 1.16.1.4 Coursera çeviri testi
- 1.16.1.5 Canlı yayın testi (Twitch/YouTube Live)
- 1.16.1.6 Zoom/Meet web toplantı testi
- 1.16.1.7 Uzun süreli çalışma testi (60 dk)

#### 1.16.2 UAT (BUSINESS_ANALYSIS.md'deki 7 senaryo)
- 1.16.2.1 UAT-001: İlk kurulum ve çeviri başlatma
- 1.16.2.2 UAT-002: Farklı platformlarda çeviri
- 1.16.2.3 UAT-003: Görüntüleme modları
- 1.16.2.4 UAT-004: Çift dilli altyazı
- 1.16.2.5 UAT-005: Video özeti ve not alma
- 1.16.2.6 UAT-006: Model değiştirme
- 1.16.2.7 UAT-007: Uzun süreli kullanım (stres testi)

---

### 1.17 DAĞITIM & YAYINLAMA

#### 1.17.1 Chrome Web Store Hazırlık
- 1.17.1.1 Store açıklaması yazma (TR + EN)
- 1.17.1.2 Ekran görüntüleri hazırlama
- 1.17.1.3 Tanıtım videosu
- 1.17.1.4 Gizlilik politikası
- 1.17.1.5 Web Store'a yükleme ve inceleme

---

## FAZ BAZLI UYGULAMA SIRASI

| Faz | WBS Bölümleri | Tahmini Süre |
|-----|--------------|-------------|
| **Faz 1 — MVP** | 1.1 + 1.2 + 1.3.1 + 1.3.2 + 1.4 + 1.5.1 + 1.5.2 + 1.5.3 (temel) + 1.5.5 + 1.5.6 + 1.6 + 1.8.1 | Temel çalışan eklenti |
| **Faz 2 — Options + Çift Dilli** | 1.7 + 1.5.1.5 + 1.5.1.6 | Options sayfası + çift dilli altyazı + konuşmacı tanıma |
| **Faz 3 — TTS + Özet + Not** | 1.9 + 1.10 + altyazı hız kontrolü | Sesli çeviri + video özeti + not + dışa aktarma |
| **Faz 4 — Çoklu Model** | 1.3.3 + 1.3.4 + 1.3.5 + 1.8.2 + 1.11 + 1.12 | 4 model + sözlük + geçmiş |
| **Faz 5 — Karakter + Sözlük** | 1.13 + 1.5.4 | Ses karakterleri + kelime tooltip |
| **Faz 6 — Cilalama** | 1.14 | Hata yönetimi, dayanıklılık |
| **Faz 7 — İleri** | 1.15 | Toplu çeviri + çevrimdışı mod |

---

## AI İLE KODLAMA STRATEJİSİ

**Yaklaşım:** Vertical Slicing + Spec-Driven Development

**Her görev için AI prompt yapısı:**
1. Dosya yolunu belirt
2. Bağımlı dosyaları referans göster
3. Fonksiyon/sınıf imzasını ver
4. Giriş/çıkış formatını açıkla
5. Kabul kriterini belirt (Given/When/Then)

**Optimum görev boyutu:**
- Tek dosya, 100-500 satır kod
- 4-8 saat iş (8/80 kuralı alt sınırı)
- Tek sorumluluk (INVEST - Independent)
- Test edilebilir (INVEST - Testable)

**Anti-pattern'lardan kaçın:**
- Aynı prompt'ta plan + kod isteme
- Birden fazla dosyayı aynı anda değiştirme (bağımlılık varsa sıralı)
- Context window'u gereksiz kodla doldurma
- Test olmadan sonraki göreve geçme
