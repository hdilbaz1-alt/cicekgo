# ÇiçekGo — Ürün Tasarımı Yeniden Yapılanma Planı

Hedef: Florist için **telefonda, hızlı** kullanılan bir POS/ERP. Başarı ölçütü: "dakikada tamamlanan sipariş + tahsilat". Kıyas: Stripe, Square, Shopify, Linear, Notion.

## Çekirdek 3 sorun
1. **Hız katmanı yok** (genel arama/komut paleti, kısayol, her yerden aksiyon yok).
2. **Sipariş oluştur = devasa modal** (en kritik akış, en yüksek bilişsel yük).
3. **Renk anlam taşımıyor**, her sayfa aynı kart-grid'i; hiyerarşi zayıf.

## Tasarım sistemi (token)
- Renk: nötr beyaz zemin; tek vurgu indigo `#4F46E5` sadece birincil aksiyon/aktif nav.
- **Anlamsal renk** (her yerde tutarlı): giriş/teslim yeşil `#16A34A`, çıkış/borç kırmızı `#DC2626`, bekleyen turuncu `#D97706`, bilgi mavi `#2563EB`.
- Gradient ikon kutuları kaldırılır → düz tonlu çipler (`bg-{semantic}/10`).
- Tipografi: 12/14/16/20/28/36; para `tabular-nums`.
- Boşluk: 4pt; gölge yerine ince kenarlık (Linear/Vercel).
- Ortak bileşenler: Button, Input, Select, **DataList** (mobil kart ↔ masaüstü tablo tek primitif), StatusChip, MetricStrip, EmptyState, Sheet, **CommandPalette**.

## Bilgi mimarisi (14 → 5 menü)
**Bugün · Siparişler · Müşteriler · Para · Ürünler** (+ Ayarlar/Hesap). "Silinen siparişler" → Siparişler filtre; "İşlem kayıtları" → Ayarlar/Para; Cari → Müşteri/"Para" altında. Kurye: sadece Teslimatlarım.

## Uygulama sırası (batch)
- **B1 — Hız:** CommandPalette (Cmd-K) + genel arama + her yerden "+ Sipariş".  ✅ başla
- **B2 — Sipariş akışı:** create/edit'i kademeli tek-sütun rota; akıllı varsayılan; sabit toplam barı; gelişmiş alanlar gizli.
- **B3 — Liste/Filtre:** 7 gün şeridi → Bugün/Yarın/Hafta + tarih aralığı + kayıtlı görünümler; DataList primitifi (Orders/Cari/Reports/Users).
- **B4 — Netlik:** token sistemi + gradient temizliği + anlamsal durum/para her yerde; "Para" hub (Kasa·Cari·Raporlar tek yerde); Dashboard → aksiyon akışı.
- **B5 — Menü & sadeleştirme:** 5'li nav; ayarlar gruplama.
- **B6 — İncelik:** animasyon/haptik, iskelet yükleme, boş durumlar, login marka anı.
- **B7 — Mobil (Flutter) yansıması:** aynı desenler; kademeli sipariş, optimistic durum, kurye swipe-to-complete.

Her batch: build + deploy + gözden geçirme.
