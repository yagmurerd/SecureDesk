using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureDesk.Api.Models;
using SecureDesk.Api.DTOs;
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;

namespace SecureDesk.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Authorize(Roles = "Admin")]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly SecureDeskDbContext _context;

        public UsersController(SecureDeskDbContext context)
        {
            _context = context;
        }

        [Authorize(Roles = "Admin,IT Staff")]
        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new UserResponseDto
                {
                    Id = u.Id,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    RoleId = u.RoleId,
                    RoleName = u.Role != null ? u.Role.Name : null
                })
                .ToListAsync();

            return Ok(users);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateUser(CreateUserDto userDto)
        {
            if (string.IsNullOrWhiteSpace(userDto.FirstName) ||
    string.IsNullOrWhiteSpace(userDto.LastName) ||
    string.IsNullOrWhiteSpace(userDto.Email) ||
    string.IsNullOrWhiteSpace(userDto.Password))
                userDto.Email = userDto.Email.Trim().ToLowerInvariant();
            {
                return BadRequest("Ad, soyad, e-posta ve şifre zorunludur.");
            }

            if (userDto.Password.Length < 8)
            {
                return BadRequest("Şifre en az 8 karakter olmalıdır.");
            }
            var normalizedEmail = userDto.Email.Trim().ToLowerInvariant();

            var emailExists = await _context.Users
                .AnyAsync(u => u.Email.ToLower() == normalizedEmail);

            if (emailExists)
            {
                return Conflict("Bu e-posta adresi zaten kayıtlı.");
            }

            var roleExists = await _context.Roles
                .AnyAsync(r => r.Id == userDto.RoleId);

            if (!roleExists)
            {
                return BadRequest("Geçersiz rol.");
            }

    
   

            if (!roleExists)
            {
                return BadRequest("Geçersiz rol.");
            }
            var user = new User
            {
                FirstName = userDto.FirstName,
                LastName = userDto.LastName,
                Email = userDto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(userDto.Password),
                RoleId = userDto.RoleId
            };

            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            var response = new UserResponseDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                RoleId = user.RoleId
            };

            return CreatedAtAction(nameof(GetUsers), new { id = user.Id }, response);
        }

    }
}