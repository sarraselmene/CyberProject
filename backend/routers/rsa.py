from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io
import math

router = APIRouter()

# In-memory key storage (single active key pair)
_key_store = {"public": None, "private": None}


# ─── Helpers ───────────────────────────────────────────────────────────────

def is_prime(n: int) -> bool:
    if n < 2:
        return False
    if n < 4:
        return True
    if n % 2 == 0 or n % 3 == 0:
        return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0:
            return False
        i += 6
    return True


def mod_inverse(e: int, phi: int) -> int:
    """Extended Euclidean Algorithm to find modular inverse."""
    g, x, _ = extended_gcd(e, phi)
    if g != 1:
        raise ValueError("Modular inverse does not exist")
    return x % phi


def extended_gcd(a: int, b: int):
    if a == 0:
        return b, 0, 1
    g, x, y = extended_gcd(b % a, a)
    return g, y - (b // a) * x, x


def encrypt_block(block: int, e: int, n: int) -> int:
    return pow(block, e, n)


def decrypt_block(block: int, d: int, n: int) -> int:
    return pow(block, d, n)


def bytes_to_int(b: bytes) -> int:
    return int.from_bytes(b, byteorder="big")


def int_to_bytes(i: int, length: int) -> bytes:
    return i.to_bytes(length, byteorder="big")


# ─── Models ────────────────────────────────────────────────────────────────

class KeyGenRequest(BaseModel):
    p: int
    q: int
    e: int


class KeyGenResponse(BaseModel):
    public_key: dict
    private_key: dict
    n: int
    phi: int
    message: str


# ─── Routes ────────────────────────────────────────────────────────────────

@router.post("/generate-key", response_model=KeyGenResponse)
def generate_key(req: KeyGenRequest):
    p, q, e = req.p, req.q, req.e

    if not is_prime(p):
        raise HTTPException(status_code=400, detail=f"{p} n'est pas un nombre premier.")
    if not is_prime(q):
        raise HTTPException(status_code=400, detail=f"{q} n'est pas un nombre premier.")
    if p == q:
        raise HTTPException(status_code=400, detail="p et q doivent être différents.")

    n = p * q
    phi = (p - 1) * (q - 1)

    if math.gcd(e, phi) != 1:
        raise HTTPException(
            status_code=400,
            detail=f"e={e} n'est pas valide : pgcd(e, φ(n)) = {math.gcd(e, phi)} ≠ 1"
        )

    d = mod_inverse(e, phi)

    _key_store["public"] = {"e": e, "n": n}
    _key_store["private"] = {"d": d, "n": n}

    return KeyGenResponse(
        public_key={"e": e, "n": n},
        private_key={"d": d, "n": n},
        n=n,
        phi=phi,
        message="Clé RSA générée avec succès"
    )


@router.post("/encrypt-file")
async def encrypt_file(file: UploadFile = File(...)):
    if _key_store["public"] is None:
        raise HTTPException(status_code=400, detail="Aucune clé publique disponible. Générez d'abord une clé RSA.")

    e = _key_store["public"]["e"]
    n = _key_store["public"]["n"]

    # block size: floor((bit_length(n) - 1) / 8) bytes per block
    block_size = (n.bit_length() - 1) // 8
    if block_size < 1:
        raise HTTPException(status_code=400, detail="La clé RSA est trop petite pour chiffrer des fichiers.")

    raw = await file.read()

    encrypted_blocks = []
    for i in range(0, len(raw), block_size):
        chunk = raw[i:i + block_size]
        m = bytes_to_int(chunk)
        c = encrypt_block(m, e, n)
        # Store each ciphertext as fixed-width (n byte-length + 1 for safety)
        cipher_block_size = (n.bit_length() + 7) // 8
        encrypted_blocks.append(int_to_bytes(c, cipher_block_size))

    # Prepend metadata: original length (8 bytes) + block_size (4 bytes)
    import struct
    metadata = struct.pack(">QI", len(raw), block_size)
    output = metadata + b"".join(encrypted_blocks)

    return StreamingResponse(
        io.BytesIO(output),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename=encrypted_{file.filename}.rsa"}
    )


@router.post("/decrypt-file")
async def decrypt_file(file: UploadFile = File(...)):
    if _key_store["private"] is None:
        raise HTTPException(status_code=400, detail="Aucune clé privée disponible. Générez d'abord une clé RSA.")

    d = _key_store["private"]["d"]
    n = _key_store["private"]["n"]

    import struct
    raw = await file.read()

    # Read metadata
    metadata_size = 8 + 4  # 8 bytes original length + 4 bytes block_size
    if len(raw) < metadata_size:
        raise HTTPException(status_code=400, detail="Fichier chiffré invalide ou corrompu.")

    original_length, block_size = struct.unpack(">QI", raw[:metadata_size])
    cipher_data = raw[metadata_size:]

    cipher_block_size = (n.bit_length() + 7) // 8
    decrypted = bytearray()

    for i in range(0, len(cipher_data), cipher_block_size):
        chunk = cipher_data[i:i + cipher_block_size]
        if len(chunk) == 0:
            break
        c = bytes_to_int(chunk)
        m = decrypt_block(c, d, n)
        decrypted.extend(int_to_bytes(m, block_size))

    # Trim to original length
    decrypted = bytes(decrypted[:original_length])

    # Guess original filename
    original_name = file.filename
    if original_name.endswith(".rsa"):
        original_name = original_name[len("encrypted_"):-4] if original_name.startswith("encrypted_") else original_name[:-4]

    return StreamingResponse(
        io.BytesIO(decrypted),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename=decrypted_{original_name}"}
    )


@router.get("/current-key")
def get_current_key():
    if _key_store["public"] is None:
        return {"has_key": False}
    return {
        "has_key": True,
        "public_key": _key_store["public"],
        "private_key": _key_store["private"]
    }
