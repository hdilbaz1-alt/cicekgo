using cicekgo.Business.Services.Interfaces;
using cicekgo.Core.Customers.Dtos;
using cicekgo.Data.Repositories.Interfaces;
using cicekgo.Domain.Entities;
using Dapper;

namespace cicekgo.Business.Services.Implementations
{
    public class CustomerService : ICustomerService
    {
        private readonly ICustomerRepository _repo;

        public CustomerService(ICustomerRepository repo)
        {
            _repo = repo;
        }

        public Task<int> AddAsync(CustomerAddDto dto, string createdUser, CancellationToken ct = default)
            => _repo.CreateAsync(dto, createdUser, ct);

        public Task<(IEnumerable<CustomerListItemDto> Items, int TotalCount)> ListAsync(
            string? search, int page, int pageSize, CancellationToken ct = default)
            => _repo.ListAsync(search, page, pageSize, ct);

        public Task UpdateAsync(CustomerUpdateDto dto, string updatedUser, CancellationToken ct = default)
            => _repo.UpdateAsync(dto, updatedUser, ct);

        public Task DeleteAsync(int customerId, CancellationToken ct = default)
            => _repo.DeleteCascadeAsync(customerId, ct);

        public Task<IEnumerable<CustomerGroupListItemDto>> GetGroupsAsync(CancellationToken ct = default)
     => _repo.GetGroupsAsync(ct);

        public Task<int> CreateGroupAsync(CustomerGroupAddDto dto, string createdUser, CancellationToken ct = default)
    => _repo.CreateGroupAsync(dto, createdUser, ct);

        public Task AddCustomerToGroupAsync(CustomerGroupMemberAddDto dto, string createdUser, CancellationToken ct = default)
            => _repo.AddCustomerToGroupAsync(dto, createdUser, ct);

        public Task<(IEnumerable<CustomerGroupMemberListDto> Items, int TotalCount)> ListCustomerGroupMembersAsync(
    string? search, int page, int pageSize, CancellationToken ct = default)
    => _repo.ListCustomerGroupMembersAsync(search, page, pageSize, ct);

        public Task UpdateCustomerGroupMemberAsync(CustomerGroupMemberUpdateDto dto, string updatedUser, CancellationToken ct = default)
            => _repo.UpdateCustomerGroupMemberAsync(dto, updatedUser, ct);

        public Task DeleteCustomerGroupMemberAsync(int id, CancellationToken ct = default)
            => _repo.DeleteCustomerGroupMemberAsync(id, ct);

        public Task<int> DeleteGroupAsync(int id, CancellationToken ct = default)
    => _repo.DeleteGroupAsync(id, ct);

        // Customer Ledger methods
        public Task<int> AddLedgerEntryAsync(CustomerLedgerAddDto dto, string createdBy, CancellationToken ct = default)
            => _repo.AddLedgerEntryAsync(dto, createdBy, ct);

        public Task UpdateLedgerEntryByOrderCodeAsync(string orderCode, CustomerLedgerUpdateDto dto, string updatedBy, CancellationToken ct = default)
            => _repo.UpdateLedgerEntryByOrderCodeAsync(orderCode, dto, updatedBy, ct);

        public Task<(IEnumerable<CustomerLedgerDto> Items, int TotalCount)> GetLedgerAsync(CustomerLedgerListRequestDto request, CancellationToken ct = default)
            => _repo.GetLedgerAsync(request, ct);

        public Task<CustomerBalanceDto?> GetCustomerBalanceAsync(int customerId, CancellationToken ct = default)
            => _repo.GetCustomerBalanceAsync(customerId, ct);

        public Task<IEnumerable<CustomerBalanceDto>> GetAllCustomerBalancesAsync(CancellationToken ct = default)
            => _repo.GetAllCustomerBalancesAsync(ct);

        public async Task<int> AddCustomerPaymentAsync(CustomerPaymentDto dto, string createdBy, CancellationToken ct = default)
        {
            var ledgerDto = new CustomerLedgerAddDto
            {
                CustomerId = dto.CustomerId,
                TransactionType = "PAYMENT",
                Description = dto.Description ?? $"Ödeme - {dto.Amount:C}",
                Debit = 0,
                Credit = dto.Amount,
                ReferenceType = "PAYMENT"
            };

            return await _repo.AddLedgerEntryAsync(ledgerDto, createdBy, ct);
        }

        public Task<bool> CustomerExistsAsync(int customerId, CancellationToken ct = default)
            => _repo.CustomerExistsAsync(customerId, ct);

        public Task<int?> GetCustomerIdByNameAndPhoneAsync(string customerName, string phone, CancellationToken ct = default)
            => _repo.GetCustomerIdByNameAndPhoneAsync(customerName, phone, ct);

        public Task<int> AddOrderPaymentAsync(CustomerOrderPaymentDto dto, string createdBy, CancellationToken ct = default)
            => _repo.AddOrderPaymentAsync(dto, createdBy, ct);

        public Task<CustomerDto?> GetCustomerByIdAsync(int customerId, CancellationToken ct = default)
            => _repo.GetCustomerByIdAsync(customerId, ct);





    }
}
