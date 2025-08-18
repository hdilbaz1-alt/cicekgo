using cicekgo_Core.Dto;
using cicekgo_Core.Requests;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo_Data.Repositories
{
    public interface IUserAuthRepository
    {
        Task<LoginResultDto> LoginAsync(LoginRequest req);
    }
}
