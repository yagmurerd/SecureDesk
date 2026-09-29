namespace SecureDesk.Api.DTOs
{
    public class CreateTicketDto
    {
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public int UserId { get; set; }
        public int CategoryId { get; set; }
        public int PriorityId { get; set; }
    }
}
