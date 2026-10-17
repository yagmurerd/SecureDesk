
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureDesk.Api.Models;
using System.Security.Claims;

namespace SecureDesk.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = "Admin,IT Staff")]
    [Route("api/[controller]")]
    public class TicketHistoriesController : ControllerBase
    {
        private readonly SecureDeskDbContext _context;

        public TicketHistoriesController(
            SecureDeskDbContext context)
        {
            _context = context;
        }

        [HttpGet("ticket/{ticketId:int}")]
        public async Task<IActionResult> GetTicketHistory(
            int ticketId)
        {
            var ticketExists = await _context.Tickets
                .AnyAsync(t => t.Id == ticketId);

            if (!ticketExists)
                return NotFound("Ticket bulunamadı.");

            var history = await _context.TicketHistories
                .Where(h => h.TicketId == ticketId)
                .OrderByDescending(h => h.CreatedAt)
                .Select(h => new
                {
                    h.Id,
                    h.TicketId,
                    h.UserId,
                    UserName = h.User.FirstName
                        + " " + h.User.LastName,
                    h.Action,
                    h.OldValue,
                    h.NewValue,
                    h.CreatedAt
                })
                .ToListAsync();

            return Ok(history);
        }
    }
}

