using System.Globalization;

namespace CicekGo.Infrastructure;

/// <summary>
/// Tam adres metnini üretir: "[Açık Adres] İLÇE/İL" (tamamı Türkçe büyük harf).
/// Tüm sistemde (kart, fatura, baskı) tek kanonik format. Frontend'deki formatFullAddress ile birebir aynı.
/// </summary>
public static class AddressFormatter
{
    private static readonly CultureInfo Tr = new("tr-TR");

    public static string? FormatFull(string? addressLine, string? district, string? city)
    {
        var line = (addressLine ?? string.Empty).Trim();
        var d = (district ?? string.Empty).Trim();
        var c = (city ?? string.Empty).Trim();

        string locality = (d.Length > 0 && c.Length > 0) ? $"{d}/{c}"
            : d.Length > 0 ? d
            : c.Length > 0 ? c
            : string.Empty;

        var combined = string.Join(" ", new[] { line, locality }.Where(s => s.Length > 0)).Trim();
        if (combined.Length == 0) return null;
        return combined.ToUpper(Tr);
    }

    /// <summary>Yapısal alanlardan en az biri doluysa true.</summary>
    public static bool HasStructured(string? addressLine, string? district, string? city)
        => !string.IsNullOrWhiteSpace(addressLine)
        || !string.IsNullOrWhiteSpace(district)
        || !string.IsNullOrWhiteSpace(city);
}
