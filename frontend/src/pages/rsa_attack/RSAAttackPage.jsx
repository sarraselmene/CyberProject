// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MEMBRE 3 — RSA Attack
//  Fichier : frontend/src/pages/rsa_attack/RSAAttackPage.jsx
//  Route   : /rsa-attack
//  API     : /api/rsa-attack/...
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { Zap } from 'lucide-react'
import styles from './RSAAttackPage.module.css'

export default function RSAAttackPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.iconWrap}><Zap size={24} /></div>
        <div>
          <h1 className={styles.title}>RSA Attack</h1>
          <p className={styles.sub}>Module à implémenter par le Membre 3</p>
        </div>
      </div>

      <div className={styles.placeholder}>
        <Zap size={48} strokeWidth={1} />
        <h2>RSA Attack — À implémenter</h2>
        <p>
          Ce module est la responsabilité du <strong>Membre 3</strong>.<br />
          Voir <code>PROJECT_GUIDE.txt</code> pour les instructions détaillées.
        </p>
        <div className={styles.todoList}>
          <h3>Attaques RSA à démontrer :</h3>
          <ul>
            <li>Factorisation de n (force brute pour petits n)</li>
            <li>Attaque de Wiener (d petit)</li>
            <li>Attaque petit exposant public e=3</li>
            <li>Affichage des étapes mathématiques</li>
          </ul>
        </div>
        <div className={styles.apiNote}>
          <strong>Backend :</strong> <code>backend/routers/rsa_attack.py</code><br />
          <strong>Frontend :</strong> <code>frontend/src/pages/rsa_attack/RSAAttackPage.jsx</code>
        </div>
      </div>
    </div>
  )
}
