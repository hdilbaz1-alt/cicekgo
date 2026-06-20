namespace CicekGo.Application.Products;

public class UnitDto
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}

public class UnitRequest
{
    public string Name { get; set; } = default!;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public interface IUnitService
{
    Task<IReadOnlyList<UnitDto>> GetAllAsync(CancellationToken ct = default);
    Task<int> CreateAsync(UnitRequest dto, CancellationToken ct = default);
    Task UpdateAsync(int id, UnitRequest dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}
