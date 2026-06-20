using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace cicekgo.Domain.Entities
{
    [Table("Tenant")]
    public class Tenant
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string DatabaseName { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}