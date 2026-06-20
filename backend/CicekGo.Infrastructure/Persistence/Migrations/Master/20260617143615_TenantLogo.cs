using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CicekGo.Infrastructure.Persistence.Migrations.Master
{
    /// <inheritdoc />
    public partial class TenantLogo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "logo_base64",
                table: "tenants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "logo_remove_bg",
                table: "tenants",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "logo_base64",
                table: "tenants");

            migrationBuilder.DropColumn(
                name: "logo_remove_bg",
                table: "tenants");
        }
    }
}
