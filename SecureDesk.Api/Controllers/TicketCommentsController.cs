
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;
using SecureDesk.Api.DTOs;
using SecureDesk.Api.Models;
using System.Security.Claims;

namespace SecureDesk.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
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
            var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(userIdValue, out var userId))
                return Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.Comment))
                return BadRequest("Yorum boş olamaz.");

            var ticket = await _context.Tickets
                .FirstOrDefaultAsync(t => t.Id == dto.TicketId);

            if (ticket == null)
                return NotFound("Ticket bulunamadı.");

            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            if (role == "Employee" && ticket.UserId != userId)
                return Forbid();

            if (role != "Employee" &&
                role != "IT Staff" &&
                role != "Admin")
                return Forbid();

            var comment = new TicketComment
            {
                TicketId = ticket.Id,
                UserId = userId,
                Comment = dto.Comment.Trim(),
                CreatedAt = DateTime.UtcNow
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
            var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(userIdValue, out var userId))
                return Unauthorized();

            var ticket = await _context.Tickets
                .FirstOrDefaultAsync(t => t.Id == ticketId);

            if (ticket == null)
                return NotFound("Ticket bulunamadı.");

            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            if (role == "Employee" && ticket.UserId != userId)
                return Forbid();

            if (role != "Employee" &&
                role != "IT Staff" &&
                role != "Admin")
                return Forbid();

            var comments = await _context.TicketComments
                .Where(c => c.TicketId == ticketId)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id,
                    c.TicketId,
                    c.UserId,
                    UserName = c.User.FirstName + " " + c.User.LastName,
                    c.Comment,
                    c.CreatedAt
                })
                .ToListAsync();

            return Ok(comments);
        }
    }
}

