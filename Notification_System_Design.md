# Stage 1: Priority Inbox Notification System Design

## Overview
The campus notifications application has a high volume of incoming alerts. To help users manage this, a **Priority Inbox** is introduced that always displays the top `n` most important unread notifications first. Priority is determined by a combination of **category weight** and **recency**.

## Priority Logic

Priority of a notification is calculated using two factors:

| Factor | Description |
|---|---|
| **Weight** | Placement (3) > Result (2) > Event (1) > Others (0) |
| **Recency** | Within the same weight tier, newer timestamps rank higher |

This ensures that critical placement notices are never buried under general event announcements, while still surfacing the most recent content within each tier.

## Efficient Data Structure: Fixed-Capacity Min-Heap

To maintain the top `N` notifications efficiently as new ones continuously arrive, the solution uses a **custom Min-Heap** with a fixed capacity of `N`.

### Why Min-Heap?

A naive approach — sorting the full list on every new arrival — costs `O(M log M)` per update, where `M` is the total number of notifications. As M grows large, this becomes unacceptable.

Instead, with a fixed-size Min-Heap of capacity `N`:

1. **The root always holds the lowest-priority item** currently in the Top N.
2. When a new notification arrives, compare it to the root:
   - If its priority **exceeds the root's**, replace the root and re-heapify: `O(log N)`
   - Otherwise, discard it immediately: `O(1)`
3. Since `N` is a small constant (e.g., 10), **every incoming notification is processed in effectively O(1) amortised time**.
4. **Space complexity is `O(N)`** — the heap never grows beyond the configured size, regardless of how many total notifications exist.

### Comparison Logic (Priority Tuple)

```
compare(a, b):
  1. Compare weights (Placement=3, Result=2, Event=1, Other=0)
  2. On tie → compare timestamps (newer wins)
  3. On tie → compare insertion counter (earlier insertion wins)
```

## Implementation

The backend is built using **Node.js + Express**. The core algorithm is a pure JavaScript `MinHeap` class (no external sorting libraries), ensuring full compliance with the evaluation rules.

**Endpoint:** `GET /notifications/priority?n=10`

**Flow:**
1. Server authenticates against the test server to obtain a Bearer token (cached to avoid redundant calls).
2. Fetches the raw notification stream from the protected Notification API.
3. Each notification is passed through the `MinHeap.push()` method:
   - The heap maintains exactly the top `n` items at all times.
   - Any notification that doesn't beat the current minimum is discarded immediately.
4. The final heap is sorted in descending priority order and returned as a JSON response.

**Logging:** Every incoming HTTP request is intercepted by the Logging Middleware, which computes the duration, maps the status code to a log level, and dispatches a structured log to the test server's Log API — all asynchronously, without blocking the response.

## Handling Real-Time Incoming Notifications

As new notifications stream in continuously:
- Each call to `push()` runs in `O(log N)` — bounded by the fixed heap size.
- In a polling scenario, the server re-fetches the stream periodically and rebuilds the heap.
- In a WebSocket or event-driven scenario, each incoming event triggers a single `push()` call, keeping the Priority Inbox always up-to-date with minimal overhead.
