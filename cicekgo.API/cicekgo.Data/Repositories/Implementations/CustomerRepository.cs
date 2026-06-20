using System.Data;
using Dapper;
using cicekgo.Core.Customers.Dtos;
using cicekgo.Data.Common.Interfaces;
using cicekgo.Data.Repositories.Interfaces;

namespace cicekgo.Data.Repositories.Implementations
{
    public class CustomerRepository : ICustomerRepository
    {
        private readonly ITenantDbFactory _tenant;

        public CustomerRepository(ITenantDbFactory tenantDbFactory)
        {
            _tenant = tenantDbFactory;
        }

        public async Task<int> CreateAsync(CustomerAddDto dto, string createdUser, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction(IsolationLevel.ReadCommitted);

            try
            {
                const string insertCustomer = @"
INSERT INTO dbo.Customers
    (CustomerName, CardName, CustomerGroup, Phone, Email, ExtraNote, IsActive, CreatedDate, CreatedUser, UpdatedDate, UpdatedUser)
VALUES
    (@CustomerName, @CardName, @CustomerGroup, @Phone, @Email, @ExtraNote, ISNULL(@IsActive,1), GETDATE(), @CreatedUser, NULL, NULL);
SELECT CAST(SCOPE_IDENTITY() AS int);";

                var customerId = await conn.ExecuteScalarAsync<int>(
                    new CommandDefinition(
                        insertCustomer,
                        new
                        {
                            dto.CustomerName,
                            dto.CardName,
                            dto.CustomerGroup,
                            dto.Phone,
                            dto.Email,
                            dto.ExtraNote,
                            dto.IsActive,
                            CreatedUser = createdUser
                        },
                        tx, cancellationToken: ct));

                if (dto.Billing is not null)
                {
                    const string insertBilling = @"
INSERT INTO dbo.CustomerBilling
    (CustomerId, TaxNumber, TaxOffice, SendMethod, FirstName, LastName, Title,
     Country, City, District, Address, Phone, Email, Website,
     CreatedDate, CreatedUser, UpdatedDate, UpdatedUser)
VALUES
    (@CustomerId, @TaxNumber, @TaxOffice, @SendMethod, @FirstName, @LastName, @Title,
     @Country, @City, @District, @Address, @Phone, @Email, @Website,
     GETDATE(), @CreatedUser, NULL, NULL);";

                    await conn.ExecuteAsync(
                        new CommandDefinition(
                            insertBilling,
                            new
                            {
                                CustomerId = customerId,
                                dto.Billing.TaxNumber,
                                dto.Billing.TaxOffice,
                                dto.Billing.SendMethod,
                                dto.Billing.FirstName,
                                dto.Billing.LastName,
                                dto.Billing.Title,
                                dto.Billing.Country,
                                dto.Billing.City,
                                dto.Billing.District,
                                dto.Billing.Address,
                                Phone = dto.Billing.Phone,
                                Email = dto.Billing.Email,
                                dto.Billing.Website,
                                CreatedUser = createdUser
                            },
                            tx, cancellationToken: ct));
                }


                if (dto.GroupIds is { Count: > 0 })
                {
                    var groupIds = dto.GroupIds
                        .Where(g => g > 0)
                        .Distinct()
                        .ToArray();

                    if (groupIds.Length > 0)
                    {
                        const string insertMember = @"
INSERT INTO dbo.CustomerGroupMembers (GroupId, CustomerId)
SELECT @GroupId, @CustomerId
WHERE EXISTS (SELECT 1 FROM dbo.CustomerGroups WHERE Id = @GroupId);";

                        foreach (var gid in groupIds)
                        {
                            await conn.ExecuteAsync(
                                new CommandDefinition(
                                    insertMember,
                                    new { GroupId = gid, CustomerId = customerId },
                                    tx, cancellationToken: ct));
                        }
                    }
                }



                tx.Commit();
                return customerId;
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

        public async Task<(IEnumerable<CustomerListItemDto> Items, int TotalCount)> ListAsync(
     string? search, int page, int pageSize, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            conn.Open();

            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 50;
            if (pageSize > 200) pageSize = 200;

            var offset = (page - 1) * pageSize;

            // search null/boş ise tüm kayıtlar döner; dolu ise CustomerName/CardName/Email/Phone'da arar
            const string sql = @"
-- Önce temp tabloya verileri al
SELECT *
INTO #C
FROM dbo.fn_CustomerWithBilling()
WHERE (@Search IS NULL OR
       CustomerName LIKE '%' + @Search + '%' OR
       CardName     LIKE '%' + @Search + '%' OR
       COALESCE(Email, '') LIKE '%' + @Search + '%' OR
       COALESCE(Phone, '') LIKE '%' + @Search + '%');

-- Sayfalı sonuç
SELECT *
FROM (
    SELECT *,
           ROW_NUMBER() OVER (ORDER BY CustomerName ASC, CustomerId ASC) AS rn
    FROM #C
) AS Paged
WHERE rn BETWEEN (@Offset + 1) AND (@Offset + @PageSize)
ORDER BY rn;

-- Toplam kayıt sayısı
SELECT COUNT(1) FROM #C;

-- Temizle
DROP TABLE #C;";

            var normalizedSearch = string.IsNullOrWhiteSpace(search) ? null : search.Trim();

            using var multi = await conn.QueryMultipleAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        Search = normalizedSearch,
                        Offset = offset,
                        PageSize = pageSize
                    },
                    cancellationToken: ct));

