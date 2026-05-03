from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import math
import random
from fractions import Fraction

router = APIRouter()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  MEMBRE 3 — RSA Attack
#  Routes disponibles sur /api/rsa-attack/...
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


# ── Utilitaires mathématiques ────────────────────────────────────

def extended_gcd(a: int, b: int):
    if b == 0:
        return a, 1, 0
    g, x, y = extended_gcd(b, a % b)
    return g, y, x - (a // b) * y

def mod_inverse(e: int, phi: int) -> Optional[int]:
    g, x, _ = extended_gcd(e, phi)
    if g != 1:
        return None
    return x % phi

def isqrt(n: int) -> int:
    if n < 0:
        raise ValueError("Square root not defined for negative numbers")
    if n == 0:
        return 0
    x = n
    y = (x + 1) // 2
    while y < x:
        x = y
        y = (x + n // x) // 2
    return x

def is_perfect_square(n: int) -> Optional[int]:
    s = isqrt(n)
    if s * s == n:
        return s
    return None

def integer_nth_root(k: int, n: int) -> int:
    """Calcule la racine n-ième entière de k."""
    if k == 0:
        return 0
    # Newton's method
    x = int(round(k ** (1.0 / n)))
    # Adjust around the estimate
    while True:
        x1 = ((n - 1) * x + k // (x ** (n - 1))) // n
        if x1 >= x:
            break
        x = x1
    # Fine-tune
    while x ** n > k:
        x -= 1
    while (x + 1) ** n <= k:
        x += 1
    return x

def continued_fraction_expansion(num: int, den: int) -> List[int]:
    """Développement en fractions continues de num/den."""
    coeffs = []
    while den:
        q = num // den
        coeffs.append(q)
        num, den = den, num - q * den
    return coeffs

def convergents(coeffs: List[int]):
    """Génère les convergents d'un développement en fractions continues."""
    for i in range(1, len(coeffs) + 1):
        frac = Fraction(0)
        for c in reversed(coeffs[:i]):
            if frac == 0:
                frac = Fraction(c)
            else:
                frac = c + Fraction(1, frac)
        yield frac.numerator, frac.denominator

def crt(remainders: List[int], moduli: List[int]) -> int:
    """Théorème chinois des restes."""
    M = 1
    for m in moduli:
        M *= m
    result = 0
    for r, m in zip(remainders, moduli):
        Mi = M // m
        _, inv, _ = extended_gcd(Mi, m)
        inv = inv % m
        result += r * Mi * inv
    return result % M


# ── Modèles Pydantic ─────────────────────────────────────────────

class FactorizeRequest(BaseModel):
    n: int

class WienerRequest(BaseModel):
    e: int
    n: int

class HastadRequest(BaseModel):
    ciphertexts: List[int]   # [c1, c2, c3] — les 3 chiffrés
    moduli: List[int]         # [n1, n2, n3] — les 3 modules
    e: int = 3               # exposant public (3 par défaut)

class WeakKeyGenRequest(BaseModel):
    bits: int = 16           # taille de p et q (petit pour la démo)
    attack_type: str = "factorize"  # "factorize" | "wiener" | "hastad"


# ── Route status ─────────────────────────────────────────────────

@router.get("/status")
def rsa_attack_status():
    return {"module": "RSA Attack", "status": "✅ Implémenté — Membre 3"}


# ── 1. Génération de clés FAIBLES (pour la démo) ─────────────────

@router.post("/generate-weak-key")
def generate_weak_key(req: WeakKeyGenRequest):
    """
    Génère une paire de clés RSA intentionnellement faible pour la démo.
    - factorize : p et q de petite taille (bits=16 max)
    - wiener    : d choisi petit < n^0.25
    - hastad    : e=3, même message pour 3 clés différentes
    """
    steps = []

    if req.attack_type == "factorize":
        bits = min(req.bits, 20)  # cap à 20 bits pour la démo
        steps.append(f"Génération de p et q avec seulement {bits} bits chacun")

        def gen_prime(bits):
            while True:
                n = random.getrandbits(bits) | (1 << (bits - 1)) | 1
                if all(n % i != 0 for i in range(2, int(n**0.5) + 1)):
                    return n

        p = gen_prime(bits)
        q = gen_prime(bits)
        while q == p:
            q = gen_prime(bits)

        n = p * q
        phi = (p - 1) * (q - 1)
        e = 65537
        while math.gcd(e, phi) != 1:
            e = random.choice([3, 17, 257, 65537])
        d = mod_inverse(e, phi)

        steps.append(f"p = {p}, q = {q}")
        steps.append(f"n = p × q = {n}")
        steps.append(f"φ(n) = (p-1)(q-1) = {phi}")
        steps.append(f"e = {e}, d = {d}")
        steps.append("⚠️ Vulnérabilité : n est petit, factorisation triviale !")

        return {
            "attack_type": "factorize",
            "public_key": {"e": e, "n": n},
            "private_key": {"d": d, "p": p, "q": q},
            "steps": steps,
            "warning": f"n={n} peut être factorisé en quelques millisecondes !"
        }

    elif req.attack_type == "wiener":
        steps.append("Génération d'une clé RSA avec d petit (attaque de Wiener)")
        # On génère p et q normaux mais on choisit d < n^0.25
        bits = 32
        def gen_prime(bits):
            while True:
                n = random.getrandbits(bits) | (1 << (bits - 1)) | 1
                if all(n % i != 0 for i in range(2, min(1000, int(n**0.5) + 1))):
                    return n

        p = gen_prime(bits)
        q = gen_prime(bits)
        while q == p:
            q = gen_prime(bits)

        n = p * q
        phi = (p - 1) * (q - 1)

        # Choisir d petit < n^(1/4) / 3
        max_d = max(2, int(n**0.25) // 3)
        d = random.randint(2, max_d)
        while math.gcd(d, phi) != 1:
            d = random.randint(2, max_d)

        e = mod_inverse(d, phi)
        if e is None:
            e = 65537
            d = mod_inverse(e, phi)

        steps.append(f"p = {p}, q = {q}")
        steps.append(f"n = {n}")
        steps.append(f"d choisi = {d}  (seuil n^0.25 = {int(n**0.25)})")
        steps.append(f"e calculé = {e}")
        steps.append("⚠️ Vulnérabilité : d < n^0.25, l'attaque de Wiener s'applique !")

        return {
            "attack_type": "wiener",
            "public_key": {"e": e, "n": n},
            "private_key": {"d": d, "p": p, "q": q},
            "steps": steps,
            "warning": f"d={d} est trop petit ! (n^0.25 ≈ {int(n**0.25)})"
        }

    elif req.attack_type == "hastad":
        steps.append("Génération de 3 paires de clés RSA avec e=3 (attaque de Håstad)")
        e = 3
        keys = []

        def gen_prime_hastad(bits=24):
            while True:
                candidate = random.getrandbits(bits) | (1 << (bits - 1)) | 1
                if candidate % 3 != 0 and all(
                    candidate % i != 0 for i in range(2, min(500, int(candidate**0.5) + 1))
                ):
                    return candidate

        for i in range(3):
            p = gen_prime_hastad()
            q = gen_prime_hastad()
            while q == p:
                q = gen_prime_hastad()
            n = p * q
            phi = (p - 1) * (q - 1)
            d = mod_inverse(e, phi)
            keys.append({"p": p, "q": q, "n": n, "e": e, "d": d})
            steps.append(f"Clé {i+1} : n={n}, e={e}, d={d}")

        # Chiffrer un message commun
        message = random.randint(2, min(keys[0]["n"], keys[1]["n"], keys[2]["n"]) - 1)
        ciphertexts = [pow(message, e, k["n"]) for k in keys]
        steps.append(f"Message secret m = {message}")
        steps.append(f"c1 = m^e mod n1 = {ciphertexts[0]}")
        steps.append(f"c2 = m^e mod n2 = {ciphertexts[1]}")
        steps.append(f"c3 = m^e mod n3 = {ciphertexts[2]}")
        steps.append("⚠️ Vulnérabilité : e=3, même message → CRT révèle m³ → racine cubique = m !")

        return {
            "attack_type": "hastad",
            "keys": keys,
            "message": message,
            "ciphertexts": ciphertexts,
            "moduli": [k["n"] for k in keys],
            "e": e,
            "steps": steps,
            "warning": "Avec e=3 et 3 chiffrements du même message, m est récupérable !"
        }

    raise HTTPException(status_code=400, detail="Type d'attaque inconnu")


# ── 2. Factorisation de n ────────────────────────────────────────

@router.post("/factorize")
def factorize(req: FactorizeRequest):
    """
    Factorisation de n par force brute (√n) + algorithme de Fermat.
    Retrouve p et q, puis recalcule d.
    """
    n = req.n
    steps = []
    steps.append(f"Cible : n = {n}")
    steps.append(f"Seuil de recherche : √n ≈ {isqrt(n)}")

    if n < 4:
        raise HTTPException(status_code=400, detail="n doit être ≥ 4")
    if n > 10**14:
        raise HTTPException(status_code=400, detail="n trop grand pour la démo (max 10^14)")

    # Méthode 1 : Factorisation de Fermat
    steps.append("── Méthode : Factorisation de Fermat ──")
    steps.append("On cherche a, b tels que n = a² - b² = (a+b)(a-b)")
    a = isqrt(n)
    if a * a < n:
        a += 1

    found = False
    iterations = 0
    max_iter = 100000

    while iterations < max_iter:
        b2 = a * a - n
        b = is_perfect_square(b2)
        if b is not None:
            p = a + b
            q = a - b
            if q > 1 and p > 1:
                steps.append(f"Trouvé à l'itération {iterations + 1} : a={a}, b={b}")
                steps.append(f"p = a + b = {p}")
                steps.append(f"q = a - b = {q}")
                found = True
                break
        a += 1
        iterations += 1

    if not found:
        # Fallback : force brute
        steps.append("Fermat échoue, passage en force brute…")
        for i in range(2, isqrt(n) + 1):
            if n % i == 0:
                p, q = i, n // i
                steps.append(f"Diviseur trouvé : {i} (après {i-1} essais)")
                found = True
                break

    if not found:
        return {
            "success": False,
            "steps": steps,
            "result": {},
            "explanation": "Factorisation échouée — n est probablement trop grand ou premier."
        }

    phi = (p - 1) * (q - 1)
    steps.append(f"φ(n) = (p-1)(q-1) = {phi}")

    # On suppose e = 65537 ou on le retrouve avec différents e
    common_e = [3, 17, 257, 65537]
    d = None
    e_found = None
    for e_candidate in common_e:
        if math.gcd(e_candidate, phi) == 1:
            d_candidate = mod_inverse(e_candidate, phi)
            e_found = e_candidate
            d = d_candidate
            steps.append(f"Clé privée recalculée avec e={e_candidate} : d = {d}")
            break

    return {
        "success": True,
        "attack_name": "Factorisation de n (Fermat)",
        "result": {
            "p": p,
            "q": q,
            "phi": phi,
            "e": e_found,
            "d": d
        },
        "steps": steps,
        "complexity": f"O(√n) ≈ {isqrt(n)} itérations max",
        "explanation": (
            "Si n est le produit de deux premiers proches (p ≈ q), "
            "la factorisation de Fermat est quasi-instantanée. "
            "La vulnérabilité est de choisir des clés avec des petits nombres premiers."
        )
    }


# ── 3. Attaque de Wiener ─────────────────────────────────────────

@router.post("/wiener")
def wiener_attack(req: WienerRequest):
    """
    Attaque de Wiener : si d < n^0.25 / 3, on retrouve d via les fractions continues de e/n.
    Référence : Wiener, M. (1990). "Cryptanalysis of short RSA secret exponents."
    """
    e, n = req.e, req.n
    steps = []
    steps.append(f"Entrée : e = {e}, n = {n}")
    steps.append(f"Seuil de Wiener : n^(1/4) / 3 ≈ {int(n**0.25) // 3}")
    steps.append("── Développement en fractions continues de e/n ──")

    coeffs = continued_fraction_expansion(e, n)
    steps.append(f"Coefficients : {coeffs[:12]}{'…' if len(coeffs) > 12 else ''}")

    for i, (k, d_candidate) in enumerate(convergents(coeffs)):
        if k == 0:
            continue

        steps.append(f"Convergent {i+1} : k={k}, d={d_candidate}")

        # Test : si k*d ≡ 1 (mod φ(n)), alors φ(n) = (e*d - 1) / k
        if (e * d_candidate - 1) % k != 0:
            continue

        phi_candidate = (e * d_candidate - 1) // k

        # Vérification : p et q sont racines de x² - (n - φ + 1)x + n = 0
        # b = n - phi + 1 = p + q
        b = n - phi_candidate + 1
        discriminant = b * b - 4 * n
        if discriminant < 0:
            continue

        sqrt_disc = is_perfect_square(discriminant)
        if sqrt_disc is None:
            continue

        p = (b + sqrt_disc) // 2
        q = (b - sqrt_disc) // 2

        if p * q == n and p > 1 and q > 1:
            steps.append(f"✅ d trouvé au convergent {i+1} : d = {d_candidate}")
            steps.append(f"φ(n) candidat = {phi_candidate}")
            steps.append(f"p = {p}, q = {q}")
            steps.append("Vérification : p × q = n ✓")
            return {
                "success": True,
                "attack_name": "Attaque de Wiener",
                "result": {
                    "d": d_candidate,
                    "p": p,
                    "q": q,
                    "phi": phi_candidate,
                    "convergent_index": i + 1
                },
                "steps": steps,
                "complexity": "O(log² n)",
                "explanation": (
                    "L'attaque de Wiener exploite le théorème des fractions continues : "
                    "si d < n^0.25 / 3, alors k/d apparaît parmi les convergents de e/n. "
                    "Solution : utiliser d > n^0.5 (padding OAEP recommandé)."
                )
            }

    return {
        "success": False,
        "attack_name": "Attaque de Wiener",
        "result": {},
        "steps": steps,
        "explanation": "d n'est probablement pas assez petit pour l'attaque de Wiener (d ≥ n^0.25 / 3)."
    }


# ── 4. Attaque de Håstad (Broadcast Attack, e=3) ─────────────────

@router.post("/hastad")
def hastad_attack(req: HastadRequest):
    """
    Attaque de Håstad : si le même message m est chiffré avec e=3 pour 3 destinataires,
    on retrouve m³ via le CRT, puis on calcule la racine cubique entière.
    Référence : Håstad, J. (1988). "Solving Simultaneous Modular Equations of Low Degree."
    """
    ciphertexts = req.ciphertexts
    moduli = req.moduli
    e = req.e

    steps = []

    if len(ciphertexts) < e or len(moduli) < e:
        raise HTTPException(
            status_code=400,
            detail=f"Il faut au moins {e} chiffrés et {e} modules pour e={e}"
        )

    # Utiliser exactement e valeurs
    c = ciphertexts[:e]
    n = moduli[:e]

    steps.append(f"Exposant public : e = {e}")
    for i in range(e):
        steps.append(f"c{i+1} = {c[i]}  (mod n{i+1} = {n[i]})")

    # Vérifier que les modules sont copremiers deux à deux
    for i in range(e):
        for j in range(i + 1, e):
            g = math.gcd(n[i], n[j])
            if g != 1:
                raise HTTPException(
                    status_code=400,
                    detail=f"n{i+1} et n{j+1} ne sont pas copremiers (gcd={g})"
                )

    steps.append("── Application du Théorème Chinois des Restes (CRT) ──")
    steps.append("On calcule M = c1·M1·y1 + c2·M2·y2 + c3·M3·y3 (mod N)")

    # CRT : retrouver m^e mod (n1*n2*...*ne)
    m_e = crt(c, n)
    N = 1
    for ni in n:
        N *= ni

    steps.append(f"N = n1 × n2 × … = {N}")
    steps.append(f"m^{e} ≡ {m_e} (mod N)")
    steps.append(f"── Calcul de la racine {e}-ième entière ──")

    # Racine e-ième entière de m_e
    m_recovered = integer_nth_root(m_e, e)

    # Vérification
    if m_recovered ** e == m_e:
        steps.append(f"✅ Racine exacte trouvée : m = {m_recovered}")
        steps.append(f"Vérification : {m_recovered}^{e} = {m_recovered**e} = m^{e} ✓")
        verified = True
    else:
        steps.append(f"⚠️ m ≈ {m_recovered} (vérification approximative)")
        verified = False

    return {
        "success": True,
        "attack_name": f"Attaque de Håstad (e={e})",
        "result": {
            "message": m_recovered,
            "m_cubed": m_e,
            "verified": verified
        },
        "steps": steps,
        "complexity": "O(e³ · log N)",
        "explanation": (
            f"Avec e={e} et le même message m chiffré pour {e} destinataires différents, "
            f"le CRT reconstruit m^{e} sans chiffrement cassé. "
            f"La racine {e}-ième entière donne m directement. "
            "Solution : utiliser du padding aléatoire (OAEP) qui rend chaque chiffré unique."
        )
    }


# ── 5. Encrypt/Decrypt simple (pour la démo des attaques) ────────

class EncryptRequest(BaseModel):
    message: int
    e: int
    n: int

class DecryptRequest(BaseModel):
    ciphertext: int
    d: int
    n: int

@router.post("/encrypt")
def encrypt_demo(req: EncryptRequest):
    if req.message >= req.n:
        raise HTTPException(status_code=400, detail="Le message doit être < n")
    c = pow(req.message, req.e, req.n)
    return {"ciphertext": c, "message": req.message, "e": req.e, "n": req.n}

@router.post("/decrypt")
def decrypt_demo(req: DecryptRequest):
    m = pow(req.ciphertext, req.d, req.n)
    return {"message": m, "ciphertext": req.ciphertext}
