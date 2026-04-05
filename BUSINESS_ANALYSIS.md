# İş Analizi Dokümanı — Universal Audio Translator
### IIBA BABOK v3 Standartlarına Uygun

**Doküman Versiyonu:** 1.0  
**Tarih:** 2026-04-05  
**Hazırlayan İş Analistleri:**
- İA-1 Elif — Fonksiyonel Gereksinimler, Use Case'ler, User Story'ler, Karar Tabloları
- İA-2 Kaan — Non-Fonksiyonel Gereksinimler (FURPS+), UAT Planı, İzlenebilirlik Matrisi
- İA-3 Zeynep — Lean Canvas, SWOT, Balık Kılçığı, Paydaş Analizi, Storyboard

---

## 1. LEAN CANVAS (İA-3 Zeynep)

```
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│    PROBLEM        │    ÇÖZÜM         │  TEMEL METRİKLER │  BENZERSİZ DEĞER │ HAKSIZ AVANTAJ   │
│                   │                  │                  │  ÖNERİSİ (UVP)   │                  │
│ 1. Yabancı dilde  │ 1. Gerçek zamanlı│ • DAU (Günlük    │                  │                  │
│    eğitim içerik- │    ses yakalama + │   Aktif Kullanıcı)│ "Herhangi bir    │ • Çoklu AI model │
│    lerine erişim  │    AI çeviri     │ • Çeviri/gün     │  web sayfasındaki│   desteği (rakip │
│    engeli         │                  │   sayısı         │  yabancı sesi    │   tek model)     │
│                   │ 2. Çoklu AI model│ • Üyelik         │  anında kendi    │ • Dil öğrenme    │
│ 2. Mevcut çeviri  │    desteği       │   dönüşüm oranı │  dilinizde       │   modu (çift     │
│    araçları sadece│    (Gemini,GPT,  │ • Retention      │  dinleyin"       │   altyazı)       │
│    metin çeviriyor│    Claude,       │   (7/30/90 gün)  │                  │ • Video özeti +  │
│    ses yok        │    DeepSeek)     │ • NPS skoru      │                  │   not alma       │
│                   │                  │ • ARPU           │                  │ • Özel sözlük    │
│ 3. Konferans ve   │ 3. Video özeti + │ • Churn oranı    │                  │   yönetimi       │
│    toplantılarda  │    not alma +    │                  │                  │                  │
│    dil bariyeri   │    dışa aktarma  │                  │                  │                  │
├──────────────────┼──────────────────┴──────────────────┴──────────────────┴──────────────────┤
│   KANALLAR        │   MÜŞTERİ SEGMENTLERİ                                                   │
│                   │                                                                          │
│ • Chrome Web Store│ • Yabancı dilde eğitim alan öğrenciler/profesyoneller                    │
│ • YouTube reklamı │ • Uluslararası konferans takip eden akademisyenler                       │
│ • EdTech blogları │ • Çok dilli içerik tüketen bireyler (anime, K-drama, spor)               │
│ • Sosyal medya    │ • Uluslararası toplantılara katılan iş insanları                         │
│ • Influencer      │ • Dil öğrenmek isteyen kullanıcılar                                     │
│   işbirlikleri    │ • İçerik üreticileri (YouTuber'lar)                                      │
├──────────────────┼──────────────────────────────────────────────────────────────────────────────┤
│  MALİYET YAPISI   │  GELİR AKIŞLARI                                                          │
│                   │                                                                          │
│ • AI API maliyeti │ • Aylık/Yıllık üyelik abonelikleri                                       │
│   (Gemini, GPT)  │ • Bakiye (pay-as-you-go) premium modeller için                           │
│ • Geliştirme      │ • BYOK (Bring Your Own Key) — ücretsiz model, platform ücreti            │
│ • Chrome Web Store│ • Kurumsal lisanslama (B2B)                                              │
│   yayın ücreti   │ • Freemium → Premium dönüşüm                                            │
│ • Destek/bakım    │                                                                          │
└──────────────────┴──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. SWOT ANALİZİ (İA-3 Zeynep)

```
┌─────────────────────────────────────┬─────────────────────────────────────┐
│          GÜÇLÜ YANLAR (S)           │          ZAYIF YANLAR (W)           │
│                                     │                                     │
│ • Çoklu AI model desteği            │ • Yeni ürün, marka bilinirliği yok  │
│ • Tek API key ile çalışma (BYOK)    │ • API maliyetleri kullanıcıya bağlı │
│ • Dil öğrenme modu (çift altyazı)   │ • Chrome-only (diğer tarayıcılar ×)│
│ • Video özeti + not alma            │ • Gerçek zamanlı çeviri gecikmesi   │
│ • Özelleştirilebilir terim sözlüğü  │ • İnternet bağlantısı zorunluluğu  │
│ • Tüm web sitelerinde çalışma       │ • Ücretsiz tier API limitleri       │
│ • Platform yerleşik altyazı desteği │                                     │
├─────────────────────────────────────┼─────────────────────────────────────┤
│          FIRSATLAR (O)              │          TEHDİTLER (T)              │
│                                     │                                     │
│ • Uzaktan eğitim pazarı büyüyor     │ • YouTube kendi çeviri geliştirme   │
│ • Uluslararası iş yapma artıyor     │ • Rakip "Dubbing" eklentisi mevcut  │
│ • AI model maliyetleri düşüyor      │ • Google Translate entegrasyonu     │
│ • Dil öğrenme pazarı $15B+          │ • API fiyat değişiklikleri           │
│ • Kurumsal çeviri ihtiyacı          │ • Chrome API politika değişiklikleri│
│ • Canlı yayın çeviri pazarı         │ • Büyük teknoloji şirketlerinin     │
│ • Podcast çeviri pazarı             │   kendi çözümlerini çıkarması      │
└─────────────────────────────────────┴─────────────────────────────────────┘
```

---

## 3. PAYDAŞ ANALİZİ (İA-3 Zeynep)

| Paydaş | Rol | Etki | İlgi | Katılım Sıklığı | İletişim Yöntemi |
|--------|-----|------|------|------------------|------------------|
| Kurucu (Emre) | Ürün Sahibi | Yüksek | Yüksek | Günlük | Doğrudan |
| Son Kullanıcı (Öğrenci) | Birincil Kullanıcı | Düşük | Yüksek | Haftalık | Anket/Test |
| Son Kullanıcı (Profesyonel) | Birincil Kullanıcı | Orta | Yüksek | Haftalık | Anket/Test |
| AI API Sağlayıcıları | Harici Bağımlılık | Yüksek | Düşük | Gerektiğinde | API Dökümantasyonu |
| Chrome Web Store | Dağıtım Platformu | Yüksek | Düşük | Yayın zamanı | Politika takibi |
| Yazılım Ekibi | Uygulayıcı | Orta | Yüksek | Günlük | Standup/Sprint |
| İş Analistleri | Gereksinim | Orta | Yüksek | Sprint başı | Toplantı/Doküman |

### Güç/İlgi Matrisi

```
         Yüksek İlgi          Düşük İlgi
