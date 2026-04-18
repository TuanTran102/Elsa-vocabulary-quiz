# ELSA Vocabulary Quiz - Real-Time Experience

Welcome to the **ELSA Vocabulary Quiz**! This is a high-performance, real-time English vocabulary quiz application where multiple users can participate simultaneously, answer questions, and compete on a live leaderboard.

## 🚀 Key Features

*   **Real-time Participation:** Join a quiz session instantly using a unique Quiz ID.
*   **Live Scoring:** Get your score updated immediately as you submit correct answers.
*   **Global Leaderboard:** Watch your rank change in real-time as other participants submit their answers.
*   **High Scalability:** Built with Redis and WebSockets to handle thousands of concurrent users.

## 🛠 Tech Stack

### Backend
*   **Runtime:** Node.js + TypeScript
*   **Framework:** Express.js
*   **Real-time:** Socket.io (with Redis Adapter for scaling)
*   **Database:** PostgreSQL (Primary storage)
*   **Caching/Leaderboard:** Redis (Sorted Sets for ranking, Pub/Sub for cross-node communication)
*   **ORM:** Prisma

### Frontend
*   **Framework:** Vue 3 (Composition API)
*   **Build Tool:** Vite
*   **UI Library:** PrimeVue + TailwindCSS
*   **State Management:** Pinia
*   **Real-time:** Socket.io-client

## 📂 Project Structure

```text
.
├── .agents/             # Technical documentation, designs, and task tracking
├── backend/            # Express.js server & Business logic
├── frontend/           # Vue.js 3 application
└── infra/              # Docker setup (Postgres & Redis)
```

## ⚙️ Getting Started

### 1. Prerequisites
*   Node.js (v18+)
*   Docker & Docker Compose
*   npm or yarn

### 2. Infrastructure Setup
Spin up the required databases:
```bash
cd infra
docker-compose up -d
```

### 3. Backend Setup
```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🧪 Testing the Infrastructure

To verify everything is working correctly:
1.  **Check Docker:** `docker ps` (Expect `postgres` and `redis` to be running).
2.  **Verify API:** Access `http://localhost:3000/api/v1/quizzes` (Expect JSON list of quizzes).
3.  **Verify UI:** Access `http://localhost:5173` (Expect Vue app with PrimeVue components).

---
*Created for the ELSA Real-Time Quiz coding challenge.*
