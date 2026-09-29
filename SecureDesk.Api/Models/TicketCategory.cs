using System;
using System.Collections.Generic;

namespace SecureDesk.Api.Models;

public partial class TicketCategory
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
