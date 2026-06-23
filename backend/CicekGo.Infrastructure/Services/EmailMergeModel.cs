using System.Globalization;
using CicekGo.Domain.Tenant;
using Scriban.Runtime;

namespace CicekGo.Infrastructure.Services;

/// <summary>Şablon render'ı için güvenli merge-tag modeli (yalnız whitelist alanlar).</summary>
public static class EmailMergeModel
{
    private static readonly CultureInfo Tr = new("tr-TR");
    private static string Money(decimal v) => string.Format(Tr, "{0:N2} ₺", v);
    private static string Date(DateTime? d) => d.HasValue ? d.Value.ToString("dd.MM.yyyy HH:mm", Tr) : "";

    public static ScriptObject Build(Order o, IEnumerable<OrderItem> items, string companyName)
    {
        var order = new ScriptObject
        {
            ["code"] = o.Code,
            ["status"] = o.Status,
            ["total"] = Money(o.Amount),
            ["total_raw"] = o.Amount,
            ["remaining"] = Money(o.RemainingAmount),
            ["delivery_date"] = Date(o.DeliveryDate),
            ["note"] = o.CardNote ?? o.ExtraNote ?? "",
            ["items"] = items.Select(i => new ScriptObject
            {
                ["name"] = i.ProductName,
                ["qty"] = i.Quantity,
                ["price"] = Money(i.UnitPrice),
                ["total"] = Money(i.TotalPrice),
            }).ToList(),
        };
        return new ScriptObject
        {
            ["order"] = order,
            ["recipient"] = new ScriptObject { ["name"] = o.RecipientName ?? "", ["phone"] = o.RecipientPhone ?? "", ["email"] = o.RecipientEmail ?? "" },
            ["sender"] = new ScriptObject { ["name"] = o.SenderName ?? "", ["phone"] = o.SenderPhone ?? "", ["email"] = o.SenderEmail ?? "" },
            ["company"] = new ScriptObject { ["name"] = companyName },
        };
    }

    public static ScriptObject Sample()
    {
        var order = new ScriptObject
        {
            ["code"] = "SIP-2026-0042", ["status"] = "Kargoya Verildi",
            ["total"] = Money(1250m), ["total_raw"] = 1250m, ["remaining"] = Money(0m),
            ["delivery_date"] = "23.06.2026 14:30", ["note"] = "Doğum günün kutlu olsun!",
            ["items"] = new List<ScriptObject>
            {
                new() { ["name"] = "Kırmızı Gül Buketi", ["qty"] = 1m, ["price"] = Money(950m), ["total"] = Money(950m) },
                new() { ["name"] = "Çikolata Kutusu", ["qty"] = 2m, ["price"] = Money(150m), ["total"] = Money(300m) },
            },
        };
        return new ScriptObject
        {
            ["order"] = order,
            ["recipient"] = new ScriptObject { ["name"] = "Ayşe Yılmaz", ["phone"] = "0555 111 22 33", ["email"] = "ayse@example.com" },
            ["sender"] = new ScriptObject { ["name"] = "Mehmet Demir", ["phone"] = "0555 444 55 66", ["email"] = "mehmet@example.com" },
            ["company"] = new ScriptObject { ["name"] = "ÇiçekGo" },
        };
    }
}
