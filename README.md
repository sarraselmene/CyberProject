# 🔐 CyberProject

Application web éducative dédiée à la cryptographie et à la cybersécurité — Projet universitaire ENSI 2026.

## Stack technique

| Couche | Technologie |
|--------|------------|
| **Frontend** | React 18 + Vite + React Router + Lucide React |
| **Backend** | FastAPI (Python 3.10+) |
| **Communication** | REST API (JSON + fichiers multipart) |
| **Cryptographie** | RSA, ECC (Elliptic Curve Cryptography) |

---

## Lancement rapide

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

- 🌐 Frontend : http://localhost:5173
- 📄 API Docs : http://localhost:8000/docs

---

## Modules

| Module | Route | Description |
|--------|-------|-------------|
| Accueil | `/` | Page principale |
| RSA Cryptography | `/rsa` | Chiffrement et déchiffrement RSA |
| ECC Cryptography | `/ecc` | Cryptographie sur courbes elliptiques |
| RSA Attack | `/rsa-attack` | Simulation d'attaques sur RSA |
| ECC Attack | `/ecc-attack` | Simulation d'attaques sur ECC |

---

## Structure du projet

```
CyberProject/
│
├── backend/
│   ├── main.py                  # Point d'entrée FastAPI
│   ├── requirements.txt
│   └── routers/
│       ├── rsa.py               # Endpoints RSA
│       ├── ecc.py               # Endpoints ECC
│       ├── rsa_attack.py        # Endpoints attaques RSA
│       └── ecc_attack.py        # Endpoints attaques ECC
│
└── frontend/
    ├── src/
    │   ├── pages/               # Composants par module
    │   └── main.jsx             # Entry point React
    ├── index.html
    └── vite.config.js
```

---

## 👤 Auteur

**Sarra Selmene** — Étudiante ingénieure, ENSI Tunisie  
Projet universitaire · 2026
