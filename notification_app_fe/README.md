# notification_app_fe

React + TypeScript + Vite frontend for the **Campus Notification Priority Inbox System**.

## Overview

This is the UI layer of the full-stack notification system. It consumes the Express backend at `http://localhost:5000` and presents a dark-mode dashboard with two views:

- **All Notifications** — Paginated, filterable feed of all campus alerts.
- **Priority Inbox** — Real-time top-N list powered by the backend's Min-Heap algorithm.

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Material UI (MUI) v6
- Axios (HTTP client)

## Setup

```bash
npm install
npm run dev
```

> Ensure the backend (`notification_app_be`) is running on port **5000** before launching the frontend.

## Environment

No `.env` required for the frontend. All API calls target `http://localhost:5000`.

For full project setup, architecture details, and API documentation, see the [root README](../README.md).
