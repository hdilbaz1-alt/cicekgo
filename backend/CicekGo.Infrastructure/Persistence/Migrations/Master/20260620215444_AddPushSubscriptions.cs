using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CicekGo.Infrastructure.Persistence.Migrations.Master
{
    /// <inheritdoc />
    public partial class AddPushSubscriptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "push_subscriptions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    tenant_id = table.Column<int>(type: "integer", nullable: true),
                    endpoint = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    p256dh = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    auth = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    user_agent = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_seen_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_push_subscriptions", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_push_subscriptions_endpoint",
                table: "push_subscriptions",
                column: "endpoint",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_push_subscriptions_tenant_id",
                table: "push_subscriptions",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "ix_push_subscriptions_user_id",
                table: "push_subscriptions",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "push_subscriptions");
        }
    }
}
