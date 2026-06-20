namespace cicekgo.Core.Customers.Dtos
{
    public class CustomerGroupListItemDto
    {
        public int Id { get; set; }
        public string GroupName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
