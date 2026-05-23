# AnomalyGuard — Fraud & Intrusion Detection System

A production-ready full-stack anomaly detection system built with Isolation Forest ML, FastAPI, React, and SQLite/PostgreSQL.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| ML Model   | Isolation Forest (scikit-learn)     |
| Backend    | FastAPI + SQLAlchemy (async)        |
| Database   | SQLite (dev) / PostgreSQL (prod)    |
| Auth       | JWT (python-jose + bcrypt)          |
| Frontend   | React 18 + Vite + Tailwind CSS      |
| Charts     | Recharts                            |
| Real-time  | WebSockets                          |
| Deploy     | Docker + Render + Vercel            |

---

## Project Structure

```
anomaly-detection/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── make_admin.py
│   └── app/
│       ├── core/       config, database, security
│       ├── ml/         predictor (model inference)
│       ├── models/     user, prediction (ORM)
│       ├── routers/    auth, predict, history, admin, ws
│       └── schemas/    pydantic request/response models
├── model/
│   ├── scripts/train_model.py
│   ├── requirements.txt
│   └── saved/          generated after training
├── frontend/
│   ├── src/
│   │   ├── pages/      Login, Register, Dashboard, Predict, Upload, History, Admin
│   │   ├── components/ Layout (sidebar)
│   │   ├── store/      Zustand auth store
│   │   ├── hooks/      useWebSocket
│   │   └── utils/      api.js, pdfReport.js
│   └── package.json
├── docker/
│   └── Dockerfile.backend
├── docker-compose.yml
└── README.md
```

---

## Local Setup (Step by Step)

### Prerequisites
- Python 3.11+
- Node.js 20+  →  https://nodejs.org (download LTS)
- Git  →  https://git-scm.com

---

### Step 1 — Train the ML Model

Open a terminal in the project root:

```bash
cd model
pip install -r requirements.txt
python scripts/train_model.py
```

Expected output:
```
Generating dataset...
Training Isolation Forest (200 trees)...
ROC-AUC: 0.9998
Model saved to: model/saved/
```

This creates 5 files inside `model/saved/`.

---

### Step 2 — Start the Backend

Open a NEW terminal:

```bash
cd backend
pip install -r requirements.txt
copy .env.example .env        # Windows
# cp .env.example .env        # Mac/Linux
uvicorn main:app --reload --port 8000
```

Visit http://localhost:8000/docs to confirm it works (Swagger UI).

---

### Step 3 — Start the Frontend

Open another NEW terminal:

```bash
cd frontend
copy .env.example .env        # Windows
# cp .env.example .env        # Mac/Linux
npm install
npm run dev
```

Visit http://localhost:5173

---



## API Endpoints

| Method | Endpoint           | Auth   | Description              |
|--------|--------------------|--------|--------------------------|
| POST   | /auth/register     | No     | Create account           |
| POST   | /auth/login        | No     | Get JWT token            |
| GET    | /auth/me           | JWT    | Current user             |
| POST   | /predict/          | JWT    | Single prediction        |
| POST   | /predict/upload    | JWT    | Batch CSV prediction     |
| GET    | /history           | JWT    | Prediction history       |
| GET    | /admin/stats       | Admin  | System statistics        |
| WS     | /ws/live           | No     | Live event stream        |
| GET    | /health            | No     | Health check             |

---

## ML Model Details

- **Algorithm:** Isolation Forest (unsupervised)
- **Training data:** 50,000 synthetic transactions (2% fraud)
- **ROC-AUC:** 0.9998
- **Features:** amount, hour, day_of_week, merchant_cat, distance_km, trans_per_day, balance_ratio, is_international, velocity_1h + 4 engineered features
- **Output:** anomaly_score (0–1), risk_level (LOW/MEDIUM/HIGH/CRITICAL), is_anomaly (bool)

---


