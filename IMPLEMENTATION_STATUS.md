# Uygulama durumu — 2026-11-08

## Konum
- Dal: `feat/platform-completion`, başlangıç noktası PR #2 başlığı `4a859b5` (PR #1 üzerine kuruludur). Güncel commit için `git rev-parse HEAD` kullanın.
- Mevcut staging: https://br-flat-tree-b9pcqgr9-bridge.compute.c-7.eu-central-1.aws.neon.tech/ (bu daldaki değişiklikler dağıtılmadı).
- Neon projesi: `kagitlik-staging`; Function: `bridge`. Üretim projesine dokunulmadı.

## Yapılanlar
- Ortak Köprü agregasına odadan ayrılma, ev sahibini devretme, kalan oyuncuyu lobiye döndürme ve son oyuncu ayrıldığında odayı kapatma eklendi. İstemciye ayrılma düğmesi eklendi; bekleyen polling yanıtının ayrılmış odayı yeniden açması önlendi.
- Yeni olay kimlikleri oyuncu bazında kapsamlandırıldı. Eski metin olayları tekrarları engellemeye devam eder.
- Bu davranışlara birim testleri eklendi. Yeni kod henüz gerçek veritabanı veya dağıtılmış ortamda test edilmedi.

## Çalıştırılan doğrulamalar
- `npm ci`: başarılı, 0 güvenlik açığı bildirildi.
- `npm test`: 12 birim testi ve 21 katalog/sayfa smoke testi geçti; staging değişkeni verilmediği için 2 staging testi atlandı. Smoke testleri oyunların oynanışını doğrulamaz.
- Mevcut dağıtıma karşı `STAGING_URL=... npx playwright test tests/staging.spec.cjs --workers=1`: 2 test geçti. Bunlar bu daldaki yeni değişiklikleri içermez.
- esbuild Function paketi oluşturuldu. Yeni paket dağıtılmadı.

## Açık işler ve devam adımları
1. Yeni değişiklikleri yalıtılmış yerel veya Neon test ortamında gerçek PostgreSQL ve iki tarayıcıyla doğrula; ayrılma ile eşzamanlı polling, ev sahibi değişimi, yeni katılım ve son oyuncu ayrılması senaryolarını ekle. Ardından staging'e dağıt ve aynı testleri dağıtılan sürümde tekrarla.
2. Köprü için gerçek bağlantı kaybı, yeniden bağlanma, hız sınırı, veri temizliği, çoklu bölüm, canlı çizim ve güvenilir zaman aşımı uygula. Mevcut uygulama polling kullanır; WebSocket yoktur.
3. Kalan dokuz çevrimiçi oyunun gerçek kurallarını incele; sunucu yetkili kurallar, oda yönetimi ve eşzamanlama uygula ve ayrı ayrı iki istemciyle test et. Diğer dokuz tek oyunculu oyunun gerçek oynanışını test et ve onar.
4. Ortak uygulama kabuğunu, erişilebilir mobil/masaüstü etkileşimlerini, sürümlü migration ve dağıtım otomasyonunu tamamla. Test, güvenlik, dayanıklılık ve üretime hazırlık gereksinimlerinin tamamı açık.

Bu dal tam bir platform teslimi değildir; mevcut staging de yalnızca Ortak Köprü prototipidir.
