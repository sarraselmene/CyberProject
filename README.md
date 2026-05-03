# CyberProject

Application web éducative de cybersécurité — Projet universitaire (équipe de 4).

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

| Interface | Route | Membre |
|-----------|-------|--------|
| Accueil | `/` | Membre 1 |
| RSA Cryptography | `/rsa` | Membre 1 |
| ECC Cryptography | `/ecc` | Membre 2 |
| RSA Attack | `/rsa-attack` | Membre 3 |
| ECC Attack | `/ecc-attack` | Membre 4 |

## Guide équipe

Voir `PROJECT_GUIDE.txt` pour les instructions détaillées par membre.
