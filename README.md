# SecureDesk — IT Support & Asset Management System

SecureDesk is a web-based IT support ticket management system built with ASP.NET Core Web API and SQL Server. It provides a centralized way to create, assign, track, and manage IT support requests with authentication and role-based access control.

## Features

- **JWT Authentication** — Secure user login using JSON Web Tokens.
- **Role-Based Authorization** — Different permissions for Admin, IT Staff, and Employee roles.
- **Ticket Management** — Create and view support tickets, update ticket statuses, and assign tickets to authorized users.
- **Ticket Comments** — Add comments to support discussions.
- **Activity History** — Track ticket assignments and status changes.
- **User Management** — Retrieve user information and create users with role validation.
- **Input Validation** — Validate required fields, email addresses, passwords, and role assignments.
- **Password Security** — Hash passwords using BCrypt.
- **Responsive Interface** — A web interface built with HTML, CSS, and JavaScript.

## Technology Stack

| Technology | Purpose |
|---|---|
| C# | Backend development |
| ASP.NET Core Web API | REST API |
| Entity Framework Core | Database access |
| Microsoft SQL Server | Relational database |
| JWT | Authentication |
| BCrypt | Password hashing |
| Swagger / OpenAPI | API documentation and testing |
| HTML5 | Frontend structure |
| CSS3 | Styling and responsive layout |
| JavaScript | Frontend functionality |
| Git & GitHub | Version control |

## Authentication & Authorization

SecureDesk uses JWT-based authentication to protect API endpoints.

The system defines three roles:

- **Admin** — Access to administrative operations, including user creation.
- **IT Staff** — Access to ticket management and permitted user information.
- **Employee** — Access to permitted employee-level operations and their own tickets.

Authorization policies restrict sensitive operations according to the authenticated user's role. Employees cannot access administrative user-management endpoints or perform restricted ticket-management operations.

## Ticket Management

The ticket management workflow includes:

1. Employees create support tickets.
2. IT Staff and Admin users can manage ticket assignments.
3. Authorized users can update ticket statuses.
4. Users can add comments to tickets.
5. Ticket activity history records assignment and status changes.

Ticket visibility and management permissions are enforced by the API rather than relying only on frontend controls.

## API Overview

The API uses the `/api` route prefix.

| Endpoint | Method | Description |
|---|---|---|
| `/api/Auth/login` | POST | Authenticate a user |
| `/api/Auth/me` | GET | Retrieve the authenticated user's information |
| `/api/Tickets` | GET | Retrieve tickets permitted for the current user |
| `/api/Tickets` | POST | Create a support ticket |
| `/api/Tickets/{id}/status` | PUT | Update a ticket's status |
| `/api/Tickets/{id}/assign` | PUT | Assign a ticket to an authorized user |
| `/api/Users` | GET | Retrieve permitted user information |
| `/api/Users` | POST | Create a user (Admin only) |

Additional endpoints support ticket comments, ticket history, categories, priorities, and statuses. Access to individual endpoints depends on authentication and authorization rules.

Use Swagger UI to inspect the available endpoints and their request and response schemas.

## Database

SecureDesk uses Microsoft SQL Server with Entity Framework Core.

The data model includes entities for:

- Users and roles
- Tickets
- Ticket categories, priorities, and statuses
- Ticket comments
- Ticket activity history

Relationships between users, tickets, and related records support ticket assignment, discussion, and activity tracking.

## Getting Started

### Prerequisites

- .NET 8 SDK
- Microsoft SQL Server
- Visual Studio or Visual Studio Code
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yagmurer d/SecureDesk.git
   ```

   Replace the repository URL with the exact URL of your GitHub repository if it differs.

2. Open the solution or project in your preferred development environment.

3. Configure the database connection string using your local development configuration.

4. Configure the JWT issuer, audience, and signing key using .NET User Secrets or another secure configuration provider.

5. Restore dependencies:

   ```bash
   dotnet restore
   ```

6. Build the project:

   ```bash
   dotnet build
   ```

7. Run the API:

   ```bash
   dotnet run
   ```

8. Open the Swagger URL displayed in the terminal to explore and test the API.

> **Configuration note:** Do not commit passwords, database credentials, JWT signing keys, or other secrets to source control. Provide your own local configuration before running the application.

> **Database note:** Ensure the required database schema exists before running the application. Apply the appropriate database setup or migration steps for your local environment.

## Screenshots

Screenshots of the login page, ticket dashboard, ticket details, comments, and activity history can be added here.

<!-- Add screenshots from your repository's screenshots directory. -->

## Future Improvements

- Automated unit and integration tests
- More comprehensive audit logging
- Advanced ticket filtering and reporting
- Improved deployment and environment configuration
- Additional asset inventory management features

## Project Purpose

SecureDesk was developed as a portfolio project to demonstrate practical backend development skills, including REST API design, database integration, authentication, authorization, input validation, and frontend-to-backend communication.

## Author

**Yağmur Erdurucan**
.NET Backend Developer

[GitHub Profile](https://github.com/yagmurerd)

