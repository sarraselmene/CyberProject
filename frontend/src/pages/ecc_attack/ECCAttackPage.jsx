// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MEMBRE 4 — ECC Attack
//  Fichier : frontend/src/pages/ecc_attack/ECCAttackPage.jsx
//  Route   : /ecc-attack
//  API     : /api/ecc-attack/...
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { Triangle } from 'lucide-react'
import styles from './ECCAttackPage.module.css'

export default function ECCAttackPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.iconWrap}><Triangle size={24} /></div>
        <div>
          <h1 className={styles.title}>ECC Attack</h1>
          <p className={styles.sub}>Module à implémenter par le Membre 4</p>
        </div>
      </div>

      <div className={styles.placeholder}>
        <Triangle size={48} strokeWidth={1} />
        <h2>ECC Attack — À implémenter</h2>
        <p>
          Ce module est la responsabilité du <strong>Membre 4</strong>.<br />
          Voir <code>PROJECT_GUIDE.txt</code> pour les instructions détaillées.
        </p>
        <div className={styles.todoList}>
          <h3>Attaques ECC à démontrer :</h3>
          <ul>
            <li>Baby-step Giant-step (BSGS) sur ECDLP</li>
            <li>Attaque Pohlig-Hellman</li>
            <li>Courbes elliptiques faibles / anomales</li>
            <li>Attaque par fautes (fault attack)</li>
          </ul>
        </div>
        <div className={styles.apiNote}>
          <strong>Backend :</strong> <code>backend/routers/ecc_attack.py</code><br />
          <strong>Frontend :</strong> <code>frontend/src/pages/ecc_attack/ECCAttackPage.jsx</code>
        </div>
      </div>
    </div>
  )
}
