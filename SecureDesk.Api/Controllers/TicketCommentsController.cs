using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureDesk.Api.DTOs;
using SecureDesk.Api.Models;

namespace SecureDesk.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TicketCommentsController : ControllerBase
    {
        private readonly SecureDeskDbContext _context;

        public TicketCommentsController(SecureDeskDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateComment(CreateTicketCommentDto dto)
        {
            var ticket = await _context.Tickets.FindAsync(dto.TicketId);

            if (ticket == null)
                return NotFound("Ticket bulunamadı.");

            var user = await _context.Users.FindAsync(dto.UserId);

            if (user == null)
                return NotFound("Kullanıcı bulunamadı.");

            if (string.IsNullOrWhiteSpace(dto.Comment))
                return BadRequest("Yorum boş olamaz.");

            var comment = new TicketComment
            {
                TicketId = dto.TicketId,
                UserId = dto.UserId,
                Comment = dto.Comment,
                CreatedAt = DateTime.Now
            };

            _context.TicketComments.Add(comment);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                comment.Id,
                comment.TicketId,
                comment.UserId,
                comment.Comment,
                comment.CreatedAt
            });
        }

        [HttpGet("ticket/{ticketId}")]
        public async Task<IActionResult> GetComments(int ticketId)
        {
            var comments = await _context.TicketComments
                .Where(c => c.TicketId == ticketId)
                .Select(c => new
                {
                    c.Id,
                    c.TicketId,
                    c.UserId,
                    UserName = c.User.FirstName + " " + c.User.LastName,
                    c.Comment,
                    c.CreatedAt
                })
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();

            return Ok(comments);
        }
    }
}
