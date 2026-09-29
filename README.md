# PortfolioPro 📈

[![Java](https://img.shields.io/badge/Java-21%20%7C%2025%20LTS-ED8B00?style=flat&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.8-6DB33F?style=flat&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**PortfolioPro** is a modern, high-precision simulated stock trading and portfolio management workstation. Designed for retail investors and traders, it provides risk-free simulated equity trading with customizable virtual starting capital configured directly by the user, live market analytics, institutional-grade dark mode, and an extensible architecture designed for real-time market data providers (such as Upstox).

---

## 🌟 Key Features

- **💼 Configurable Virtual Capital:** Users choose and configure their own virtual paper-trading starting capital during registration or onboarding to match their individual trading strategy.
- **📊 Real-Time Market Feed Architecture:** Decoupled `MarketDataProvider` abstraction interface supporting mock feeds, with pluggable support for Indian broker APIs (Upstox / NSE / BSE).
- **📈 Interactive Technical Charts:** Candlestick and area chart visualizations across multiple timeframes (`1D`, `1W`, `1M`, `3M`, `1Y`, `ALL`) with intraday volume tracking.
- **🔢 High-Precision Monetary Math:** All order totals, cash balances, and Weighted Average Price (WAP) calculations utilize Java `BigDecimal` with `RoundingMode.HALF_UP` to prevent floating-point rounding errors.
- **🔒 Enterprise Security:** Stateless JWT authentication (Auth0 library), BCrypt password hashing, and role-based endpoint authorization.
- **🎨 Bloomberg/TradingView Inspired UI:** Built with React 19, Tailwind CSS v4, Lucide icons, responsive navigation, and dynamic dark/light theme switching.
- **⚡ Dual-Database Support:** Plug-and-play development using an in-memory **H2 database** (`local-h2` profile with web console) or enterprise **MySQL 8.x** via Docker Compose.

---

## 🏗️ Architecture & Tech Stack

```
PortfolioPro/
├── backend/                  # Java 21+ / Spring Boot 4.x / Maven Wrapper
├── frontend/                 # React 19 / Vite / TypeScript / Tailwind CSS v4
└── docker-compose.yml        # MySQL 8.0 container definition
```

### Backend
- **Language / Runtime:** Java 21+ (Tested on Java 25 LTS)
- **Framework:** Spring Boot 4.0.8 (Spring WebMVC, Spring Security, Spring Data JPA)
- **Database Access:** Hibernate 7.2.x, HikariCP Connection Pool
- **Databases Supported:** 
  - H2 In-Memory Database (`jdbc:h2:mem:portfoliopro_dev`)
  - MySQL 8.x Connector/J
- **Security:** Stateless JWT with Authorization Bearer header (`com.auth0:java-jwt`)
- **Build Tool:** Maven Wrapper (`mvnw` / `mvnw.cmd`)

### Frontend
- **Framework:** React 19 + TypeScript
- **Tooling & Dev Server:** Vite 8.x
- **Styling:** Tailwind CSS v4 with custom dark mode design system
- **Routing:** React Router DOM v7
- **HTTP Client:** Axios (configured with auto-attaching JWT interceptors and reverse proxy)
- **Icons:** Lucide React

---

## 🚀 Quick Start Guide

### Prerequisites
1. **Java:** JDK 21 or JDK 25 LTS installed
2. **Node.js:** Node.js v20+ and npm installed
3. **Git:** Installed on your system

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/qrstajalli/PortfolioPro.git
cd PortfolioPro
```

---

### Step 2: Configure Environment & Run Backend

1. Copy `.env.example` to `.env` in the root folder:
```bash
cp .env.example .env
```
2. Configure your MySQL credentials in `.env` (or via environment variables):
```properties
SPRING_PROFILES_ACTIVE=default
DB_URL=jdbc:mysql://localhost:3306/portfoliopro?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=your_password
```

3. Build and start the backend:
```bash
cd backend

# Build and verify
.\mvnw.cmd clean compile       # Windows
# or: ./mvnw clean compile    # Linux / macOS

# Run Spring Boot with persistent MySQL
.\mvnw.cmd spring-boot:run     # Windows
# or: ./mvnw spring-boot:run   # Linux / macOS
```

The backend server starts on **`http://localhost:8080`**.

> **Testing / Ephemeral In-Memory Mode:**
> To run the backend with zero external database dependencies using ephemeral in-memory H2:
> ```bash
> .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local-h2
> ```

---

### Step 3: Run the Frontend

In a separate terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

The client application will open at **`http://localhost:5173`**.

---

## 📡 API Reference

All REST endpoints are prefixed with `/api/v1`.

### 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new user with optional custom virtual capital |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user and receive JWT Bearer token |

#### Register Request Body:
```json
{
  "name": "Jane Trader",
  "email": "jane@example.com",
  "password": "SecurePassword123!",
  "initialCapital": 250000.00
}
```

#### Auth Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresInMs": 86400000,
    "user": {
      "id": 1,
      "name": "Jane Trader",
      "email": "jane@example.com",
      "role": "ROLE_USER"
    }
  }
}
```

### 2. Virtual Wallet (`/api/v1/wallet`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/wallet` | Bearer Token | Fetch current user's virtual buying power and configuration |
| `POST` | `/api/v1/wallet/setup` | Bearer Token | Set up or reset user's virtual starting capital |
| `PUT` | `/api/v1/wallet/capital` | Bearer Token | Update or adjust user's virtual starting capital |

