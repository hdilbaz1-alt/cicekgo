namespace CicekGo.Application.Account;

public class AccountMeDto
{
    public int UserId { get; set; }
    public string Username { get; set; } = default!;
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? TenantName { get; set; }
    public List<string> Roles { get; set; } = new();
    public List<string> Permissions { get; set; } = new();
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = default!;
    public string NewPassword { get; set; } = default!;
}

public class UpdateProfileDto
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
}

public class DeleteAccountDto
{
    public string Password { get; set; } = default!;
}

public interface IAccountService
{
    Task<AccountMeDto> GetMeAsync(CancellationToken ct = default);
    Task ChangePasswordAsync(ChangePasswordDto dto, CancellationToken ct = default);
    Task<AccountMeDto> UpdateProfileAsync(UpdateProfileDto dto, CancellationToken ct = default);
    Task DeleteAccountAsync(DeleteAccountDto dto, CancellationToken ct = default);
}
