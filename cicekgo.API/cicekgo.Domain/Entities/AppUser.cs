namespace cicekgo.Domain.Entities;

public class AppUser
{
    public int Id { get; set; }
    public string UserName { get; set; } = default!;
    public string? Email { get; set; }
    public byte[] PasswordHash { get; set; } = default!;
    public byte[] PasswordSalt { get; set; } = default!;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}
