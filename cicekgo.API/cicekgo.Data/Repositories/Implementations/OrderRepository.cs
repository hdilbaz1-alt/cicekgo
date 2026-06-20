using System.Data;
using Dapper;
using cicekgo.Core.Orders.Dtos;
using cicekgo.Data.Common.Interfaces;
using cicekgo.Data.Repositories.Interfaces;

namespace cicekgo.Data.Repositories.Implementations
{
    public class OrderRepository : IOrderRepository
    {
        private readonly ITenantDbFactory _tenantDbFactory;

        public OrderRepository(ITenantDbFactory tenantDbFactory)
        {
            _tenantDbFactory = tenantDbFactory;
        }

        public async Task<int> CreateOrderAggregateAsync(OrderCreateDto dto, string createdUser, CancellationToken ct = default)
        {
            using var conn = _tenantDbFactory.CreateConnection();
            conn.Open();

            using var tx = conn.BeginTransaction(IsolationLevel.ReadCommitted);

            try
            {
                // 1) Orders insert (PK al)
                const string insertOrderSql = @"
INSERT INTO dbo.Orders
    (Order_Status, Order_Id, Order_Sender, Order_To, Order_DeliveryDate, 
     Order_Amount, Order_RemainingAmount, Order_ProductType, CreatedDate, CreatedUser, UpdatedDate)
VALUES
    (@Order_Status, @Order_Id, @Order_Sender, @Order_To, @Order_DeliveryDate, 
     @Order_Amount, @Order_RemainingAmount, @Order_ProductType, GETDATE(), @CreatedUser, NULL);
SELECT CAST(SCOPE_IDENTITY() AS int);";

                var orderPkId = await conn.ExecuteScalarAsync<int>(
                    new CommandDefinition(
                        insertOrderSql,
                                                 new
                         {
                             Order_Status = dto.OrderStatus,
                             Order_Id = dto.OrderId,
                             Order_Sender = dto.OrderSender,
                             Order_To = dto.OrderTo,
                             Order_DeliveryDate = dto.OrderDeliveryDate,
                             Order_Amount = dto.OrderAmount,
                             Order_RemainingAmount = dto.OrderRemainingAmount,
                             Order_ProductType = dto.OrderProductType,
                             CreatedUser = createdUser
                         },
                        tx,
                        cancellationToken: ct
                    )
                );

                // 2) Notes (varsa)
                if (!string.IsNullOrWhiteSpace(dto.ExtraNote) ||
                    !string.IsNullOrWhiteSpace(dto.CardNote) ||
                    !string.IsNullOrWhiteSpace(dto.CustomerNote))
                {
                    const string insertNotesSql = @"
INSERT INTO dbo.OrderNotes (OrderId, ExtraNote, CardNote, CustomerNote)
VALUES (@OrderId, @ExtraNote, @CardNote, @CustomerNote);";

                    await conn.ExecuteAsync(
                        new CommandDefinition(
                            insertNotesSql,
                            new
                            {
                                OrderId = orderPkId,
                                ExtraNote = dto.ExtraNote,
                                CardNote = dto.CardNote,
                                CustomerNote = dto.CustomerNote
                            },
                            tx,
                            cancellationToken: ct
                        )
                    );
                }

                // 3) Sender (varsa)
                if (!string.IsNullOrWhiteSpace(dto.SenderName) ||
                    !string.IsNullOrWhiteSpace(dto.SenderPhone))
                {
                    const string insertSenderSql = @"
INSERT INTO dbo.OrderSender (OrderId, SenderName, SenderPhone)
VALUES (@OrderId, @SenderName, @SenderPhone);";

                    await conn.ExecuteAsync(
                        new CommandDefinition(
                            insertSenderSql,
                            new
                            {
                                OrderId = orderPkId,
                                SenderName = dto.SenderName,
                                SenderPhone = dto.SenderPhone
                            },
                            tx,
                            cancellationToken: ct
                        )
                    );
                }

                // 4) Recipient (varsa)
                if (!string.IsNullOrWhiteSpace(dto.RecipientName) ||
                    !string.IsNullOrWhiteSpace(dto.RecipientPhone) ||
                    !string.IsNullOrWhiteSpace(dto.RecipientAddress))
                {
                    const string insertRecipientSql = @"
INSERT INTO dbo.OrderRecipient (OrderId, RecipientName, RecipientPhone, RecipientAddress)
VALUES (@OrderId, @RecipientName, @RecipientPhone, @RecipientAddress);";

                    await conn.ExecuteAsync(
                        new CommandDefinition(
                            insertRecipientSql,
                            new
                            {
                                OrderId = orderPkId,
                                RecipientName = dto.RecipientName,
                                RecipientPhone = dto.RecipientPhone,
                                RecipientAddress = dto.RecipientAddress
                            },
                            tx,
                            cancellationToken: ct
                        )
                    );
                }

                // 5) Notification (varsa)
                if (dto.IsNotified.HasValue)
                {
                    const string insertNotifSql = @"
INSERT INTO dbo.OrderNotification (OrderId, IsNotified)
VALUES (@OrderId, @IsNotified);";

                    await conn.ExecuteAsync(
                        new CommandDefinition(
                            insertNotifSql,
                            new
                            {
                                OrderId = orderPkId,
                                IsNotified = dto.IsNotified.Value
                            },
                            tx,
                            cancellationToken: ct
                        )
                    );
                }

                // 6) Payments (liste varsa; PaymentDate null ise GETDATE())
                if (dto.Payments is { Count: > 0 })
                {
                    const string insertPaymentSql = @"
INSERT INTO dbo.OrderPayment (OrderId, PaymentAmount, PaymentMethodId, PaymentDate)
VALUES (@OrderId, @PaymentAmount, @PaymentMethodId, ISNULL(@PaymentDate, GETDATE()));";

                    foreach (var p in dto.Payments)
                    {
                        await conn.ExecuteAsync(
                            new CommandDefinition(
                                insertPaymentSql,
                                new
                                {
                                    OrderId = orderPkId,
                                    PaymentAmount = p.PaymentAmount,
                                    PaymentMethodId = p.PaymentMethodId,
                                    PaymentDate = p.PaymentDate
                                },
                                tx,
                                cancellationToken: ct
                            )
                        );
                    }
                }

                tx.Commit();
                return orderPkId;
            }
            catch
            {
                tx.Rollback();
                throw;
            }
            finally
            {
                conn.Close();
            }
        }


