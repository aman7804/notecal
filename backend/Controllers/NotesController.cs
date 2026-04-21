namespace backend.Controllers
{
    using backend.Model;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;

    [ApiController]
    [Route("api/[controller]")]
    public class NotesController(AppDbContext db) : ControllerBase
    {
        // GET api/notes/06-03-2026
        [HttpGet("{date}")]
        public async Task<IActionResult> GetByDate(string date)
        {
            if (!DateOnly.TryParseExact(date, "dd-MM-yyyy", out var parsedDate))
                return BadRequest("Invalid date format. Use DD-MM-YYYY.");

            var note = await db.Notes.FirstOrDefaultAsync(n => n.Date == parsedDate);

            if (note == null) return Ok(null);

            return Ok(new NoteDto(note.Id, note.Title, note.Text));
        }

        // PUT api/notes/06-03-2026  (upsert)
        [HttpPut("{date}")]
        public async Task<IActionResult> UpsertNote(string date, [FromBody] NotePayload payload)
        {
            if (!DateOnly.TryParseExact(date, "dd-MM-yyyy", out var parsedDate))
                return BadRequest("Invalid date format. Use DD-MM-YYYY.");

            var note = await db.Notes.FirstOrDefaultAsync(n => n.Date == parsedDate);

            if (note == null)
            {
                note = new Note
                {
                    Date = parsedDate,
                    Title = payload.Title ?? "",
                    Text = payload.Text ?? "",
                };
                db.Notes.Add(note);
            }
            else
            {
                note.Title = payload.Title ?? note.Title;
                note.Text = payload.Text ?? note.Text;
            }

            await db.SaveChangesAsync();
            return Ok(new NoteDto(note.Id, note.Title, note.Text));
        }

        // DELETE api/notes/06-03-2026
        [HttpDelete("{date}")]
        public async Task<IActionResult> DeleteNote(string date)
        {
            if (!DateOnly.TryParseExact(date, "dd-MM-yyyy", out var parsedDate))
                return BadRequest("Invalid date format. Use DD-MM-YYYY.");

            var note = await db.Notes.FirstOrDefaultAsync(n => n.Date == parsedDate);

            if (note == null) return NotFound("No note found for this date.");

            db.Notes.Remove(note);
            await db.SaveChangesAsync();
            return NoContent();
        }
    }

    // DTOs
    public record NoteDto(int Id, string Title, string Text);
    public record NotePayload(string? Title, string? Text);
}