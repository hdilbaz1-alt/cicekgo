using cicekgo.Core.Customers.Dtos;
using cicekgo.Data.Common.Interfaces;
using cicekgo.Data.Repositories.Interfaces;
using Dapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo.Data.Repositories.Implementations
{
    public class OrderCodeRepository : IOrderCodeRepository
    {
        private readonly ITenantDbFactory _tenant;

        public OrderCodeRepository(ITenantDbFactory tenantDbFactory)
        {
            _tenant = tenantDbFactory;
        }

        public async Task<IEnumerable<OrderCodeDto>> GetAllAsync(CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            const string sql = @"SELECT Id, OrderStartCode, OrderLastCode FROM dbo.OrderCode ORDER BY Id DESC;";
            return await conn.QueryAsync<OrderCodeDto>(new CommandDefinition(sql, cancellationToken: ct));
        }

        public async Task<OrderCodeDto?> GetByIdAsync(int id, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            const string sql = @"SELECT Id, OrderStartCode, OrderLastCode FROM dbo.OrderCode WHERE Id = @Id;";
            return await conn.QueryFirstOrDefaultAsync<OrderCodeDto>(new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        }

        public async Task<int> CreateAsync(OrderCodeCreateDto dto, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            const string sql = @"
INSERT INTO dbo.OrderCode (OrderStartCode, OrderLastCode)
VALUES (@OrderStartCode, @OrderLastCode);
SELECT CAST(SCOPE_IDENTITY() AS int);";
            return await conn.ExecuteScalarAsync<int>(new CommandDefinition(sql, dto, cancellationToken: ct));
        }

        public async Task<int> UpdateAsync(int id, OrderCodeUpdateDto dto, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            const string sql = @"
UPDATE dbo.OrderCode
SET OrderStartCode = @OrderStartCode,
    OrderLastCode = @OrderLastCode
WHERE Id = @Id;";
            return await conn.ExecuteAsync(new CommandDefinition(sql, new { Id = id, dto.OrderStartCode, dto.OrderLastCode }, cancellationToken: ct));
        }

        public async Task<int> DeleteAsync(int id, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            const string sql = @"DELETE FROM dbo.OrderCode WHERE Id = @Id;";
            return await conn.ExecuteAsync(new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        }
    }
}
