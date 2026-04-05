# Universal Audio Translator — Proje Kuralları

## Mimari
- Chrome Extension Manifest V3
- ES Modules (type: module)
- Shadow DOM ile content script UI izolasyonu
- Provider pattern: lib/models/base-model.js interface, her model extends

## Dosya Yapısı Kuralları
- background/ → Service worker (orkestrasyon)
- offscreen/ → Ses yakalama ve işleme (DOM gerekli)
- content/ → Sayfa içi UI (altyazı, buton, baloncuk)
- popup/ → Extension popup UI
- options/ → Tam ayarlar sayfası
- lib/ → Paylaşılan modüller
- lib/models/ → AI model provider'ları

## Mesaj Tipleri (chrome.runtime.sendMessage)
- START_CAPTURE, STOP_CAPTURE, SET_GAIN
- TRANSLATION, AUDIO_DATA, ERROR
- SHOW_SUBTITLE, HIDE_SUBTITLE, UPDATE_SETTINGS

## Kodlama Standartları
- Vanilla JS (framework yok)
- const/let (var kullanma)
- async/await (callback yerine)
- JSDoc yorumları sadece public API'larda
- Hata durumlarında anlamlı mesajlar

## Test Kuralları
- Her bölüm sonunda Quality Gate testi zorunlu
- QG geçilmeden sonraki bölüme geçilmez
- Faz sonunda tüm önceki QG'ler regression olarak tekrar çalıştırılır
