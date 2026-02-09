# Boardly - Issue Tracking & Project Management System

Boardly is a modern, full-stack Kanban and issue tracking application built with **Next.js**, **FastAPI**, and **PostgreSQL**.

## Features
- 📋 **Kanban Board**: Drag-and-drop ticket management.
- 📝 **Task Management**: Create, edit, and delete tickets with rich details.
- 🔍 **List View**: Filter, sort, and search tickets efficiently.
- 🌓 **Themes**: Light and Dark mode support.
- 🔐 **Authentication**: User accounts and secure access.
- 👥 **Role-Based Access**: Permission handling for board owners and members.

---

## 📂 Project Architecture

### 🛡️ Backend (FastAPI)
The backend follows a modular structure focused on separation of concerns.

- **`app/api/`**: API route definitions and endpoint logic. Handles incoming requests.
- **`app/crud/`**: CRUD (Create, Read, Update, Delete) operations. Contains database-specific query logic.
- **`app/models/`**: SQLAlchemy models defining the database schema and relationships.
- **`app/schemas/`**: Pydantic models for data validation and serialization (request/response bodies).
- **`app/core/`**: Core configuration including security, environment variables, and global constants.
- **`app/db/`**: Database connection management and session handling.
- **`alembic/`**: Database migration scripts for version-controlled schema changes.

### 🎨 Frontend (Next.js)
The frontend uses the Next.js App Router with TypeScript and Tailwind CSS.

- **`app/`**: Route segments and page layouts. Uses React Server Components and Client Components appropriately.
- **`components/`**: Reusable UI components, including specialized components for boards, tickets, and authentication.
- **`lib/`**: Utility functions, API client wrappers, and shared constants.
- **`public/`**: Static assets like images and global configuration files.

---

## 🚀 Getting Started

Follow these instructions to run the application locally on your machine.

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **PostgreSQL** (Ensure it is installed and running)

---

### 1. Database Setup
Ensure your PostgreSQL server is running. Create a database named `boardly` (or match the configuration in `backend/app/core/config.py`).

```bash
# Example via command line
createdb boardly
```

### 2. Backend Setup (FastAPI)

Navigate to the `backend` directory:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
# Create venv
python3 -m venv venv

# Activate (Linux/macOS)
source venv/bin/activate

# Activate (Windows)
.\venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run Database Migrations (Alembic):

```bash
# Apply schema changes to the database
alembic upgrade head
```

Start the Backend Server:

```bash
uvicorn app.main:app --reload
```
The backend API will be available at `http://localhost:8000`. API Docs at `http://localhost:8000/docs`.

---

### 3. Frontend Setup (Next.js)

Open a new terminal and navigate to the `frontend` directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the Development Server:

```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

---

## 🔮 Upcoming Features / Roadmap

The following features are planned for future updates:

- **💬 Comments**: Discuss tasks directly on tickets.
- **📜 Ticket History Tracking**: View a detailed audit log of all changes made to a ticket.
- **🔔 CC/Watchers & Notifications**: Subscribe to ticket updates and get notified of changes.
- **👤 User Profile**: Enhanced profile page, settings, and activity overview (Coming Soon).

---

## License
MIT
