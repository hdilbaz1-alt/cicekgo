using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using cicekgo.Business.Common.Interfaces;
using cicekgo.Business.Services.Interfaces;
using cicekgo.Core.Common;
using cicekgo.Core.Customers.Dtos;
using cicekgo.Business.Services.Implementations;

namespace cicekgo.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CustomerLedgerController : ControllerBase
    {
        private readonly ICustomerService _service;
        private readonly ICurrentUser _current;

        public CustomerLedgerController(ICustomerService service, ICurrentUser current)
        {
            _service = service;
            _current = current;
        }

        // GET api/customerledger/balance/{customerId}
        [HttpGet("balance/{customerId:int}")]
        public async Task<ActionResult<ApiResponse<CustomerBalanceDto?>>> GetCustomerBalance(int customerId, CancellationToken ct)
        {
            try
            {
                var balance = await _service.GetCustomerBalanceAsync(customerId, ct);
                if (balance == null)
                    return NotFound(ApiResponse<CustomerBalanceDto?>.Fail("Customer not found", 404));

                return Ok(ApiResponse<CustomerBalanceDto?>.Ok(balance));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<CustomerBalanceDto?>.Fail("unexpected error: " + ex.Message, 500));
            }
        }

        // GET api/customerledger/balances
        [HttpGet("balances")]
        public async Task<ActionResult<ApiResponse<IEnumerable<CustomerBalanceDto>>>> GetAllCustomerBalances(CancellationToken ct)
        {
            try
            {
                var balances = await _service.GetAllCustomerBalancesAsync(ct);
                return Ok(ApiResponse<IEnumerable<CustomerBalanceDto>>.Ok(balances));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<IEnumerable<CustomerBalanceDto>>.Fail("unexpected error: " + ex.Message, 500));
            }
        }

        // POST api/customerledger/list
        [HttpPost("list")]
        public async Task<ActionResult<ApiResponse<object>>> GetLedger([FromBody] CustomerLedgerListRequestDto request, CancellationToken ct)
        {
            try
            {
                if (request.CustomerId <= 0)
                    return BadRequest(ApiResponse<object>.Fail("Invalid CustomerId", 400));

                var (items, total) = await _service.GetLedgerAsync(request, ct);
                return Ok(ApiResponse<object>.Ok(new { total, items }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.Fail("unexpected error: " + ex.Message, 500));
            }
        }

        // POST api/customerledger/payment
        [HttpPost("payment")]
        public async Task<ActionResult<ApiResponse<int>>> AddPayment([FromBody] CustomerPaymentDto dto, CancellationToken ct)
        {
            try
            {
                if (dto.CustomerId <= 0)
                    return BadRequest(ApiResponse<int>.Fail("Invalid CustomerId", 400));

                if (dto.Amount <= 0)
                    return BadRequest(ApiResponse<int>.Fail("Amount must be greater than 0", 400));

                var user = _current.UserName ?? "system";
                var id = await _service.AddCustomerPaymentAsync(dto, user, ct);
                return Ok(ApiResponse<int>.Ok(id));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<int>.Fail("unexpected error: " + ex.Message, 500));
            }
        }

        // POST api/customerledger/order-payment
        [HttpPost("order-payment")]
        public async Task<ActionResult<ApiResponse<int>>> AddOrderPayment([FromBody] CustomerOrderPaymentDto dto, CancellationToken ct)
        {
            try
            {
                if (dto.CustomerId <= 0)
                    return BadRequest(ApiResponse<int>.Fail("Invalid CustomerId", 400));

                if (string.IsNullOrWhiteSpace(dto.OrderCode))
                    return BadRequest(ApiResponse<int>.Fail("OrderCode is required", 400));

                if (dto.Amount <= 0)
                    return BadRequest(ApiResponse<int>.Fail("Amount must be greater than 0", 400));

                var user = _current.UserName ?? "system";
                var id = await _service.AddOrderPaymentAsync(dto, user, ct);
                return Ok(ApiResponse<int>.Ok(id));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponse<int>.Fail(ex.Message, 400));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<int>.Fail("unexpected error: " + ex.Message, 500));
            }
        }

        // POST api/customerledger/entry
        [HttpPost("entry")]
        public async Task<ActionResult<ApiResponse<int>>> AddLedgerEntry([FromBody] CustomerLedgerAddDto dto, CancellationToken ct)
        {
            try
            {
                if (dto.CustomerId <= 0)
                    return BadRequest(ApiResponse<int>.Fail("Invalid CustomerId", 400));

                if (string.IsNullOrWhiteSpace(dto.TransactionType))
                    return BadRequest(ApiResponse<int>.Fail("TransactionType is required", 400));

                var user = _current.UserName ?? "system";
                var id = await _service.AddLedgerEntryAsync(dto, user, ct);
                return Ok(ApiResponse<int>.Ok(id));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<int>.Fail("unexpected error: " + ex.Message, 500));
            }
        }


    }
}
