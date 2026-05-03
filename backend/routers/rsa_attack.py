from fastapi import APIRouter

router = APIRouter()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  MEMBRE 3 — RSA Attack
#  → Travaillez dans ce fichier : backend/routers/rsa_attack.py
#  → Vos routes seront accessibles sur /api/rsa-attack/...
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/status")
def rsa_attack_status():
    return {"module": "RSA Attack", "status": "À implémenter par le membre 3"}

# TODO Membre 3 : Ajoutez vos routes d'attaque RSA ici
# Exemples de routes à implémenter :
# POST /brute-force      → attaque force brute sur petites clés
# POST /factorize        → factorisation de n pour trouver p et q
# POST /wiener           → attaque de Wiener (petit d)
