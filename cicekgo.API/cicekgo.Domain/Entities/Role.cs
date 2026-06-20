using System.ComponentModel.DataAnnotations.Schema;

namespace cicekgo.Domain.Entities
{
    [Table("Role")]
    public class Role
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }
}