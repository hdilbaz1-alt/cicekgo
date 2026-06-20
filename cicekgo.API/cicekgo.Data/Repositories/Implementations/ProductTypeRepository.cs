using cicekgo.Core.Orders.Dtos;
using cicekgo.Data.Common.Interfaces;
using cicekgo.Data.Repositories.Interfaces;
using Dapper;

namespace cicekgo.Data.Repositories.Implementations;

public class ProductTypeRepository : IProductTypeRepository
{
    private readonly ITenantDbFactory _tenant;

    public ProductTypeRepository(ITenantDbFactory tenantDbFactory)
    {
        _tenant = tenantDbFactory;
    }

    public async Task<IEnumerable<ProductTypeDto>> GetAllAsync(CancellationToken ct = default)
    {
        using var conn = _tenant.CreateConnection();
        const string sql = @"SELECT Id, ProductName FROM dbo.ProductType ORDER BY ProductName;";
        return await conn.QueryAsync<ProductTypeDto>(new CommandDefinition(sql, cancellationToken: ct));
    }

    public async Task<ProductTypeDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        using var conn = _tenant.CreateConnection();
        const string sql = @"SELECT Id, ProductName FROM dbo.ProductType WHERE Id = @Id;";
        return await conn.QueryFirstOrDefaultAsync<ProductTypeDto>(new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<int> AddAsync(ProductTypeAddRequest request, string createdBy, CancellationToken ct = default)
    {
        using var conn = _tenant.CreateConnection();
        const string sql = @"
INSERT INTO dbo.ProductType (ProductName)
VALUES (@ProductName);
SELECT CAST(SCOPE_IDENTITY() AS int);";
        return await conn.ExecuteScalarAsync<int>(new CommandDefinition(sql, request, cancellationToken: ct));
    }

    public async Task<bool> UpdateAsync(int id, ProductTypeUpdateRequest request, string updatedBy, CancellationToken ct = default)
    {
        using var conn = _tenant.CreateConnection();
        const string sql = @"
UPDATE dbo.ProductType
SET ProductName = @ProductName
WHERE Id = @Id;";
        var rowsAffected = await conn.ExecuteAsync(new CommandDefinition(sql, new { Id = id, request.ProductName }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        using var conn = _tenant.CreateConnection();
        const string sql = @"DELETE FROM dbo.ProductType WHERE Id = @Id;";
        var rowsAffected = await conn.ExecuteAsync(new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return rowsAffected > 0;
    }
}
