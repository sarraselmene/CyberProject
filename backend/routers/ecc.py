from fastapi import APIRouter

router = APIRouter()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  MEMBRE 2 — Elliptic Curve Cryptography
#  → Travaillez dans ce fichier : backend/routers/ecc.py
#  → Vos routes seront accessibles sur /api/ecc/...
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/status")
def ecc_status():
    return {"module": "ECC", "status": "À implémenter par le membre 2"}

# TODO Membre 2 : Ajoutez vos routes ECC ici
# Exemples de routes à implémenter :
# POST /generate-key     → générer paire de clés ECC
# POST /encrypt-file     → chiffrer un fichier avec ECC
# POST /decrypt-file     → déchiffrer un fichier avec ECC
