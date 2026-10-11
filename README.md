# WIRK: Turn Intent into Execution

> **Open-Source Executive AI Workspace, 5-Stage Kanban Architecture & Zero-Knowledge Cryptography**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Web Crypto](https://img.shields.io/badge/Cryptography-AES--GCM--256-emerald)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

**WIRK** (*Workspace for Intent, Reflection & Kinetic action* — derived from German *Wirkung*) is an open-source, local-first executive command center engineered to eliminate cognitive friction between planning and execution.

---

## ⚡ Core Architecture

* **🤖 Autonomous AI Companion (ARIA)**: Natural language to structured execution. Decompose loose ideas into prioritized projects, schedule daily itineraries, and resolve circular blockers with atomic human-in-the-loop approvals.
* **📊 5-Stage Linear Kanban**: `BACKLOG` → `TODO` → `IN_PROGRESS` → `IN_REVIEW` → `DONE` with fractional index rebalancing and decoupled blocker tracking.
* **🔒 Zero-Knowledge Cryptography**: Private diary entries and retrospective reviews are encrypted client-side using Web Crypto **AES-GCM-256** with PBKDF2 key derivation.
* **⏱️ Focus Velocity & Pomodoro Engine**: Deep work blocks linked directly to active deliverables, tracking real cognitive momentum instead of idle screen time.
* **💻 100% Local-First & Privacy-Sovereign**: Runs out of the box in your browser using local storage with zero tracking, telemetry, or mandatory cloud dependencies.

---

## 🚀 Quick Start (Zero Setup)

WIRK Community Edition runs as a standalone progressive web application right out of the box.

```bash
# 1. Clone the repository
git clone https://github.com/bilalsabugar/wirk.git
cd wirk

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open **`http://localhost:5173`** in your browser. All tasks and projects will immediately persist to your local browser storage.

---

## 🔑 Bring Your Own Key (BYOK) AI Setup

To activate the autonomous ARIA AI companion, simply add your free Google Gemini API key:

1. Obtain a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Open **WIRK** → Click your **Profile** or press `⌘K` → Select **Settings** → **AI Keys & BYOK**.
3. Paste your key and click **Save Key**.
4. WIRK connects directly to Gemini's low-latency endpoints with zero middleman servers.

---

## 🌐 Community Edition vs. Cloud Edition

| Feature | WIRK Community (Open Source) | WIRK Cloud (Hosted SaaS) |
| :--- | :--- | :--- |
| **License** | MIT (Free Forever) | Commercial Hosted |
| **Deployment** | Self-Hosted / Localhost / Static | Managed Global CDN |
| **AI Provider** | BYOK (Your Gemini Key) | Managed Quotas & Auto-Routing |
| **Storage** | Local-First (IndexedDB / LocalStorage) | Managed Firestore Sync & Cloud Backup |
| **Telemetry** | 0% (Zero Trackers) | Anonymized Performance Metrics |
| **Cost** | **$0.00** | $9/mo or $39 Lifetime Pass |

---

## 🛠️ Tech Stack

* **Frontend**: React 19, Lucide Icons, Modern View Transitions
* **Build System**: Vite 5.4, PostCSS, Tailwind CSS
* **Cryptography**: Native Web Cryptography API (`crypto.subtle`, AES-GCM-256)
* **Storage Options**: LocalStorage (Default), Optional Firebase Firestore, Exportable JSON/CSV Backups

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or pull request to suggest improvements:

1. Fork the Project (`git checkout -b feature/AmazingFeature`)
2. Commit your Changes (`git commit -m 'feat: add amazing feature'`)
3. Push to the Branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

Engineered by **Bilal Sabugar** • [bilal.07.04.07@gmail.com](mailto:bilal.07.04.07@gmail.com)
