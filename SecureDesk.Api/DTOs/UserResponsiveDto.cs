namespace SecureDesk.Api.DTOs
{
    public class UserResponseDto
    {
        public int Id { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Email { get; set; }

        public int RoleId { get; set; }

        public string? RoleName { get; set; }
    }
}