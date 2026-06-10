namespace backend.Model
{
    public class DayNotes
    {
        public int Id { get; set; }
        public DateOnly Date { get; set; }
        public ICollection<Note> Notes { get; set; } = [];
    }
}