┌─────────────────────┬─────────────────────┐
│   Yakından Yönet    │     Tatmin Et       │ Yüksek
│                     │                     │ Güç
│   • Kurucu (Emre)   │ • Chrome Web Store  │
│                     │ • AI API Sağlayıcı  │
├─────────────────────┼─────────────────────┤
│   Bilgilendir       │     İzle            │ Düşük
│                     │                     │ Güç
│   • Son Kullanıcılar│ • Rakipler          │
│   • Yazılım Ekibi   │                     │
│   • İş Analistleri  │                     │
└─────────────────────┴─────────────────────┘
```

---

## 4. BALIK KILÇIĞI (ISHIKAWA) DİYAGRAMI (İA-3 Zeynep)

**Problem:** "Kullanıcılar yabancı dildeki ses içeriklerini anlayamıyor"

```
    İnsan               Yöntem                Teknoloji
      │                   │                      │
      ├─ Dil bilmeme      ├─ Manuel çeviri yavaş ├─ Mevcut araçlar sadece metin
      ├─ Çoklu dil engeli ├─ Altyazı gecikme     ├─ Gerçek zamanlı API yok (eskiden)
      ├─ Farklı aksanlar  ├─ Bağlam kaybı        ├─ Tarayıcı ses yakalama kısıtı
      │                   ├─ Terim tutarsızlığı   ├─ Yüksek gecikme (latency)
      │                   │                      │
      ▼                   ▼                      ▼
  ════════════════════════════════════════════════════════════▶ PROBLEM:
  ════════════════════════════════════════════════════════════▶ Yabancı ses
      ▲                   ▲                      ▲             içerik anlaşılmıyor
      │                   │                      │
      ├─ Ücretsiz araç yok├─ Platform desteği yok├─ Ses kalitesi düşük
      ├─ Pahalı çözümler  ├─ Her site farklı     ├─ Gürültülü ortam
      ├─ Karmaşık kurulum ├─ Canlı yayın desteği ├─ Çoklu konuşmacı karışma
      │                     yok                  │
    Maliyet             Ortam                  Materyal
```

---

## 5. PERSONA'LAR (İA-2 Kaan)

### Persona 1: Yusuf — Freelancer Yazılımcı

```
👤 Yusuf Aktaş, 28
"Udemy'deki ileri seviye kurslar hep İngilizce, Türkçe çevirisi yok"

Demografi: İstanbul, Freelancer, 5 yıl deneyim
Hedefler:
  • İleri seviye yazılım kurslarını Türkçe anlamak
  • Teknik terimlerin doğru çevrilmesi
  • Ders notlarını otomatik çıkarmak
Acı Noktalar:
  • İngilizce dinleme seviyesi orta, teknik içerik zor
  • Mevcut altyazılar genelde yanlış
  • Video duraklatıp çeviri yapmak zaman kaybı
Davranış: Günde 2-3 saat eğitim videosu izler
Ödeme İsteği: Aylık $5-10 ödeyebilir
```

### Persona 2: Gamze — Akademisyen

```
👤 Prof. Dr. Gamze Demir, 42
"Uluslararası konferansları takip etmeliyim ama hepsi İngilizce"

Demografi: Ankara, Üniversite Öğretim Üyesi
Hedefler:
  • Konferans sunumlarını anlık çevirmek
  • Akademik terimlerin tutarlı çevirisi
  • Konferans özetlerini otomatik çıkarmak
Acı Noktalar:
  • Canlı konferanslarda anlık çeviri yok
  • Akademik terimler yanlış çevriliyor
  • Not almak ve dinlemek aynı anda zor
Davranış: Haftada 5-10 konferans/webinar izler
Ödeme İsteği: Kurumsal bütçe, $20-50/ay
```

### Persona 3: Tarık — Lise Öğrencisi

```
👤 Tarık Yılmaz, 17
"İngilizce YouTube kanallarını anlamak ve İngilizce öğrenmek istiyorum"

Demografi: İzmir, Lise öğrencisi
Hedefler:
  • İngilizce YouTube içeriklerini anlamak
  • Dil öğrenme (çift altyazı ile)
  • Anime/K-drama izlemek
Acı Noktalar:
  • İngilizce seviyesi düşük
  • Altyazılar çok hızlı geçiyor
  • Bilmediği kelimeleri arayamıyor
Davranış: Günde 3-4 saat video izler
Ödeme İsteği: Ücretsiz veya çok düşük ($2-3/ay)
```

### Persona 4: Kerem — CEO

```
👤 Kerem Özkan, 45
"Uluslararası Zoom toplantılarında anlık çeviri şart"

Demografi: İstanbul, Teknoloji şirketi CEO'su
Hedefler:
  • Zoom/Meet toplantılarında anlık çeviri
  • Toplantı özetleri ve aksiyon maddeleri
  • Çoklu dil desteği (İngilizce, Almanca, Çince)
Acı Noktalar:
  • Toplantılarda dil bariyeri
  • Tercüman maliyeti yüksek
  • Toplantı notları eksik kalıyor
