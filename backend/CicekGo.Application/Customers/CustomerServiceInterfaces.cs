using CicekGo.Application.Common;

namespace CicekGo.Application.Customers;

public interface ICustomerService
{
    Task<int> CreateAsync(CustomerAddDto dto, CancellationToken ct = default);
    Task UpdateAsync(CustomerUpdateDto dto, CancellationToken ct = default);
    Task DeleteAsync(int customerId, CancellationToken ct = default);
    Task<CustomerDto?> GetByIdAsync(int customerId, CancellationToken ct = default);
    Task<PagedResult<CustomerListItemDto>> ListAsync(CustomerListRequestDto request, CancellationToken ct = default);
}

public interface ICustomerGroupService
{
    Task<IReadOnlyList<CustomerGroupListItemDto>> GetGroupsAsync(CancellationToken ct = default);
    Task<int> CreateGroupAsync(CustomerGroupAddDto dto, CancellationToken ct = default);
    Task DeleteGroupAsync(int id, CancellationToken ct = default);
    Task AddMemberAsync(CustomerGroupMemberAddDto dto, CancellationToken ct = default);
    Task<PagedResult<CustomerGroupMemberListDto>> ListMembersAsync(string? search, int page, int pageSize, CancellationToken ct = default);
}

public interface ICustomerLedgerService
{
    Task<IReadOnlyList<CustomerBalanceDto>> GetAllBalancesAsync(CancellationToken ct = default);
    Task<PagedResult<CustomerLedgerDto>> GetLedgerAsync(CustomerLedgerListRequestDto request, CancellationToken ct = default);
    Task<int> AddPaymentAsync(CustomerPaymentDto dto, CancellationToken ct = default);
    Task<int> AddOrderPaymentAsync(CustomerOrderPaymentDto dto, CancellationToken ct = default);
    Task<int> AddCreditPayoutAsync(CustomerPayoutDto dto, CancellationToken ct = default);
    Task<int> AddEntryAsync(CustomerLedgerAddDto dto, CancellationToken ct = default);
}
