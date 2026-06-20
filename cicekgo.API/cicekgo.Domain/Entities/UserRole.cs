using System.ComponentModel.DataAnnotations.Schema;

namespace cicekgo.Domain.Entities
{
    [Table("UserRole")]
    public class UserRole
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int RoleId { get; set; }
        public Role Role { get; set; } // Navigasyon özelliği
    }
}