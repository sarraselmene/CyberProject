# CyberProject

Application web éducative de cybersécurité — Projet universitaire.

## Stack technique
- **Frontend** : React 18 + Vite + React Router
- **Backend** : FastAPI (Python)
- **Communication** : REST API (JSON + fichiers multipart)

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

- Frontend : http://localhost:5173
- API Docs : http://localhost:8000/docs

## Modules

| Interface | Route |
|-----------|-------|
| Accueil | `/` |
| RSA Cryptography | `/rsa` |
| ECC Cryptography | `/ecc` |
| RSA Attack | `/rsa-attack` |
| ECC Attack | `/ecc-attack` |


