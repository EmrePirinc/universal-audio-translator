# Chrome Eklentisi: Evrensel Sesli Çeviri (Universal Audio Translator)

## Context

Herhangi bir web sayfasındaki (YouTube, Udemy, Coursera, konferans vb.) yabancı dildeki sesi yakalayıp, otomatik olarak kullanıcının istediği dile çeviren ve sesli/altyazılı olarak sunan bir Chrome eklentisi.

**Rakip analizi:** "YouTube Dubbing V3.5.2" incelendi. Çoklu model, üyelik sistemi, karakter seçimi, video üzerinde kontrol butonu ve ayar baloncuğu gibi özellikler referans alındı.

**API kararı:** Çoklu model desteği — Gemini, DeepSeek, GPT, Claude. Üyelik planına göre model erişimi değişir.

---

## Mimari

```
[Sekme Sesi] → [Chrome tabCapture] → [Offscreen Document] → [AI Model API (WebSocket/REST)]
                                                                    ↓
                                              [Transkripsiyon + Çeviri + TTS]
                                                                    ↓
[Video Üstü Kontrol Butonu] ← [Content Script] → [Altyazı Overlay] + [Sesli Çeviri]
        ↕                                                ↕
[Floating Ayar Baloncuğu]                    [Popup Ayarlar Sayfası]
```

### Desteklenen Modeller & Üyelik Planı

| Model | ID | Üyelik Durumu | Maliyet |
|-------|-----|---------------|---------|
| **Gemini 3.1 Flash Live** | `gemini-3.1-flash-live-preview` | Üyelere ücretsiz | Düşük |
| **Gemini 2.5 Flash Native Audio** | `gemini-2.5-flash-native-audio` | Üyelere ücretsiz | Düşük |
| **DeepSeek** | `deepseek-v3` | Üyelere ücretsiz | Düşük |
| **GPT-4o mini** | `gpt-4o-mini` | Üyelere ücretsiz | Orta |
| **Claude Haiku 4.5** | `claude-haiku-4-5` | Üyelere ücretsiz | Orta |
| **GPT-4o / GPT-5** | `gpt-4o` / `gpt-5` | Bakiye + Üyelik (Pahalı) | Yüksek |

### Üyelik Planları

| Plan | Fiyat | Özellikler |
|------|-------|------------|
| **Ücretsiz** | $0 | Günlük sınırlı kullanım, sadece Gemini Flash |
| **Üye (Aylık)** | TBD | Tüm ücretsiz modeller sınırsız, altyazı + dublaj |
| **Üye (Yıllık)** | TBD | İndirimli aylık, öncelikli erişim |
| **Bakiye (Pay-as-you-go)** | Kullanım bazlı | Premium modeller (GPT-5 vb.) için ek bakiye |

---

## Dosya Yapısı

