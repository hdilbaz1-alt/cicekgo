using System.ComponentModel.DataAnnotations.Schema;

namespace cicekgo.Domain.Entities
{
    [Table("UserSpecialRole")]
    public class UserSpecialRole
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int SpecialRoleId { get; set; }
        public SpecialRole SpecialRole { get; set; } // Navigasyon özelliği
    }
}