Davranış: Haftada 10+ uluslararası toplantı
Ödeme İsteği: $50-100/ay, kurumsal lisans
```

---

## 6. FONKSİYONEL GEREKSİNİMLER (İA-1 Elif)

### MoSCoW Önceliklendirmesi

#### MUST HAVE (Olmazsa Olmaz)

| ID | User Story | Kabul Kriterleri | Faz |
|----|-----------|------------------|-----|
| FR-001 | Bir kullanıcı olarak, herhangi bir web sayfasındaki sesi yakalayabilmek istiyorum ki yabancı içerikleri çevirebilecek altyapıyı elde edeyim | **Given:** Kullanıcı bir video sayfasında **When:** "Başlat" butonuna tıklar **Then:** Sekme sesi yakalanır ve işlenmeye başlar | Faz 1 |
| FR-002 | Bir kullanıcı olarak, yakalanan sesi gerçek zamanlı olarak hedef dilime çevirmek istiyorum ki yabancı içeriği anlayabileyim | **Given:** Ses yakalama aktif **When:** Konuşmacı konuşur **Then:** Çevrilmiş metin 2-5 saniye içinde altyazı olarak görünür | Faz 1 |
| FR-003 | Bir kullanıcı olarak, hedef dilimi seçebilmek istiyorum ki çeviri istediğim dilde olsun | **Given:** Popup açık **When:** Dil dropdown'undan "Türkçe" seçer **Then:** Tüm çeviriler Türkçe olarak yapılır | Faz 1 |
| FR-004 | Bir kullanıcı olarak, API key'imi girebilmek istiyorum ki servisi kendi hesabımla kullanabileyim | **Given:** Popup'ta API key alanı **When:** Geçerli Gemini key girer ve kaydeder **Then:** Key güvenli şekilde saklanır ve çeviri çalışır | Faz 1 |
| FR-005 | Bir kullanıcı olarak, video üzerindeki butonla çeviriyi başlatıp durdurmak istiyorum ki kolay kontrol edeyim | **Given:** Video oynatıcı sayfada mevcut **When:** Sayfa yüklenir **Then:** Video player üzerinde yeşil kontrol butonu görünür | Faz 1 |
| FR-006 | Bir kullanıcı olarak, altyazıyı açıp kapatabilmek istiyorum ki ihtiyacıma göre kullanayım | **Given:** Çeviri aktif **When:** Altyazı toggle'ını kapatır **Then:** Altyazı overlay gizlenir, çeviri arka planda devam eder | Faz 1 |

#### SHOULD HAVE (Olmalı)

| ID | User Story | Kabul Kriterleri | Faz |
|----|-----------|------------------|-----|
| FR-007 | Bir kullanıcı olarak, AI modelini seçebilmek istiyorum ki kalite/maliyet dengemi kurayım | **Given:** Popup/baloncuk açık **When:** Model dropdown'unu açar **Then:** Üyelik durumuna göre erişilebilir modeller listelenir | Faz 2 |
| FR-008 | Bir kullanıcı olarak, çevrilmiş sesi dinleyebilmek istiyorum ki okumak yerine dinleyebileyim | **Given:** Görüntüleme modu "Sesli Çeviri" **When:** Çeviri tamamlanır **Then:** Çevrilmiş metin TTS ile seslendirilir | Faz 3 |
| FR-009 | Bir kullanıcı olarak, orijinal sesi kısmak istiyorum ki çeviri sesini net duyayım | **Given:** Mod "Orijinali kıs" seçili **When:** Çeviri aktif **Then:** Orijinal ses %0-10'a düşer, TTS çalışır | Faz 3 |
| FR-010 | Bir kullanıcı olarak, çift dilli altyazı görmek istiyorum ki hem orijinali hem çeviriyi izleyebileyim | **Given:** "Çift Dilli" modu aktif **When:** Konuşmacı konuşur **Then:** Üst satırda orijinal, alt satırda çeviri görünür | Faz 2 |
| FR-011 | Bir kullanıcı olarak, konuşmacıları ayırt edebilmek istiyorum ki kim ne dedi anlayayım | **Given:** Birden fazla kişi konuşuyor **When:** Konuşmacı değişir **Then:** Altyazıda "Konuşmacı 1:", "Konuşmacı 2:" etiketleri ve farklı renkler gösterilir | Faz 2 |
| FR-012 | Bir kullanıcı olarak, floating ayar baloncuğundan hızlı ayar yapmak istiyorum ki sayfadan ayrılmayayım | **Given:** Video sayfasında **When:** Baloncuk ikonuna tıklar **Then:** Sağ tarafta model, altyazı, karakter ayarları paneli açılır | Faz 1 |
| FR-013 | Bir kullanıcı olarak, ses karakteri seçebilmek istiyorum ki çeviri sesini beğeneyim | **Given:** Popup/baloncukta karakter bölümü **When:** Yeni karakter ekler ve ses seçer **Then:** TTS bu ses ile konuşur | Faz 5 |

#### COULD HAVE (Olsa İyi Olur)

| ID | User Story | Kabul Kriterleri | Faz |
|----|-----------|------------------|-----|
| FR-014 | Bir kullanıcı olarak, video özetini görmek istiyorum ki içeriğin ana noktalarını hızlıca kavrayayım | **Given:** Çeviri tamamlanmış/devam ediyor **When:** "Özet" butonuna tıklar **Then:** Videonun ana noktaları madde madde gösterilir | Faz 3 |
| FR-015 | Bir kullanıcı olarak, önemli anlara not eklemek istiyorum ki sonra geri dönüp bakayım | **Given:** Video oynatılıyor **When:** "Not Ekle" butonuna tıklar **Then:** Zaman damgalı not kaydedilir | Faz 3 |
| FR-016 | Bir kullanıcı olarak, çeviriyi SRT/TXT/PDF olarak indirmek istiyorum ki çevrimdışı kullanayım | **Given:** Çeviri mevcut **When:** "İndir" butonuna tıklar ve format seçer **Then:** Çevrilmiş transkript seçili formatta indirilir | Faz 3 |
| FR-017 | Bir kullanıcı olarak, altyazı hızını ayarlayabilmek istiyorum ki rahat okuyayım | **Given:** Ayarlarda hız kontrolü **When:** Slider'ı ayarlar **Then:** Altyazı gösterim süresi ayarlanan hıza göre değişir | Faz 3 |
| FR-018 | Bir kullanıcı olarak, özel terim sözlüğü oluşturmak istiyorum ki teknik terimler doğru çevrilsin | **Given:** Ayarlarda sözlük bölümü **When:** "Machine Learning" → "Makine Öğrenimi" kuralı ekler **Then:** Çevirilerde bu terim her zaman "Makine Öğrenimi" olarak kullanılır | Faz 4 |
| FR-019 | Bir kullanıcı olarak, çeviri geçmişimi görmek istiyorum ki önceki çevirilere dönüp bakayım | **Given:** Geçmiş sayfası **When:** Açar **Then:** Tarih, site, dil bilgisiyle çeviri listesi görünür, arama yapılabilir | Faz 4 |
| FR-020 | Bir kullanıcı olarak, altyazıdaki bir kelimeye tıklayıp anlamını görmek istiyorum ki yeni kelimeler öğreneyim | **Given:** Çift dilli altyazı aktif **When:** Bir kelimeye tıklar **Then:** Kelime anlamı, telaffuz ve örnek cümle tooltip'te gösterilir | Faz 5 |
| FR-021 | Bir kullanıcı olarak, aynı dilde çeviriyi atlamak istiyorum ki gereksiz API harcaması olmasın | **Given:** Ayarlarda "aynı dilde atla" aktif **When:** Kaynak dil = hedef dil **Then:** Çeviri yapılmaz, orijinal ses/altyazı devam eder | Faz 2 |
| FR-022 | Bir kullanıcı olarak, belirli siteleri devre dışı bırakmak istiyorum ki eklenti her yerde çalışmasın | **Given:** Ayarlarda devre dışı site listesi **When:** URL ekler **Then:** O sitede eklenti butonu görünmez | Faz 2 |

#### WON'T HAVE (Bu Sürümde Yok — Gelecek)

| ID | User Story | Faz |
|----|-----------|-----|
| FR-023 | Toplu video çevirisi (kuyruk sistemi) — Playlist sıraya koyma | Faz 7 |
| FR-024 | Çevrimdışı mod / yerel model (Whisper WASM) | Faz 7 |
| FR-025 | Çoklu tarayıcı desteği (Firefox, Edge, Safari) | Gelecek |

---

## 7. USE CASE DİYAGRAMLARI (İA-1 Elif)

### UC-001: Gerçek Zamanlı Ses Çevirisi (Ana Use Case)

```
                        ┌─────────────────────────────────────┐
                        │     Universal Audio Translator      │
   ┌──────┐             │                                     │
   │      │────────────▶│  UC-001: Sekme Sesini Yakala        │
   │      │             │         & Çeviri Başlat             │
   │      │────────────▶│  UC-002: AI Model Seç               │
   │      │             │                                     │
   │Kulla-│────────────▶│  UC-003: Altyazı Görüntüle          │
   │ nıcı │             │                                     │
   │      │────────────▶│  UC-004: Sesli Çeviri Dinle          │
   │      │             │                                     │           ┌──────────┐
   │      │────────────▶│  UC-005: Görüntüleme Modu Seç       │           │          │
   │      │             │                                     │──────────▶│ Gemini   │
   │      │────────────▶│  UC-006: Video Özeti Oluştur        │──────────▶│ API      │
   │      │             │                                     │──────────▶│          │
   │      │────────────▶│  UC-007: Not Ekle                   │           │ OpenAI   │
   │      │             │                                     │           │ API      │
   │      │────────────▶│  UC-008: Çeviriyi Dışa Aktar        │           │          │
   │      │             │                                     │           │ DeepSeek │
   │      │────────────▶│  UC-009: Sözlük Yönet               │           │ API      │
   │      │             │                                     │           │          │
   │      │────────────▶│  UC-010: Ayarları Yapılandır         │           │ Claude   │
   │      │             │                                     │           │ API      │
   │      │────────────▶│  UC-011: Karakter/Ses Seç            │           │          │
   │      │             │                                     │           └──────────┘
   │      │────────────▶│  UC-012: Kelime Anlamı Görüntüle     │
   └──────┘             │                                     │           ┌──────────┐
                        │  UC-013: Çeviri Geçmişini Görüntüle │──────────▶│ Sözlük   │
   ┌──────┐             │                                     │           │ API      │
   │Admin │────────────▶│  UC-014: Üyelik Yönetimi             │           └──────────┘
   └──────┘             │                                     │
                        └─────────────────────────────────────┘
