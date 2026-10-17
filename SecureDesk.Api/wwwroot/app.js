
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
            `status-badge ${statusClasses[statusId] ?? ""}`;
        badge.textContent = getStatusName(ticket);

        statusCell.appendChild(badge);

        const dateCell = document.createElement("td");
        dateCell.textContent = getDateText(getTicketDate(ticket));

        row.append(idCell, titleCell, statusCell, dateCell);



        row.style.cursor = "pointer";

        row.addEventListener("click", () => {
            const detailPanel = document.getElementById("ticketDetailPanel");

            const detailTitle = document.getElementById("detailTicketTitle");
            const detailNumber = document.getElementById("detailTicketNumber");
            const detailStatus = document.getElementById("detailTicketStatus");
            const detailPriority = document.getElementById("detailTicketPriority");
            const detailCategory = document.getElementById("detailTicketCategory");
            const detailCreated = document.getElementById("detailTicketCreated");
            const detailDescription = document.getElementById("detailTicketDescription");

            detailTitle.textContent = getTicketTitle(ticket);
            detailNumber.textContent = `Ticket #SD-${getTicketId(ticket)}`;
            detailStatus.textContent = getStatusName(ticket);

            detailPriority.textContent =
                ticket.priorityName ??
                ticket.PriorityName ??
                ticket.priority?.name ??
                ticket.Priority?.Name ??
                ticket.priorityId ??
                ticket.PriorityId ??
                "Not available";

            detailCategory.textContent =
                ticket.categoryName ??
                ticket.CategoryName ??
                ticket.category?.name ??
                ticket.Category?.Name ??
                ticket.categoryId ??
                ticket.CategoryId ??
                "Not available";

            detailCreated.textContent = getDateText(getTicketDate(ticket));

            detailDescription.textContent =
                ticket.description ??
                ticket.Description ??
                "No description available.";

            detailPanel.hidden = false;

            loadComments(getTicketId(ticket));

            loadTicketHistory(getTicketId(ticket));

            detailPanel.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });

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


document.getElementById("closeTicketDetail")
    .addEventListener("click", () => {
        document.getElementById("ticketDetailPanel").hidden = true;
        document.querySelector(".tickets-panel").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });


elements.search.addEventListener("input", renderTickets);
elements.filter.addEventListener("change", renderTickets);
elements.refresh.addEventListener("click", loadTickets);

const ticketFormPanel = document.getElementById("ticketFormPanel");
const ticketForm = document.getElementById("ticketForm");
const ticketFormMessage = document.getElementById("ticketFormMessage");

