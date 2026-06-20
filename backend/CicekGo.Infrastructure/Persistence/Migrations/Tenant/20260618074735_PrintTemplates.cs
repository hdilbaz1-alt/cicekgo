using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CicekGo.Infrastructure.Persistence.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class PrintTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "print_templates",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    template_type = table.Column<string>(type: "text", nullable: false),
                    paper_type = table.Column<string>(type: "text", nullable: false),
                    rotation = table.Column<string>(type: "text", nullable: false),
                    theme = table.Column<string>(type: "text", nullable: false),
                    style = table.Column<string>(type: "text", nullable: false),
                    is_default = table.Column<bool>(type: "boolean", nullable: false),
                    show_order_code = table.Column<bool>(type: "boolean", nullable: false),
                    show_created_date = table.Column<bool>(type: "boolean", nullable: false),
                    show_price = table.Column<bool>(type: "boolean", nullable: false),
                    show_payment_status = table.Column<bool>(type: "boolean", nullable: false),
                    show_extra_note = table.Column<bool>(type: "boolean", nullable: false),
                    show_recipient_phone = table.Column<bool>(type: "boolean", nullable: false),
                    show_sender_phone = table.Column<bool>(type: "boolean", nullable: false),
                    show_qr = table.Column<bool>(type: "boolean", nullable: false),
                    note_font = table.Column<string>(type: "text", nullable: false),
                    note_bold = table.Column<bool>(type: "boolean", nullable: false),
                    note_font_style = table.Column<string>(type: "text", nullable: false),
                    note_font_size = table.Column<int>(type: "integer", nullable: false),
                    note_color = table.Column<string>(type: "text", nullable: false),
                    card_size = table.Column<string>(type: "text", nullable: false),
                    note_content = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_print_templates", x => x.id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "print_templates");
        }
    }
}
