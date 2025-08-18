using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using Dapper;
using Dapper.Contrib.Extensions;

using cicekgo_Core.Entities;
using cicekgo_Core.Dto;        // FullOrderDetailsDto
using cicekgo_Core.Requests;   // FullOrderCreateRequest, OrderAggregateUpdateRequest

namespace cicekgo_Data.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly string _cs;
        public OrderRepository(string connectionString) { _cs = connectionString; }

        // === COMMON ===
        public async Task<bool> OrderIdExistsAsync(string orderId)
        {
            using (var conn = new SqlConnection(_cs))
            {
                var sql = "SELECT 1 FROM dbo.Orders WHERE Order_Id = @orderId";
                var r = await conn.ExecuteScalarAsync<int?>(sql, new { orderId = orderId });
                return r.HasValue;
            }
        }

        // === VIEW-BASED GETs ===
        public async Task<FullOrderDetailsDto> GetViewByOrderIdAsync(string orderId)
        {
            const string sql = @"SELECT TOP (1) * FROM dbo.vw_FullOrderDetails WHERE Order_Id = @orderId";
            using (var conn = new SqlConnection(_cs))
            {
                await conn.OpenAsync();
                return await conn.QuerySingleOrDefaultAsync<FullOrderDetailsDto>(sql, new { orderId = orderId });
            }
        }

        public async Task<IEnumerable<FullOrderDetailsDto>> GetViewLatestAsync(int take, string status = null)
        {
            const string sql = @"
SELECT TOP (@take) * 
FROM dbo.vw_FullOrderDetails
WHERE (@status IS NULL OR Order_Status = @status)
ORDER BY Id DESC;";
            using (var conn = new SqlConnection(_cs))
            {
                await conn.OpenAsync();
                var rows = await conn.QueryAsync<FullOrderDetailsDto>(sql, new { take = take, status = status });
                return rows.ToList();
            }
        }

        // === FULL CREATE (transaction) ===
        public async Task<int> CreateFullOrderAsync(FullOrderCreateRequest req)
        {
            using (var conn = new SqlConnection(_cs))
            {
                await conn.OpenAsync();
                using (var tx = conn.BeginTransaction())
                {
                    try
                    {
                        // 1) Benzersiz Order_Id
                        var exists = await conn.ExecuteScalarAsync<int?>(
                            "SELECT Id FROM dbo.Orders WHERE Order_Id=@oid",
                            new { oid = req.Order_Id }, tx);
                        if (exists.HasValue)
                            throw new Exception("Order_Id zaten mevcut.");

                        // 2) Orders
                        var order = new Order
                        {
                            Order_Id = req.Order_Id,
                            Order_Status = req.Order_Status,
                            Order_Sender = req.Order_Sender,
                            Order_To = req.Order_To,
                            Order_DeliveryDate = req.Order_DeliveryDate,
                            Order_Amount = req.Order_Amount,
                            Order_RemainingAmount = req.Order_RemainingAmount,
                            Order_ProductType = req.Order_ProductType,
                            UpdatedDate = null
                        };
                        var newId = (int)await conn.InsertAsync(order, tx); // Contrib long döndürür

                        // 3) Sender
                        if (!string.IsNullOrWhiteSpace(req.SenderName) || !string.IsNullOrWhiteSpace(req.SenderPhone))
                        {
                            await conn.InsertAsync(new OrderSender
                            {
                                OrderId = newId,
                                SenderName = req.SenderName,
                                SenderPhone = req.SenderPhone
                            }, tx);
                        }

                        // 4) Recipient
                        if (!string.IsNullOrWhiteSpace(req.RecipientName) ||
                            !string.IsNullOrWhiteSpace(req.RecipientPhone) ||
                            !string.IsNullOrWhiteSpace(req.RecipientAddress))
                        {
                            await conn.InsertAsync(new OrderRecipient
                            {
                                OrderId = newId,
                                RecipientName = req.RecipientName,
                                RecipientPhone = req.RecipientPhone,
                                RecipientAddress = req.RecipientAddress
                            }, tx);
                        }

                        // 5) Payments
                        if (req.Payments != null && req.Payments.Count > 0)
                        {
                            foreach (var p in req.Payments)
                            {
                                var methodId = await EnsurePaymentMethodIdAsync(conn, tx, p.MethodName);
                                await conn.InsertAsync(new OrderPayment
                                {
                                    OrderId = newId,
                                    PaymentAmount = p.Amount,
                                    PaymentDate = p.PaymentDate,
                                    PaymentMethodId = methodId
                                }, tx);
                            }
                        }

                        // 6) Notes
                        if (!string.IsNullOrWhiteSpace(req.CardNote) ||
                            !string.IsNullOrWhiteSpace(req.CustomerNote) ||
                            !string.IsNullOrWhiteSpace(req.ExtraNote))
                        {
                            await conn.InsertAsync(new OrderNotes
                            {
                                OrderId = newId,
                                CardNote = req.CardNote,
                                CustomerNote = req.CustomerNote,
                                ExtraNote = req.ExtraNote
                            }, tx);
                        }

                        // 7) Notification (tek kayıt)
                        await conn.InsertAsync(new OrderNotification
                        {
                            OrderId = newId,
                            IsNotified = req.IsNotified ?? false
                        }, tx);

                        tx.Commit();
                        return newId;
                    }
                    catch
                    {
                        tx.Rollback();
                        throw;
                    }
                }
            }
        }

        // === AGGREGATE UPDATE by Order_Id (transaction) ===
        public async Task<bool> UpdateAggregateByOrderIdAsync(OrderAggregateUpdateRequest req)
        {
            using (var conn = new SqlConnection(_cs))
            {
                await conn.OpenAsync();
                using (var tx = conn.BeginTransaction())
                {
                    try
                    {
                        // Order'ı bul
                        var id = await conn.ExecuteScalarAsync<int?>(
                            "SELECT Id FROM dbo.Orders WHERE Order_Id = @oid",
                            new { oid = req.Order_Id }, tx);

                        if (!id.HasValue)
                            return false;

                        // Orders update (CreatedDate'e dokunma, UpdatedDate = GETDATE())
                        const string sqlOrder = @"
UPDATE dbo.Orders
SET Order_Status = @Order_Status,
    Order_Sender = @Order_Sender,
    Order_To = @Order_To,
    Order_DeliveryDate = @Order_DeliveryDate,
    Order_Amount = @Order_Amount,
    Order_RemainingAmount = @Order_RemainingAmount,
    Order_ProductType = @Order_ProductType,
    UpdatedDate = GETDATE()
WHERE Id = @Id;";

                        await conn.ExecuteAsync(sqlOrder, new
                        {
                            Id = id.Value,
                            Order_Status = (object)req.Order_Status ?? DBNull.Value,
                            Order_Sender = (object)req.Order_Sender ?? DBNull.Value,
                            Order_To = (object)req.Order_To ?? DBNull.Value,
                            Order_DeliveryDate = (object)req.Order_DeliveryDate ?? DBNull.Value,
                            Order_Amount = (object)req.Order_Amount ?? DBNull.Value,
                            Order_RemainingAmount = (object)req.Order_RemainingAmount ?? DBNull.Value,
                            Order_ProductType = (object)req.Order_ProductType ?? DBNull.Value
                        }, tx);

                        // Sender upsert
                        if (!string.IsNullOrWhiteSpace(req.SenderName) || !string.IsNullOrWhiteSpace(req.SenderPhone))
                        {
                            var existsSender = await conn.ExecuteScalarAsync<int>(
                                "SELECT COUNT(1) FROM dbo.OrderSender WHERE OrderId = @Id",
                                new { Id = id.Value }, tx);

                            if (existsSender > 0)
                            {
                                await conn.ExecuteAsync(@"
UPDATE dbo.OrderSender
SET SenderName = @SenderName,
    SenderPhone = @SenderPhone
WHERE OrderId = @Id;",
                                    new { Id = id.Value, SenderName = req.SenderName, SenderPhone = req.SenderPhone }, tx);
                            }
                            else
                            {
                                await conn.ExecuteAsync(@"
INSERT INTO dbo.OrderSender (OrderId, SenderName, SenderPhone)
VALUES (@Id, @SenderName, @SenderPhone);",
                                    new { Id = id.Value, SenderName = req.SenderName, SenderPhone = req.SenderPhone }, tx);
                            }
                        }

                        // Recipient upsert
                        if (!string.IsNullOrWhiteSpace(req.RecipientName) ||
                            !string.IsNullOrWhiteSpace(req.RecipientPhone) ||
                            !string.IsNullOrWhiteSpace(req.RecipientAddress))
                        {
                            var existsRec = await conn.ExecuteScalarAsync<int>(
                                "SELECT COUNT(1) FROM dbo.OrderRecipient WHERE OrderId = @Id",
                                new { Id = id.Value }, tx);

                            if (existsRec > 0)
                            {
                                await conn.ExecuteAsync(@"
UPDATE dbo.OrderRecipient
SET RecipientName = @RecipientName,
    RecipientPhone = @RecipientPhone,
    RecipientAddress = @RecipientAddress
WHERE OrderId = @Id;",
                                    new
                                    {
                                        Id = id.Value,
                                        RecipientName = req.RecipientName,
                                        RecipientPhone = req.RecipientPhone,
                                        RecipientAddress = req.RecipientAddress
                                    }, tx);
                            }
                            else
                            {
                                await conn.ExecuteAsync(@"
INSERT INTO dbo.OrderRecipient (OrderId, RecipientName, RecipientPhone, RecipientAddress)
VALUES (@Id, @RecipientName, @RecipientPhone, @RecipientAddress);",
                                    new
                                    {
                                        Id = id.Value,
                                        RecipientName = req.RecipientName,
                                        RecipientPhone = req.RecipientPhone,
                                        RecipientAddress = req.RecipientAddress
                                    }, tx);
                            }
                        }

                        tx.Commit();
                        return true;
                    }
                    catch
                    {
                        tx.Rollback();
                        throw;
                    }
                }
            }
        }

        // === HELPERS ===
        private async Task<int> EnsurePaymentMethodIdAsync(SqlConnection conn, SqlTransaction tx, string methodName)
        {
            if (string.IsNullOrWhiteSpace(methodName))
                throw new Exception("Payment method adı boş olamaz.");

            var id = await conn.ExecuteScalarAsync<int?>(
                "SELECT Id FROM dbo.PaymentMethod WHERE MethodName = @n",
                new { n = methodName }, tx);

            if (id.HasValue) return id.Value;

            var newId = await conn.InsertAsync(new PaymentMethod { MethodName = methodName }, tx);
            return (int)newId;
        }

        public Task<Order> GetByOrderIdAsync(string orderId)
        {
            throw new NotImplementedException();
        }
    }
}
