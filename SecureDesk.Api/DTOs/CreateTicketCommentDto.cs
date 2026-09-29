namespace SecureDesk.Api.DTOs
{
    public class CreateTicketCommentDto
    {
        public int TicketId { get; set; }
        public int UserId { get; set; }
        public string Comment { get; set; } = null!;
    }
}
