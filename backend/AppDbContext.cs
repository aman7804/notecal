using backend.Model;
using Microsoft.EntityFrameworkCore;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<DayNotes> DayNotes => Set<DayNotes>();
    public DbSet<Note> Notes => Set<Note>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<DayNotes>()
            .HasIndex(d => d.Date)
            .IsUnique();

        modelBuilder.Entity<DayNotes>()
            .HasMany(d => d.Notes)
            .WithOne(n => n.DayNotes)
            .HasForeignKey(n => n.DayNotesId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
