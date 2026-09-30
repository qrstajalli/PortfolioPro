# PortfolioPro 

**PortfolioPro** is a modern, high-precision simulated stock trading and portfolio management workstation. Designed for retail investors and traders, it provides risk-free simulated equity trading with customizable virtual starting capital configured directly by the user, live market analytics, institutional-grade dark mode, and an extensible architecture designed for real-time market data providers (such as Upstox).

---
## Quick Start Guide

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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
