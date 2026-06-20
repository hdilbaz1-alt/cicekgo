using cicekgo.Core.Orders.Dtos;
using cicekgo.Data.Common.Interfaces;
using cicekgo.Data.Repositories.Interfaces;
using Dapper;

namespace cicekgo.Data.Repositories.Implementations;

public class OrderStatusRepository : IOrderStatusRepository
{
    private readonly ITenantDbFactory _tenant;

    public OrderStatusRepository(ITenantDbFactory tenantDbFactory)
    {
        _tenant = tenantDbFactory;
    }

    public async Task<IEnumerable<OrderStatusDto>> GetAllAsync(CancellationToken ct = default)
    {
        using var conn = _tenant.CreateConnection();
        const string sql = @"SELECT Id, StatusName FROM dbo.OrderStatus ORDER BY StatusName;";
        return await conn.QueryAsync<OrderStatusDto>(new CommandDefinition(sql, cancellationToken: ct));
    }

    public async Task<OrderStatusDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        using var conn = _tenant.CreateConnection();
        const string sql = @"SELECT Id, StatusName FROM dbo.OrderStatus WHERE Id = @Id;";
        return await conn.QueryFirstOrDefaultAsync<OrderStatusDto>(new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
    }

    public async Task<int> AddAsync(OrderStatusAddRequest request, string createdBy, CancellationToken ct = default)
    {
        using var conn = _tenant.CreateConnection();
        const string sql = @"
INSERT INTO dbo.OrderStatus (StatusName)
VALUES (@StatusName);
SELECT CAST(SCOPE_IDENTITY() AS int);";
        return await conn.ExecuteScalarAsync<int>(new CommandDefinition(sql, request, cancellationToken: ct));
    }

    public async Task<bool> UpdateAsync(int id, OrderStatusUpdateRequest request, string updatedBy, CancellationToken ct = default)
    {
        using var conn = _tenant.CreateConnection();
        const string sql = @"
UPDATE dbo.OrderStatus
SET StatusName = @StatusName
WHERE Id = @Id;";
        var rowsAffected = await conn.ExecuteAsync(new CommandDefinition(sql, new { Id = id, request.StatusName }, cancellationToken: ct));
        return rowsAffected > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        using var conn = _tenant.CreateConnection();
        const string sql = @"DELETE FROM dbo.OrderStatus WHERE Id = @Id;";
        var rowsAffected = await conn.ExecuteAsync(new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        return rowsAffected > 0;
    }
}
