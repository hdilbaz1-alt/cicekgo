// Tam adres formatlama — TÜM sistemde tek kanonik biçim.
// Backend AddressFormatter.FormatFull ile birebir aynı çıktıyı üretir:
//   "[Açık Adres] İLÇE/İL"  (tamamı Türkçe büyük harf)

/** Türkçe-duyarlı büyük harf (i→İ, ı→I). */
export function trUpper(s: string): string {
  return (s || '').toLocaleUpperCase('tr-TR');
}

/**
 * Açık adres + ilçe + il'den tam adres metni üretir.
 * Örn: ("Sancak Mah. ... 1A/6", "Selçuklu", "Konya")
 *   → "SANCAK MAH. ... 1A/6 SELÇUKLU/KONYA"
 * Eksik parçalar zarifçe atlanır. Hiçbiri yoksa boş string döner.
 */
export function formatFullAddress(addressLine?: string | null, district?: string | null, city?: string | null): string {
  const line = (addressLine || '').trim();
  const d = (district || '').trim();
  const c = (city || '').trim();

  const locality = d && c ? `${d}/${c}` : d || c || '';
  const combined = [line, locality].filter(Boolean).join(' ').trim();
  return combined ? trUpper(combined) : '';
}

/** İl/İlçe/Açık Adres alanlarından en az biri dolu mu? */
export function hasStructuredAddress(addressLine?: string | null, district?: string | null, city?: string | null): boolean {
  return !!((addressLine && addressLine.trim()) || (district && district.trim()) || (city && city.trim()));
}
