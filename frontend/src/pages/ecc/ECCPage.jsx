// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MEMBRE 2 — Elliptic Curve Cryptography
//  Fichier : frontend/src/pages/ecc/ECCPage.jsx
//  Route   : /ecc
//  API     : /api/ecc/...
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { Cpu } from 'lucide-react'
import styles from './ECCPage.module.css'

export default function ECCPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.iconWrap}><Cpu size={24} /></div>
        <div>
          <h1 className={styles.title}>Elliptic Curve Cryptography</h1>
          <p className={styles.sub}>Module à implémenter par le Membre 2</p>
        </div>
      </div>

      <div className={styles.placeholder}>
        <Cpu size={48} strokeWidth={1} />
        <h2>ECC — À implémenter</h2>
        <p>
          Ce module est la responsabilité du <strong>Membre 2</strong>.<br />
          Voir <code>PROJECT_GUIDE.txt</code> pour les instructions détaillées.
        </p>
        <div className={styles.todoList}>
          <h3>Fonctionnalités à développer :</h3>
          <ul>
            <li>Choix de la courbe elliptique (paramètres a, b, p, G)</li>
            <li>Génération de paire de clés ECC</li>
            <li>Chiffrement ECIES / ECDH</li>
            <li>Déchiffrement avec clé privée</li>
            <li>Affichage des opérations sur les points</li>
          </ul>
        </div>
        <div className={styles.apiNote}>
          <strong>Backend :</strong> <code>backend/routers/ecc.py</code><br />
          <strong>Frontend :</strong> <code>frontend/src/pages/ecc/ECCPage.jsx</code>
        </div>
      </div>
    </div>
  )
}