        public async Task<(IEnumerable<OrderListItemDto> Items, int TotalCount)> ListOrdersAsync(
            DateTime startDate, DateTime endDate, int page, int pageSize, CancellationToken ct = default)
        {
            using var conn = _tenantDbFactory.CreateConnection();
            conn.Open();

            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 50;
            if (pageSize > 200) pageSize = 200;

            var offset = (page - 1) * pageSize;

            const string sql = @"
SELECT
    o.Id as OrderPkId,
    o.Order_Id as OrderCode,
    o.Order_Status as OrderStatus,
    o.Order_ProductType as ProductType,
    o.CreatedDate,
    o.Order_DeliveryDate as DeliveryDate,
    o.CreatedUser,
    os.SenderName,
    os.SenderPhone,
    ore.RecipientName,
    ore.RecipientPhone,
    ore.RecipientAddress,
    CAST(ISNULL(SUM(op.PaymentAmount), 0) AS decimal(18,2)) AS TotalPaid,
    MAX(op.PaymentDate) as LastPaymentDate,
    o.Order_Amount as OrderAmount,
    o.Order_RemainingAmount as OrderRemainingAmount,
    ISNULL(onot.IsNotified, 0) as IsNotified,
    c.Id as CustomerId,
    onotes.ExtraNote,
    onotes.CardNote,
    onotes.CustomerNote
FROM dbo.Orders o
LEFT JOIN dbo.OrderSender os ON o.Id = os.OrderId
LEFT JOIN dbo.OrderRecipient ore ON o.Id = ore.OrderId
LEFT JOIN dbo.OrderPayment op ON o.Id = op.OrderId
LEFT JOIN dbo.OrderNotification onot ON o.Id = onot.OrderId
LEFT JOIN dbo.OrderNotes onotes ON o.Id = onotes.OrderId
LEFT JOIN dbo.Customers c ON os.SenderName = c.CustomerName AND os.SenderPhone = c.Phone
WHERE o.Order_DeliveryDate >= @StartDate AND o.Order_DeliveryDate < @EndDate
GROUP BY o.Id, o.Order_Id, o.Order_Status, o.Order_ProductType, o.CreatedDate, 
         o.Order_DeliveryDate, o.CreatedUser, os.SenderName, os.SenderPhone,
         ore.RecipientName, ore.RecipientPhone, ore.RecipientAddress,
         o.Order_Amount, o.Order_RemainingAmount, onot.IsNotified, c.Id,
         onotes.ExtraNote, onotes.CardNote, onotes.CustomerNote
ORDER BY o.Order_DeliveryDate DESC, o.Id DESC
OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

SELECT COUNT(1)
FROM dbo.Orders o
WHERE o.Order_DeliveryDate >= @StartDate AND o.Order_DeliveryDate < @EndDate;";

            using var multi = await conn.QueryMultipleAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        StartDate = startDate.Date,
                        EndDate = endDate.Date,
                        Offset = offset,
                        PageSize = pageSize
                    },
                    cancellationToken: ct
                )
            );

            var items = await multi.ReadAsync<OrderListItemDto>(); // 1. set
            var total = await multi.ReadFirstAsync<int>();          // 2. set

            return (items, total);
        }

        public async Task UpdateOrderAggregateByCodeAsync(
            string orderCode, OrderUpdateDto dto, string updatedBy, CancellationToken ct = default)
        {
            using var conn = _tenantDbFactory.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction(IsolationLevel.ReadCommitted);

            try
            {
                // 0) Order PK (Order_Id = NVARCHAR(50))
                const string getPkSql = @"
SELECT TOP(1) Id 
FROM dbo.Orders WITH (UPDLOCK, ROWLOCK) 
WHERE Order_Id = @OrderCode;";

                var orderPkId = await conn.ExecuteScalarAsync<int?>(
                    new CommandDefinition(getPkSql, new { OrderCode = orderCode }, tx, cancellationToken: ct));

                if (!orderPkId.HasValue)
                    throw new InvalidOperationException("order not found");

                // 1) Orders (null olmayan alanları güncelle)
                const string updOrderSql = @"
UPDATE dbo.Orders
   SET Order_Status          = COALESCE(@Order_Status, Order_Status),
       Order_Sender          = COALESCE(@Order_Sender, Order_Sender),
       Order_To              = COALESCE(@Order_To, Order_To),
       Order_DeliveryDate    = COALESCE(@Order_DeliveryDate, Order_DeliveryDate),
       Order_Amount          = COALESCE(@Order_Amount, Order_Amount),
       Order_ProductType     = COALESCE(@Order_ProductType, Order_ProductType),
       UpdatedDate           = GETDATE(),
       UpdatedUser           = @UpdatedUser
WHERE Id = @OrderPkId;";

                await conn.ExecuteAsync(
                    new CommandDefinition(
                        updOrderSql,
                                                 new
                         {
                             Order_Status = dto.OrderStatus,
                             Order_Sender = dto.OrderSender,
                             Order_To = dto.OrderTo,
                             Order_DeliveryDate = dto.OrderDeliveryDate,
                             Order_Amount = dto.OrderAmount,
                             Order_ProductType = dto.OrderProductType,
                             UpdatedUser = updatedBy,
                             OrderPkId = orderPkId.Value
                         },
                        tx,
                        cancellationToken: ct));

                // 2) Notes upsert
                if (dto.ExtraNote is not null || dto.CardNote is not null || dto.CustomerNote is not null)
                {
                    const string notesUpsert = @"
IF EXISTS (SELECT 1 FROM dbo.OrderNotes WHERE OrderId = @OrderId)
BEGIN
    UPDATE dbo.OrderNotes
       SET ExtraNote    = COALESCE(@ExtraNote, ExtraNote),
           CardNote     = COALESCE(@CardNote, CardNote),
           CustomerNote = COALESCE(@CustomerNote, CustomerNote)
     WHERE OrderId = @OrderId;
END
ELSE
BEGIN
    INSERT INTO dbo.OrderNotes (OrderId, ExtraNote, CardNote, CustomerNote)
    VALUES (@OrderId, @ExtraNote, @CardNote, @CustomerNote);
END";
                    await conn.ExecuteAsync(
                        new CommandDefinition(
                            notesUpsert,
                            new
                            {
                                OrderId = orderPkId.Value,
                                ExtraNote = dto.ExtraNote,
                                CardNote = dto.CardNote,
                                CustomerNote = dto.CustomerNote
                            },
                            tx,
                            cancellationToken: ct));
                }

                // 3) Sender upsert
                if (dto.SenderName is not null || dto.SenderPhone is not null)
                {
                    const string senderUpsert = @"
IF EXISTS (SELECT 1 FROM dbo.OrderSender WHERE OrderId = @OrderId)
BEGIN
    UPDATE dbo.OrderSender
       SET SenderName  = COALESCE(@SenderName, SenderName),
           SenderPhone = COALESCE(@SenderPhone, SenderPhone)
     WHERE OrderId = @OrderId;
END
ELSE
BEGIN
    INSERT INTO dbo.OrderSender (OrderId, SenderName, SenderPhone)
    VALUES (@OrderId, @SenderName, @SenderPhone);
END";
                    await conn.ExecuteAsync(
                        new CommandDefinition(
                            senderUpsert,
                            new
                            {
                                OrderId = orderPkId.Value,
                                SenderName = dto.SenderName,
                                SenderPhone = dto.SenderPhone
                            },
                            tx,
                            cancellationToken: ct));
                }

                // 4) Recipient upsert
                if (dto.RecipientName is not null || dto.RecipientPhone is not null || dto.RecipientAddress is not null)
                {
                    const string recipientUpsert = @"
IF EXISTS (SELECT 1 FROM dbo.OrderRecipient WHERE OrderId = @OrderId)
BEGIN
    UPDATE dbo.OrderRecipient
       SET RecipientName    = COALESCE(@RecipientName, RecipientName),
           RecipientPhone   = COALESCE(@RecipientPhone, RecipientPhone),
           RecipientAddress = COALESCE(@RecipientAddress, RecipientAddress)
     WHERE OrderId = @OrderId;
END
ELSE
BEGIN
    INSERT INTO dbo.OrderRecipient (OrderId, RecipientName, RecipientPhone, RecipientAddress)
    VALUES (@OrderId, @RecipientName, @RecipientPhone, @RecipientAddress);
END";
                    await conn.ExecuteAsync(
                        new CommandDefinition(
                            recipientUpsert,
                            new
                            {
                                OrderId = orderPkId.Value,
                                RecipientName = dto.RecipientName,
                                RecipientPhone = dto.RecipientPhone,
                                RecipientAddress = dto.RecipientAddress
                            },
                            tx,
                            cancellationToken: ct));
                }

                // 5) Notification upsert
                if (dto.IsNotified.HasValue)
                {
                    const string notifUpsert = @"
IF EXISTS (SELECT 1 FROM dbo.OrderNotification WHERE OrderId = @OrderId)
BEGIN
    UPDATE dbo.OrderNotification
       SET IsNotified = @IsNotified
     WHERE OrderId = @OrderId;
END
ELSE
BEGIN
    INSERT INTO dbo.OrderNotification (OrderId, IsNotified)
    VALUES (@OrderId, @IsNotified);
END";
                    await conn.ExecuteAsync(
                        new CommandDefinition(
                            notifUpsert,
                            new { OrderId = orderPkId.Value, IsNotified = dto.IsNotified.Value },
                            tx,
                            cancellationToken: ct));
                }

                // 6) Payments
                if (dto.Payments is { Count: > 0 })
                {
                    if (dto.ReplacePayments == true)
                    {
                        await conn.ExecuteAsync(
                            new CommandDefinition(
                                "DELETE FROM dbo.OrderPayment WHERE OrderId = @OrderId;",
                                new { OrderId = orderPkId.Value }, tx, cancellationToken: ct));
                    }

                    const string insertPayment = @"
INSERT INTO dbo.OrderPayment (OrderId, PaymentAmount, PaymentMethodId, PaymentDate)
VALUES (@OrderId, @PaymentAmount, @PaymentMethodId, ISNULL(@PaymentDate, GETDATE()));";

                    foreach (var p in dto.Payments)
                    {
                        await conn.ExecuteAsync(
                            new CommandDefinition(
                                insertPayment,
                                new
                                {
                                    OrderId = orderPkId.Value,
                                    PaymentAmount = p.PaymentAmount,
                                    PaymentMethodId = p.PaymentMethodId,
                                    PaymentDate = p.PaymentDate
                                },
                                tx,
                                cancellationToken: ct));
                    }
                }
                else if (dto.ReplacePayments == true)
                {
                    // Liste boş + ReplacePayments=true → var olan tüm ödemeleri sil
                    await conn.ExecuteAsync(
                        new CommandDefinition(
                            "DELETE FROM dbo.OrderPayment WHERE OrderId = @OrderId;",
                            new { OrderId = orderPkId.Value }, tx, cancellationToken: ct));
                }

                tx.Commit();
            }
            catch
            {
                tx.Rollback();
                throw;
            }
            finally
            {
                conn.Close();
            }
        }
    }
}
