namespace CicekGo.Application.Admin;

public class CreateTenantRequestDto
{
    public string Name { get; set; } = default!;
    public string Slug { get; set; } = default!;          // db adı türetmek için (a-z0-9_)
    public DateTime? LicenseStartUtc { get; set; }
    public DateTime? LicenseEndUtc { get; set; }

    // İlk firma admin kullanıcısı
    public string AdminUsername { get; set; } = default!;
    public string AdminPassword { get; set; } = default!;
    public string? AdminEmail { get; set; }
    public string? AdminFullName { get; set; }
}

public class UpdateTenantRequestDto
{
    public string? Name { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? LicenseStartUtc { get; set; }
    public DateTime? LicenseEndUtc { get; set; }
}

public class TenantDto
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string Slug { get; set; } = default!;
    public string DbName { get; set; } = default!;
    public bool IsActive { get; set; }
    public DateTime? LicenseStartUtc { get; set; }
    public DateTime? LicenseEndUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class CreateUserRequestDto
{
    public string Username { get; set; } = default!;
    public string Password { get; set; } = default!;
    public string? Email { get; set; }
    public string? FullName { get; set; }
    public List<int> RoleIds { get; set; } = new();
}

public class UpdateUserRequestDto
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public bool? IsActive { get; set; }
    public string? NewPassword { get; set; }          // doluysa şifre sıfırlanır
    public List<int>? RoleIds { get; set; }           // null değilse roller değiştirilir (yetki kısma)
}

public class PermissionDto
{
    public string Code { get; set; } = default!;
    public string? Description { get; set; }
}

public class UserDto
{
    public int Id { get; set; }
    public int? TenantId { get; set; }
    public string Username { get; set; } = default!;
    public string? Email { get; set; }
    public string? FullName { get; set; }
    public bool IsActive { get; set; }
    public bool IsPlatformAdmin { get; set; }
    public List<RoleDto> Roles { get; set; } = new();
}

public class RoleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public bool IsSystem { get; set; }
    public List<string> Permissions { get; set; } = new();
}

public class CreateRoleRequestDto
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public List<string> Permissions { get; set; } = new();
}
