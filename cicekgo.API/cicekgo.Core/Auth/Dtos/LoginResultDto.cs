namespace cicekgo.Core.Auth.Dtos
{
    public class LoginResultDto
    {
        public string Token { get; set; } = default!;
        public DateTime ExpiresAt { get; set; }

        public int UserId { get; set; }
        public string UserName { get; set; } = default!;

        public int TenantId { get; set; }

        // Eskisi string[] idi. Artık ID+Name dönüyoruz:
        public List<RoleItemDto> Roles { get; set; } = new();
        public List<RoleItemDto> SpecialRoles { get; set; } = new();
    }
}
