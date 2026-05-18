# Stage 1: Priority Inbox Notification System Design

## Overview
The goal of this module is to implement a **Priority Inbox** for campus notifications. Due to the high volume of incoming alerts, the system must always display the top `n` (configured to 10 by default) most important unread notifications.

## Priority Logic
The priority of a notification is calculated using a combination of its category weight and its recency:
1. **Weight (Category-based):** 
   - `Placement` -> Weight: 3 (High)
   - `Result` -> Weight: 2 (Medium)
   - `Event` -> Weight: 1 (Low)
   - `Others` -> Weight: 0
2. **Recency:** Newer notifications (higher timestamp) are prioritized over older ones within the same weight category.

## Efficient Data Structure: Min-Heap
To maintain the top 10 notifications efficiently as a continuous stream of new notifications arrives, the solution uses a custom **Min-Heap (Priority Queue)** with a fixed capacity `N` (where N=10).

### Why Min-Heap?
If we were to sort the entire list of notifications every time a new one arrived, it would take `O(M log M)` time where `M` is the total number of notifications. For a high volume of incoming notifications streaming in continuously, this is not scalable and consumes unnecessary CPU cycles and memory.

By maintaining a fixed-size Min-Heap of size `N`:
1. **Insertion/Update Time:** When a new notification arrives, we only need to compare it against the *root* of the Min-Heap. The root inherently represents the **lowest priority** notification that currently sits in the Top 10.
2. If the new incoming notification has a higher priority than the root, we perform a `heappushpop` operation: we remove the root and insert the new notification. This operation takes `O(log N)` time. 
3. Since `N=10` is a small constant, the update effectively takes `O(1)` time per incoming notification.
4. **Space Complexity:** The space is strictly limited to `O(N)`, completely avoiding the memory bloat of storing thousands of irrelevant or historical notifications.

## System Workflow
1. **Fetching Module:** Connects to the protected Notification API using the `Authorization: Bearer <TOKEN>` header obtained dynamically using the client registration credentials.
2. **Weight Assignment (`get_weight`):** Parsers examine the `type` or `category` property of the notification payload and assign an integer weight (3, 2, 1, or 0).
3. **Stream Processing (`PriorityInbox` Class / `MinHeap` Class):** 
   - Receives notifications iteratively.
   - Computes a priority tuple: `(Weight, Timestamp, Counter, Notification Data)`.
   - Compares the tuple to the existing items in the Min-Heap to determine if it earns a spot in the Top 10.
4. **Output Generation:** Sorts the final 10 elements in descending order (highest weight/newest first) for the UI or API payload response.

## Handling Real-time Data
In a production environment, this processor runs continuously. It can be attached to a WebSocket listener or a polling background worker. As each notification object streams in, `push()` is executed, dynamically and instantly updating the internal heap with near-zero latency and minimal CPU overhead.
