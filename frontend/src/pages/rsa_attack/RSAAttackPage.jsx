import { useState } from "react";
import styles from "./RSAAttackPage.module.css";

// ── API helpers ──────────────────────────────────────────────────
const API = "http://localhost:8000/api/rsa-attack";

async function apiFetch(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Erreur API");
  return data;
}

// ── Sub-components ───────────────────────────────────────────────

function Alert({ type, message }) {
  if (!message) return null;
  return (
    <div className={`${styles.alert} ${styles[`alert_${type}`]}`}>
      {type === "error" ? "⛔ " : type === "success" ? "✅ " : "⚠️ "}
      {message}
    </div>
  );
}

function StepList({ steps }) {
  if (!steps?.length) return null;
  return (
    <div className={styles.stepList}>
      <div className={styles.stepTitle}>📋 Étapes de l'attaque</div>
      {steps.map((s, i) => (
        <div key={i} className={styles.step} style={{ animationDelay: `${i * 60}ms` }}>
          <span className={styles.stepIndex}>{String(i + 1).padStart(2, "0")}</span>
          <span className={styles.stepText}>{s}</span>
        </div>
      ))}
    </div>
  );
}

function ResultBox({ data }) {
  if (!data) return null;
  return (
    <div className={styles.resultBox}>
      <div className={styles.resultTitle}>🔓 Résultat</div>
      <pre className={styles.resultPre}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

function ExplanationBox({ text, complexity }) {
  if (!text) return null;
  return (
    <div className={styles.explanationBox}>
      <div className={styles.explanationTitle}>
        📖 Analyse &nbsp;
        {complexity && <span className={styles.badge}>{complexity}</span>}
      </div>
      <p>{text}</p>
    </div>
  );
}

// ── Tab 1 : Factorisation ────────────────────────────────────────
function TabFactorize() {
  const [n, setN] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [weakKey, setWeakKey] = useState(null);

  async function generateWeak() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/generate-weak-key", {
        bits: 16,
        attack_type: "factorize",
      });
      setWeakKey(data);
      setN(String(data.public_key.n));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function attack() {
    if (!n) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await apiFetch("/factorize", { n: parseInt(n) });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.attackHeader}>
        <div className={styles.attackIcon}>🔢</div>
        <div>
          <h2 className={styles.attackTitle}>Factorisation de n</h2>
          <p className={styles.attackSubtitle}>
            Retrouver p et q à partir de n — algorithme de Fermat
          </p>
        </div>
      </div>

      <div className={styles.vulnBadge}>
        Vulnérabilité : clés de trop petite taille (p, q &lt; 2²⁰)
      </div>

      <div className={styles.demoSection}>
        <button className={styles.btnSecondary} onClick={generateWeak} disabled={loading}>
          🎲 Générer une clé faible
        </button>
        {weakKey && (
          <div className={styles.weakKeyPreview}>
            <span>n = <b>{weakKey.public_key.n}</b></span>
            <span>e = <b>{weakKey.public_key.e}</b></span>
            <span className={styles.warningText}>⚠️ {weakKey.warning}</span>
          </div>
        )}
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Valeur de n à factoriser</label>
        <input
          className={styles.input}
          type="number"
          value={n}
          onChange={(e) => setN(e.target.value)}
          placeholder="Ex : 3233 (= 61 × 53)"
        />
      </div>

      <button className={styles.btnAttack} onClick={attack} disabled={loading || !n}>
        {loading ? <span className={styles.spinner} /> : "⚡ Lancer l'attaque"}
      </button>

      <Alert type="error" message={error} />

      {result && (
        <>
          <Alert
            type={result.success ? "success" : "warning"}
            message={
              result.success
                ? `Clé cassée ! p=${result.result.p}, q=${result.result.q}, d=${result.result.d}`
                : "Factorisation échouée — n trop grand"
            }
          />
          <StepList steps={result.steps} />
          <ResultBox data={result.result} />
          <ExplanationBox text={result.explanation} complexity={result.complexity} />
        </>
      )}
    </div>
  );
}

// ── Tab 2 : Wiener ───────────────────────────────────────────────
function TabWiener() {
  const [e, setE] = useState("");
  const [n, setN] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [weakKey, setWeakKey] = useState(null);

  async function generateWeak() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/generate-weak-key", {
        bits: 32,
        attack_type: "wiener",
      });
      setWeakKey(data);
      setE(String(data.public_key.e));
      setN(String(data.public_key.n));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function attack() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await apiFetch("/wiener", {
        e: parseInt(e),
        n: parseInt(n),
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.attackHeader}>
        <div className={styles.attackIcon}>📐</div>
        <div>
          <h2 className={styles.attackTitle}>Attaque de Wiener</h2>
          <p className={styles.attackSubtitle}>
            Fractions continues sur e/n — exploite d &lt; n^0.25
          </p>
        </div>
      </div>

      <div className={styles.vulnBadge}>
        Vulnérabilité : clé privée d trop petite (d &lt; n^¼ / 3)
      </div>

      <div className={styles.demoSection}>
        <button className={styles.btnSecondary} onClick={generateWeak} disabled={loading}>
          🎲 Générer une clé Wiener-vulnérable
        </button>
        {weakKey && (
          <div className={styles.weakKeyPreview}>
            <span>n = <b>{weakKey.public_key.n}</b></span>
            <span>e = <b>{weakKey.public_key.e}</b></span>
            <span>d réel = <b>{weakKey.private_key.d}</b></span>
            <span className={styles.warningText}>⚠️ {weakKey.warning}</span>
          </div>
        )}
      </div>

      <div className={styles.inputRow}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Exposant public e</label>
          <input
            className={styles.input}
            type="number"
            value={e}
            onChange={(ev) => setE(ev.target.value)}
            placeholder="e"
          />
        </div>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Module n</label>
          <input
            className={styles.input}
            type="number"
            value={n}
            onChange={(ev) => setN(ev.target.value)}
            placeholder="n"
          />
        </div>
      </div>

      <button className={styles.btnAttack} onClick={attack} disabled={loading || !e || !n}>
        {loading ? <span className={styles.spinner} /> : "⚡ Lancer Wiener"}
      </button>

      <Alert type="error" message={error} />

      {result && (
        <>
          <Alert
            type={result.success ? "success" : "warning"}
            message={
              result.success
                ? `d trouvé = ${result.result.d} au convergent #${result.result.convergent_index}`
                : "Wiener échoue — d est suffisamment grand"
            }
          />
          <StepList steps={result.steps} />
          <ResultBox data={result.result} />
          <ExplanationBox text={result.explanation} complexity={result.complexity} />
        </>
      )}
    </div>
  );
}

