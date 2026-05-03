import { useState } from 'react'
import { Lock, Key, Upload, Download, CheckCircle, XCircle, Loader, Info, ChevronRight } from 'lucide-react'
import styles from './RSAPage.module.css'

const API = '/api/rsa'

// ─── Sub-components ────────────────────────────────────────────

function Alert({ type, msg }) {
  if (!msg) return null
  const Icon = type === 'success' ? CheckCircle : XCircle
  return (
    <div className={`${styles.alert} ${styles[type]}`}>
      <Icon size={16} />
      <span>{msg}</span>
    </div>
  )
}

function Spinner() {
  return <span className={styles.spinner}><Loader size={16} /></span>
}

function KeyDisplay({ label, pairs }) {
  return (
    <div className={styles.keyBox}>
      <div className={styles.keyLabel}><Key size={13} />{label}</div>
      <div className={styles.keyPairs}>
        {pairs.map(([k, v]) => (
          <div key={k} className={styles.keyPair}>
            <span className={styles.keyName}>{k}</span>
            <span className={styles.keyVal}>{String(v)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section: Key Generation ────────────────────────────────────

function KeyGenSection({ onKeyGenerated }) {
  const [p, setP] = useState('')
  const [q, setQ] = useState('')
  const [e, setE] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [alert, setAlert] = useState(null)

  const handleGenerate = async () => {
    setAlert(null)
    setResult(null)
    if (!p || !q || !e) { setAlert({ type: 'error', msg: 'Veuillez remplir p, q et e.' }); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/generate-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ p: parseInt(p), q: parseInt(q), e: parseInt(e) })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      setResult(data)
      setAlert({ type: 'success', msg: data.message })
      onKeyGenerated(data)
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}><Key size={18} /></div>
        <div>
          <h2 className={styles.sectionTitle}>Génération de Clé RSA</h2>
          <p className={styles.sectionSub}>Entrez deux nombres premiers p, q et un exposant public e</p>
        </div>
      </div>

      {/* Info strip */}
      <div className={styles.infoStrip}>
        <Info size={13} />
        <span>Exemples : p=61, q=53, e=17 &nbsp;|&nbsp; p=101, q=103, e=7</span>
      </div>

      <div className={styles.inputRow}>
        {[
          { label: 'p (premier)', value: p, set: setP, ph: 'ex. 61' },
          { label: 'q (premier)', value: q, set: setQ, ph: 'ex. 53' },
          { label: 'e (public)', value: e, set: setE, ph: 'ex. 17' },
        ].map(f => (
          <div key={f.label} className={styles.field}>
            <label className={styles.fieldLabel}>{f.label}</label>
            <input
              type="number"
              className={styles.input}
              placeholder={f.ph}
              value={f.value}
              onChange={ev => f.set(ev.target.value)}
            />
          </div>
        ))}
      </div>

      <button className={styles.btnPrimary} onClick={handleGenerate} disabled={loading}>
        {loading ? <Spinner /> : <Key size={16} />}
        {loading ? 'Génération…' : 'Générer la clé RSA'}
      </button>

      <Alert type={alert?.type} msg={alert?.msg} />

      {result && (
        <div className={styles.keyResults}>
          <KeyDisplay label="Clé Publique" pairs={[['e', result.public_key.e], ['n', result.public_key.n]]} />
          <KeyDisplay label="Clé Privée" pairs={[['d', result.private_key.d], ['n', result.private_key.n]]} />
          <KeyDisplay label="Paramètres" pairs={[['φ(n)', result.phi], ['n = p × q', result.n]]} />
        </div>
      )}
    </section>
  )
}

// ─── Section: File Encryption ───────────────────────────────────

function EncryptSection({ hasKey }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = f => { setFile(f); setAlert(null) }

  const handleEncrypt = async () => {
    if (!hasKey) { setAlert({ type: 'error', msg: 'Générez d\'abord une clé RSA.' }); return }
    if (!file) { setAlert({ type: 'error', msg: 'Sélectionnez un fichier à chiffrer.' }); return }
    setLoading(true)
    setAlert(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API}/encrypt-file`, { method: 'POST', body: fd })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail) }
      const blob = await res.blob()
      const cd = res.headers.get('content-disposition')
      const name = cd?.match(/filename=(.+)/)?.[1] || 'encrypted.rsa'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = name; a.click()
      URL.revokeObjectURL(url)
      setAlert({ type: 'success', msg: `Chiffrement réussi avec clé publique — "${name}" téléchargé.` })
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon} style={{ '--ico': '#2584e8' }}><Upload size={18} /></div>
        <div>
          <h2 className={styles.sectionTitle}>Chiffrement de Fichier</h2>
          <p className={styles.sectionSub}>Chiffrez n'importe quel fichier avec votre clé publique RSA</p>
        </div>
      </div>

      {!hasKey && (
        <div className={styles.warningBanner}>
          <ChevronRight size={13} />
          Générez d'abord une clé RSA dans la section ci-dessus.
        </div>
      )}

      <div
        className={`${styles.dropZone} ${dragging ? styles.dragging : ''} ${file ? styles.hasFile : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onClick={() => document.getElementById('enc-input').click()}
      >
        <input id="enc-input" type="file" hidden onChange={e => handleFile(e.target.files[0])} />
        <Upload size={28} className={styles.dropIcon} />
        {file ? (
          <div className={styles.fileInfo}>
            <strong>{file.name}</strong>
            <span>{(file.size / 1024).toFixed(1)} KB</span>
          </div>
        ) : (
          <>
            <p>Glissez-déposez un fichier ici</p>
            <p className={styles.dropHint}>ou cliquez pour sélectionner</p>
          </>
        )}
      </div>

      <button className={styles.btnPrimary} onClick={handleEncrypt} disabled={loading || !hasKey}>
        {loading ? <Spinner /> : <Lock size={16} />}
        {loading ? 'Chiffrement en cours…' : 'Chiffrer et télécharger'}
      </button>

      <Alert type={alert?.type} msg={alert?.msg} />
    </section>
  )
}

// ─── Section: File Decryption ───────────────────────────────────

function DecryptSection({ hasKey }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = f => { setFile(f); setAlert(null) }

  const handleDecrypt = async () => {
    if (!hasKey) { setAlert({ type: 'error', msg: 'Générez d\'abord une clé RSA.' }); return }
    if (!file) { setAlert({ type: 'error', msg: 'Sélectionnez un fichier chiffré (.rsa).' }); return }
    setLoading(true)
    setAlert(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API}/decrypt-file`, { method: 'POST', body: fd })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail) }
      const blob = await res.blob()
      const cd = res.headers.get('content-disposition')
      const name = cd?.match(/filename=(.+)/)?.[1] || 'decrypted_file'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = name; a.click()
      URL.revokeObjectURL(url)
      setAlert({ type: 'success', msg: `Déchiffrement réussi avec clé privée — "${name}" téléchargé.` })
    } catch (err) {
      setAlert({ type: 'error', msg: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon} style={{ '--ico': '#00c896' }}><Download size={18} /></div>
        <div>
          <h2 className={styles.sectionTitle}>Déchiffrement de Fichier</h2>
          <p className={styles.sectionSub}>Restaurez le fichier original avec votre clé privée RSA</p>
        </div>
      </div>

      {!hasKey && (
        <div className={styles.warningBanner}>
          <ChevronRight size={13} />
          Générez d'abord une clé RSA dans la section ci-dessus.
        </div>
      )}

      <div
        className={`${styles.dropZone} ${dragging ? styles.dragging : ''} ${file ? styles.hasFile : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onClick={() => document.getElementById('dec-input').click()}
      >
        <input id="dec-input" type="file" accept=".rsa" hidden onChange={e => handleFile(e.target.files[0])} />
        <Download size={28} className={styles.dropIcon} />
        {file ? (
          <div className={styles.fileInfo}>
            <strong>{file.name}</strong>
            <span>{(file.size / 1024).toFixed(1)} KB</span>
          </div>
        ) : (
          <>
            <p>Glissez-déposez le fichier .rsa ici</p>
            <p className={styles.dropHint}>ou cliquez pour sélectionner</p>
          </>
        )}
      </div>

      <button className={`${styles.btnPrimary} ${styles.btnGreen}`} onClick={handleDecrypt} disabled={loading || !hasKey}>
        {loading ? <Spinner /> : <Download size={16} />}
        {loading ? 'Déchiffrement en cours…' : 'Déchiffrer et télécharger'}
      </button>

      <Alert type={alert?.type} msg={alert?.msg} />
    </section>
  )
}

// ─── Main Page ──────────────────────────────────────────────────

export default function RSAPage() {
  const [hasKey, setHasKey] = useState(false)
  const [keyData, setKeyData] = useState(null)

  const handleKeyGenerated = data => {
    setHasKey(true)
    setKeyData(data)
  }

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageIconWrap}><Lock size={24} /></div>
        <div>
          <h1 className={styles.pageTitle}>RSA Cryptography</h1>
          <p className={styles.pageSub}>
            Génération de clés · Chiffrement de fichiers · Déchiffrement de fichiers
          </p>
        </div>
        {hasKey && (
          <div className={styles.keyStatus}>
            <span className={styles.keyDot} />
            Clé active : e={keyData?.public_key?.e}, n={keyData?.public_key?.n}
          </div>
        )}
      </div>

      {/* How RSA works strip */}
      <div className={styles.howStrip}>
        {[
          { n: '1', t: 'Choisir p, q premiers' },
          { n: '2', t: 'Calculer n = p×q, φ(n)' },
          { n: '3', t: 'Choisir e copremier à φ(n)' },
          { n: '4', t: 'Calculer d = e⁻¹ mod φ(n)' },
          { n: '5', t: 'Chiffrer / Déchiffrer' },
        ].map(s => (
          <div key={s.n} className={styles.step}>
            <span className={styles.stepNum}>{s.n}</span>
            <span className={styles.stepText}>{s.t}</span>
          </div>
        ))}
      </div>

      {/* Sections */}
      <div className={styles.sections}>
        <KeyGenSection onKeyGenerated={handleKeyGenerated} />
        <EncryptSection hasKey={hasKey} />
        <DecryptSection hasKey={hasKey} />
      </div>
    </div>
  )
}
