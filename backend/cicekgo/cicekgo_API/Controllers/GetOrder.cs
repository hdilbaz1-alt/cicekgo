using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

using cicekgo_Business.Services;
using cicekgo_Core.Requests;

namespace cicekgo_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrdersController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        // ?? Basit liste (parametresiz): vw_FullOrderDetails'ten son 100 kayýt
        // GET /api/orders
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var rows = await _orderService.GetViewLatestAsync(100, null); // gerekirse sayýyý artýr
            return Ok(rows);
        }

        // Tek kayýt (Order_Id ile)
        // GET /api/orders/view/{orderId}
        [HttpGet("view/{orderId}")]
        public async Task<IActionResult> GetFromViewByOrderId(string orderId)
        {
            var row = await _orderService.GetViewByOrderIdAsync(orderId);
            return row == null ? (IActionResult)NotFound() : Ok(row);
        }

        // Opsiyonel filtreli liste (istersen kalsýn)
        // GET /api/orders/view?take=50&status=Beklemede
        [HttpGet("view")]
        public async Task<IActionResult> GetFromView([FromQuery] int take = 50, [FromQuery] string status = null)
        {
            if (take < 1 || take > 500) take = 50;
            var rows = await _orderService.GetViewLatestAsync(take, string.IsNullOrWhiteSpace(status) ? null : status);
            return Ok(rows);
        }

        // PUT /api/orders  ? Order_Id ile aggregate update
        [HttpPut]
        public async Task<IActionResult> Update([FromBody] OrderAggregateUpdateRequest req)
        {
            try
            {
                var ok = await _orderService.UpdateAggregateByOrderIdAsync(req);
                return ok ? Ok(new { message = "updated" }) : (IActionResult)NotFound("Order_Id bulunamadý.");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST /api/orders/full-create  ? Orders + baðlý tablolar (transaction)
        [HttpPost("full-create")]
        public async Task<IActionResult> FullCreate([FromBody] FullOrderCreateRequest req)
        {
            try
            {
                var newId = await _orderService.CreateFullOrderAsync(req);
                return CreatedAtAction(nameof(GetById), new { id = newId }, new { id = newId, orderId = req.Order_Id });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // CreatedAtAction için basit uç
        [HttpGet("{id:int}")]
        public IActionResult GetById(int id) => Ok(new { id });
    }
}