```
Translate Google/
├── manifest.json                    # Manifest V3
├── background/
│   └── service-worker.js            # Orkestrasyon, durum yönetimi
├── offscreen/
│   ├── offscreen.html               # Offscreen document
│   └── offscreen.js                 # Ses yakalama + AI model bağlantısı
├── content/
│   ├── content.js                   # Video üstü kontrol butonu + altyazı overlay + floating baloncuk
│   └── content.css                  # Tüm content UI stilleri
├── popup/
│   ├── popup.html                   # Ana popup (model seçimi, karakter, altyazı ayarları)
│   ├── popup.js                     # Popup mantığı
│   └── popup.css                    # Popup stilleri
├── options/
│   ├── options.html                 # Tam ayarlar sayfası (temel ayarlar, altyazı stili, devre dışı siteler)
│   ├── options.js                   # Ayarlar mantığı
│   └── options.css                  # Ayarlar stilleri
├── lib/
│   ├── models/
│   │   ├── base-model.js            # Ortak model arayüzü (interface)
│   │   ├── gemini-live.js           # Gemini Live API WebSocket client
│   │   ├── openai-realtime.js       # OpenAI Realtime API client
│   │   ├── deepseek.js              # DeepSeek API client
│   │   └── claude.js                # Claude API client
│   ├── audio-processor.js           # AudioWorklet - PCM çıkarma
│   ├── settings.js                  # chrome.storage ayar yönetimi
│   └── membership.js                # Üyelik durumu ve model erişim kontrolü
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## UI Bileşenleri (Rakipten Referans)

### 1. Video Üstü Kontrol Butonu (Content Script)
YouTube/Udemy vb. video player üzerinde görünen yeşil aktifleştirme butonu:
- Video player'ın kontrol çubuğu yakınında küçük ikon
- Tıklanınca çeviri başlar/durur
- Aktifken yeşil, pasifken gri
- Hover'da tooltip gösterir

### 2. Floating Ayar Baloncuğu (Content Script)
Video sayfasının sağ tarafında açılır kapanır panel:
- Özet bilgi (mevcut dil, hedef dil, aktif model)
- Model seçimi dropdown
- Altyazı toggle + boyut slider
- Karakter/ses seçimi
- "Kaydet" butonu
- Küçültülebilir (ikon haline gelir)

### 3. Popup (Extension İkonu Tıklanınca)
Rakipteki gibi kompakt panel:
- **Üst bar:** Uygulama adı + versiyon + üyelik durumu (taç ikonu + kalan gün) + ayarlar + profil
- **Model seçimi:** Dropdown ile model seç (üyelik durumuna göre hangileri erişilebilir gösterilir)
- **Altyazı:** Toggle (aç/kapa) + Boyut slider
- **Karakterler:** Ses karakteri seçimi (+ ile yeni ekle, dropdown ile seç, X ile sil)
- **Kaydet butonu**

### 4. Options Sayfası (Tam Ayarlar — Ayarlar İkonu Tıklanınca)
Rakipteki gibi sol sidebar + sağ içerik:

**Sol Sidebar:**
- Temel ayarlar
- Altyazı stili
- Devre dışı siteler

**Temel Ayarlar:**
- E-posta bildirimleri — Altyazı tanıma tamamlandığında bildir (toggle)
- Aynı dilde çeviriyi atla — Kaynak dil = hedef dil ise çeviri yapma (toggle)
- Altyazı Çeviri Önceliği:
  - Eklenti AI Tanımlı Altyazılar (AI konuşma tanıma ile oluşturulan)
  - Platform Yerleşik Altyazıları (YouTube/Udemy'nin kendi altyazıları)

**Altyazı Stili:**
- Font ailesi, boyut, renk
- Arka plan rengi ve opaklık
- Pozisyon (üst/alt)
- Kenarlık ve gölge

**Devre Dışı Siteler:**
- Eklentinin çalışmamasını istediğiniz sitelerin listesi
- URL ekleme/silme

---

## Uygulama Fazları

### Faz 1 — MVP: Temel Çeviri + Video Üstü Kontrol

**Hedef:** Sekme sesini yakala → Gemini'ye gönder → altyazı göster + video üstü butonla kontrol et

1. **`manifest.json`**
   - Manifest V3
   - Permissions: `tabCapture`, `offscreen`, `activeTab`, `storage`
   - Host permissions: Gemini API endpoint
   - Options page tanımı

2. **`lib/settings.js`**
   - `chrome.storage.local` ile ayar yönetimi
   - Varsayılanlar: hedef dil `tr`, mod `subtitles_only`, model `gemini-3.1-flash-live-preview`

3. **`lib/models/base-model.js`** — Ortak model arayüzü
   - `connect()`, `sendAudio()`, `onTranslation()`, `onAudio()`, `disconnect()` metodları
   - Tüm model provider'ları bu interface'i implement eder

4. **`lib/models/gemini-live.js`** — Gemini Live API WebSocket client
   - `wss://generativelanguage.googleapis.com/ws/...BidiGenerateContent` endpoint
   - Setup mesajı: model, system instruction, generation config
   - Ses gönderme (base64 PCM) ve yanıt alma

5. **`lib/audio-processor.js`** — AudioWorklet
   - Float32 PCM → 16-bit PCM (16kHz mono) dönüşümü

6. **`offscreen/offscreen.html` + `offscreen.js`**
   - `navigator.mediaDevices.getUserMedia()` ile tab stream yakala
   - `AudioContext` + `GainNode` ile ses kontrolü
   - Model API'ye PCM chunk gönder
   - Çeviri metnini service worker'a ilet

7. **`background/service-worker.js`**
   - `chrome.tabCapture.getMediaStreamId()` ile ses yakala
   - Offscreen document yönetimi
   - Mesaj yönlendirme (offscreen ↔ content script)
   - `chrome.alarms` ile keep-alive

8. **`content/content.js` + `content.css`**
   - **Altyazı overlay:** Shadow DOM, sayfanın altında sabit pozisyon
   - **Video üstü kontrol butonu:** Video player'ı tespit et, yeşil buton ekle
   - **Floating ayar baloncuğu:** Sağ tarafta açılır panel (model seçimi, altyazı toggle, boyut slider)
   - YouTube, Udemy, Coursera player tespiti

