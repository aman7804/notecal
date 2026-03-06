using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Model
{
    public class Note
    {
        [Key]
        public int Id { get; set; }
        public string Title { get; set; } = "";
        [Required]
        public string Text { get; set; } = "";
        [ForeignKey("DayNotes")]
        public int DayNotesId { get; set; }
        public DayNotes DayNotes { get; set; } = null!;
    }
}