```

### UC-001 Detay: Gerçek Zamanlı Ses Çevirisi

```
USE CASE: UC-001 Gerçek Zamanlı Ses Çevirisi

Aktörler:
  Birincil: Kullanıcı
  İkincil: AI Model API (Gemini/GPT/Claude/DeepSeek)

Ön Koşullar:
  - Kullanıcı Chrome tarayıcısında bir video/ses içeriği sayfasında
  - API key girilmiş ve geçerli
  - Eklenti yüklü ve aktif

Tetikleyici: Kullanıcı video üstü yeşil butona veya popup'taki "Başlat" butonuna tıklar

Ana Akış:
  1. Sistem video player'ı tespit eder ve kontrol butonunu gösterir
  2. Kullanıcı "Başlat" butonuna tıklar
  3. Service worker chrome.tabCapture ile sekme sesini yakalar
  4. Offscreen document AudioContext ile ses akışını işler
  5. AudioWorklet PCM formatına dönüştürür (16kHz, 16-bit, mono)
  6. Sistem seçili AI modeline WebSocket/REST ile bağlanır
  7. PCM chunk'ları base64 olarak API'ye gönderilir
  8. API çevrilmiş metni döndürür
  9. Content script altyazı overlay'inde çeviriyi gösterir
  10. Kullanıcı "Durdur" butonuna tıklayana kadar devam eder

Alternatif Akışlar:
  3a. tabCapture başarısız olursa:
    - Sistem hata mesajı gösterir: "Ses yakalama izni gerekli"
    - Use case sonlanır
  
  6a. API bağlantısı kurulamazsa:
    - Sistem 3 kez yeniden dener (2 sn aralıkla)
    - Başarısız olursa hata mesajı gösterir
    - Use case sonlanır
  
  6b. API key geçersiz ise:
    - Sistem "Geçersiz API key" uyarısı gösterir
    - Kullanıcıyı popup'a yönlendirir
    - Use case sonlanır
  
  8a. Kaynak dil = hedef dil ve "aynı dilde atla" aktif ise:
    - Çeviri yapılmaz, orijinal transkript gösterilir
    - Kullanıcıya bilgi verilir

Son Koşullar:
  - Çeviri metni ekranda altyazı olarak gösterilir
  - Kullanıcı yabancı içeriği kendi dilinde anlar
  - Çeviri geçmişi kaydedilir (aktifse)

