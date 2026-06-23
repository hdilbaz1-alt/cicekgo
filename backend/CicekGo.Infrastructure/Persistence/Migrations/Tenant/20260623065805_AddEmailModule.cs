using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CicekGo.Infrastructure.Persistence.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddEmailModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "recipient_email",
                table: "orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "sender_email",
                table: "orders",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "email_settings",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    from_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    from_email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    smtp_host = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    smtp_port = table.Column<int>(type: "integer", nullable: false),
                    smtp_security = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    smtp_username = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    smtp_password_enc = table.Column<string>(type: "text", nullable: false),
                    imap_host = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    imap_port = table.Column<int>(type: "integer", nullable: true),
                    imap_username = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    imap_password_enc = table.Column<string>(type: "text", nullable: true),
                    send_to_recipient = table.Column<bool>(type: "boolean", nullable: false),
                    send_to_sender = table.Column<bool>(type: "boolean", nullable: false),
                    is_verified = table.Column<bool>(type: "boolean", nullable: false),
                    verified_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    daily_limit = table.Column<int>(type: "integer", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_email_settings", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "email_templates",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    subject = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    design_json = table.Column<string>(type: "jsonb", nullable: true),
                    html_body = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_email_templates", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "order_status_email_triggers",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    order_status_id = table.Column<int>(type: "integer", nullable: false),
                    template_id = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_order_status_email_triggers", x => x.id);
                    table.ForeignKey(
                        name: "fk_order_status_email_triggers_email_templates_template_id",
                        column: x => x.template_id,
                        principalTable: "email_templates",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_order_status_email_triggers_order_statuses_order_status_id",
                        column: x => x.order_status_id,
                        principalTable: "order_statuses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_email_templates_name",
                table: "email_templates",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "ix_order_status_email_triggers_order_status_id",
                table: "order_status_email_triggers",
                column: "order_status_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_order_status_email_triggers_template_id",
                table: "order_status_email_triggers",
                column: "template_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "email_settings");

            migrationBuilder.DropTable(
                name: "order_status_email_triggers");

            migrationBuilder.DropTable(
                name: "email_templates");

            migrationBuilder.DropColumn(
                name: "recipient_email",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "sender_email",
                table: "orders");
        }
    }
}
