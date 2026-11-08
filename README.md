# Testler

Node.js 22 ve npm ile `npm ci`, `npx playwright install chromium`, `npm test` çalıştırın. Smoke testleri tüm harici istekleri engeller ve mevcut backend'e bağlanmaz. Bunlar oyun mantığı veya iki oyunculu entegrasyon testi değildir. Kapsam ve bilinen riskler için [AUDIT.md](AUDIT.md) dosyasına bakın.

## Staging database (schema prototype)

Ayrı `kagitlik-staging` projesi oluşturuldu. `migrations/001_initial.sql` boş bir PostgreSQL veritabanına bir kez uygulanabilir. `DATABASE_URL` yalnızca backend ortamında tutulmalıdır; `.env.example` örnektir. Şema taslaktır: uygulama sunucusu, migration yürütücüsü, kimlik doğrulaması, süre sonu temizliği ve rollback henüz uygulanmadı. Bir üretim ortamına uygulanmamalıdır.
