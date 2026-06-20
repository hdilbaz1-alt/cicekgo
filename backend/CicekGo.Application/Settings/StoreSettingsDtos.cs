namespace CicekGo.Application.Settings;

public class StoreSettingsDto
{
    public string OpenTime { get; set; } = "09:00";
    public string CloseTime { get; set; } = "18:00";
    public int SlotMinutes { get; set; } = 30;
    public List<string> DeliverySlots { get; set; } = new();   // "09:00 - 09:30" ...
}

public class StoreSettingsUpdateDto
{
    public string OpenTime { get; set; } = "09:00";
    public string CloseTime { get; set; } = "18:00";
    public int SlotMinutes { get; set; } = 30;
}

public interface IStoreSettingsService
{
    Task<StoreSettingsDto> GetAsync(CancellationToken ct = default);
    Task<StoreSettingsDto> UpdateAsync(StoreSettingsUpdateDto dto, CancellationToken ct = default);
}
