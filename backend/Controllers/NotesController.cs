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

            var day = await db.DayNotes
                .Include(d => d.Notes)
                .FirstOrDefaultAsync(d => d.Date == parsedDate);

            if (day == null) return Ok(new List<NoteDto>());

            var result = day.Notes.Select(n => new NoteDto(n.Id, n.Title, n.Text));
            return Ok(result);
        }

        // POST api/notes/06-03-2026
        [HttpPost("{date}")]
        public async Task<IActionResult> AddNote(string date, [FromBody] NotePayload payload)
        {
            if (!DateOnly.TryParseExact(date, "dd-MM-yyyy", out var parsedDate))
                return BadRequest("Invalid date format. Use DD-MM-YYYY.");

            var day = await db.DayNotes
                .Include(d => d.Notes)
                .FirstOrDefaultAsync(d => d.Date == parsedDate);

            if (day == null)
            {
                day = new DayNotes { Date = parsedDate };
                db.DayNotes.Add(day);
            }

            var note = new Note
            {
                Title = payload.Title ?? "",
                Text = payload.Text ?? "",
                DayNotes = day
            };

            day.Notes.Add(note);
            await db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetByDate), new { date },
                new NoteDto(note.Id, note.Title, note.Text));
        }

        // PUT api/notes/06-03-2026/5
        [HttpPut("{date}/{noteId}")]
        public async Task<IActionResult> UpdateNote(string date, int noteId, [FromBody] NotePayload payload)
        {
            if (!DateOnly.TryParseExact(date, "dd-MM-yyyy", out var parsedDate))
                return BadRequest("Invalid date format. Use DD-MM-YYYY.");

            var day = await db.DayNotes
                .Include(d => d.Notes)
                .FirstOrDefaultAsync(d => d.Date == parsedDate);

            if (day == null) return NotFound("No notes found for this date.");

            var note = day.Notes.FirstOrDefault(n => n.Id == noteId);
            if (note == null) return NotFound("Note not found.");

            note.Title = payload.Title ?? note.Title;
            note.Text = payload.Text ?? note.Text;

            await db.SaveChangesAsync();
            return Ok(new NoteDto(note.Id, note.Title, note.Text));
        }

        // DELETE api/notes/06-03-2026/5
        [HttpDelete("{date}/{noteId}")]
        public async Task<IActionResult> DeleteNote(string date, int noteId)
        {
            if (!DateOnly.TryParseExact(date, "dd-MM-yyyy", out var parsedDate))
                return BadRequest("Invalid date format. Use DD-MM-YYYY.");

            var day = await db.DayNotes
                .Include(d => d.Notes)
                .FirstOrDefaultAsync(d => d.Date == parsedDate);

            if (day == null) return NotFound("No notes found for this date.");

            var note = day.Notes.FirstOrDefault(n => n.Id == noteId);
            if (note == null) return NotFound("Note not found.");

            // Don't allow deleting the last note
            if (day.Notes.Count == 1)
                return BadRequest("Cannot delete the only note for a day.");

            day.Notes.Remove(note);

            // Clean up DayNotes row if no notes remain (edge case)
            if (day.Notes.Count == 0)
                db.DayNotes.Remove(day);

            await db.SaveChangesAsync();
            return NoContent();
        }
    }

    // DTOs
    public record NoteDto(int Id, string Title, string Text);
    public record NotePayload(string? Title, string? Text);
}