// ── Tab 3 : Håstad ───────────────────────────────────────────────
function TabHastad() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [scenario, setScenario] = useState(null);
  const [attackResult, setAttackResult] = useState(null);

  async function generateScenario() {
    setLoading(true);
    setError("");
    setAttackResult(null);
    try {
      const data = await apiFetch("/generate-weak-key", {
        bits: 24,
        attack_type: "hastad",
      });
      setScenario(data);
      setResult(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function attack() {
    if (!scenario) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/hastad", {
        ciphertexts: scenario.ciphertexts,
        moduli: scenario.moduli,
        e: scenario.e,
      });
      setAttackResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.attackHeader}>
        <div className={styles.attackIcon}>📡</div>
        <div>
          <h2 className={styles.attackTitle}>Attaque de Håstad</h2>
          <p className={styles.attackSubtitle}>
            Broadcast attack — CRT + racine cubique pour e=3
          </p>
        </div>
      </div>

      <div className={styles.vulnBadge}>
        Vulnérabilité : même message m chiffré avec e=3 vers ≥3 destinataires
      </div>

      <div className={styles.hastadFlow}>
        <div className={styles.flowBox}>
          <div className={styles.flowIcon}>👤</div>
          <div className={styles.flowLabel}>Émetteur</div>
          <div className={styles.flowDesc}>envoie m à 3 destinataires avec e=3</div>
        </div>
        <div className={styles.flowArrow}>→</div>
        <div className={styles.flowBox}>
          <div className={styles.flowIcon}>🕵️</div>
          <div className={styles.flowLabel}>Attaquant</div>
          <div className={styles.flowDesc}>intercepte c1, c2, c3 (sans clé privée)</div>
        </div>
        <div className={styles.flowArrow}>→</div>
        <div className={styles.flowBox}>
          <div className={styles.flowIcon}>🔓</div>
          <div className={styles.flowLabel}>CRT + ∛</div>
          <div className={styles.flowDesc}>retrouve m en clair !</div>
        </div>
      </div>

      <div className={styles.demoSection}>
        <button className={styles.btnSecondary} onClick={generateScenario} disabled={loading}>
          🎲 Générer le scénario (3 chiffrés)
        </button>
      </div>

      {scenario && (
        <div className={styles.hastadScenario}>
          <div className={styles.scenarioTitle}>Données interceptées</div>
          {scenario.ciphertexts.map((c, i) => (
            <div key={i} className={styles.scenarioRow}>
              <span className={styles.scenarioLabel}>c{i + 1} =</span>
              <span className={styles.scenarioValue}>{c}</span>
              <span className={styles.scenarioLabel}>mod n{i + 1} =</span>
              <span className={styles.scenarioValue}>{scenario.moduli[i]}</span>
            </div>
          ))}
          <div className={styles.secretHint}>
            Message secret : <b className={styles.hidden}>{"?".repeat(8)}</b> (caché)
          </div>
        </div>
      )}

      <button
        className={styles.btnAttack}
        onClick={attack}
        disabled={loading || !scenario}
      >
        {loading ? <span className={styles.spinner} /> : "⚡ Lancer Håstad"}
      </button>

      <Alert type="error" message={error} />

      {attackResult && (
        <>
          <Alert
            type="success"
            message={`Message récupéré : m = ${attackResult.result.message} (secret était ${scenario.message})`}
          />
          <StepList steps={attackResult.steps} />
          <ResultBox data={attackResult.result} />
          <ExplanationBox
            text={attackResult.explanation}
            complexity={attackResult.complexity}
          />
        </>
      )}
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────────
const TABS = [
  { id: "factorize", label: "Factorisation", icon: "🔢" },
  { id: "wiener", label: "Wiener", icon: "📐" },
  { id: "hastad", label: "Håstad", icon: "📡" },
];

export default function RSAAttackPage() {
  const [activeTab, setActiveTab] = useState("factorize");

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroTag}>Module 3 — Red Team</div>
        <h1 className={styles.heroTitle}>
          <span className={styles.heroAccent}>RSA</span> Attaques
        </h1>
        <p className={styles.heroDesc}>
          Démonstration interactive des vulnérabilités RSA classiques.
          Générez des clés intentionnellement faibles et observez comment elles sont cassées.
        </p>
      </div>

      <div className={styles.container}>
        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <div className={styles.panel}>
          {activeTab === "factorize" && <TabFactorize />}
          {activeTab === "wiener" && <TabWiener />}
          {activeTab === "hastad" && <TabHastad />}
        </div>
      </div>
    </div>
  );
}
