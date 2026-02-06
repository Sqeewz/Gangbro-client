# 🕶️ GangBro Tech Stack

> **Urban Mission Operations Hub** - Complete Technology Overview

---

## 🎯 Architecture Overview

GangBro follows a **modern full-stack architecture** with:
- **Frontend**: Single Page Application (SPA) using Angular
- **Backend**: High-performance REST API built with Rust
- **Real-time**: WebSocket connections for live chat and notifications
- **Database**: PostgreSQL with Diesel ORM
- **Deployment**: Dockerized multi-stage builds deployed on Render

---

## 🖥️ Frontend Stack

### Core Framework
- **Angular 21** - Latest standalone components with Signals
- **TypeScript 5.9** - Type-safe development
- **RxJS 7.8** - Reactive programming for async operations

### UI/UX
- **Angular Material 21** - Material Design 3 components
- **SCSS/CSS3** - Custom "Gang" cyberpunk theming
- **ngx-spinner** - Loading states and animations

### State Management
- Angular Signals (built-in)
- RxJS Observables for async data streams

### Development Tools
- **Angular CLI 21.0.5** - Code generation and build tools
- **Prettier** - Code formatting
- **Vitest 4.0.8** - Unit testing framework
- **npm 11.6.2** - Package management

### Build Configuration
- **Angular Build** - Production optimizations
- **Output**: Static bundle (HTML/CSS/JS)
- **SSR**: Not implemented (pure SPA)

---

## ⚙️ Backend Stack

### Core Framework
- **Rust (Nightly Edition)** - Systems programming language
- **Axum 0.8.6** - Fast, ergonomic web framework
  - Macro support for routing
  - WebSocket support built-in
- **Tokio 1.48** - Async runtime for concurrent operations

### Database & ORM
- **PostgreSQL 15+** - Primary database
- **Diesel 2.3.3** - Type-safe ORM with compile-time query verification
  - Postgres support
  - JSON serialization
  - Chrono datetime support
  - Connection pooling (r2d2)
- **Diesel Migrations 2.3.1** - Database schema versioning

### Authentication & Security
- **Argon2 0.5.3** - Password hashing (OWASP recommended)
- **jsonwebtoken 10.1** - JWT token generation/validation
- **cookie 0.18** - Secure cookie handling
- **axum-extra 0.12.1** - Cookie and typed headers middleware

### Real-time Communication
- **WebSockets** - Native Axum support
- **futures-util 0.3.31** - Stream processing
- **DashMap 6.1** - Concurrent connection management

### File Handling
- **Cloudinary 0.8.2** - Cloud storage for images/avatars
- **infer 0.19** - MIME type detection
- **base64 0.22.1** - Binary encoding
- **file-type** - File validation

### HTTP & Networking
- **tower-http 0.6.6** - HTTP middleware (CORS, compression, etc.)
- **reqwest 0.12.26** - HTTP client for external APIs
- **Cookie** - Session management

### Development & Testing
- **mockall 0.14** - Mock generation for unit tests
- **anyhow 1.0** - Error handling
- **tracing 0.1.41** - Structured logging
- **tracing-subscriber 0.3.20** - Log output formatting

### Utilities
- **serde 1.0.228** - Serialization/deserialization
- **serde_json 1.0.145** - JSON support
- **chrono 0.4.42** - DateTime handling
- **sha1 0.10.6** - Hashing utilities
- **dotenvy 0.15.7** - Environment variable management
- **async-trait 0.1.89** - Async trait support

---

## 🗄️ Database

### Primary Database
- **PostgreSQL 15+**
  - ACID compliance
  - JSON/JSONB support for flexible data
  - Full-text search capabilities
  - Connection pooling via Diesel r2d2

### Migrations
- Diesel CLI for schema migrations
- Version-controlled migrations in `/server/migrations`

### Schema Highlights
- **Users** (Brawlers) - Authentication and profiles
- **Missions** - Mission operations and status
- **Mission Members** - Crew assignments
- **Mission Chats** - Real-time messages
- **Notifications** - User alerts

---

## 🔌 Real-time Features

### WebSocket Implementation
- **Protocol**: WSS (WebSocket Secure)
- **Use Cases**:
  - Live chat in mission details
  - Real-time mission status updates
  - Crew join/leave notifications
- **Connection Management**: DashMap for concurrent connections
- **Message Format**: JSON

