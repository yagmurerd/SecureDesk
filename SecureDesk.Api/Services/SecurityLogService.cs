
using Microsoft.AspNetCore.Http;
using SecureDesk.Api.Models;

namespace SecureDesk.Api.Services
{
    public class SecurityLogService
    {
        private readonly SecureDeskDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public SecurityLogService(
            SecureDeskDbContext context,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task LogAsync(
            int? userId,
            string action,
            string? description = null)
        {
            var httpContext = _httpContextAccessor.HttpContext;

            var log = new SecurityLog
            {
                UserId = userId,
                Action = action,
                Description = description,
                IpAddress = httpContext?.Connection.RemoteIpAddress?.ToString(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Set<SecurityLog>().Add(log);
            await _context.SaveChangesAsync();
        }
    }
}
