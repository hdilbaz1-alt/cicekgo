using CicekGo.Application.Abstractions;
using CicekGo.Application.Account;
using CicekGo.Application.Common;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class AccountService : IAccountService
{
    private readonly MasterDbContext _master;
    private readonly IPasswordHasher _hasher;
    private readonly ICurrentUser _current;

    public AccountService(MasterDbContext master, IPasswordHasher hasher, ICurrentUser current)
    {
        _master = master;
        _hasher = hasher;
        _current = current;
    }

    private async Task<Domain.Master.User> LoadAsync(CancellationToken ct)
    {
        var id = _current.UserId ?? throw new ForbiddenException("Oturum gerekli.");
        return await _master.Users.Include(u => u.Tenant).Include(u => u.UserRoles).ThenInclude(r => r.Role)
            .FirstOrDefaultAsync(u => u.Id == id, ct) ?? throw new NotFoundException("kullanıcı bulunamadı");
    }

    public async Task<AccountMeDto> GetMeAsync(CancellationToken ct = default)
    {
        var u = await LoadAsync(ct);
        return new AccountMeDto
        {
            UserId = u.Id, Username = u.Username, FullName = u.FullName, Email = u.Email,
            TenantName = u.Tenant?.Name,
            CreatedAtUtc = u.CreatedAtUtc,
            LastLoginAtUtc = u.LastLoginAtUtc,
            LkStart = u.Tenant?.LicenseStartUtc,
            LkEnd = u.Tenant?.LicenseEndUtc,
            Roles = u.UserRoles.Select(r => r.Role!.Name).ToList(),
            Permissions = _current.Permissions.ToList(),
        };
    }

    public async Task ChangePasswordAsync(ChangePasswordDto dto, CancellationToken ct = default)
    {
        var u = await LoadAsync(ct);
        if (!_hasher.Verify(dto.CurrentPassword ?? "", u.PasswordHash))
            throw new AppException("Mevcut şifre hatalı.");
        if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 6)
            throw new AppException("Yeni şifre en az 6 karakter olmalı.");
        u.PasswordHash = _hasher.Hash(dto.NewPassword);
        await _master.SaveChangesAsync(ct);
    }

    public async Task<AccountMeDto> UpdateProfileAsync(UpdateProfileDto dto, CancellationToken ct = default)
    {
        var u = await LoadAsync(ct);
        if (dto.FullName is not null) u.FullName = dto.FullName.Trim();
        if (dto.Email is not null) u.Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim();
        await _master.SaveChangesAsync(ct);
        return await GetMeAsync(ct);
    }

    public async Task DeleteAccountAsync(DeleteAccountDto dto, CancellationToken ct = default)
    {
        var u = await LoadAsync(ct);
        if (!_hasher.Verify(dto.Password ?? "", u.PasswordHash))
            throw new AppException("Şifre hatalı.");
        // Soft-delete: girişi engelle + kişisel verileri temizle
        u.IsActive = false;
        u.DeletedAtUtc = DateTime.UtcNow;
        u.Email = null;
        u.FullName = null;
        u.Username = $"deleted_{u.Id}_{DateTime.UtcNow:yyyyMMddHHmmss}";
        await _master.SaveChangesAsync(ct);
    }
}
