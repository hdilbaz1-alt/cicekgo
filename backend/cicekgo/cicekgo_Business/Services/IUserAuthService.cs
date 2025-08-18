using cicekgo_Core.Dto;
using cicekgo_Core.Requests;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo_Business.Services
{
    public interface IUserAuthService
    {
        Task<LoginResultDto> LoginAsync(LoginRequest req);
    }
}
