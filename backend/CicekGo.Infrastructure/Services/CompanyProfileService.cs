using CicekGo.Application.Abstractions;
using CicekGo.Application.Common;
using CicekGo.Application.Tenants;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class CompanyProfileService : ICompanyProfileService
{
    private readonly MasterDbContext _master;
    private readonly ICurrentUser _current;
    private readonly ITenantConnectionResolver _resolver;

    public CompanyProfileService(MasterDbContext master, ICurrentUser current, ITenantConnectionResolver resolver)
    {
        _master = master;
        _current = current;
        _resolver = resolver;
    }

    public async Task<CompanyProfileDto> GetAsync(CancellationToken ct = default)
    {
        var tid = _current.TenantId ?? throw new ForbiddenException("Firma bağlamı gerekli.");
        var t = await _master.Tenants.AsNoTracking().FirstOrDefaultAsync(x => x.Id == tid, ct)
            ?? throw new NotFoundException("firma bulunamadı");
        return new CompanyProfileDto { Name = t.Name, LogoBase64 = t.LogoBase64, LogoRemoveBg = t.LogoRemoveBg };
    }

    public async Task<CompanyProfileDto> UpdateAsync(CompanyProfileUpdateDto dto, CancellationToken ct = default)
    {
        var tid = _current.TenantId ?? throw new ForbiddenException("Firma bağlamı gerekli.");
        var t = await _master.Tenants.FirstOrDefaultAsync(x => x.Id == tid, ct)
            ?? throw new NotFoundException("firma bulunamadı");

        if (!string.IsNullOrWhiteSpace(dto.Name)) t.Name = dto.Name.Trim();
        if (dto.LogoBase64 is not null) t.LogoBase64 = dto.LogoBase64 == "" ? null : dto.LogoBase64;
        if (dto.LogoRemoveBg.HasValue) t.LogoRemoveBg = dto.LogoRemoveBg.Value;
        t.UpdatedAtUtc = DateTime.UtcNow;
        await _master.SaveChangesAsync(ct);
        _resolver.Invalidate(tid);

        return new CompanyProfileDto { Name = t.Name, LogoBase64 = t.LogoBase64, LogoRemoveBg = t.LogoRemoveBg };
    }
}
