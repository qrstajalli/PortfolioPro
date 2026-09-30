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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