elements.create.addEventListener("click", () => {
    console.log("Create Ticket button clicked");
    console.log("Form panel:", ticketFormPanel);

    ticketFormPanel.hidden = false;

    console.log("Form hidden:", ticketFormPanel.hidden);

    ticketFormPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

document.getElementById("cancelTicketButton")
    .addEventListener("click", () => {
        ticketForm.reset();
        ticketFormMessage.textContent = "";
        ticketFormPanel.hidden = true;
    });



ticketForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("secureDeskToken");

    if (!token) {
        ticketFormMessage.textContent = "Please log in again.";
        return;
    }

    const submitButton = ticketForm.querySelector(
        'button[type="submit"]'
    );

    const ticketData = {
        title: document.getElementById("ticketTitle").value.trim(),
        description: document.getElementById("ticketDescription").value.trim(),
        categoryId: Number(document.getElementById("ticketCategory").value),
        priorityId: Number(document.getElementById("ticketPriority").value)
    };

    submitButton.disabled = true;
    ticketFormMessage.textContent = "Submitting ticket...";

    try {
        const response = await fetch(`${API_BASE_URL}/Tickets`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(ticketData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Ticket could not be created (HTTP ${response.status}): ${errorText}`
            );
        }

        ticketForm.reset();
        ticketFormPanel.hidden = true;
        ticketFormMessage.textContent = "";

        await loadTickets();

    } catch (error) {
        console.error("Ticket creation error:", error);
        ticketFormMessage.textContent = error.message;
    } finally {
        submitButton.disabled = false;
    }
});


// Login
const loginScreen = document.getElementById("loginScreen");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const logoutButton = document.getElementById("logoutButton");

logoutButton.addEventListener("click", () => {
    localStorage.removeItem("secureDeskToken");
    loginScreen.classList.remove("hidden");
    loginMessage.textContent = "";
});


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



const commentsList = document.getElementById("commentsList");
const commentForm = document.getElementById("commentForm");
const commentInput = document.getElementById("commentInput");
const commentMessage = document.getElementById("commentMessage");
const sendCommentButton = document.getElementById("sendCommentButton");

let activeCommentTicketId = null;

function getToken() {
    return localStorage.getItem("secureDeskToken");
}

function getCommentTicketId() {
    const numberText =
        document.getElementById("detailTicketNumber")?.textContent ?? "";

    const match = numberText.match(/#SD-(\d+)/);
    return match ? Number(match[1]) : null;
}

function formatCommentDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleString("tr-TR");
}

async function loadComments(ticketId) {
    activeCommentTicketId = Number(ticketId);
    commentsList.replaceChildren();

    const loading = document.createElement("p");
    loading.className = "comments-empty";
    loading.textContent = "Loading comments...";
    commentsList.appendChild(loading);

    try {
        const response = await fetch(
            `${API_BASE_URL}/TicketComments/ticket/${ticketId}`,
            {
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                response.status === 403
                    ? "You do not have permission to view these comments."
                    : `Comments could not be loaded (${response.status}).`
            );
        }

        const comments = await response.json();
        commentsList.replaceChildren();

        if (!comments.length) {
            const empty = document.createElement("p");
            empty.className = "comments-empty";
            empty.textContent = "No comments yet. Start the conversation.";
            commentsList.appendChild(empty);
            return;
        }

        comments.forEach(comment => {
            const card = document.createElement("article");
            card.className = "comment-card";

            const header = document.createElement("div");
            header.className = "comment-header";

            const author = document.createElement("span");
            author.className = "comment-author";
            author.textContent = comment.userName ?? "User";

            const date = document.createElement("span");
            date.className = "comment-date";
            date.textContent = formatCommentDate(comment.createdAt);

            const body = document.createElement("div");
            body.className = "comment-text";
            body.textContent = comment.comment ?? "";

            header.append(author, date);
            card.append(header, body);
            commentsList.appendChild(card);
        });
    } catch (error) {
        commentsList.replaceChildren();

        const errorText = document.createElement("p");
        errorText.className = "comments-empty";
        errorText.textContent = error.message;
        commentsList.appendChild(errorText);
    }
}

commentForm.addEventListener("submit", async event => {
    event.preventDefault();

    const ticketId = getCommentTicketId();
    const comment = commentInput.value.trim();

    if (!ticketId) {
        commentMessage.textContent = "Select a ticket first.";
        return;
    }

    if (!comment) {
        commentMessage.textContent = "Comment cannot be empty.";
        return;
    }

    sendCommentButton.disabled = true;
    commentMessage.textContent = "Sending...";

    try {
        const response = await fetch(`${API_BASE_URL}/TicketComments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                ticketId: ticketId,
                comment: comment
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                errorText || `Comment could not be sent (${response.status}).`
            );
        }

        commentInput.value = "";
        commentMessage.textContent = "Comment added successfully.";

        await loadComments(ticketId);
    } catch (error) {
        commentMessage.textContent = error.message;
    } finally {
        sendCommentButton.disabled = false;
    }
});