İlgili NFR'ler:
  - NFR-001 (Performans: <3 sn gecikme)
  - NFR-002 (Güvenilirlik: %99.5 uptime)
  - NFR-003 (Güvenlik: API key şifreleme)
```

---

## 8. NON-FONKSİYONEL GEREKSİNİMLER — FURPS+ (İA-2 Kaan)

### Functionality (Ek Fonksiyonel Kısıtlamalar)

| ID | Gereksinim | Metrik | Öncelik |
|----|-----------|--------|---------|
| NFR-F01 | Sistem 24+ dili desteklemeli | Desteklenen dil sayısı ≥ 24 | Must |
| NFR-F02 | Sistem 4+ AI modelini desteklemeli | Gemini, GPT, Claude, DeepSeek | Must |
| NFR-F03 | API key'ler tarayıcıda şifrelenmiş saklanmalı | chrome.storage.local + encryption | Must |

### Usability (Kullanılabilirlik)

| ID | Gereksinim | Metrik | Öncelik |
|----|-----------|--------|---------|
| NFR-U01 | İlk kullanıcı 2 dakika içinde ilk çeviriyi başlatabilmeli | Time-to-first-translation ≤ 2 dk | Must |
| NFR-U02 | Popup UI 3 tıklamada temel işlem yapılabilmeli | Maksimum tıklama sayısı ≤ 3 | Should |
| NFR-U03 | Altyazı boyutu, renk, pozisyon özelleştirilebilmeli | Ayar sayısı ≥ 5 | Should |
| NFR-U04 | Eklenti Türkçe ve İngilizce arayüz sunmalı | i18n desteği ≥ 2 dil | Should |
| NFR-U05 | Video üstü buton her major video platformunda görünmeli | YouTube, Udemy, Coursera, Vimeo | Must |

### Reliability (Güvenilirlik)

| ID | Gereksinim | Metrik | Öncelik |
|----|-----------|--------|---------|
| NFR-R01 | API bağlantısı koptuğunda otomatik yeniden bağlanmalı | Maksimum 3 deneme, 2 sn aralık | Must |
| NFR-R02 | Service worker uyandırılabilir olmalı | chrome.alarms ile 25 sn ping | Must |
| NFR-R03 | Offscreen document kapanırsa yeniden oluşturulmalı | Otomatik recovery ≤ 5 sn | Must |
| NFR-R04 | 1 saatlik kesintisiz çeviri oturumu desteklenmeli | Sürekli çalışma ≥ 60 dk | Should |

### Performance (Performans)

| ID | Gereksinim | Metrik | Öncelik |
|----|-----------|--------|---------|
| NFR-P01 | Ses yakalama → altyazı gösterim gecikmesi ≤ 3 saniye | End-to-end latency ≤ 3000 ms | Must |
| NFR-P02 | Eklenti CPU kullanımı ≤ %15 | Ortalama CPU ≤ 15% | Should |
| NFR-P03 | Eklenti bellek kullanımı ≤ 150 MB | RAM ≤ 150 MB | Should |
| NFR-P04 | Popup açılış süresi ≤ 500 ms | Load time ≤ 500 ms | Should |
| NFR-P05 | Altyazı render süresi ≤ 50 ms | DOM update ≤ 50 ms | Must |

### Supportability (Desteklenebilirlik)

| ID | Gereksinim | Metrik | Öncelik |
|----|-----------|--------|---------|
| NFR-S01 | Yeni AI model ekleme ≤ 1 gün geliştirme | Modüler provider mimarisi | Must |
| NFR-S02 | Chrome Manifest V3 uyumlu olmalı | Manifest V3 tam uyum | Must |
| NFR-S03 | Kod modüler ve test edilebilir olmalı | ES modules, birim test ≥ %60 | Should |
| NFR-S04 | Chrome 120+ sürümleri desteklenmeli | Minimum Chrome versiyon ≥ 120 | Must |

### + Ek Kısıtlamalar

| ID | Gereksinim | Kategori | Öncelik |
|----|-----------|----------|---------|
| NFR-C01 | Yalnızca Chrome Web Store üzerinden dağıtılmalı | Dağıtım | Must |
| NFR-C02 | Kullanıcı verisi üçüncü taraflarla paylaşılmamalı | Gizlilik | Must |
| NFR-C03 | KVKK ve GDPR uyumlu olmalı | Yasal | Must |
| NFR-C04 | Eklenti toplam boyutu ≤ 5 MB | Fiziksel | Should |

---

## 9. KARAR TABLOSU (İA-1 Elif)

### Model Erişim Karar Tablosu

| | Durum 1 | Durum 2 | Durum 3 | Durum 4 | Durum 5 |
|---|---------|---------|---------|---------|---------|
| **Koşullar** | | | | | |
| Üyelik aktif mi? | Hayır | Evet | Evet | Evet | Hayır |
| Kendi API key var mı? | Hayır | Hayır | Evet | Evet | Evet |
| Premium model seçili mi? | Hayır | Hayır | Hayır | Evet | Hayır |
| Bakiye yeterli mi? | — | — | — | Evet | — |
| **Aksiyonlar** | | | | | |
| Ücretsiz Gemini Flash | ✅ (limitli) | ✅ | ✅ | ✅ | ✅ |
| Üye modelleri (GPT-mini, Claude) | ❌ | ✅ | ✅ | ✅ | ❌ |
| Premium modeller (GPT-5) | ❌ | ❌ | ❌ | ✅ | ❌ |
| BYOK (kendi key ile tüm modeller) | ❌ | ❌ | ✅ | ✅ | ✅ |

### Görüntüleme Modu Karar Tablosu

| | Mod 1 | Mod 2 | Mod 3 |
|---|-------|-------|-------|
| **Koşullar** | | | |
| Altyazı göster | ❌ | ✅ | ✅ |
| TTS sesli çeviri | ✅ | ✅ | ❌ |
| **Aksiyonlar** | | | |
| Orijinal ses | Kısık (0) | Kısık (0.1) | Normal (1.0) |
| Altyazı overlay | Gizli | Görünür | Görünür |
| TTS oynatma | Aktif | Aktif | Pasif |

---

## 10. DURUM DİYAGRAMI (İA-1 Elif)

### Çeviri Oturumu Durum Diyagramı

```
                    ┌─────────┐
                    │  HAZIR   │◀──────────────────────────┐
                    │  (Idle)  │                           │
                    └────┬─────┘                           │
                         │ [Başlat tıklandı]               │
                         ▼                                 │
                    ┌─────────┐                           │
                    │BAĞLANI- │                           │
                    │  YOR    │                           │
                    │(Connect)│                           │
                    └────┬─────┘                           │
                         │ [WebSocket bağlandı]            │
                         ▼                                 │
                    ┌─────────┐    [API hatası]     ┌──────┴──────┐
         ┌─────────│  AKTİF   │───────────────────▶│    HATA     │
         │         │(Active)  │                    │   (Error)   │
         │         └────┬─────┘                    └──────┬──────┘
         │              │                                 │
         │              │ [Durdur tıklandı]               │ [Yeniden dene]
         │              │ [Sekme kapatıldı]                │ [3 deneme aşıldı → HAZIR]
         │              ▼                                 │
         │         ┌─────────┐                           │
         │         │DURDURU- │                           │
         │         │  LUYOR  │───────────────────────────┘
         │         │ (Stop)  │
         │         └────┬─────┘
         │              │ [Kaynaklar temizlendi]
         │              ▼
         │         ┌─────────┐
         └────────▶│  HAZIR   │
                   │  (Idle)  │
                   └──────────┘
                   
