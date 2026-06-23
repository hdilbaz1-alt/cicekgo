namespace CicekGo.Application.Auth;

public interface IAuthService
{
    Task<LoginResultDto> LoginAsync(LoginRequestDto request, CancellationToken ct = default);
    Task<RefreshResultDto> RefreshAsync(string refreshToken, CancellationToken ct = default);
}
