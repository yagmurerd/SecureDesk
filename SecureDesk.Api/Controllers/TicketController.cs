using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureDesk.Api.Models;
using SecureDesk.Api.DTOs;


namespace SecureDesk.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketsController : ControllerBase
    {
        private readonly SecureDeskDbContext _context;

        public TicketsController(SecureDeskDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetTickets()
        {
            var tickets = await _context.Tickets
    .Select(t => new TicketResponseDto
    {
        Id = t.Id,
        Title = t.Title,
        Description = t.Description,

        UserId = t.UserId,
        UserName = t.User.FirstName + " " + t.User.LastName,

        AssignedToUserId = t.AssignedToUserId,
        AssignedToUserName = t.AssignedToUser != null
            ? t.AssignedToUser.FirstName + " " + t.AssignedToUser.LastName
            : null,

        CategoryId = t.CategoryId,
        CategoryName = t.Category.Name,

        PriorityId = t.PriorityId,
        PriorityName = t.Priority.Name,

        StatusId = t.StatusId,
        StatusName = t.Status.Name,

        CreatedAt = t.CreatedAt,
        ClosedAt = t.ClosedAt
    })
    .ToListAsync();

            return Ok(tickets);
        }

   

        [HttpPost]
        public async Task<IActionResult> CreateTicket(Ticket ticket)
        {
            ticket.CreatedAt = DateTime.Now;

            _context.Tickets.Add(ticket);

            await _context.SaveChangesAsync();

            return Ok(ticket);
        }


        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, UpdateTicketStatusDto dto)
        {
            var ticket = await _context.Tickets.FindAsync(id);

            if (ticket == null)
                return NotFound("Ticket bulunamadı.");

            var oldStatus = await _context.TicketStatuses
                .FindAsync(ticket.StatusId);

            var newStatus = await _context.TicketStatuses
                .FindAsync(dto.StatusId);

            if (newStatus == null)
                return BadRequest("Geçersiz statusId.");

            if (ticket.StatusId == dto.StatusId)
                return BadRequest("Ticket zaten bu durumda.");

            var history = new TicketHistory
            {
                TicketId = ticket.Id,
                UserId = ticket.UserId,
                Action = "Status Changed",
                OldValue = oldStatus?.Name,
                NewValue = newStatus.Name,
                CreatedAt = DateTime.Now
            };

            ticket.StatusId = dto.StatusId;

            _context.TicketHistories.Add(history);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                ticket.Id,
                ticket.Title,
                ticket.StatusId
            });
        }

        [HttpPut("{id}/assign")]
        public async Task<IActionResult> AssignTicket(int id, AssignTicketDto dto)
        {
            var ticket = await _context.Tickets.FindAsync(id);

            if (ticket == null)
                return NotFound("Ticket bulunamadı.");

            var user = await _context.Users.FindAsync(dto.AssignedToUserId);

            if (user == null)
                return NotFound("Atanacak kullanıcı bulunamadı.");

            var oldUser = ticket.AssignedToUserId.HasValue
                ? await _context.Users.FindAsync(ticket.AssignedToUserId.Value)
                : null;

            var history = new TicketHistory
            {
                TicketId = ticket.Id,
                UserId = ticket.UserId,
                Action = "Assigned",
                OldValue = oldUser != null
                    ? oldUser.FirstName + " " + oldUser.LastName
                    : "Unassigned",
                NewValue = user.FirstName + " " + user.LastName,
                CreatedAt = DateTime.Now
            };

            ticket.AssignedToUserId = dto.AssignedToUserId;

            if (ticket.StatusId == 1)
            {
                ticket.StatusId = 2;
            }

            _context.TicketHistories.Add(history);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                ticket.Id,
                ticket.Title,
                ticket.AssignedToUserId,
                AssignedToUser = user.FirstName + " " + user.LastName,
                ticket.StatusId
            });
        }
    }
}