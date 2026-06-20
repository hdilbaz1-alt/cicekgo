using System.ComponentModel.DataAnnotations.Schema;

namespace cicekgo.Domain.Entities
{
    [Table("SpecialRole")]
    public class SpecialRole
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }
}