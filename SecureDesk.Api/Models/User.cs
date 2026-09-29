using System;
using System.Collections.Generic;

namespace SecureDesk.Api.Models;

public partial class User
{
    public int Id { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public int RoleId { get; set; }

    public virtual Role? Role { get; set; } 

    public virtual ICollection<SecurityLog> SecurityLogs { get; set; } = new List<SecurityLog>();

    public virtual ICollection<Ticket> TicketAssignedToUsers { get; set; } = new List<Ticket>();

    public virtual ICollection<TicketComment> TicketComments { get; set; } = new List<TicketComment>();

    public virtual ICollection<TicketHistory> TicketHistories { get; set; } = new List<TicketHistory>();

    public virtual ICollection<Ticket> TicketUsers { get; set; } = new List<Ticket>();
}
