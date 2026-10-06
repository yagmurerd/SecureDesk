using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SecureDesk.Api.DTOs;
using SecureDesk.Api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using SecureDesk.Api.Services;


namespace SecureDesk.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly SecurityLogService _securityLogService;
        private readonly SecureDeskDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(
    SecureDeskDbContext context,
    IConfiguration configuration,
    SecurityLogService securityLogService)
        {
            _context = context;
            _configuration = configuration;
            _securityLogService = securityLogService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email);

            if (user == null)
            {
                await _securityLogService.LogAsync(
                    null,
                    "LoginFailed",
                    $"Başarısız giriş denemesi: {dto.Email}");

                return Unauthorized("E-posta veya şifre hatalı.");
            }

            bool passwordIsValid;

            try
            {
                passwordIsValid = BCrypt.Net.BCrypt.Verify(
                    dto.Password,
                    user.PasswordHash
                );
            }
            catch (BCrypt.Net.SaltParseException)
            {
                passwordIsValid = false;
            }

            if (!passwordIsValid)
            {
                await _securityLogService.LogAsync(
                    user.Id,
                    "LoginFailed",
                    "Hatalı şifreyle giriş denemesi.");

                return Unauthorized("E-posta veya şifre hatalı.");
            }

            var jwtKey = _configuration["Jwt:Key"];
            var jwtIssuer = _configuration["Jwt:Issuer"];
            var jwtAudience = _configuration["Jwt:Audience"];

            if (string.IsNullOrWhiteSpace(jwtKey) ||
                string.IsNullOrWhiteSpace(jwtIssuer) ||
                string.IsNullOrWhiteSpace(jwtAudience))
            {
                return StatusCode(
                    500,
                    "JWT yapılandırması eksik."
                );
            }


            var role = await _context.Roles
    .FirstOrDefaultAsync(r => r.Id == user.RoleId);

            if (role == null)
            {
                return StatusCode(500, "Kullanıcının rolü bulunamadı.");
            }

            var claims = new[]
            {
                new Claim(
                    ClaimTypes.NameIdentifier,
                    user.Id.ToString()
                ),
                new Claim(
                    ClaimTypes.Name,
                    $"{user.FirstName} {user.LastName}"
                ),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, role.Name)
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            );

            var credentials = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            );

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                notBefore: DateTime.UtcNow,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: credentials
            );

            var tokenString = new JwtSecurityTokenHandler()
                .WriteToken(token);

            await _securityLogService.LogAsync(
    user.Id,
    "LoginSuccess",
    "Kullanıcı başarıyla giriş yaptı.");

            return Ok(new
            {
                Message = "Giriş başarılı!",
                Token = tokenString,
                UserId = user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                Role = role.Name,
                user.RoleId
            });
        }

            [Authorize]
            [HttpGet("me")]
            public IActionResult Me()
            {
                return Ok(new
                {
                    UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                    Email = User.FindFirst(ClaimTypes.Email)?.Value,
                    Role = User.FindFirst(ClaimTypes.Role)?.Value
                });
            }

        }





    }