async function loadTicketHistory(ticketId) {
    const historyList = document.getElementById("ticketHistoryList");
    const token = localStorage.getItem("secureDeskToken");

    if (!historyList || !ticketId || !token) return;

    historyList.replaceChildren();

    const loading = document.createElement("p");
    loading.className = "history-empty";
    loading.textContent = "Loading history...";
    historyList.appendChild(loading);

    try {
        const response = await fetch(
            `${API_BASE_URL}/TicketHistories/ticket/${ticketId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`History could not be loaded (${response.status}).`);
        }

        const history = await response.json();
        historyList.replaceChildren();

        if (!history.length) {
            const empty = document.createElement("p");
            empty.className = "history-empty";
            empty.textContent = "No activity recorded yet.";
            historyList.appendChild(empty);
            return;
        }

        history.forEach(item => {
            const card = document.createElement("article");
            card.className = "history-item";

            const action = document.createElement("p");
            action.className = "history-action";
            action.textContent = item.action || "Activity";

            const user = document.createElement("p");
            user.textContent = `By: ${item.userName || "Unknown user"}`;

            const change = document.createElement("p");
            if (item.oldValue || item.newValue) {
                change.textContent =
                    `${item.oldValue || "—"} → ${item.newValue || "—"}`;
            }

            const date = document.createElement("p");
            date.className = "history-meta";
            const parsedDate = new Date(item.createdAt);
            date.textContent = Number.isNaN(parsedDate.getTime())
                ? ""
                : parsedDate.toLocaleString();

            card.append(action, user);

            if (item.oldValue || item.newValue) {
                card.appendChild(change);
            }

            card.appendChild(date);
            historyList.appendChild(card);
        });
    } catch (error) {
        historyList.replaceChildren();

        const message = document.createElement("p");
        message.className = "history-error";
        message.textContent = error.message || "Could not load history.";
        historyList.appendChild(message);
    }
}

document.getElementById("refreshHistoryButton")
    ?.addEventListener("click", () => {
        const numberText = document.getElementById("detailTicketNumber")
            ?.textContent || "";

        const match = numberText.match(/#SD-(\d+)/);

        if (match) {
            loadTicketHistory(Number(match[1]));
        }
    });



/* SecureDesk - Ticket Management */

(() => {
    const controls = document.getElementById("ticketManagementControls");
    const statusSelect = document.getElementById("ticketStatusSelect");
    const assigneeSelect = document.getElementById("ticketAssigneeSelect");
    const statusButton = document.getElementById("updateTicketStatusButton");
    const assignButton = document.getElementById("assignTicketButton");
    const message = document.getElementById("ticketManagementMessage");

    if (!controls || !statusSelect || !assigneeSelect ||
        !statusButton || !assignButton || !message) {
        console.warn("Ticket Management HTML alanları bulunamadı.");
        return;
    }

    const token = () => localStorage.getItem("secureDeskToken");

    function getCurrentTicketId() {
        const number = document.getElementById("detailTicketNumber");
        const text = number?.textContent || "";
        const match = text.match(/#SD-(\d+)/i);

        if (match) return Number(match[1]);

        // Ticket numarası farklı biçimde gösteriliyorsa
        // mevcut detay alanlarından ID alınamıyor demektir.
        return null;
    }

    async function apiRequest(url, options = {}) {
        const jwt = token();

        if (!jwt) throw new Error("Oturum süresi dolmuş. Yeniden giriş yap.");

        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${jwt}`,
                ...(options.body ? { "Content-Type": "application/json" } : {})
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP ${response.status}`);
        }

        if (response.status === 204) return null;
        return response.json();
    }

    async function loadManagementOptions() {
        try {
            const [statuses, users] = await Promise.all([
                apiRequest("/Tickets/statuses"),
                apiRequest("/Users")
            ]);

            statusSelect.replaceChildren();
            statuses.forEach(status => {
                const option = document.createElement("option");
                option.value = status.id;
                option.textContent = status.name;
                statusSelect.appendChild(option);
            });

            assigneeSelect.replaceChildren();
            const placeholder = document.createElement("option");
            placeholder.value = "";
            placeholder.textContent = "Select IT Staff or Admin";
            assigneeSelect.appendChild(placeholder);

            users
                .filter(user =>
                    ["IT Staff", "Admin"].includes(user.roleName)
                )
                .forEach(user => {
                    const option = document.createElement("option");
                    option.value = user.id;
                    option.textContent =
                        `${user.firstName} ${user.lastName} (${user.roleName})`;
                    assigneeSelect.appendChild(option);
                });
        } catch (error) {
            message.textContent =
                `Alanlar yüklenemedi: ${error.message}`;
        }
    }

    statusButton.addEventListener("click", async () => {
        const ticketId = getCurrentTicketId();
        const statusId = Number(statusSelect.value);

        if (!ticketId) {
            message.textContent = "Ticket ID bulunamadı.";
            return;
        }

        if (!statusId) {
            message.textContent = "Bir durum seç.";
            return;
        }

        statusButton.disabled = true;
        message.textContent = "Durum güncelleniyor...";

        try {
            await apiRequest(`/Tickets/${ticketId}/status`, {
                method: "PUT",
                body: JSON.stringify({ statusId })
            });

            message.textContent = "Ticket durumu güncellendi.";
            document.getElementById("detailTicketStatus").textContent =
                statusSelect.selectedOptions[0]?.textContent || "";

            await refreshTicketHistory(ticketId);
        } catch (error) {
            message.textContent = `İşlem başarısız: ${error.message}`;
        } finally {
            statusButton.disabled = false;
        }
    });

    assignButton.addEventListener("click", async () => {
        const ticketId = getCurrentTicketId();
        const assignedToUserId = Number(assigneeSelect.value);

        if (!ticketId) {
            message.textContent = "Ticket ID bulunamadı.";
            return;
        }

        if (!assignedToUserId) {
            message.textContent = "Atanacak kullanıcıyı seç.";
            return;
        }

        assignButton.disabled = true;
        message.textContent = "Ticket atanıyor...";

        try {
            await apiRequest(`/Tickets/${ticketId}/assign`, {
                method: "PUT",
                body: JSON.stringify({ assignedToUserId })
            });

            message.textContent = "Ticket başarıyla atandı.";
            await refreshTicketHistory(ticketId);
        } catch (error) {
            message.textContent = `İşlem başarısız: ${error.message}`;
        } finally {
            assignButton.disabled = false;
        }
    });

    async function refreshTicketHistory(ticketId) {
        const historyList = document.getElementById("ticketHistoryList");
        if (!historyList) return;

        try {
            const history = await apiRequest(
                `/TicketHistories/ticket/${ticketId}`
            );

            historyList.replaceChildren();

            if (!Array.isArray(history) || history.length === 0) {
                const empty = document.createElement("p");
                empty.className = "history-empty";
                empty.textContent = "No activity recorded yet.";
                historyList.appendChild(empty);
                return;
            }

            history.forEach(item => {
                const entry = document.createElement("div");
                entry.className = "history-entry";

                const action = document.createElement("strong");
                action.textContent = item.action || "Ticket updated";

                const details = document.createElement("p");
                details.textContent =
                    `${item.oldValue || "-"} → ${item.newValue || "-"}`;

                const date = document.createElement("small");
                date.textContent = item.createdAt
                    ? new Date(item.createdAt).toLocaleString()
                    : "";

                entry.append(action, details, date);
                historyList.appendChild(entry);
            });
        } catch (error) {
            console.error("Ticket history yüklenemedi:", error);
        }
    }

    // Yönetim alanı yalnızca yetkili kullanıcıya gösterilir.
    // Backend yetkilendirmesi de ayrıca uygulanmalıdır.
    try {
        const payload = JSON.parse(atob(token().split(".")[1]));
        const role =
            payload.role ||
            payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

        if (["IT Staff", "Admin"].includes(role)) {
            controls.hidden = false;
            loadManagementOptions();
        }
    } catch {
        controls.hidden = true;
    }
})();
