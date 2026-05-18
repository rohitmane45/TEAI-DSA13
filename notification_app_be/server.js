const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config({ path: '../.env' }); // Load env variables from project root

const loggingMiddleware = require('../logging_middleware/middleware');
const { logToServer } = require('../logging_middleware/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and parsing of request bodies
app.use(cors());
app.use(express.json());

// Register the logging middleware globally to log all requests
app.use(loggingMiddleware);

// Local variables to cache token and manage API urls
const AUTH_URL = process.env.TEST_SERVER_AUTH_URL;
const NOTIFICATIONS_URL = process.env.TEST_SERVER_NOTIFICATIONS_URL;

let apiToken = null;
let apiTokenExpiry = 0;

/**
 * Retrieve authorization token from test server with credentials.
 */
async function fetchToken() {
  const now = Date.now();
  if (apiToken && apiTokenExpiry > now + 10000) {
    return apiToken;
  }

  const payload = {
    email: process.env.EMAIL,
    name: process.env.NAME,
    rollNo: process.env.ROLL_NO,
    accessCode: process.env.ACCESS_CODE,
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  };

  try {
    const response = await axios.post(AUTH_URL, payload);
    if (response.status === 201 && response.data.access_token) {
      apiToken = response.data.access_token;
      const expiresAt = response.data.expires_in;
      apiTokenExpiry = expiresAt ? expiresAt * 1000 : Date.now() + 5 * 60 * 1000;
      return apiToken;
    }
  } catch (error) {
    const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    await logToServer('fatal', 'controller', `Auth failed: ${errMsg}`);
    throw new Error('Test server authentication failed');
  }
}

/**
 * Assign a priority weight based on notification type/category.
 * placement (3) > result (2) > event (1)
 */
function getWeight(notif) {
  const type = (notif.Type || notif.type || notif.category || '').toLowerCase();
  if (type.includes('placement')) return 3;
  if (type.includes('result')) return 2;
  if (type.includes('event')) return 1;
  return 0;
}

/**
 * Extract timestamp as a Unix millisecond value.
 */
function getTimestamp(notif) {
  const tsStr = notif.Timestamp || notif.timestamp || notif.createdAt;
  if (!tsStr) return 0;
  // Robust ISO parse for space-separated SQL datetimes
  const parsed = Date.parse(tsStr.replace(' ', 'T'));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Custom comparison function for prioritizing notifications in the Min-Heap.
 * Returns negative if a < b (lower priority), positive if a > b (higher priority).
 */
function compareNotifications(a, b) {
  const wA = getWeight(a.data);
  const wB = getWeight(b.data);

  if (wA !== wB) {
    return wA - wB; 
  }

  const tA = getTimestamp(a.data);
  const tB = getTimestamp(b.data);
  
  if (tA !== tB) {
    return tA - tB;
  }
  
  return a.counter - b.counter;
}

/**
 * Custom Min-Heap implementation to maintain the Top N elements efficiently.
 */
class MinHeap {
  constructor(capacity, compare) {
    this.capacity = capacity;
    this.compare = compare;
    this.heap = [];
  }

  push(item) {
    if (this.heap.length < this.capacity) {
      this.heap.push(item);
      this._bubbleUp(this.heap.length - 1);
    } else if (this.compare(item, this.heap[0]) > 0) {
      // Replace root if new item is higher priority than lowest in top N
      this.heap[0] = item;
      this._bubbleDown(0);
    }
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[index], this.heap[parent]) < 0) {
        this._swap(index, parent);
        index = parent;
      } else {
        break;
      }
    }
  }

  _bubbleDown(index) {
    const len = this.heap.length;
    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      if (left < len && this.compare(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < len && this.compare(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }

      if (smallest !== index) {
        this._swap(index, smallest);
        index = smallest;
      } else {
        break;
      }
    }
  }

  _swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  getSortedList() {
    return [...this.heap].sort((a, b) => this.compare(b, a)).map(item => item.data);
  }
}

/**
 * Route: GET /notifications/priority
 * Fetches the raw notifications, processes them, and returns the top n priority ones.
 */
app.get('/notifications/priority', async (req, res) => {
  const n = parseInt(req.query.n, 10) || 10;
  
  try {
    const token = await fetchToken();
    const headers = { Authorization: `Bearer ${token}` };
    
    const response = await axios.get(NOTIFICATIONS_URL, { headers });
    const rawNotifications = response.data.notifications || [];
    
    // Initialize Min-Heap of capacity n
    const heap = new MinHeap(n, compareNotifications);
    
    let counter = 0;
    for (const notif of rawNotifications) {
      counter++;
      heap.push({
        data: notif,
        counter: counter
      });
    }
    
    const priorityNotifications = heap.getSortedList();
    
    res.json({
      success: true,
      count: priorityNotifications.length,
      requestedSize: n,
      notifications: priorityNotifications
    });
  } catch (error) {
    const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    await logToServer('error', 'controller', `Priority fetch failed: ${errMsg}`);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve or process priority notifications',
      error: error.message
    });
  }
});

// Start the Express app
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  logToServer('info', 'controller', `Server initialized on port ${PORT}`).catch(console.error);
});
