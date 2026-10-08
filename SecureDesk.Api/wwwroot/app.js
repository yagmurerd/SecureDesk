
const API_BASE_URL = "/api";

let allTickets = [];

const statusNames = {
    1: "Open",
    2: "Assigned",
    3: "In Progress",
    4: "Resolved",
    5: "Closed"
};

const statusClasses = {
    1: "status-open",
    2: "status-assigned",
    3: "status-progress",
    4: "status-resolved",
    5: "status-closed"
};

const elements = {
    total: document.getElementById("totalTickets"),
    open: document.getElementById("openTickets"),
    progress: document.getElementById("progressTickets"),
    resolved: document.getElementById("resolvedTickets"),
    table: document.getElementById("ticketTable"),
    message: document.getElementById("message"),
    search: document.getElementById("ticketSearch"),
    filter: document.getElementById("statusFilter"),
    refresh: document.getElementById("refreshTickets"),
    create: document.getElementById("createTicketButton")
};

function showMessage(text, isError = false) {
    elements.message.textContent = text;
    elements.message.className = isError
        ? "message error"
        : "message";
}

function getTicketStatus(ticket) {
    return Number(
        ticket.statusId ??
        ticket.StatusId ??
        ticket.status?.id ??
        ticket.Status?.Id
    );
}

function getTicketId(ticket) {
    return ticket.id ?? ticket.Id;
}

function getTicketTitle(ticket) {
    return ticket.title ?? ticket.Title ?? "Untitled ticket";
}

function getTicketDate(ticket) {
    return ticket.createdAt ?? ticket.CreatedAt;
}

function getStatusName(ticket) {
    const id = getTicketStatus(ticket);

    return statusNames[id] ??
        ticket.status?.name ??
        ticket.Status?.Name ??
        "Unknown";
}

function getDateText(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("tr-TR");
}

function renderStats(tickets) {
    elements.total.textContent = tickets.length;

    elements.open.textContent = tickets.filter(ticket =>
        getTicketStatus(ticket) === 1
    ).length;

    elements.progress.textContent = tickets.filter(ticket =>
        getTicketStatus(ticket) === 3
    ).length;

    elements.resolved.textContent = tickets.filter(ticket =>
        getTicketStatus(ticket) === 4
    ).length;
}

function renderTickets() {
    const searchText = elements.search.value
        .trim()
        .toLocaleLowerCase("tr-TR");

    const selectedStatus = elements.filter.value;

    const filteredTickets = allTickets.filter(ticket => {
        const id = String(getTicketId(ticket) ?? "");
        const title = getTicketTitle(ticket)
            .toLocaleLowerCase("tr-TR");

        const matchesSearch =
            id.includes(searchText) ||
            title.includes(searchText);

        const statusId = getTicketStatus(ticket);

        const matchesStatus =
            selectedStatus === "all" ||
            (selectedStatus === "resolved" && statusId === 4) ||
            (selectedStatus === "closed" && statusId === 5) ||
            String(statusId) === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    elements.table.replaceChildren();

    if (filteredTickets.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.className = "empty-state";
        cell.textContent = "No tickets found.";

        row.appendChild(cell);
        elements.table.appendChild(row);
        return;
    }

    filteredTickets.forEach(ticket => {
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.className = "ticket-id";
        idCell.textContent = `#SD - ${ getTicketId(ticket) } `;

        const titleCell = document.createElement("td");
        titleCell.className = "ticket-title";
        titleCell.textContent = getTicketTitle(ticket);

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");

        const statusId = getTicketStatus(ticket);

        badge.className =
            `status - badge ${ statusClasses[statusId] ?? "" } `;
        badge.textContent = getStatusName(ticket);

        statusCell.appendChild(badge);

        const dateCell = document.createElement("td");
        dateCell.textContent = getDateText(getTicketDate(ticket));

        row.append(idCell, titleCell, statusCell, dateCell);
        elements.table.appendChild(row);
    });
}

async function loadTickets() {
    showMessage("Loading tickets...");
    elements.refresh.disabled = true;

    try {
        const token = localStorage.getItem("secureDeskToken");

        if (!token) {
            showMessage("Please log in first. API authentication is required.");
            allTickets = [];
            renderStats(allTickets);
            renderTickets();
            return;
        }

        const response = await fetch(`${API_BASE_URL}/Tickets`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (response.status === 401 || response.status === 403) {
            showMessage(
                "Your session is invalid or you do not have permission.",
                true
            );
            return;
        }

        if (!response.ok) {
            throw new Error(`API returned HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Unexpected ticket response format.");
        }

        allTickets = data;

        renderStats(allTickets);
        renderTickets();

        showMessage(`${allTickets.length} ticket(s) loaded.`);
    } catch (error) {
        console.error("Ticket loading error:", error);

        showMessage(
            "Could not connect to the API. Check the API port and server.",
            true
        );
    } finally {
        elements.refresh.disabled = false;
    }
}


// Ticket events
elements.search.addEventListener("input", renderTickets);
elements.filter.addEventListener("change", renderTickets);
elements.refresh.addEventListener("click", loadTickets);

elements.create.addEventListener("click", () => {
    alert("Ticket creation form is the next step.");
});


// Login
const loginScreen = document.getElementById("loginScreen");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

function updateLoginScreen() {
    const token = localStorage.getItem("secureDeskToken");

    loginScreen.classList.toggle("hidden", Boolean(token));

    if (token) {
        loadTickets();
    }
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const submitButton = loginForm.querySelector(
        "button[type='submit']"
    );

    submitButton.disabled = true;
    submitButton.textContent = "Signing in...";
    loginMessage.textContent = "";

    try {
        const response = await fetch(`${API_BASE_URL}/Auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                typeof data === "string"
                    ? data
                    : data.message ??
                    data.title ??
                    "Login failed. Check your credentials."
            );
        }

        const token =
            data.token ??
            data.Token ??
            data.accessToken ??
            data.access_token;

        if (!token) {
            throw new Error(
                "API response did not contain a JWT token."
            );
        }

        localStorage.setItem("secureDeskToken", token);

        loginForm.reset();

        updateLoginScreen();

    } catch (error) {
        console.error("Login error:", error);

        loginMessage.textContent =
            error.message.includes("fetch")
                ? "API bağlantısı kurulamadı. Sunucu adresini kontrol et."
                : error.message;

    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Sign in →";
    }
});


// Start application
updateLoginScreen();