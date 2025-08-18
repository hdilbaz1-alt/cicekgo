using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using cicekgo_Business.Services;
using cicekgo_Core.Requests;

namespace cicekgo_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserAuthService _auth;

        public UserController(IUserAuthService auth)
        {
            _auth = auth;
        }

        // POST /api/User/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            try
            {
                var res = await _auth.LoginAsync(req);
                if (!res.Success) return Unauthorized(res); // 401
                return Ok(res);                             // 200
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);             // 400
            }
        }
    }
}
