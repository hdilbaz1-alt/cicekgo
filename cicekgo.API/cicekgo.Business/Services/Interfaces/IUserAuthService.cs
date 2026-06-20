using cicekgo.Core.Auth.Dtos;

namespace cicekgo.Business.Services.Interfaces;

public interface IUserAuthService
{
    Task<LoginResultDto> LoginAsync(LoginRequestDto request);
}
