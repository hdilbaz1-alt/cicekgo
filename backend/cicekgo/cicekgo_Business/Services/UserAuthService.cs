using System;
using System.Threading.Tasks;
using cicekgo_Core.Dto;
using cicekgo_Core.Requests;
using cicekgo_Data.Repositories;

namespace cicekgo_Business.Services
{
    public class UserAuthService : IUserAuthService
    {
        private readonly IUserAuthRepository _repo;
        public UserAuthService(IUserAuthRepository repo)
        {
            _repo = repo;
        }

        public Task<LoginResultDto> LoginAsync(LoginRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.UserName) || string.IsNullOrWhiteSpace(req.Password))
                throw new ArgumentException("Kullanıcı adı ve şifre zorunlu.");
            return _repo.LoginAsync(req);
        }
    }
}
