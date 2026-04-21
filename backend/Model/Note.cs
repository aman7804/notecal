using System.ComponentModel.DataAnnotations;

namespace backend.Model
{
    public class Note
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public DateOnly Date { get; set; }

        public string Title { get; set; } = "";

        [Required]
        public string Text { get; set; } = "";
    }
}