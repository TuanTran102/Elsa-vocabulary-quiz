# 📝 User Stories: Real-Time Vocabulary Quiz

Welcome to the **Real-Time Vocabulary Quiz**! This feature is designed to transform English learning into a competitive, high-engagement experience. Users can join live sessions, compete with peers, and see their progress reflected instantly on a global leaderboard.

---

## 👥 User Roles

| Role | Description |
| :--- | :--- |
| **Host (Master)** | Creates the session, manages the room, and controls the game flow. |
| **Player (Participant)** | Joins the room via PIN, answers questions, and competes for the top rank. |

---

## 🗺️ User Story Map

To make the requirements clearer, we have broken down the stories by the **Game Lifecycle**:

### 🏗️ Phase 1: Session Setup & Joining
| As a... | I want to... | So that... |
| :--- | :--- | :--- |
| **Host** | Select an existing quiz template and create a new room | I can prepare a session for my classroom or group in seconds. |
| **Host** | Receive a unique 6-digit PIN | I can easily share it via chat or screen with my audience. |
| **Player** | Enter a PIN and a screen nickname | I can join the session as a guest without a tedious registration process. |
| **Player** | Wait in a live lobby and see other joined players | I know I've joined correctly and feel part of the group before it starts. |

### 🎮 Phase 2: Live Gameplay
| As a... | I want to... | So that... |
| :--- | :--- | :--- |
| **Host** | Manually trigger the start of the first question | I can ensure everyone is ready before the timer begins. |
| **Player** | Answer multiple-choice questions within a time limit | I can test my vocabulary knowledge and cognitive speed. |
| **Player** | Earn more points for answering faster | There is a fair and exciting competitive advantage for quick thinking. |
| **Player** | See immediate status ("Correct" or "Wrong") after submitting | I get instant reinforcement or correction of my vocabulary knowledge. |

### 🏆 Phase 3: Leaderboard & Competition
| As a... | I want to... | So that... |
| :--- | :--- | :--- |
| **User** | View a real-time leaderboard after each question | I can see my current standing and feel motivated to climb higher. |
| **Host** | See the distribution of answers from all players | I can identify exactly which words are difficult for the group to learn. |
| **User** | View the final podium at the end of the quiz | We can celebrate the top performers and conclude the session effectively. |

---

## 🎯 Acceptance Criteria

### 1. User Participation
| ID | Requirement | Description |
| :--- | :--- | :--- |
| **AC 1.1** | **Join via PIN** | Users must be able to join a specific quiz session using a unique 6-digit PIN. |
| **AC 1.2** | **High Concurrency** | The system must support hundreds of users joining the same session simultaneously. |
| **AC 1.3** | **Lobby Experience** | Players should see a live list of other participants in the "Waiting Room". |

### 2. Real-Time Interactions
| ID | Requirement | Description |
| :--- | :--- | :--- |
| **AC 2.1** | **Instant Scoring** | Scores must be calculated and updated in real-time immediately after an answer is submitted. |
| **AC 2.2** | **Dynamic Leaderboard** | The leaderboard must shift positions instantly as players earn points. |
| **AC 2.3** | **Live Distribution** | Hosts should see a real-time bar chart of per-option answer counts. |

---

## 🚀 Non-Functional Requirements

### 🏗️ Scalability
- [ ] Support horizontal scaling of backend nodes using a Redis Pub/Sub adapter.
- [ ] Use Redis Sorted Sets for $O(\log N)$ leaderboard complexity.

### ⚡ Performance
- [ ] Broadcast throttling to prevent network congestion (max 1 leaderboard update per second per room).
- [ ] Server-side time delta calculation to prevent client-side cheating.

### 🛡️ Reliability & Security
- [ ] Graceful handle of disconnections (players can rejoin using the same PIN + Nickname).
- [ ] Secure Host Dashboard (Master privileges assigned only to the socket that created the session).

---
> [!TIP]
> **Pro Tip:** Make sure the transition between the "Waiting Lobby" and the "Play Page" is smooth for all connected sockets when the host clicks "Start".