9. **`popup/popup.html` + `popup.js` + `popup.css`**
   - Üst bar: logo + versiyon + üyelik badge
   - Model seçimi dropdown
   - Altyazı toggle + boyut slider
   - Karakter/ses seçimi
   - Kaydet butonu
   - Ayarlar ikonu → options sayfasına yönlendir

### Faz 2 — Options Sayfası + Çift Dilli Altyazı + Konuşmacı Tanıma

10. **`options/options.html` + `options.js` + `options.css`**
    - Sol sidebar navigasyonu
    - **Temel ayarlar:** E-posta bildirimleri, aynı dilde çeviriyi atla, altyazı çeviri önceliği
    - **Altyazı stili:** Font, boyut, renk, arka plan, pozisyon
    - **Devre dışı siteler:** Site URL listesi yönetimi

11. **Çift dilli altyazı modu** (Beyin Fırtınası #8)
    - Üst satır: orijinal metin, alt satır: çeviri
    - Dil öğrenme modu olarak pazarlanacak

12. **Konuşmacı tanıma** (Beyin Fırtınası #3)
    - "Konuşmacı 1:", "Konuşmacı 2:" etiketleri
    - Her konuşmacıya farklı renk

13. **Aynı dilde çeviriyi atla** (Beyin Fırtınası #9 — FR-021)

14. **Devre dışı siteler** (FR-022)

### Faz 3 — Ses Çıkışı + Özet + Not + Dışa Aktarma

15. **Gemini TTS entegrasyonu**
    - Gemini Live API'den ses yanıtı al (response_modalities: ["AUDIO", "TEXT"])
    - PCM decode + AudioContext oynatma

16. **Ses karıştırma + 3 görüntüleme modu**
    - "Orijinali kıs" → orijinal=0, TTS=1
    - "Altyazı+Ses" → orijinal=0.1, TTS=1
    - "Sadece altyazı" → orijinal=1, TTS yok

17. **2 zamanlama modu** — gerçek zamanlı vs paragraf

18. **Video özeti & not alma** (Beyin Fırtınası #2)
    - Gemini'ye ek prompt ile özet çıkarma
    - Zaman damgalı not ekleme
    - Floating baloncukta özet paneli

19. **Çeviriyi dışa aktarma** (Beyin Fırtınası #11 — Kurucu revize)
    - SRT, TXT, PDF formatları
    - İndir butonu

20. **Altyazı hız kontrolü** (Beyin Fırtınası #7)
    - Altyazı gösterim süresi slider
    - Çeviri gecikmesi ayarı

### Faz 4 — Çoklu Model + Sözlük + Geçmiş

21. **`lib/models/openai-realtime.js`** — OpenAI GPT-4o / GPT-5 Realtime API
22. **`lib/models/deepseek.js`** — DeepSeek API client
23. **`lib/models/claude.js`** — Claude Haiku API client
24. **`lib/membership.js`** — Üyelik kontrolü
    - Model erişim hakları (ücretsiz/üye/bakiye)
    - Kalan gün göstergesi
    - Kullanım limitleri

25. **Terim sözlüğü** (Beyin Fırtınası #5)
    - Özel çeviri kuralları (kaynak→hedef terim)
    - Gemini system instruction'a sözlük enjekte etme
    - Maksimum 1000 terim

26. **Çeviri geçmişi & arama** (Beyin Fırtınası #4)
    - IndexedDB ile yerel depolama
    - Tarih, site, dil bilgisiyle arama
    - Maksimum 500 kayıt

### Faz 5 — Karakter/Ses + Dil Öğrenme Modu

27. **Karakter yönetimi**
    - Birden fazla ses karakteri tanımlama
    - Karakter listesi (ekleme, seçme, silme)
    - Gemini voiceConfig ile ses seçimi (Kore, Puck, Charon, vb.)

28. **Kelime vurgulama & anlık sözlük** (Beyin Fırtınası #12)
    - Altyazıdaki kelimeye tıklama → anlam tooltip
    - Kelime listesine ekleme
    - Sözlük API entegrasyonu

### Faz 6 — Cilalama & UX

29. **Hata yönetimi** — bağlantı kopması, API limiti, otomatik yeniden bağlanma
30. **Extension badge** — aktif/pasif/hata durumu
31. **Dil otomatik algılama**
32. **Klavye kısayolu** — Başlat/Durdur
33. **Platform altyazı entegrasyonu** — YouTube/Udemy yerleşik altyazılarını çekme

### Faz 7 — İleri Özellikler (Gelecek)

34. **Toplu video çevirisi / kuyruk sistemi** (Beyin Fırtınası #13 — Kurucu veto)
    - Playlist sıraya koyma, arka planda sıralı çeviri
    - Teknik kısıtlar nedeniyle sıralı (paralel değil) işleme

35. **Çevrimdışı mod / yerel model** (Beyin Fırtınası #1 — Kurucu veto)
    - Whisper.cpp WebAssembly ile tarayıcıda çalışan STT
    - İnternetsiz temel transkripsiyon

---

## Gemini Live API Kullanım Detayı

### Bağlantı kurma
```javascript
const ws = new WebSocket(
  `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`
);
```

### Setup mesajı
```javascript
ws.send(JSON.stringify({
  setup: {
    model: "models/gemini-3.1-flash-live-preview",
    generationConfig: {
      responseModalities: ["TEXT"],  // Faz 1: sadece metin, Faz 3: ["AUDIO", "TEXT"]
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }
      }
    },
    systemInstruction: {
      parts: [{
        text: "You are a real-time audio translator. Listen to the audio and translate everything you hear to {targetLanguage}. Output only the translation, nothing else. Preserve the meaning and tone."
      }]
    }
  }
}));
```

### Ses gönderme
```javascript
ws.send(JSON.stringify({
  realtimeInput: {
    mediaChunks: [{
      mimeType: "audio/pcm;rate=16000",
      data: base64EncodedPCMChunk
    }]
  }
}));
```

### Yanıt alma
```javascript
ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  // Metin yanıtı: response.serverContent.modelTurn.parts[].text
  // Ses yanıtı: response.serverContent.modelTurn.parts[].inlineData.data (base64 PCM)
};
```

---

## Varsayılan Ayarlar

```javascript
{
  // API & Model
  apiKeys: { gemini: "", openai: "", deepseek: "", claude: "" },
  selectedModel: "gemini-3.1-flash-live-preview",
  
  // Çeviri
  targetLanguage: "tr",
  skipSameLanguage: false,          // Aynı dilde çeviriyi atla
  subtitlePriority: "ai",           // "ai" | "platform" (AI tanımlı vs platform yerleşik)
  
  // Görüntüleme
  displayMode: "subtitles_only",    // "mute_translated" | "subtitles_audio" | "subtitles_only"
  timingMode: "realtime",           // "realtime" | "paragraph"
  subtitleEnabled: true,
  
  // Altyazı Stili
  subtitleFontSize: 20,
  subtitleFontFamily: "Arial",
  subtitleColor: "#FFFFFF",
  subtitleBackground: "rgba(0,0,0,0.8)",
  subtitlePosition: "bottom",
  
  // Karakter/Ses
  characters: [{ id: 1, name: "Varsayılan", voiceName: "Kore" }],
  activeCharacterId: 1,
  
  // Üyelik
  membershipPlan: "free",           // "free" | "monthly" | "yearly"
  membershipExpiry: null,
  balance: 0,
  
  // Diğer
  emailNotifications: true,
  disabledSites: [],
}
```

---

## Kritik Dosyalar (Oluşturulacak)

1. `manifest.json` — Extension tanımı ve izinler
2. `content/content.js` — **En büyük dosya:** video üstü buton + floating baloncuk + altyazı overlay
3. `offscreen/offscreen.js` — Ses yakalama + model API bağlantısı
4. `lib/models/gemini-live.js` — Gemini Live API WebSocket client
5. `lib/models/base-model.js` — Ortak model interface
6. `background/service-worker.js` — Orkestrasyon ve mesaj yönlendirme
7. `popup/popup.js` — Popup UI (model seçimi, karakter, altyazı)
8. `options/options.js` — Tam ayarlar sayfası
9. `lib/settings.js` — Ayar yönetimi
10. `lib/membership.js` — Üyelik ve erişim kontrolü

---

## Doğrulama / Test

1. `chrome://extensions` → "Paketlenmemiş uzantı yükle" ile yükle
2. Popup'tan Gemini API key gir
3. YouTube'da İngilizce video aç → video üstü yeşil butona tıkla → çeviri başlamalı
4. Floating baloncuktan model değiştir, altyazı toggle/boyut test et
5. Karakter ekle/seç/sil
6. Options sayfasından ayarları değiştir (altyazı stili, devre dışı site)
7. Aynı dilde çeviriyi atla özelliğini test et
8. Altyazı önceliği değiştir (AI vs Platform)
9. Farklı sitelerde test et (Udemy, Coursera)
10. 3 görüntüleme modunu test et
11. Üyelik durumuna göre model erişim kısıtlamalarını test et
