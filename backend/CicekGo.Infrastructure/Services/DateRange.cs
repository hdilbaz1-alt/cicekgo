namespace CicekGo.Infrastructure.Services;

/// <summary>
/// Query-string'den gelen (Kind=Unspecified) tarihleri UTC'ye çevirir.
/// PostgreSQL timestamptz kolonlarıyla karşılaştırma için gerekli.
/// </summary>
public static class DateRange
{
    public static (DateTime? From, DateTime? ToExclusive) Utc(DateTime? from, DateTime? to)
    {
        DateTime? f = from.HasValue ? DateTime.SpecifyKind(from.Value.Date, DateTimeKind.Utc) : null;
        DateTime? t = to.HasValue ? DateTime.SpecifyKind(to.Value.Date, DateTimeKind.Utc).AddDays(1) : null;
        return (f, t);
    }
}
