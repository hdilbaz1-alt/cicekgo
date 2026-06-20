namespace CicekGo.Domain.Tenant;

/// <summary>Mağaza çalışma saatleri (tek satır). Teslimat saat aralıkları bundan üretilir.</summary>
public class StoreSettings
{
    public int Id { get; set; }
    public string OpenTime { get; set; } = "09:00";    // HH:mm
    public string CloseTime { get; set; } = "18:00";   // HH:mm
    public int SlotMinutes { get; set; } = 30;          // teslimat slotu uzunluğu
}