[Ses gelmiyor 30sn] → DURAKLATILDI (Paused) → [Ses tekrar geldi] → AKTİF
```

---

## 11. STORYBOARD (İA-3 Zeynep)

### Senaryo: Yusuf, Udemy'den Python Kursu İzliyor

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   SAHNE 1        │  │   SAHNE 2        │  │   SAHNE 3        │
│                  │  │                  │  │                  │
│ Yusuf Udemy'de   │  │ Video player     │  │ Popup açılır:    │
│ İngilizce Python │  │ üzerinde yeşil   │  │ - Gemini seçili  │
│ kursunu açar     │  │ 🟢 buton görür   │  │ - Hedef: Türkçe  │
│                  │  │                  │  │ - "Başlat" tıklar│
│ [Udemy sayfası]  │  │ [Yeşil buton]    │  │ [Popup UI]       │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                      │
         ▼                     ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   SAHNE 4        │  │   SAHNE 5        │  │   SAHNE 6        │
│                  │  │                  │  │                  │
│ Video oynar,     │  │ Sağ tarafta      │  │ Yusuf "İndir"    │
│ alt kısımda      │  │ floating baloncuk│  │ butonuna tıklar  │
│ Türkçe altyazı   │  │ açar → özet ve   │  │ PDF olarak ders  │
│ gerçek zamanlı   │  │ not ekleme       │  │ notlarını indirir│
│ akar             │  │ alanı görür      │  │                  │
│                  │  │                  │  │                  │
│ [Altyazı overlay]│  │ [Floating panel] │  │ [İndirme diyalog]│
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### Senaryo: Tarık, Dil Öğrenme Moduyla YouTube İzliyor

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   SAHNE 1        │  │   SAHNE 2        │  │   SAHNE 3        │
│                  │  │                  │  │                  │
│ Tarık YouTube'da │  │ Popup'tan "Çift  │  │ Video oynar:     │
│ İngilizce tech   │  │ Dilli Altyazı"   │  │ Üst: "AI agents  │
│ videosu açar     │  │ modunu seçer     │  │ are transforming"│
│                  │  │                  │  │ Alt: "AI ajanları │
│                  │  │                  │  │ dönüştürüyor"    │
│ [YouTube]        │  │ [Mod seçimi]     │  │ [Çift altyazı]   │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                      │
         ▼                     ▼                      ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   SAHNE 4        │  │   SAHNE 5        │  │   SAHNE 6        │
│                  │  │                  │  │                  │
│ Tarık bilmediği  │  │ Tooltip açılır:  │  │ Kelime listesine │
│ "transforming"   │  │ "transform:      │  │ eklenir. Sonra   │
│ kelimesine       │  │ dönüştürmek,     │  │ kelime listesini │
│ tıklar           │  │ değiştirmek"     │  │ inceleyebilir    │
│                  │  │ + örnek cümle    │  │                  │
│ [Kelime tıklama] │  │ [Sözlük tooltip] │  │ [Kelime listesi] │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 12. GEREKSİNİM İZLENEBİLİRLİK MATRİSİ — RTM (İA-2 Kaan)

| Gereksinim ID | Tip | Durum | Açıklama | Test Case ID | Use Case | Faz | Öncelik |
|--------------|-----|-------|----------|-------------|----------|-----|---------|
| FR-001 | FR | Taslak | Sekme sesi yakalama | TST-001, TST-002 | UC-001 | 1 | Must |
| FR-002 | FR | Taslak | Gerçek zamanlı çeviri | TST-003, TST-004 | UC-001 | 1 | Must |
| FR-003 | FR | Taslak | Hedef dil seçimi | TST-005 | UC-010 | 1 | Must |
| FR-004 | FR | Taslak | API key girişi | TST-006, TST-007 | UC-010 | 1 | Must |
| FR-005 | FR | Taslak | Video üstü kontrol butonu | TST-008 | UC-001 | 1 | Must |
| FR-006 | FR | Taslak | Altyazı toggle | TST-009 | UC-003 | 1 | Must |
| FR-007 | FR | Taslak | AI model seçimi | TST-010, TST-011 | UC-002 | 2 | Should |
| FR-008 | FR | Taslak | Sesli çeviri (TTS) | TST-012 | UC-004 | 3 | Should |
| FR-009 | FR | Taslak | Orijinal ses kısma | TST-013 | UC-005 | 3 | Should |
| FR-010 | FR | Taslak | Çift dilli altyazı | TST-014 | UC-003 | 2 | Should |
| FR-011 | FR | Taslak | Konuşmacı tanıma | TST-015 | UC-003 | 2 | Should |
| FR-012 | FR | Taslak | Floating ayar baloncuğu | TST-016 | UC-010 | 1 | Should |
| FR-013 | FR | Taslak | Karakter/ses seçimi | TST-017 | UC-011 | 5 | Could |
| FR-014 | FR | Taslak | Video özeti | TST-018 | UC-006 | 3 | Could |
| FR-015 | FR | Taslak | Not ekleme | TST-019 | UC-007 | 3 | Could |
| FR-016 | FR | Taslak | Çeviri dışa aktarma | TST-020 | UC-008 | 3 | Could |
| FR-017 | FR | Taslak | Altyazı hız kontrolü | TST-021 | UC-010 | 3 | Could |
| FR-018 | FR | Taslak | Terim sözlüğü | TST-022 | UC-009 | 4 | Could |
| FR-019 | FR | Taslak | Çeviri geçmişi | TST-023 | UC-013 | 4 | Could |
| FR-020 | FR | Taslak | Kelime anlamı tooltip | TST-024 | UC-012 | 5 | Could |
| FR-021 | FR | Taslak | Aynı dilde çeviriyi atla | TST-025 | UC-001 | 2 | Could |
| FR-022 | FR | Taslak | Devre dışı siteler | TST-026 | UC-010 | 2 | Could |
| NFR-P01 | NFR | Taslak | Gecikme ≤ 3 sn | TST-P01 | — | 1 | Must |
| NFR-R01 | NFR | Taslak | Otomatik yeniden bağlanma | TST-R01 | — | 1 | Must |
| NFR-U01 | NFR | Taslak | İlk çeviri ≤ 2 dk | TST-U01 | — | 1 | Must |
| NFR-S02 | NFR | Taslak | Manifest V3 uyumu | TST-S01 | — | 1 | Must |

---

## 13. UAT (KULLANICI KABUL TESTİ) PLANI (İA-2 Kaan)

### UAT Kapsamı ve Stratejisi

**Amaç:** Son kullanıcıların eklentiyi gerçek senaryolarda test ederek kabul vermesi
**Test Ekibi:** 10 hedef kitle kullanıcısı (Persona'lara uygun seçilmiş)
**Ortam:** Chrome 120+, farklı OS (Windows, macOS), farklı internet hızları

### UAT Test Senaryoları

#### UAT-001: İlk Kurulum ve Çeviri Başlatma
```
Ön Koşul: Eklenti yeni yüklenmiş, API key girilmemiş
Adımlar:
  1. Chrome'da eklenti ikonuna tıkla
  2. Popup'ta Gemini API key gir
  3. Hedef dil olarak "Türkçe" seç
  4. "Kaydet" butonuna tıkla
  5. YouTube'da İngilizce video aç
  6. Video üstü yeşil butona tıkla
