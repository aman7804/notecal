using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class removedaynote : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notes_DayNotes_DayNotesId",
                table: "Notes");

            migrationBuilder.DropTable(
                name: "DayNotes");

            migrationBuilder.DropIndex(
                name: "IX_Notes_DayNotesId",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "DayNotesId",
                table: "Notes");

            migrationBuilder.AddColumn<DateOnly>(
                name: "Date",
                table: "Notes",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(1, 1, 1));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Date",
                table: "Notes");

            migrationBuilder.AddColumn<int>(
                name: "DayNotesId",
                table: "Notes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "DayNotes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Date = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DayNotes", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Notes_DayNotesId",
                table: "Notes",
                column: "DayNotesId");

            migrationBuilder.CreateIndex(
                name: "IX_DayNotes_Date",
                table: "DayNotes",
                column: "Date",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Notes_DayNotes_DayNotesId",
                table: "Notes",
                column: "DayNotesId",
                principalTable: "DayNotes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
