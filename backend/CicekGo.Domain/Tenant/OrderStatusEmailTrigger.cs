namespace CicekGo.Domain.Tenant;

/// <summary>Sipariş durumu ↔ e-posta şablonu eşleştirmesi. İş kuralı: SMTP doğrulanmadan IsActive=true olamaz.</summary>
public class OrderStatusEmailTrigger
{
    public int Id { get; set; }
    public int OrderStatusId { get; set; }
    public OrderStatus? OrderStatus { get; set; }
    public int TemplateId { get; set; }
    public EmailTemplate? Template { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}