Beklenen Sonuç: 
  - API key kaydedilir
  - Video üzerinde yeşil buton görünür
  - Tıklandığında 3 saniye içinde Türkçe altyazı görünmeye başlar
Gerçek Sonuç: ___________
Durum: ☐ Geçti  ☐ Kaldı  ☐ Bloke
```

#### UAT-002: Farklı Platformlarda Çeviri
```
Ön Koşul: API key girilmiş, çeviri çalışıyor
Adımlar:
  1. YouTube'da İngilizce video ile test et
  2. Udemy'de İngilizce kurs ile test et
  3. Coursera'da İngilizce ders ile test et
  4. Twitch canlı yayında test et
  5. Zoom/Meet web toplantısında test et
Beklenen Sonuç: Tüm platformlarda altyazı çevirisi çalışır
Gerçek Sonuç: ___________
Durum: ☐ Geçti  ☐ Kaldı  ☐ Bloke
```

#### UAT-003: Görüntüleme Modları
```
Ön Koşul: Çeviri aktif
Adımlar:
  1. "Sadece altyazı" modunu seç → orijinal ses normal, altyazı var
  2. "Altyazı + Ses" modunu seç → orijinal kısık, TTS + altyazı
  3. "Orijinali kıs + Ses" modunu seç → orijinal sessiz, sadece TTS
Beklenen Sonuç: Her mod doğru şekilde çalışır
Gerçek Sonuç: ___________
Durum: ☐ Geçti  ☐ Kaldı  ☐ Bloke
```

#### UAT-004: Çift Dilli Altyazı
```
Ön Koşul: Çeviri aktif
Adımlar:
  1. "Çift Dilli Altyazı" modunu aktifleştir
  2. Video oynat
  3. Üst satırda orijinal metin, alt satırda çeviri görüntülendiğini doğrula
  4. Bir kelimeye tıkla, sözlük tooltip'inin göründüğünü doğrula
Beklenen Sonuç: Her iki dil aynı anda görünür, kelime tıklanabilir
Gerçek Sonuç: ___________
Durum: ☐ Geçti  ☐ Kaldı  ☐ Bloke
```

#### UAT-005: Video Özeti ve Not Alma
```
Ön Koşul: En az 5 dakika çeviri yapılmış
Adımlar:
  1. Floating baloncukta "Özet" butonuna tıkla
  2. Özetin ana noktaları içerdiğini doğrula
  3. "Not Ekle" butonuna tıkla, not yaz
  4. Notun zaman damgasıyla kaydedildiğini doğrula
  5. "İndir" → PDF seçerek dışa aktar
Beklenen Sonuç: Özet doğru, notlar kaydedilir, PDF indirilir
Gerçek Sonuç: ___________
Durum: ☐ Geçti  ☐ Kaldı  ☐ Bloke
```

#### UAT-006: Model Değiştirme
```
Ön Koşul: Birden fazla API key girilmiş
Adımlar:
  1. Gemini ile çeviri başlat
  2. Çeviri devam ederken modeli GPT-4o mini'ye değiştir
  3. Çevirinin yeni modelle devam ettiğini doğrula
  4. Üyelik gerektiren modeli üyeliksiz seçmeye çalış
Beklenen Sonuç: Model değişimi sorunsuz, kısıtlı modeller uyarı verir
Gerçek Sonuç: ___________
Durum: ☐ Geçti  ☐ Kaldı  ☐ Bloke
```

#### UAT-007: Uzun Süreli Kullanım (Stres Testi)
```
Ön Koşul: Çeviri aktif
Adımlar:
  1. 60 dakika kesintisiz çeviri çalıştır
  2. CPU ve RAM kullanımını izle
  3. Bağlantı kopması olup olmadığını kontrol et
  4. Altyazı gecikmesinin artıp artmadığını kontrol et
