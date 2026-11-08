# Ortak Köprü: ilk kural sözleşmesi

Mevcut sayfanın iki hedefi (120,390) ve (740,250), 860 × 520 tahtada 24 birim yarıçaplıdır. Mevcut kaynak engel veya gerçek bağlantı kontrolü tanımlamıyor. Önerilen yeni staging bölümü, (380,260)–(480,410) dikdörtgen engelini ekler; eski sayfa ve üretim davranışı henüz değiştirilmemiştir.

İki oyuncu birer sürekli çizgi sunar. Her çizgide 2–256 sonlu, tahta içi nokta ve en az bir birim uzunluk bulunmalıdır. Çizgilerden biri başlangıç, diğeri hedef dairesine değmeli; çizgiler kesişmeli veya aralarındaki en kısa mesafe en çok 12 birim olmalıdır. Engel sınırına değmek dahil engelden geçen çizgi başarısızdır. Geometri çizgi segmentleri boyunca hesaplanır; sadece uç noktalar karşılaştırılmaz. Başarı iş birliği sonucudur, bireysel kazanan yoktur. Süre, bölüm dizisi ve rövanş akışı sunucu uygulanınca kesinleştirilmelidir.

`src/bridge/rules.mjs` saf işlevdir; henüz bir sunucu yetkisi veya çalışan online oyun değildir. Sunucu bu işlevi kendi doğruladığı hamlelerle kullanmalı; istemcinin sonucuna güvenmemelidir.
