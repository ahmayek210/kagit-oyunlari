# Testler

Node.js 22 ve npm ile `npm ci`, `npx playwright install chromium`, `npm test` çalıştırın. Smoke testleri tüm harici istekleri engeller ve mevcut backend'e bağlanmaz. Bunlar oyun mantığı veya iki oyunculu entegrasyon testi değildir. Kapsam ve bilinen riskler için [AUDIT.md](AUDIT.md) dosyasına bakın.

## Staging database (schema prototype)

Ayrı `kagitlik-staging` projesi oluşturuldu. `migrations/001_initial.sql` boş bir PostgreSQL veritabanına bir kez uygulanabilir. `DATABASE_URL` yalnızca backend ortamında tutulmalıdır; `.env.example` örnektir. Şema taslaktır: uygulama sunucusu, migration yürütücüsü, kimlik doğrulaması, süre sonu temizliği ve rollback henüz uygulanmadı. Bir üretim ortamına uygulanmamalıdır.

## Ortak Köprü staging prototipi

Neon PostgreSQL'de `001_initial.sql` ve ardından `002_room_aggregate.sql` uygulayın. Sunucu `DATABASE_URL` ortam değişkenini kullanır. `npm ci` sonrasında `npx esbuild server/index.mjs --bundle --platform=node --format=esm --loader:.html=text --banner:js="import { createRequire } from 'module'; const require = createRequire(import.meta.url);" --outfile=work-function/index.mjs` ile Function paketi hazırlanabilir. Ortam değişkenini istemciye koymayın.

Staging E2E: PowerShell'de `$env:STAGING_URL='<staging function URL>'` ardından `npx playwright test tests/staging.spec.cjs --workers=1`. Test staging verisi oluşturur. Normal `npm test` staging URL olmadan bu testleri atlar.

Bu sürüm tek bölümlü deneysel bir dikey dilimdir. Açık eksikler: oda terk etme, gerçek kopma algılama, sunucu tarafı hız sınırlama, süreli veri temizliği, çoklu bölüm ve üretime uygun dağıtım/erişim politikası. Polling ile sonuçlar eşitlenir; canlı çizim akışı yoktur. Üretime alınmamalıdır.
