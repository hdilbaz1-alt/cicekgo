using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CicekGo.Infrastructure.Persistence.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class StatusColorAndNonCariRefund : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "customer_id",
                table: "refunds",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<string>(
                name: "recipient_name",
                table: "refunds",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "recipient_phone",
                table: "refunds",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "color",
                table: "order_statuses",
                type: "character varying(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_system",
                table: "order_statuses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "ix_refunds_recipient_phone",
                table: "refunds",
                column: "recipient_phone");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_refunds_recipient_phone",
                table: "refunds");

            migrationBuilder.DropColumn(
                name: "recipient_name",
                table: "refunds");

            migrationBuilder.DropColumn(
                name: "recipient_phone",
                table: "refunds");

            migrationBuilder.DropColumn(
                name: "color",
                table: "order_statuses");

            migrationBuilder.DropColumn(
                name: "is_system",
                table: "order_statuses");

            migrationBuilder.AlterColumn<int>(
                name: "customer_id",
                table: "refunds",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
