using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureDesk.Api.Models;
using SecureDesk.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;


namespace SecureDesk.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Authorize]
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
            var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(userIdValue, out var userId))
            {
                return Unauthorized("Kullanıcı kimliği doğrulanamadı.");

            }
            





            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            var query = _context.Tickets.AsQueryable();

            // Employee yalnızca kendi açtığı ticket'ları görebilir.
            if (role == "Employee")
            {
                query = query.Where(t => t.UserId == userId);
            }
            // Admin ve IT Staff şimdilik tüm ticket'ları görebilir.

            var tickets = await query
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




        [Authorize]



        [HttpPost]
        public async Task<IActionResult> CreateTicket(CreateTicketDto dto)
        {
            var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(userIdValue, out var userId))
            {
                return Unauthorized("Kullanıcı kimliği doğrulanamadı.");
            }

         
            if (string.IsNullOrWhiteSpace(dto.Title) ||
                string.IsNullOrWhiteSpace(dto.Description))
            {
                return BadRequest("Başlık ve açıklama boş bırakılamaz.");
            }

            var categoryExists = await _context.TicketCategories
                .AnyAsync(c => c.Id == dto.CategoryId);

           

            if (!categoryExists)
            {
                return BadRequest("Geçersiz kategori.");
            }

            var priorityExists = await _context.TicketPriorities
                .AnyAsync(p => p.Id == dto.PriorityId);

            if (!priorityExists)
            {
                return BadRequest("Geçersiz öncelik.");
            }

            var ticket = new Ticket
            {
                Title = dto.Title,
                Description = dto.Description,
                UserId = userId,
                CategoryId = dto.CategoryId,
                PriorityId = dto.PriorityId,
                StatusId = 1,
                CreatedAt = DateTime.UtcNow
            };

            _context.Tickets.Add(ticket);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetTickets),
                new { id = ticket.Id },
                new
                {
                    ticket.Id,
                    ticket.Title,
                    ticket.Description,
                    ticket.UserId,
                    ticket.CategoryId,
                    ticket.PriorityId,
                    ticket.StatusId,
                    ticket.CreatedAt
                });
        }



        [Authorize(Roles = "IT Staff,Admin")]

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, UpdateTicketStatusDto dto)
        {
            var currentUserId = int.Parse(
    User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

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
                UserId = currentUserId,
                Action = "Status Changed",
                OldValue = oldStatus?.Name,
                NewValue = newStatus.Name,
                CreatedAt = DateTime.UtcNow
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

        [Authorize(Roles = "IT Staff,Admin")]
        [HttpPut("{id}/assign")]
        public async Task<IActionResult> AssignTicket(int id, AssignTicketDto dto)
        {
            var currentUserId = int.Parse(
    User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

            var ticket = await _context.Tickets.FindAsync(id);

            if (ticket == null)
                return NotFound("Ticket bulunamadı.");

            var user = await _context.Users.FindAsync(dto.AssignedToUserId);

            if (user == null)
                return NotFound("Atanacak kullanıcı bulunamadı.");

            if (user.RoleId != 1 && user.RoleId != 2)
            {
                return BadRequest("Görev yalnızca IT Staff veya Admin kullanıcısına atanabilir.");
            }

            var oldUser = ticket.AssignedToUserId.HasValue
                ? await _context.Users.FindAsync(ticket.AssignedToUserId.Value)
                : null;

            var history = new TicketHistory
            {
                TicketId = ticket.Id,
                UserId = currentUserId,
                Action = "Assigned",
                OldValue = oldUser != null
                    ? oldUser.FirstName + " " + oldUser.LastName
                    : "Unassigned",
                NewValue = user.FirstName + " " + user.LastName,
                CreatedAt = DateTime.UtcNow
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