namespace CicekGo.Application.PaymentMethods;

public class PaymentMethodDto
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }
    public int SortOrder { get; set; }
}

public class PaymentMethodSaveDto
{
    public string Name { get; set; } = default!;
    public bool IsActive { get; set; } = true;
}

public interface IPaymentMethodService
{
    Task<IReadOnlyList<PaymentMethodDto>> ListAsync(CancellationToken ct = default);
    Task<int> CreateAsync(PaymentMethodSaveDto dto, CancellationToken ct = default);
    Task UpdateAsync(int id, PaymentMethodSaveDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
    Task SetDefaultAsync(int id, CancellationToken ct = default);
}
