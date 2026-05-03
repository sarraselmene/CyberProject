from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import os
import io
import json
import hashlib
import secrets
import struct

router = APIRouter(prefix="/api/ecc", tags=["ECC"])

# ─────────────────────────────────────────────
#  Courbe secp256k1 (paramètres)
# ─────────────────────────────────────────────
P  = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
A  = 0
B  = 7
Gx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798
Gy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8
N  = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141

G = (Gx, Gy)

# ─────────────────────────────────────────────
#  Arithmétique sur la courbe
# ─────────────────────────────────────────────

def modinv(a: int, m: int) -> int:
    """Inverse modulaire via algorithme d'Euclide étendu."""
    if a == 0:
        raise ValueError("Pas d'inverse pour 0")
    lm, hm = 1, 0
    low, high = a % m, m
    while low > 1:
        ratio = high // low
        nm = hm - lm * ratio
        new = high - low * ratio
        lm, low, hm, high = nm, new, lm, low
    return lm % m


def point_add(P1, P2):
    """Addition de deux points sur la courbe elliptique."""
    if P1 is None:
        return P2
    if P2 is None:
        return P1
    x1, y1 = P1
    x2, y2 = P2
    if x1 == x2:
        if y1 != y2:
            return None  # Point à l'infini
        # Doublement
        lam = (3 * x1 * x1 + A) * modinv(2 * y1, P) % P
    else:
        lam = (y2 - y1) * modinv(x2 - x1, P) % P
    x3 = (lam * lam - x1 - x2) % P
    y3 = (lam * (x1 - x3) - y1) % P
    return (x3, y3)


def scalar_mult(k: int, point):
    """Multiplication scalaire par double-and-add."""
    result = None
    addend = point
    while k:
        if k & 1:
            result = point_add(result, addend)
        addend = point_add(addend, addend)
        k >>= 1
    return result


# ─────────────────────────────────────────────
#  État en mémoire (clé active)
# ─────────────────────────────────────────────

_current_key: dict = {}


# ─────────────────────────────────────────────
#  Schémas Pydantic
# ─────────────────────────────────────────────

class KeyResponse(BaseModel):
    private_key: str
    public_key_x: str
    public_key_y: str
    curve: str
    message: str


class CurrentKeyResponse(BaseModel):
    has_key: bool
    public_key_x: Optional[str] = None
    public_key_y: Optional[str] = None
    curve: Optional[str] = None


# ─────────────────────────────────────────────
#  Routes
# ─────────────────────────────────────────────

@router.post("/generate-key", response_model=KeyResponse)
def generate_key():
    """Génère une paire de clés ECC sur secp256k1."""
    global _current_key

    # Clé privée : entier aléatoire dans [1, N-1]
    private_k = secrets.randbelow(N - 1) + 1

    # Clé publique : Q = k * G
    public_Q = scalar_mult(private_k, G)
    if public_Q is None:
        raise HTTPException(status_code=500, detail="Erreur lors du calcul de la clé publique")

    Qx, Qy = public_Q

    _current_key = {
        "private_key": hex(private_k),
        "public_key_x": hex(Qx),
        "public_key_y": hex(Qy),
        "curve": "secp256k1",
    }

    return KeyResponse(
        private_key=hex(private_k),
        public_key_x=hex(Qx),
        public_key_y=hex(Qy),
        curve="secp256k1",
        message="Paire de clés ECC générée avec succès sur secp256k1",
    )


@router.get("/current-key", response_model=CurrentKeyResponse)
def get_current_key():
    """Retourne la clé publique active en mémoire."""
    if not _current_key:
        return CurrentKeyResponse(has_key=False)
    return CurrentKeyResponse(
        has_key=True,
        public_key_x=_current_key.get("public_key_x"),
        public_key_y=_current_key.get("public_key_y"),
        curve=_current_key.get("curve"),
    )


