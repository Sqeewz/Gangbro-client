# 🕶️ GangBro: Urban Mission Operations Hub

GangBro is a high-octane, cyberpunk-themed mission management platform. Built for elite "Brawlers" to coordinate, execute, and profit from digital underworld operations.

## 🚀 Technologies
- **Frontend**: Angular 21 (Standalone Components, Signals, RxJS)
- **Backend**: Rust (Axum, Diesel ORM, PostgreSQL)
- **Real-time**: WebSockets for mission intelligence and chat
- **Security**: Argon2 Password Hashing, JWT Authentication
- **Design**: Material 3 with "Gang" Custom Theming

---

## 🛠️ Installation Guide

### Prerequisites
- **Node.js**: v20 or later
- **Rust**: 1.80 or later
- **Postgres**: v15 or later

### Backend Setup (Server)
1. Navigate to `/server`
2. Create a `.env` file (see [Environment Variables](#-environment-variables-setup))
3. Run migrations: `diesel migration run`
4. Start server: `cargo run`

### Frontend Setup (Client)
1. Navigate to `/GangBro-client`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Access at `http://localhost:4200`

---

## 🔐 Environment Variables Setup

### Server (.env)
```env
DATABASE_URL=postgres://user:password@localhost:5432/gangbro
JWT_SECRET=your_super_secret_key_change_me
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
SERVER_PORT=8080
```

### Client (environments/environment.ts)
```typescript
export const environment = {
  production: false,
  baseUrl: 'http://localhost:8080/api'
};
```

---

## 📡 API Documentation (Summary)

### Authentication
- `POST /api/auth/login` - Authenticate brawler
- `POST /api/auth/register` - Recruit new brawler

### Missions
- `GET /api/missions` - List available missions (filterable)
- `POST /api/missions` - Deploy new mission
- `GET /api/missions/:id` - Fetch mission intel
- `POST /api/missions/:id/join` - Enlist in a mission

### Intel Chat (WebSockets)
- `WS /api/mission-chats/ws/:id` - Real-time mission communication

---

## 🤝 Contributing Guidelines

1. **Branching**: Use `feature/` or `fix/` prefixes.
2. **Formatting**: Ensure `npm run format` (Prettier) is run before committing.
3. **Linting**: No `eslint` errors allowed.
4. **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/).

---

## 📜 License
Unlicensed. Built for educational/underworld purposes.