            var items = await multi.ReadAsync<CustomerListItemDto>();
            var total = await multi.ReadFirstAsync<int>();

            return (items, total);
        }


       public async Task DeleteCascadeAsync(int customerId, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction(IsolationLevel.ReadCommitted);

            try
            {
                // İstediğin sıra: önce Billing, sonra GroupMembers, en son Customers
                await conn.ExecuteAsync(
                    new CommandDefinition(
                        "DELETE FROM dbo.CustomerBilling WHERE CustomerId = @CustomerId;",
                        new { CustomerId = customerId }, tx, cancellationToken: ct));

                await conn.ExecuteAsync(
                    new CommandDefinition(
                        "DELETE FROM dbo.CustomerGroupMembers WHERE CustomerId = @CustomerId;",
                        new { CustomerId = customerId }, tx, cancellationToken: ct));

                var affected = await conn.ExecuteAsync(
                    new CommandDefinition(
                        "DELETE FROM dbo.Customers WHERE Id = @CustomerId;",
                        new { CustomerId = customerId }, tx, cancellationToken: ct));

                if (affected == 0)
                    throw new InvalidOperationException("customer not found");

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

        public async Task UpdateAsync(CustomerUpdateDto dto, string updatedUser, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction(IsolationLevel.ReadCommitted);

            try
            {
                // Ana müşteri bilgilerini güncelle
                const string updateCustomer = @"
UPDATE dbo.Customers
   SET CustomerName  = COALESCE(@CustomerName, CustomerName),
       CardName      = COALESCE(@CardName, CardName),
       CustomerGroup = COALESCE(@CustomerGroup, CustomerGroup),
       Phone         = COALESCE(@Phone, Phone),
       Email         = COALESCE(@Email, Email),
       ExtraNote     = COALESCE(@ExtraNote, ExtraNote),
       IsActive      = COALESCE(@IsActive, IsActive),
       UpdatedDate   = GETDATE(),
       UpdatedUser   = @UpdatedUser
 WHERE Id = @Id;";

                await conn.ExecuteAsync(
                    new CommandDefinition(
                        updateCustomer,
                        new
                        {
                            dto.Id,
                            dto.CustomerName,
                            dto.CardName,
                            dto.CustomerGroup,
                            dto.Phone,
                            dto.Email,
                            dto.ExtraNote,
                            dto.IsActive,
                            UpdatedUser = updatedUser
                        },
                        tx, cancellationToken: ct));

                // Fatura bilgilerini güncelle veya ekle
                if (dto.Billing is not null)
                {
                    const string upsertBilling = @"
IF EXISTS (SELECT 1 FROM dbo.CustomerBilling WHERE CustomerId = @CustomerId)
BEGIN
    UPDATE dbo.CustomerBilling
       SET TaxNumber   = COALESCE(@TaxNumber, TaxNumber),
           TaxOffice   = COALESCE(@TaxOffice, TaxOffice),
           SendMethod  = COALESCE(@SendMethod, SendMethod),
           FirstName   = COALESCE(@FirstName, FirstName),
           LastName    = COALESCE(@LastName, LastName),
           Title       = COALESCE(@Title, Title),
           Country     = COALESCE(@Country, Country),
           City        = COALESCE(@City, City),
           District    = COALESCE(@District, District),
           Address     = COALESCE(@Address, Address),
           Phone       = COALESCE(@Phone, Phone),
           Email       = COALESCE(@Email, Email),
           Website     = COALESCE(@Website, Website),
           UpdatedDate = GETDATE(),
           UpdatedUser = @UpdatedUser
     WHERE CustomerId = @CustomerId;
END
ELSE
BEGIN
    INSERT INTO dbo.CustomerBilling
        (CustomerId, TaxNumber, TaxOffice, SendMethod, FirstName, LastName, Title,
         Country, City, District, Address, Phone, Email, Website,
         CreatedDate, CreatedUser, UpdatedDate, UpdatedUser)
    VALUES
        (@CustomerId, @TaxNumber, @TaxOffice, @SendMethod, @FirstName, @LastName, @Title,
         @Country, @City, @District, @Address, @Phone, @Email, @Website,
         GETDATE(), @UpdatedUser, NULL, NULL);
END";

                    await conn.ExecuteAsync(
                        new CommandDefinition(
                            upsertBilling,
                            new
                            {
                                CustomerId = dto.Id,
                                dto.Billing!.TaxNumber,
                                dto.Billing.TaxOffice,
                                dto.Billing.SendMethod,
                                dto.Billing.FirstName,
                                dto.Billing.LastName,
                                dto.Billing.Title,
                                dto.Billing.Country,
                                dto.Billing.City,
                                dto.Billing.District,
                                dto.Billing.Address,
                                Phone = dto.Billing.Phone,
                                Email = dto.Billing.Email,
                                dto.Billing.Website,
                                UpdatedUser = updatedUser
                            },
                            tx, cancellationToken: ct));
                }

                // Grup üyeliklerini güncelle
                const string deleteGroups = @"DELETE FROM dbo.CustomerGroupMembers WHERE CustomerId = @CustomerId;";
                await conn.ExecuteAsync(
                    new CommandDefinition(deleteGroups, new { CustomerId = dto.Id }, tx, cancellationToken: ct)
                );

                if (dto.GroupIds is { Count: > 0 })
                {
                    var groupIds = dto.GroupIds
                        .Where(g => g > 0)
                        .Distinct()
                        .ToArray();

                    if (groupIds.Length > 0)
                    {
                        const string insertMember = @"
INSERT INTO dbo.CustomerGroupMembers (GroupId, CustomerId)
SELECT @GroupId, @CustomerId
WHERE EXISTS (SELECT 1 FROM dbo.CustomerGroups WHERE Id = @GroupId);";

                        foreach (var gid in groupIds)
                        {
                            await conn.ExecuteAsync(
                                new CommandDefinition(insertMember, new { GroupId = gid, CustomerId = dto.Id }, tx, cancellationToken: ct)
                            );
                        }
                    }
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

        public async Task<IEnumerable<CustomerGroupListItemDto>> GetGroupsAsync(CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            const string sql = @"
SELECT TOP (1000) 
       Id,
       GroupName,
       Description,
       CreatedAt
FROM dbo.CustomerGroups
ORDER BY CreatedAt DESC;";

            return await conn.QueryAsync<CustomerGroupListItemDto>(
                new CommandDefinition(sql, cancellationToken: ct));
        }

        public async Task<int> CreateGroupAsync(CustomerGroupAddDto dto, string createdUser, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            const string sql = @"
INSERT INTO dbo.CustomerGroups (GroupName, Description, CreatedAt)
VALUES (@GroupName, @Description, GETDATE());
SELECT CAST(SCOPE_IDENTITY() as int);";

            return await conn.ExecuteScalarAsync<int>(
                new CommandDefinition(sql, new
                {
                    dto.GroupName,
                    dto.Description
                }, cancellationToken: ct));
        }

        public async Task AddCustomerToGroupAsync(CustomerGroupMemberAddDto dto, string createdUser, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            const string sql = @"
INSERT INTO dbo.CustomerGroupMembers (GroupId, CustomerId)
VALUES (@GroupId, @CustomerId);";

            await conn.ExecuteAsync(
                new CommandDefinition(sql, new
                {
                    dto.GroupId,
                    dto.CustomerId
                }, cancellationToken: ct));
        }

        public async Task<(IEnumerable<CustomerGroupMemberListDto> Items, int TotalCount)> ListCustomerGroupMembersAsync(
    string? search, int page, int pageSize, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            conn.Open();

            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 50;
            if (pageSize > 200) pageSize = 200;

            var offset = (page - 1) * pageSize;
            var normalizedSearch = string.IsNullOrWhiteSpace(search) ? null : search.Trim();

            const string sql = @"
SELECT m.Id, m.GroupId, g.GroupName, g.Description,
       m.CustomerId, c.CustomerName
FROM dbo.CustomerGroupMembers m
INNER JOIN dbo.CustomerGroups g ON m.GroupId = g.Id
INNER JOIN dbo.Customers c ON m.CustomerId = c.Id
WHERE (@Search IS NULL OR c.CustomerName LIKE '%' + @Search + '%' OR g.GroupName LIKE '%' + @Search + '%')
ORDER BY m.Id
OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

SELECT COUNT(*) 
FROM dbo.CustomerGroupMembers m
INNER JOIN dbo.CustomerGroups g ON m.GroupId = g.Id
INNER JOIN dbo.Customers c ON m.CustomerId = c.Id
WHERE (@Search IS NULL OR c.CustomerName LIKE '%' + @Search + '%' OR g.GroupName LIKE '%' + @Search + '%');";

            using var multi = await conn.QueryMultipleAsync(
                new CommandDefinition(sql, new { Search = normalizedSearch, Offset = offset, PageSize = pageSize }, cancellationToken: ct));

            var items = await multi.ReadAsync<CustomerGroupMemberListDto>();
            var total = await multi.ReadFirstAsync<int>();

            return (items, total);
        }

        public async Task UpdateCustomerGroupMemberAsync(CustomerGroupMemberUpdateDto dto, string updatedUser, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            const string sql = @"
UPDATE dbo.CustomerGroupMembers
SET GroupId = @GroupId,
    CustomerId = @CustomerId
WHERE Id = @Id;";

            await conn.ExecuteAsync(new CommandDefinition(sql, dto, cancellationToken: ct));
        }

        public async Task DeleteCustomerGroupMemberAsync(int id, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            const string sql = @"DELETE FROM dbo.CustomerGroupMembers WHERE Id = @Id;";
            await conn.ExecuteAsync(new CommandDefinition(sql, new { Id = id }, cancellationToken: ct));
        }

        public async Task<int> DeleteGroupAsync(int id, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                // önce group üyeliklerini sil
                await conn.ExecuteAsync(
                    new CommandDefinition(
                        "DELETE FROM dbo.CustomerGroupMembers WHERE GroupId = @Id;",
                        new { Id = id }, tx, cancellationToken: ct));

                // sonra grubu sil
                var affected = await conn.ExecuteAsync(
                    new CommandDefinition(
                        "DELETE FROM dbo.CustomerGroups WHERE Id = @Id;",
                        new { Id = id }, tx, cancellationToken: ct));

                tx.Commit();
                return affected; // 0 ise grup yoktu
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

        // Customer Ledger Implementation
        public async Task<int> AddLedgerEntryAsync(CustomerLedgerAddDto dto, string createdBy, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                // Mevcut bakiyeyi al
                var currentBalance = await GetCurrentBalanceAsync(dto.CustomerId, ct);
                var newBalance = currentBalance + dto.Credit - dto.Debit;

                const string sql = @"
INSERT INTO dbo.CustomerLedger
    (CustomerId, TransactionDate, TransactionType, Description, Debit, Credit, Balance, ReferenceId, ReferenceType, OrderCode, CustomerNote, CreatedBy, CreatedDate)
VALUES
    (@CustomerId, GETDATE(), @TransactionType, @Description, @Debit, @Credit, @Balance, @ReferenceId, @ReferenceType, @OrderCode, @CustomerNote, @CreatedBy, GETDATE());
SELECT CAST(SCOPE_IDENTITY() AS int);";

                var ledgerId = await conn.ExecuteScalarAsync<int>(
                    new CommandDefinition(sql, new
                    {
                        dto.CustomerId,
                        dto.TransactionType,
                        dto.Description,
                        dto.Debit,
                        dto.Credit,
                        Balance = newBalance,
                        dto.ReferenceId,
                        dto.ReferenceType,
                        dto.OrderCode,
                        dto.CustomerNote,
                        CreatedBy = createdBy
                    }, tx, cancellationToken: ct));

                tx.Commit();
                return ledgerId;
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        public async Task UpdateLedgerEntryByOrderCodeAsync(string orderCode, CustomerLedgerUpdateDto dto, string updatedBy, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                // Önce mevcut kaydı bul
                const string findSql = @"
SELECT Id, CustomerId, Debit, Credit, Balance
FROM dbo.CustomerLedger
WHERE OrderCode = @OrderCode AND TransactionType = 'ORDER'";

                var existingEntry = await conn.QueryFirstOrDefaultAsync<dynamic>(
                    new CommandDefinition(findSql, new { OrderCode = orderCode }, tx, cancellationToken: ct));

                if (existingEntry == null)
                {
                    // Kayıt bulunamadı, işlemi sonlandır
                    tx.Commit();
                    return;
                }

                // Eski değerleri hesapla
                var oldDebit = (decimal)existingEntry.Debit;
                var oldCredit = (decimal)existingEntry.Credit;
                var oldBalance = (decimal)existingEntry.Balance;
                var customerId = (int)existingEntry.CustomerId;

                // Yeni bakiye hesapla
                var balanceDifference = (dto.Debit - oldDebit) - (dto.Credit - oldCredit);
                var newBalance = oldBalance + balanceDifference;

                // CustomerLedger kaydını güncelle
                const string updateSql = @"
UPDATE dbo.CustomerLedger
SET Debit = @Debit,
    Credit = @Credit,
    Balance = @Balance,
    Description = @Description,
    CustomerNote = @CustomerNote
WHERE OrderCode = @OrderCode AND TransactionType = 'ORDER'";

                await conn.ExecuteAsync(
                    new CommandDefinition(updateSql, new
                    {
                        dto.Debit,
                        dto.Credit,
                        Balance = newBalance,
                        dto.Description,
                        dto.CustomerNote,
                        OrderCode = orderCode
                    }, tx, cancellationToken: ct));

                // Bu müşterinin sonraki tüm kayıtlarının bakiyelerini güncelle
                const string updateBalancesSql = @"
UPDATE dbo.CustomerLedger
SET Balance = Balance + @BalanceDifference
WHERE CustomerId = @CustomerId 
  AND Id > @CurrentId
ORDER BY Id";

                await conn.ExecuteAsync(
                    new CommandDefinition(updateBalancesSql, new
                    {
                        BalanceDifference = balanceDifference,
                        CustomerId = customerId,
                        CurrentId = existingEntry.Id
                    }, tx, cancellationToken: ct));

                tx.Commit();
            }
            catch
            {
                tx.Rollback();
                throw;
            }
        }

        public async Task<(IEnumerable<CustomerLedgerDto> Items, int TotalCount)> GetLedgerAsync(CustomerLedgerListRequestDto request, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            conn.Open();

            if (request.Page < 1) request.Page = 1;
            if (request.PageSize < 1) request.PageSize = 50;
            if (request.PageSize > 200) request.PageSize = 200;

            var offset = (request.Page - 1) * request.PageSize;

            const string sql = @"
SELECT Id, CustomerId, TransactionDate, TransactionType, Description, 
       Debit, Credit, Balance, ReferenceId, ReferenceType, OrderCode, CustomerNote, CreatedBy, CreatedDate
FROM dbo.CustomerLedger
WHERE CustomerId = @CustomerId
  AND (@StartDate IS NULL OR TransactionDate >= @StartDate)
  AND (@EndDate IS NULL OR TransactionDate <= @EndDate)
  AND (@TransactionType IS NULL OR TransactionType = @TransactionType)
ORDER BY TransactionDate DESC, Id DESC
OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

SELECT COUNT(*) 
FROM dbo.CustomerLedger
WHERE CustomerId = @CustomerId
  AND (@StartDate IS NULL OR TransactionDate >= @StartDate)
  AND (@EndDate IS NULL OR TransactionDate <= @EndDate)
  AND (@TransactionType IS NULL OR TransactionType = @TransactionType);";

            using var multi = await conn.QueryMultipleAsync(
                new CommandDefinition(sql, new
                {
                    request.CustomerId,
                    StartDate = request.StartDate?.Date,
                    EndDate = request.EndDate?.Date.AddDays(1).AddSeconds(-1), // End of day
                    request.TransactionType,
                    Offset = offset,
                    PageSize = request.PageSize
                }, cancellationToken: ct));

            var items = await multi.ReadAsync<CustomerLedgerDto>();
            var total = await multi.ReadFirstAsync<int>();

            return (items, total);
        }

        public async Task<CustomerBalanceDto?> GetCustomerBalanceAsync(int customerId, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            const string sql = @"
SELECT 
    c.Id as CustomerId,
    c.CustomerName,
    ISNULL(SUM(l.Debit), 0) as TotalDebit,
    ISNULL(SUM(l.Credit), 0) as TotalCredit,
    ISNULL(SUM(l.Credit - l.Debit), 0) as Balance,
    ISNULL(MAX(l.TransactionDate), c.CreatedDate) as LastTransactionDate
FROM dbo.Customers c
LEFT JOIN dbo.CustomerLedger l ON c.Id = l.CustomerId
WHERE c.Id = @CustomerId
GROUP BY c.Id, c.CustomerName, c.CreatedDate;";

            return await conn.QuerySingleOrDefaultAsync<CustomerBalanceDto>(
                new CommandDefinition(sql, new { CustomerId = customerId }, cancellationToken: ct));
        }

        public async Task<IEnumerable<CustomerBalanceDto>> GetAllCustomerBalancesAsync(CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            const string sql = @"
SELECT 
    c.Id as CustomerId,
    c.CustomerName,
    ISNULL(SUM(l.Debit), 0) as TotalDebit,
    ISNULL(SUM(l.Credit), 0) as TotalCredit,
    ISNULL(SUM(l.Credit - l.Debit), 0) as Balance,
    ISNULL(MAX(l.TransactionDate), c.CreatedDate) as LastTransactionDate
FROM dbo.Customers c
LEFT JOIN dbo.CustomerLedger l ON c.Id = l.CustomerId
WHERE c.IsActive = 1
GROUP BY c.Id, c.CustomerName, c.CreatedDate
ORDER BY Balance DESC;";

            return await conn.QueryAsync<CustomerBalanceDto>(
                new CommandDefinition(sql, cancellationToken: ct));
        }

        public async Task<decimal> GetCurrentBalanceAsync(int customerId, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            const string sql = @"
SELECT ISNULL(SUM(Credit - Debit), 0)
FROM dbo.CustomerLedger
WHERE CustomerId = @CustomerId;";

            return await conn.ExecuteScalarAsync<decimal>(
                new CommandDefinition(sql, new { CustomerId = customerId }, cancellationToken: ct));
        }

        public async Task<bool> CustomerExistsAsync(int customerId, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            const string sql = @"
SELECT COUNT(1)
FROM dbo.Customers
WHERE Id = @CustomerId AND IsActive = 1";

            var count = await conn.ExecuteScalarAsync<int>(
                new CommandDefinition(sql, new { CustomerId = customerId }, cancellationToken: ct));
            
            return count > 0;
        }

        public async Task<int?> GetCustomerIdByNameAndPhoneAsync(string customerName, string phone, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            const string sql = @"
SELECT Id
FROM dbo.Customers
WHERE CustomerName = @CustomerName AND Phone = @Phone AND IsActive = 1";

            return await conn.ExecuteScalarAsync<int?>(
                new CommandDefinition(sql, new { CustomerName = customerName, Phone = phone }, cancellationToken: ct));
        }

        public async Task<int> AddOrderPaymentAsync(CustomerOrderPaymentDto dto, string createdBy, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            conn.Open();
            using var tx = conn.BeginTransaction(IsolationLevel.ReadCommitted);

            try
            {
                // 1) Siparişi bul ve kalan tutarı kontrol et
                const string getOrderSql = @"
SELECT Id, Order_Amount, Order_RemainingAmount
FROM dbo.Orders
WHERE Order_Id = @OrderCode";

                var order = await conn.QuerySingleOrDefaultAsync<dynamic>(
                    new CommandDefinition(getOrderSql, new { OrderCode = dto.OrderCode }, tx, cancellationToken: ct));

                if (order == null)
                    throw new InvalidOperationException("Sipariş bulunamadı");

                var orderAmount = (decimal)order.Order_Amount;
                var currentRemaining = (decimal)order.Order_RemainingAmount;
                var newRemaining = currentRemaining - dto.Amount;

                if (newRemaining < 0)
                    throw new InvalidOperationException("Ödeme tutarı kalan tutardan fazla olamaz");

                // 2) Orders tablosunda kalan tutarı güncelle
                const string updateOrderSql = @"
UPDATE dbo.Orders
SET Order_RemainingAmount = @NewRemaining,
    UpdatedDate = GETDATE(),
    UpdatedUser = @UpdatedUser
WHERE Order_Id = @OrderCode";

                await conn.ExecuteAsync(
                    new CommandDefinition(updateOrderSql, new { 
                        NewRemaining = newRemaining, 
                        UpdatedUser = createdBy, 
                        OrderCode = dto.OrderCode 
                    }, tx, cancellationToken: ct));

                // 3) OrderPayment tablosuna ödeme kaydı ekle
                const string insertPaymentSql = @"
INSERT INTO dbo.OrderPayment (OrderId, PaymentAmount, PaymentMethodId, PaymentDate)
VALUES (@OrderId, @PaymentAmount, @PaymentMethodId, @PaymentDate);
SELECT CAST(SCOPE_IDENTITY() AS int);";

                var paymentId = await conn.ExecuteScalarAsync<int>(
                    new CommandDefinition(insertPaymentSql, new {
                        OrderId = order.Id,
                        PaymentAmount = dto.Amount,
                        PaymentMethodId = dto.PaymentMethodId,
                        PaymentDate = dto.PaymentDate ?? DateTime.Now
                    }, tx, cancellationToken: ct));

                // 4) CustomerLedger tablosuna ödeme kaydı ekle
                var ledgerDto = new CustomerLedgerAddDto
                {
                    CustomerId = dto.CustomerId,
                    TransactionType = "PAYMENT",
                    Description = dto.Description ?? $"Sipariş Ödemesi - {dto.OrderCode}",
                    Debit = 0, // Ödeme için debit 0
                    Credit = dto.Amount, // Ödeme tutarı
                    ReferenceId = paymentId,
                    ReferenceType = "ORDER_PAYMENT",
                    OrderCode = dto.OrderCode,
                    CustomerNote = $"Sipariş: {dto.OrderCode}"
                };

                var ledgerId = await AddLedgerEntryAsync(ledgerDto, createdBy, ct);

                tx.Commit();
                return ledgerId;
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

        public async Task<CustomerDto?> GetCustomerByIdAsync(int customerId, CancellationToken ct = default)
        {
            using var conn = _tenant.CreateConnection();
            const string sql = @"
SELECT Id as CustomerId, CustomerName, CardName, CustomerGroup, Phone, Email, ExtraNote, IsActive, CreatedDate, CreatedUser, UpdatedDate, UpdatedUser
FROM dbo.Customers
WHERE Id = @CustomerId AND IsActive = 1";

            return await conn.QuerySingleOrDefaultAsync<CustomerDto>(
                new CommandDefinition(sql, new { CustomerId = customerId }, cancellationToken: ct));
        }





    }
}