@router.post("/encrypt-file")
async def encrypt_file(
    file: UploadFile = File(...),
    pub_x: str = "",
    pub_y: str = "",
):
    """
    Chiffre un fichier via ECIES (ECC + AES-CTR).
    
    Paramètres (form-data) :
      - file   : fichier à chiffrer
      - pub_x  : coordonnée X de la clé publique (hex)
      - pub_y  : coordonnée Y de la clé publique (hex)
    
    Si pub_x/pub_y sont vides, utilise la clé active en mémoire.
    """
    # Résoudre la clé publique
    if pub_x and pub_y:
        try:
            Qx = int(pub_x, 16)
            Qy = int(pub_y, 16)
        except ValueError:
            raise HTTPException(status_code=400, detail="Clé publique invalide (format hex attendu)")
    elif _current_key:
        Qx = int(_current_key["public_key_x"], 16)
        Qy = int(_current_key["public_key_y"], 16)
    else:
        raise HTTPException(
            status_code=400,
            detail="Aucune clé publique fournie. Générez d'abord une paire de clés."
        )

    Q = (Qx, Qy)

    # Lire le fichier
    plaintext = await file.read()
    original_name = file.filename or "file"

    # ── ECIES ──────────────────────────────────────────────
    # 1. Clé éphémère r aléatoire
    r = secrets.randbelow(N - 1) + 1

    # 2. Point éphémère C1 = r * G
    C1 = scalar_mult(r, G)
    if C1 is None:
        raise HTTPException(status_code=500, detail="Erreur ECIES : point éphémère nul")

    # 3. Secret partagé S = r * Q
    S = scalar_mult(r, Q)
    if S is None:
        raise HTTPException(status_code=500, detail="Erreur ECIES : secret partagé nul")

    # 4. Dériver clé AES via SHA-256(Sx)
    shared_x_bytes = S[0].to_bytes(32, "big")
    aes_key = hashlib.sha256(shared_x_bytes).digest()  # 32 octets → AES-256

    # 5. Chiffrement AES-CTR (implémentation légère sans dépendance externe)
    nonce = secrets.token_bytes(16)
    ciphertext = _aes_ctr_crypt(aes_key, nonce, plaintext)

    # ── Sérialisation du fichier chiffré ───────────────────
    # Format :  [4B nom_len][nom][32B C1x][32B C1y][16B nonce][reste = ciphertext]
    name_bytes = original_name.encode("utf-8")
    name_len = len(name_bytes)

    out = io.BytesIO()
    out.write(struct.pack(">I", name_len))
    out.write(name_bytes)
    out.write(C1[0].to_bytes(32, "big"))
    out.write(C1[1].to_bytes(32, "big"))
    out.write(nonce)
    out.write(ciphertext)
    out.seek(0)

    return StreamingResponse(
        out,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{original_name}.ecc"'},
    )


@router.post("/decrypt-file")
async def decrypt_file(
    file: UploadFile = File(...),
    private_key: str = "",
):
    """
    Déchiffre un fichier chiffré par ECIES.
    
    Paramètres (form-data) :
      - file        : fichier .ecc à déchiffrer
      - private_key : clé privée en hex
    
    Si private_key est vide, utilise la clé active en mémoire.
    """
    # Résoudre la clé privée
    if private_key:
        try:
            k = int(private_key, 16)
        except ValueError:
            raise HTTPException(status_code=400, detail="Clé privée invalide (format hex attendu)")
    elif _current_key:
        k = int(_current_key["private_key"], 16)
    else:
        raise HTTPException(
            status_code=400,
            detail="Aucune clé privée fournie. Générez d'abord une paire de clés."
        )

    # Lire le fichier chiffré
    data = await file.read()

    try:
        offset = 0
        # Lire le nom original
        (name_len,) = struct.unpack_from(">I", data, offset)
        offset += 4
        original_name = data[offset:offset + name_len].decode("utf-8")
        offset += name_len

        # Lire C1
        C1x = int.from_bytes(data[offset:offset + 32], "big")
        offset += 32
        C1y = int.from_bytes(data[offset:offset + 32], "big")
        offset += 32
        C1 = (C1x, C1y)

        # Lire nonce
        nonce = data[offset:offset + 16]
        offset += 16

        ciphertext = data[offset:]
    except Exception:
        raise HTTPException(status_code=400, detail="Fichier chiffré corrompu ou format invalide")

    # ── ECIES déchiffrement ─────────────────────────────────
    # Secret partagé S = k * C1  (car C1 = r*G, donc k*C1 = k*r*G = r*k*G = r*Q)
    S = scalar_mult(k, C1)
    if S is None:
        raise HTTPException(status_code=500, detail="Erreur ECIES : secret partagé nul lors du déchiffrement")

    shared_x_bytes = S[0].to_bytes(32, "big")
    aes_key = hashlib.sha256(shared_x_bytes).digest()

    plaintext = _aes_ctr_crypt(aes_key, nonce, ciphertext)

    return StreamingResponse(
        io.BytesIO(plaintext),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{original_name}"'},
    )


# ─────────────────────────────────────────────
#  Utilitaire AES-CTR (sans pycryptodome)
# ─────────────────────────────────────────────

def _aes_ctr_crypt(key: bytes, nonce: bytes, data: bytes) -> bytes:
    """
    AES-CTR chiffrement/déchiffrement (symétrique).
    Utilise le module 'cryptography' de Python si disponible,
    sinon fallback sur une implémentation XOR basique avec SHA-256
    (pour usage éducatif uniquement).
    """
    try:
        from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
        from cryptography.hazmat.backends import default_backend
        cipher = Cipher(
            algorithms.AES(key),
            modes.CTR(nonce),
            backend=default_backend(),
        )
        enc = cipher.encryptor()
        return enc.update(data) + enc.finalize()
    except ImportError:
        # Fallback éducatif : keystream via SHA-256 (non sécurisé en prod)
        keystream = b""
        counter = 0
        while len(keystream) < len(data):
            block = hashlib.sha256(key + nonce + counter.to_bytes(4, "big")).digest()
            keystream += block
            counter += 1
        return bytes(a ^ b for a, b in zip(data, keystream[: len(data)]))