### 3. Market Quotes (`/api/v1/market`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/market/stocks` | Public | List all active stock quotes (optional `?sector=`) |
| `GET` | `/api/v1/market/stocks/{symbol}` | Public | Get detailed quote by symbol (e.g. `RELIANCE`) |
| `GET` | `/api/v1/market/stocks/search?q=` | Public | Search stocks by symbol, name, or sector |

### 4. Health Check

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Public | System status, active profile, and currency |

---

## 📊 Database Schema

```
┌──────────────┐       1:1       ┌──────────────┐
│    users     ├─────────────────┤   wallets    │
└──────┬───────┘                 └──────────────┘
       │ 1:1
┌──────▼───────┐       1:N       ┌──────────────┐       N:1       ┌──────────────┐
│  portfolios  ├─────────────────┤   holdings   ├─────────────────┤    stocks    │
└──────┬───────┘                 └──────────────┘                 └──────┬───────┘
       │ 1:N                                                             │ 1:N
┌──────▼───────┐                                                  ┌──────▼───────┐
│    orders    │                                                  │ hist_prices  │
└──────────────┘                                                  └──────────────┘
```

- **`users`**: User identities, credential hashes, roles (`ROLE_USER`, `ROLE_ADMIN`).
- **`wallets`**: Real-time virtual purchasing power with optimistic lock versioning.
- **`portfolios`**: User portfolio aggregate and cash allocation.
- **`holdings`**: User stock positions, share quantities, and weighted average buy prices (WAP).
- **`stocks`**: Equities metadata, sector classification, and live pricing metrics.
- **`orders`**: Transaction ledger of simulated market and limit orders (`BUY` / `SELL`).
- **`stock_historical_prices`**: Timestamped OHLCV candles for chart rendering.
- **`watchlists` & `watchlist_items`**: User-defined stock watchlists.

---

## 🔌 Market Data Provider Architecture

PortfolioPro decouples the trading and presentation layers from market data feeds using the `MarketDataProvider` interface:

```java
public interface MarketDataProvider {
    Optional<StockQuoteDto> getQuote(String symbol);
    List<StockQuoteDto> getAllQuotes();
    List<StockQuoteDto> searchStocks(String query);
    List<StockQuoteDto> getQuotesBySector(String sector);
}
```

- **`MockMarketDataProvider`**: Built-in provider supplying deterministic quotes for top NSE and global stocks.
- **`UpstoxMarketDataProvider`** *(In Progress)*: Live Indian market integration for real-time quotes, market depth, and historical candles via Upstox API v2.

---

## 🛠️ Configuration & Environment

| Environment Variable | Default Value | Description |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `local-h2` | Active Spring profile (`local-h2` or `default`) |
| `DB_URL` | `jdbc:mysql://localhost:3306/portfoliopro` | MySQL JDBC connection string |
| `DB_USERNAME` | `root` | Database username |
| `DB_PASSWORD` | *(empty)* | Database password |
| `PORT` | `8080` | Backend server port |
| `JWT_SECRET` | *32-byte default key* | HMAC256 signature secret for JWT |
| `JWT_EXPIRATION_MS` | `86400000` (24h) | JWT validity window |
| `DEFAULT_CURRENCY` | `INR` | Default currency code |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/qrstajalli/PortfolioPro/issues).

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
