# Kaynak denetimi ve test planı

Temel: `main` f38decb. Depoda 19 oyun ve katalog dahil 20 HTML var; kaynakta migration, paket yönetimi veya CI yoktu. Arşiv sağlanmadığından arşiv ile fark doğrulanmadı. HTML dosyaları doğrudan statik sunulabilir; mevcut Pages ayarları depoda tanımlı değil.

## Çevrimiçi mimari ve riskler

On oyun: Deflect, Gizli Karalama, Grid Pulse, Hangimiz Daha Yakın Çizdi, Mürekkep Savaşı, Ortak Köprü, Pixel Hafıza, Slingshot Arena, Tek Resim Tek Tuval, Üç Çizgide Anlat. Sayfalarda Supabase istemcisi, anonim oturum, `rooms` ve `room_players`, `create_game_room`, `join_game_room`, `set_room_ready`, `leave_game_room`, Realtime broadcast/presence kullanılıyor. Tam şema, RLS ve RPC tanımları depoda yok; sunucu yetkileri kaynak üzerinden doğrulanamaz. Beş çizim oyunu aynı genel motoru içeriyor. `scoreLocal` nokta sayısı ve sınır kutusunu kullanıyor; gelen skor doğrudan kabul ediliyor. Köprüde iki gönderim başarı sayılıyor. `visibleScore` zamanlayıcı kimliğini geçen zaman sanıyor; `clearTimers` snapshot aralığını da temizliyor. Bunlar çözüldü iddiası değildir.

## Test matrisi ve sıra

1. Sayfa kabukları: Chromium ile 20 sayfa, katalog sayısı; ağ kapalı. `npm ci`, `npx playwright install chromium`, `npm test`.
2. Oyun başına kurallar ve saf mantık: geçerli/geçersiz hamle, skor, eşitlik, süre ve tekrar denemeyi kaynak ve kullanıcı vaadine göre kaydet; eksik kuralları uydurma.
3. İzole staging: iki tarayıcıyla oda, hazır, maç, 3. kişi, yeniden bağlanma, sahte kimlik/skor, duplicate olay, gecikme ve rövanş. Üretim servisine otomatik test yazma.
4. Bir oyunu sunucu otoritesiyle uçtan uca doğrula; sonra diğer oyunları ayrı oyun kurallarıyla taşı. En son ortak arayüz ve solo oyunları düzenle.

Smoke testi oyun oynandığını, JavaScript'in bütün davranışlarını veya backend güvenliğini doğrulamaz. Entegrasyon ve E2E için ayrı Neon staging, gizli yapılandırma ve temizlenebilir test verisi gerekir. Production Supabase korunmalı; migration'lar ve geri dönüş doğrulanmadan kaldırılmamalıdır.
