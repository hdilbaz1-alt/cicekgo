using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CicekGo.Infrastructure.Persistence.Migrations.Master
{
    /// <inheritdoc />
    public partial class UserSelfDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at_utc",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "deleted_at_utc",
                table: "users");
        }
    }
}
