# Task 6: Leaderboard Logic (Redis ZSET)

**Relevant Docs:**
- `system_design.md`: Redis components.
- `detail_design.md`: Section 4 (Real-time Ranking).

## Objective
Utilize Redis Sorted Sets to maintain high-performance ranking and broadcast leaderboard updates to all participants.

## Detailed Steps

1. **Score Update (Redis ZSET)**:
   - When a correct answer is validated in Task 5, execute `ZINCRBY quiz:{quiz_id}:leaderboard <points> <user_id>`.

2. **Leaderboard Retrieval**:
   - Implement a method to fetch the top 10-20 scores using `ZREVRANGE ... WITHSCORES`.
   - Enrich user IDs with usernames from the database/cache for display.

3. **Throttled Broadcasting**:
   - Implement a throttler (e.g., max once every 500ms - 1s per quiz) to avoid flooding the network with leaderboard updates.
   - Broadcast the `leaderboard_update` event to the room with the latest standings.

## Acceptance Criteria
- [ ] Redis correctly sorts users by score in descending order.
- [ ] All clients in a room receive the `leaderboard_update` event.
- [ ] Updates are throttled to ensure system stability under high load.
