using cicekgo.Core.Customers.Dtos;

namespace cicekgo.Data.Repositories.Interfaces
{
    public interface ICustomerRepository
    {
        Task<int> CreateAsync(CustomerAddDto dto, string createdUser, CancellationToken ct = default);

        Task<(IEnumerable<CustomerListItemDto> Items, int TotalCount)> ListAsync(
            string? search, int page, int pageSize, CancellationToken ct = default);

        Task UpdateAsync(CustomerUpdateDto dto, string updatedUser, CancellationToken ct = default);

        Task DeleteCascadeAsync(int customerId, CancellationToken ct = default);

        Task<IEnumerable<CustomerGroupListItemDto>> GetGroupsAsync(CancellationToken ct = default);
        Task<int> CreateGroupAsync(CustomerGroupAddDto dto, string createdUser, CancellationToken ct = default);
        Task AddCustomerToGroupAsync(CustomerGroupMemberAddDto dto, string createdUser, CancellationToken ct = default);

        Task<(IEnumerable<CustomerGroupMemberListDto> Items, int TotalCount)> ListCustomerGroupMembersAsync(
    string? search, int page, int pageSize, CancellationToken ct = default);

        Task UpdateCustomerGroupMemberAsync(CustomerGroupMemberUpdateDto dto, string updatedUser, CancellationToken ct = default);

        Task DeleteCustomerGroupMemberAsync(int id, CancellationToken ct = default);
        Task<int> DeleteGroupAsync(int id, CancellationToken ct = default);

        // Customer Ledger methods
        Task<int> AddLedgerEntryAsync(CustomerLedgerAddDto dto, string createdBy, CancellationToken ct = default);
        Task UpdateLedgerEntryByOrderCodeAsync(string orderCode, CustomerLedgerUpdateDto dto, string updatedBy, CancellationToken ct = default);
        Task<(IEnumerable<CustomerLedgerDto> Items, int TotalCount)> GetLedgerAsync(CustomerLedgerListRequestDto request, CancellationToken ct = default);
        Task<CustomerBalanceDto?> GetCustomerBalanceAsync(int customerId, CancellationToken ct = default);
        Task<IEnumerable<CustomerBalanceDto>> GetAllCustomerBalancesAsync(CancellationToken ct = default);
        Task<decimal> GetCurrentBalanceAsync(int customerId, CancellationToken ct = default);
        Task<bool> CustomerExistsAsync(int customerId, CancellationToken ct = default);
        Task<int?> GetCustomerIdByNameAndPhoneAsync(string customerName, string phone, CancellationToken ct = default);
        Task<int> AddOrderPaymentAsync(CustomerOrderPaymentDto dto, string createdBy, CancellationToken ct = default);
        Task<CustomerDto?> GetCustomerByIdAsync(int customerId, CancellationToken ct = default);

    }
}
