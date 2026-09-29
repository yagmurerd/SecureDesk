using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecureDesk.Api.Models;
using SecureDesk.Api.DTOs;
using BCrypt.Net;

namespace SecureDesk.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly SecureDeskDbContext _context;

        public UsersController(SecureDeskDbContext context)
        {
            _context = context;
        }

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
                    RoleName = u.Role.Name
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser(CreateUserDto userDto)
        {
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