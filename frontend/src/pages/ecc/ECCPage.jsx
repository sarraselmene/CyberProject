// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MEMBRE 2 — Elliptic Curve Cryptography
//  Fichier : frontend/src/pages/ecc/ECCPage.jsx
//  Route   : /ecc
//  API     : /api/ecc/...
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useRef } from 'react'
import { Cpu, Key, Lock, Unlock, Copy, Check, Upload, AlertCircle, CheckCircle } from 'lucide-react'
import styles from './ECCPage.module.css'

const API = 'http://localhost:8000/api/ecc'

// ─── Alert ────────────────────────────────────────────────────
function Alert({ type, message, onClose }) {
  if (!message) return null
  const Icon = type === 'success' ? CheckCircle : AlertCircle
  return (
    <div className={`${styles.alert} ${styles['alert_' + type]}`}>
      <Icon size={16} />
      <span>{message}</span>
      <button className={styles.alertClose} onClick={onClose}>✕</button>
    </div>
  )
}

// ─── Dropzone ─────────────────────────────────────────────────
function Dropzone({ label, onFile, accept, file }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) onFile(dropped)
  }

  return (
    <div
      className={`${styles.dropzone} ${dragging ? styles.dropzoneDragging : ''} ${file ? styles.dropzoneHasFile : ''}`}
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
      <Upload size={20} className={styles.dropzoneIcon} />
      <div className={styles.dropzoneText}>
        {file ? (
          <>
            <strong>{file.name}</strong>
            <span>{(file.size / 1024).toFixed(1)} Ko</span>
          </>
        ) : (
          <>
            <strong>{label}</strong>
            <span>Glissez ou cliquez pour sélectionner</span>
          </>
        )}
      </div>
    </div>
  )
}

