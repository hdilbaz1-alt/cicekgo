namespace CicekGo.Domain.Tenant;

/// <summary>
/// Sipariş kodu üreteci. Eski OrderStartCode/OrderLastCode (string artırma) yerine
/// atomik sayaç. Kod = Prefix + yyyyMMdd + NextNumber gibi formatla üretilir.
/// </summary>
public class OrderCodeSequence
{
    public int Id { get; set; }
    public string Prefix { get; set; } = default!;        // örn. "KDRCCK"
    public long NextNumber { get; set; } = 1;
}
