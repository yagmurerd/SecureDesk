namespace SecureDesk.Api.DTOs
{
    public class TicketResponseDto
    {
        public int Id { get; set; }

        public string Title { get; set; } = null!;

        public string Description { get; set; } = null!;

        public int UserId { get; set; }

        public string UserName { get; set; } = null!;

        public int? AssignedToUserId { get; set; }

        public string? AssignedToUserName { get; set; }

        public int CategoryId { get; set; }

        public string CategoryName { get; set; } = null!;

        public int PriorityId { get; set; }

        public string PriorityName { get; set; } = null!;

        public int StatusId { get; set; }

        public string StatusName { get; set; } = null!;

        public DateTime CreatedAt { get; set; }

        public DateTime? ClosedAt { get; set; }
    }
}