// ─── KeyField ─────────────────────────────────────────────────
function KeyField({ label, value }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className={styles.keyField}>
      <span className={styles.keyLabel}>{label}</span>
      <div className={styles.keyValueRow}>
        <code className={styles.keyValue}>{value}</code>
        <button className={styles.copyBtn} onClick={handleCopy} title="Copier">
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────
export default function ECCPage() {
  const [alert, setAlert]         = useState({ type: '', message: '' })
  const [loading, setLoading]     = useState('')
  const [keyPair, setKeyPair]     = useState(null)
  const [encFile, setEncFile]     = useState(null)
  const [encPubX, setEncPubX]     = useState('')
  const [encPubY, setEncPubY]     = useState('')
  const [useMemEnc, setUseMemEnc] = useState(true)
  const [decFile, setDecFile]     = useState(null)
  const [decPriv, setDecPriv]     = useState('')
  const [useMemDec, setUseMemDec] = useState(true)

  const showAlert  = (type, message) => setAlert({ type, message })
  const clearAlert = () => setAlert({ type: '', message: '' })

  // ── Générer une paire de clés ──────────────────────────────
  const handleGenerate = async () => {
    setLoading('gen'); clearAlert()
    try {
      const res  = await fetch(`${API}/generate-key`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Erreur serveur')
      setKeyPair(data)
      showAlert('success', data.message)
    } catch (e) {
      showAlert('error', e.message)
    } finally { setLoading('') }
  }

  // ── Chiffrer un fichier ────────────────────────────────────
  const handleEncrypt = async () => {
    if (!encFile) return showAlert('error', 'Sélectionnez un fichier à chiffrer.')
    if (!useMemEnc && (!encPubX || !encPubY))
      return showAlert('error', 'Fournissez la clé publique (Qx et Qy).')
    setLoading('enc'); clearAlert()
    try {
      const form = new FormData()
      form.append('file', encFile)
      if (!useMemEnc) { form.append('pub_x', encPubX); form.append('pub_y', encPubY) }
      const res = await fetch(`${API}/encrypt-file`, { method: 'POST', body: form })
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail) }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      Object.assign(document.createElement('a'), { href: url, download: `${encFile.name}.ecc` }).click()
      URL.revokeObjectURL(url)
      showAlert('success', `Fichier chiffré téléchargé → ${encFile.name}.ecc`)
    } catch (e) {
      showAlert('error', e.message)
    } finally { setLoading('') }
  }

  // ── Déchiffrer un fichier ──────────────────────────────────
  const handleDecrypt = async () => {
    if (!decFile) return showAlert('error', 'Sélectionnez un fichier .ecc.')
    if (!useMemDec && !decPriv) return showAlert('error', 'Fournissez la clé privée.')
    setLoading('dec'); clearAlert()
    try {
      const form = new FormData()
      form.append('file', decFile)
      if (!useMemDec) form.append('private_key', decPriv)
      const res = await fetch(`${API}/decrypt-file`, { method: 'POST', body: form })
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail) }
      const disposition = res.headers.get('content-disposition') || ''
      const match    = disposition.match(/filename="(.+)"/)
      const filename = match ? match[1] : 'fichier_dechiffre'
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      Object.assign(document.createElement('a'), { href: url, download: filename }).click()
      URL.revokeObjectURL(url)
      showAlert('success', `Fichier déchiffré téléchargé → ${filename}`)
    } catch (e) {
      showAlert('error', e.message)
    } finally { setLoading('') }
  }

  return (
    <div className={styles.page}>

      {/* ── En-tête (structure originale conservée) ──────────── */}
      <div className={styles.header}>
        <div className={styles.iconWrap}><Cpu size={24} /></div>
        <div>
          <h1 className={styles.title}>Elliptic Curve Cryptography</h1>
          <p className={styles.sub}>
            Chiffrement asymétrique sur <strong>secp256k1</strong> — ECIES + AES-256-CTR
          </p>
        </div>
      </div>

      {/* Alerte globale */}
      <Alert type={alert.type} message={alert.message} onClose={clearAlert} />

      {/* Bandeau courbe */}
      <div className={styles.curveBar}>
        <span><em>Courbe</em> secp256k1</span>
        <span><em>Équation</em> y² = x³ + 7</span>
        <span><em>Corps</em> 𝔽ₚ (p ≈ 2²⁵⁶)</span>
        <span><em>Schéma</em> ECIES</span>
      </div>

      {/* ── 1. Génération de clé ─────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIconWrap}><Key size={17} /></div>
          <div>
            <h2 className={styles.cardTitle}>Génération de clés</h2>
            <p className={styles.cardDesc}>
              Génère k aléatoire ∈ [1, n−1] puis calcule Q&nbsp;=&nbsp;k·G
            </p>
          </div>
        </div>

        <button className={styles.btn} onClick={handleGenerate} disabled={loading === 'gen'}>
          {loading === 'gen'
            ? <><span className={styles.spinner} /> Génération…</>
            : <><Cpu size={15} /> Générer une paire de clés</>}
        </button>

        {keyPair && (
          <div className={styles.keyBox}>
            <KeyField label="Clé privée  k"   value={keyPair.private_key} />
            <KeyField label="Clé publique Qx" value={keyPair.public_key_x} />
            <KeyField label="Clé publique Qy" value={keyPair.public_key_y} />
            <p className={styles.keyMeta}>Courbe : <strong>{keyPair.curve}</strong></p>
          </div>
        )}
      </div>

      {/* ── 2. Chiffrement ───────────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIconWrap}><Lock size={17} /></div>
          <div>
            <h2 className={styles.cardTitle}>Chiffrement de fichier</h2>
            <p className={styles.cardDesc}>
              r éphémère → C1&nbsp;=&nbsp;r·G · secret&nbsp;=&nbsp;r·Q → AES-256-CTR
            </p>
          </div>
        </div>

        <Dropzone label="Fichier à chiffrer" onFile={setEncFile} accept="*/*" file={encFile} />

        <label className={styles.checkLabel}>
          <input type="checkbox" checked={useMemEnc} onChange={e => setUseMemEnc(e.target.checked)} />
          Utiliser la clé publique active en mémoire
        </label>

        {!useMemEnc && (
          <div className={styles.inputRow}>
            <div className={styles.inputWrap}>
              <label>Clé publique Qx (hex)</label>
              <input className={styles.input} placeholder="0x…" value={encPubX} onChange={e => setEncPubX(e.target.value)} />
            </div>
            <div className={styles.inputWrap}>
              <label>Clé publique Qy (hex)</label>
              <input className={styles.input} placeholder="0x…" value={encPubY} onChange={e => setEncPubY(e.target.value)} />
            </div>
          </div>
        )}

        <button className={styles.btn} onClick={handleEncrypt} disabled={loading === 'enc'}>
          {loading === 'enc'
            ? <><span className={styles.spinner} /> Chiffrement…</>
            : <><Lock size={15} /> Chiffrer et télécharger</>}
        </button>
      </div>

      {/* ── 3. Déchiffrement ─────────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIconWrap}><Unlock size={17} /></div>
          <div>
            <h2 className={styles.cardTitle}>Déchiffrement de fichier</h2>
            <p className={styles.cardDesc}>
              secret&nbsp;=&nbsp;k·C1&nbsp;=&nbsp;r·Q → même clé AES → déchiffrement
            </p>
          </div>
        </div>

        <Dropzone label="Fichier chiffré (.ecc)" onFile={setDecFile} accept=".ecc" file={decFile} />

        <label className={styles.checkLabel}>
          <input type="checkbox" checked={useMemDec} onChange={e => setUseMemDec(e.target.checked)} />
          Utiliser la clé privée active en mémoire
        </label>

        {!useMemDec && (
          <div className={styles.inputRow}>
            <div className={styles.inputWrap}>
              <label>Clé privée k (hex)</label>
              <input className={styles.input} placeholder="0x…" value={decPriv} onChange={e => setDecPriv(e.target.value)} />
            </div>
          </div>
        )}

        <button className={styles.btn} onClick={handleDecrypt} disabled={loading === 'dec'}>
          {loading === 'dec'
            ? <><span className={styles.spinner} /> Déchiffrement…</>
            : <><Unlock size={15} /> Déchiffrer et télécharger</>}
        </button>
      </div>

      {/* ── Note pédagogique (style apiNote original conservé) ── */}
      <div className={styles.apiNote}>
        <strong>💡 Protocole ECIES</strong><br />
        <span className={styles.apiNoteText}>
          <strong>Chiffrement :</strong> choisir r → C1 = r·G (transmis) · secret = r·Q →
          AES-key = SHA-256(secret.x) → chiffrer fichier (AES-256-CTR)<br />
          <strong>Déchiffrement :</strong> secret = k·C1 car k·(r·G) = r·(k·G) = r·Q →
          retrouve AES-key → déchiffre fichier
        </span>
      </div>

    </div>
  )
}
