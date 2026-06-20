namespace CicekGo.Application.Customers;

public class CustomerGroupListItemDto
{
    public int Id { get; set; }
    public string GroupName { get; set; } = default!;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CustomerGroupAddDto
{
    public string GroupName { get; set; } = default!;
    public string? Description { get; set; }
}

public class CustomerGroupMemberAddDto
{
    public int GroupId { get; set; }
    public int CustomerId { get; set; }
}

public class CustomerGroupMemberListDto
{
    public int Id { get; set; }
    public int GroupId { get; set; }
    public string GroupName { get; set; } = default!;
    public string? Description { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = default!;
}
