from fastapi import APIRouter

router = APIRouter()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  MEMBRE 4 — Elliptic Curve Attack
#  → Travaillez dans ce fichier : backend/routers/ecc_attack.py
#  → Vos routes seront accessibles sur /api/ecc-attack/...
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/status")
def ecc_attack_status():
    return {"module": "ECC Attack", "status": "À implémenter par le membre 4"}

# TODO Membre 4 : Ajoutez vos routes d'attaque ECC ici
# Exemples de routes à implémenter :
# POST /baby-step-giant-step  → algorithme BSGS sur ECDLP
# POST /pohlig-hellman        → attaque Pohlig-Hellman