---

## 🔐 Security Measures

### Authentication
- **JWT Tokens** - Stateless authentication
- **HTTP-only Cookies** - XSS protection
- **Secure Cookies** - HTTPS-only in production

### Password Security
- **Argon2id** - Memory-hard hashing algorithm
- **Salt Generation** - Unique per user
- **No plain-text storage** - All passwords hashed

### CORS
- Configured via tower-http
- Whitelist-based origin control

### API Security
- Protected routes with JWT middleware
- Role-based access control (RBAC) ready

---

## 🐳 DevOps & Deployment

### Containerization
- **Docker** - Multi-stage builds
  - **Stage 1**: Node.js 20 for Angular build
  - **Stage 2**: Rust Nightly for backend compilation
  - **Stage 3**: Debian (testing-slim) runtime
- **Image Size**: Optimized (~200MB final image)

### Cloud Platform
- **Render** - Hosting provider
  - Auto-deploy from Git
  - PostgreSQL managed database
  - Environment variable management
  - HTTPS by default

### Build Process
1. Frontend build → Static files
2. Backend compilation → Single binary
3. Bundle into minimal Debian image
4. Expose port 8080
5. Serve static files from Axum

### Environment Variables
```
DATABASE_URL - PostgreSQL connection string
JWT_SECRET - Token signing key
CLOUDINARY_URL - Cloud storage credentials
SERVER_PORT - Application port (default: 8080)
```

---

## 📦 Package Management

### Frontend
- **npm 11.6.2** - Node package manager
- **package.json** - Dependency manifest
- **package-lock.json** - Locked versions

### Backend
- **Cargo** - Rust package manager
- **Cargo.toml** - Dependency manifest
- **Cargo.lock** - Locked versions (auto-generated)

---

## 🧪 Testing

### Frontend
- **Vitest 4.0.8** - Fast unit testing
- **jsdom 27.1** - DOM simulation

### Backend
- **mockall 0.14** - Mock generation
- **Rust built-in testing** - `cargo test`

---

## 🎨 Design System

### Theme
- **"Gang"** - Custom cyberpunk/urban aesthetic
- Dark mode with neon accents
- Glassmorphism effects
- Glitch text animations

### Colors
- Primary: Cyan/Electric Blue
- Accent: Purple/Magenta
- Background: Dark grays (#0a0a0a - #1a1a1a)
- Success: Neon Green
- Danger: Hot Pink/Red

### Typography
- Modern sans-serif fonts
- Glitch effects on headers
- Monospace for code/IDs

---

## 📊 Performance Optimizations

### Frontend
- Lazy loading routes
- OnPush change detection
- Production builds with minification
- Icon optimization

### Backend
- Async/await for non-blocking I/O
- Connection pooling (r2d2)
- Efficient query generation (Diesel)
- Compiled Rust = near-C performance

### Deployment
- Multi-stage Docker builds
- Static file serving from Rust
- CDN for assets (Cloudinary)

---

## 🔄 Data Flow

```
Client (Angular) 
    ↓ HTTP/WebSocket
Axum Router
    ↓ Route Handlers
Business Logic (Services)
    ↓ Repository Pattern
Diesel ORM
    ↓ SQL
PostgreSQL Database
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v20+
- **Rust** 1.80+ (nightly)
- **PostgreSQL** 15+
- **Docker** (optional, for deployment)

### Quick Start
```bash
# Backend
cd server
diesel migration run
cargo run

# Frontend
cd GangBro-client
npm install
npm run dev
```

Visit: `http://localhost:4200`

---

## 📈 Future Enhancements

### Potential Additions
- [ ] Redis for caching/session storage
- [ ] GraphQL API layer
- [ ] Server-Sent Events (SSE) as WebSocket fallback
- [ ] Mobile apps (Flutter/React Native)
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] End-to-end testing (Playwright/Cypress)
- [ ] Performance monitoring (Sentry/DataDog)

---

## 📝 Version History

- **v0.1.0** - Initial release
  - Core mission management
  - Real-time chat
  - Authentication system
  - "Gang" theme implementation

---

## 🤝 Contributing

See [README.md](./README.md) for contribution guidelines.

---

## 📄 License

Unlicensed - Educational/Demonstration purposes only.

---

**Built with 💜 by the GangBro team**

*Last Updated: February 2026*
