namespace CicekGo.Application.Auth;

public class LoginRequestDto
{
    public string UserName { get; set; } = default!;
    public string Password { get; set; } = default!;
}

public class RoleItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
}

public class LoginResultDto
{
    public string Token { get; set; } = default!;
    public DateTime ExpiresAt { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = default!;
    public int? TenantId { get; set; }
    public List<RoleItemDto> Roles { get; set; } = new();
    public List<RoleItemDto> SpecialRoles { get; set; } = new();  // permission-based modelde boş kalır (frontend uyumu)
    public List<string> Permissions { get; set; } = new();
}