Beklenen Sonuç: 60 dk boyunca stabil, CPU ≤ %15, RAM ≤ 150MB
Gerçek Sonuç: ___________
Durum: ☐ Geçti  ☐ Kaldı  ☐ Bloke
```

---

## 14. İŞ KURALLARI (İA-1 Elif)

| ID | Kural | Tip | Öncelik |
|----|-------|-----|---------|
| BR-001 | Ücretsiz kullanıcılar günde maksimum 30 dakika çeviri yapabilir | Kısıtlama | Must |
| BR-002 | Üyeliği olmayan kullanıcılar yalnızca Gemini Flash modelini kullanabilir | Yetkilendirme | Must |
| BR-003 | BYOK (kendi API key) kullanan kullanıcılar tüm modellere erişebilir | Yetkilendirme | Must |
| BR-004 | Premium modeller (GPT-5) hem üyelik hem bakiye gerektirir | Yetkilendirme | Must |
| BR-005 | API key tarayıcı dışına (3. taraf sunuculara) gönderilmemeli | Güvenlik | Must |
| BR-006 | Devre dışı sitelerde eklenti UI elemanları gösterilmemeli | Kısıtlama | Should |
| BR-007 | Kaynak dil = hedef dil ise ve ayar aktifse çeviri API çağrısı yapılmamalı | Optimizasyon | Should |
| BR-008 | Çeviri geçmişi yerel IndexedDB'de saklanmalı, maksimum 500 kayıt | Depolama | Should |
| BR-009 | Terim sözlüğünde maksimum 1000 özel terim tanımlanabilir | Kısıtlama | Should |
| BR-010 | Üyelik süresi dolduğunda kullanıcı ücretsiz plana düşmeli | İş kuralı | Must |

---

## 15. VERİ SÖZLÜĞÜ (İA-2 Kaan)

| Veri Elemanı | Tip | Format | Geçerli Değerler | Açıklama |
|-------------|-----|--------|------------------|----------|
| apiKey | String | Şifreli | Alfanumerik, 39 karakter (Gemini) | Kullanıcının AI API anahtarı |
| targetLanguage | String | ISO 639-1 | "tr", "en", "de", "fr", "ja", ... | Hedef çeviri dili |
| selectedModel | String | Enum | gemini-3.1-flash-live-preview, gpt-4o-mini, ... | Aktif AI modeli |
| displayMode | String | Enum | mute_translated, subtitles_audio, subtitles_only | Görüntüleme modu |
| timingMode | String | Enum | realtime, paragraph | Zamanlama modu |
| subtitleEnabled | Boolean | true/false | true, false | Altyazı açık/kapalı |
| subtitleFontSize | Integer | px | 12-48 | Altyazı font boyutu |
| membershipPlan | String | Enum | free, monthly, yearly | Üyelik planı |
| membershipExpiry | DateTime | ISO 8601 | Tarih veya null | Üyelik bitiş tarihi |
| balance | Float | Decimal | 0.00 - 9999.99 | Bakiye (pay-as-you-go) |
| characters | Array | JSON | [{id, name, voiceName}] | Ses karakterleri listesi |
| disabledSites | Array | URL | ["example.com", ...] | Devre dışı site listesi |
| customDictionary | Array | JSON | [{source, target}] | Özel terim sözlüğü |
| translationHistory | Array | JSON | [{date, url, lang, transcript}] | Çeviri geçmişi |

---

## 16. BAĞLAM DİYAGRAMI (İA-3 Zeynep)

```
                         ┌──────────────┐
                         │   Chrome     │
                         │   Tarayıcı   │
                         │   (Sekme     │
                         │    Sesi)     │
                         └──────┬───────┘
                                │ Ses akışı
                                ▼
┌──────────────┐      ┌──────────────────────┐      ┌──────────────┐
│   Kullanıcı  │─────▶│                      │─────▶│  Gemini API  │
│              │◀─────│   Universal Audio    │◀─────│              │
│  • Ayarlar   │      │     Translator       │      ├──────────────┤
│  • Başlat    │      │                      │─────▶│  OpenAI API  │
│  • Durdur    │      │   (Chrome Extension) │◀─────│              │
│  • Not ekle  │      │                      │      ├──────────────┤
│  • İndir     │      │                      │─────▶│ DeepSeek API │
└──────────────┘      │                      │◀─────│              │
                      │                      │      ├──────────────┤
┌──────────────┐      │                      │─────▶│  Claude API  │
│  Chrome      │◀─────│                      │◀─────│              │
│  Storage     │─────▶│                      │      └──────────────┘
│              │      │                      │
│  • Ayarlar   │      │                      │      ┌──────────────┐
│  • API Keys  │      │                      │─────▶│  Sözlük API  │
│  • Geçmiş    │      │                      │◀─────│  (kelime     │
│  • Sözlük    │      │                      │      │   anlamı)    │
└──────────────┘      └──────────────────────┘      └──────────────┘
```

---

## EK: BEYIN FIRTINASI OYLAMA SONUÇLARI

| # | Öneri | Sonuç | Faz |
|---|-------|-------|-----|
| 1 | Çevrimdışı Mod / Yerel Model | ✅ Kabul (Kurucu) | Faz 7 |
| 2 | Video Özeti & Not Alma | ✅ Kabul (Oybirliği) | Faz 3 |
| 3 | Konuşmacı Tanıma & Çoklu Konuşmacı | ✅ Kabul (Oybirliği) | Faz 2 |
| 4 | Çeviri Geçmişi & Arama | ✅ Kabul (Çoğunluk) | Faz 4 |
| 5 | Sözlük & Terim Yönetimi | ✅ Kabul (Oybirliği) | Faz 4 |
| 6 | Canlı Yayın Desteği | ✅ Kabul (Oybirliği) | Pazarlama |
| 7 | Hız Kontrolü & Gecikme Ayarı | ✅ Kabul (Oybirliği) | Faz 3 |
| 8 | Çift Dilli Altyazı | ✅ Kabul (Oybirliği) | Faz 2 |
| 9 | BYOK (Kendi API Key) | ✅ Kabul (Çoğunluk) | Zaten mevcut |
| 10 | Çoklu Tarayıcı Desteği | ⏳ Ertelendi | Gelecek |
| 11 | Çeviriyi İndirilebilir Dışa Aktarma | ✅ Kabul (Kurucu revize) | Faz 3 |
| 12 | Kelime Vurgulama & Anlık Sözlük | ✅ Kabul (Oybirliği) | Faz 5 |
| 13 | Toplu Video Çevirisi (Kuyruk) | ✅ Kabul (Kurucu) | Faz 7 |
