using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Model
{
    public class Note
    {
        public int Id { get; set; }
        public DateOnly Date { get; set; }
        public string Title { get; set; } = "";
        public string Text { get; set; } = "";
    }
}