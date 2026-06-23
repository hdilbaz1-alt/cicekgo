namespace CicekGo.Application.Email;

// ---- Şablonlar ----
public class EmailTemplateDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Subject { get; set; } = "";
    public string? DesignJson { get; set; }
    public string HtmlBody { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; }
}

public class UpsertEmailTemplateDto
{
    public string Name { get; set; } = default!;
    public string Subject { get; set; } = default!;
    public string? DesignJson { get; set; }
    public string HtmlBody { get; set; } = default!;
    public bool IsActive { get; set; } = true;
}

public class PreviewRequestDto
{
    public string Subject { get; set; } = "";
    public string HtmlBody { get; set; } = "";
}
public class PreviewResultDto
{
    public string Subject { get; set; } = "";
    public string Html { get; set; } = "";
}

public class MergeTagDto
{
    public string Code { get; set; } = "";   // örn: order.code  ya da  loop:order.items
    public string Label { get; set; } = "";
    public string Insert { get; set; } = "";  // editöre eklenecek metin
}

// ---- Durum eşleştirmeleri ----
public class EmailTriggerDto
{
    public int OrderStatusId { get; set; }
    public string StatusName { get; set; } = "";
    public string? Color { get; set; }
    public int? TriggerId { get; set; }
    public int? TemplateId { get; set; }
    public string? TemplateName { get; set; }
    public bool IsActive { get; set; }
}
public class SetTriggerTemplateDto { public int? TemplateId { get; set; } }
public class SetTriggerActiveDto { public bool IsActive { get; set; } }

public interface IEmailTemplateService
{
    Task<IReadOnlyList<EmailTemplateDto>> ListAsync(CancellationToken ct = default);
    Task<EmailTemplateDto> CreateAsync(UpsertEmailTemplateDto dto, CancellationToken ct = default);
    Task<EmailTemplateDto> UpdateAsync(int id, UpsertEmailTemplateDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
    Task<PreviewResultDto> PreviewAsync(PreviewRequestDto dto, CancellationToken ct = default);
    IReadOnlyList<MergeTagDto> MergeTags();
}

public interface IEmailTriggerService
{
    Task<IReadOnlyList<EmailTriggerDto>> ListAsync(CancellationToken ct = default);
    Task SetTemplateAsync(int orderStatusId, int? templateId, CancellationToken ct = default);
    Task SetActiveAsync(int orderStatusId, bool isActive, CancellationToken ct = default);
}

/// <summary>Sipariş durumu değişince (commit sonrası) ilgili maili kuyruğa alır.</summary>
public interface IEmailDispatcher
{
    Task EnqueueForOrderStatusAsync(int orderId, CancellationToken ct = default);
}
