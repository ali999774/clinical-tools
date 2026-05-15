import { useState } from "react";

const TIME_THRESHOLDS = {
  established: [
    { min: 10, max: 19, code: "99212", level: 2, mdm: "Straightforward" },
    { min: 20, max: 29, code: "99213", level: 3, mdm: "Low" },
    { min: 30, max: 39, code: "99214", level: 4, mdm: "Moderate" },
    { min: 40, max: 54, code: "99215", level: 5, mdm: "High" },
    { min: 55, max: 69, code: "99215 + 99417", level: 5, mdm: "High + Prolonged ×1" },
    { min: 70, max: 999, code: "99215 + 99417×2", level: 5, mdm: "High + Prolonged ×2" },
  ],
  new: [
    { min: 15, max: 29, code: "99202", level: 2, mdm: "Straightforward" },
    { min: 30, max: 44, code: "99203", level: 3, mdm: "Low" },
    { min: 45, max: 59, code: "99204", level: 4, mdm: "Moderate" },
    { min: 60, max: 74, code: "99205", level: 5, mdm: "High" },
    { min: 75, max: 89, code: "99205 + 99417", level: 5, mdm: "High + Prolonged ×1" },
    { min: 90, max: 999, code: "99205 + 99417×2", level: 5, mdm: "High + Prolonged ×2" },
  ],
};

const WELL_CODES = {
  new: [
    { label: "Newborn < 28 days", code: "99460/99461" },
    { label: "1–11 months", code: "99381" },
    { label: "1–4 years", code: "99382" },
    { label: "5–11 years", code: "99383" },
    { label: "12–17 years", code: "99384" },
    { label: "18–39 years", code: "99385" },
  ],
  established: [
    { label: "Newborn < 28 days", code: "99460/99461" },
    { label: "1–11 months", code: "99391" },
    { label: "1–4 years", code: "99392" },
    { label: "5–11 years", code: "99393" },
    { label: "12–17 years", code: "99394" },
    { label: "18–39 years", code: "99395" },
  ],
};

const PROBLEM_OPTIONS = [
  { value: 1, label: "Minimal", desc: "1 self-limited or minor problem", eg: "URI, rash, conjunctivitis" },
  { value: 2, label: "Low", desc: "2+ self-limited, OR 1 stable chronic, OR 1 acute uncomplicated", eg: "Stable ADHD + URI, UTI, ankle sprain" },
  { value: 3, label: "Moderate", desc: "Chronic w/ exacerbation, undiagnosed new problem w/ uncertain prognosis, acute w/ systemic symptoms", eg: "Asthma exacerbation, new seizure, fever with meningismus" },
  { value: 4, label: "High", desc: "Chronic illness with severe exacerbation, or threat to life/bodily function", eg: "Status asthmaticus, sepsis, DKA, suicidality" },
];

function calcMDMLevel({ problemScore, dataScore, riskScore }) {
  const sorted = [problemScore, dataScore, riskScore].sort((a, b) => a - b);
  const twoOfThree = sorted[1];
  if (twoOfThree >= 4) return { level: 5, label: "High" };
  if (twoOfThree >= 3) return { level: 4, label: "Moderate" };
  if (twoOfThree >= 2) return { level: 3, label: "Low" };
  return { level: 2, label: "Straightforward" };
}

function getCode(level, patientType) {
  const map = {
    established: { 2: "99212", 3: "99213", 4: "99214", 5: "99215" },
    new: { 2: "99202", 3: "99203", 4: "99204", 5: "99205" },
  };
  return map[patientType][level] || "—";
}

const LEVEL_STYLES = {
  light: {
    2: { bg: "#f0fdf4", border: "#86efac", text: "#14532d", badgeBg: "#dcfce7", badgeText: "#166534" },
    3: { bg: "#eff6ff", border: "#93c5fd", text: "#1e3a8a", badgeBg: "#dbeafe", badgeText: "#1d4ed8" },
    4: { bg: "#fffbeb", border: "#fcd34d", text: "#78350f", badgeBg: "#fef3c7", badgeText: "#92400e" },
    5: { bg: "#fef2f2", border: "#fca5a5", text: "#7f1d1d", badgeBg: "#fee2e2", badgeText: "#991b1b" },
  },
  dark: {
    2: { bg: "#052e16", border: "#166534", text: "#4ade80", badgeBg: "#14532d", badgeText: "#86efac" },
    3: { bg: "#0c1a3a", border: "#1e3a8a", text: "#93b4f8", badgeBg: "#1e3a8a", badgeText: "#bfdbfe" },
    4: { bg: "#1c1100", border: "#78350f", text: "#fbbf24", badgeBg: "#78350f", badgeText: "#fde68a" },
    5: { bg: "#1a0505", border: "#7f1d1d", text: "#f87171", badgeBg: "#7f1d1d", badgeText: "#fecaca" },
  },
};

const mkMDM  = () => ({ problemText: "", problemScore: 0, stableCount: "0", exacerbation: "no", tests: false, external: false, historian: false, interp: false, discussion: false, otc: false, rx: false, sdoh: false, toxicity: false, escalation: false });
const mkTime = () => ({ minutes: 20 });
const mkM25  = () => ({ wellVisit: false, acuteProblem: false, separateHPI: false, separatePlan: false, notRelated: false, ageGroup: "1", emCode: "99213" });

export default function EMCalculator() {
  const [dark, setDark] = useState(false);
  const [patientType, setPatientType] = useState("established");
  const [tab, setTab] = useState("mdm");
  const [mdm, setMdm] = useState(mkMDM);
  const [timeState, setTimeState] = useState(mkTime);
  const [m25, setM25] = useState(mkM25);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const theme = dark ? "dark" : "light";
  const T = {
    bg: dark ? "#0f0f0e" : "#f5f4f1",
    surface: dark ? "#1a1a18" : "#ffffff",
    surface2: dark ? "#242422" : "#f0eee9",
    border: dark ? "#2e2e2b" : "#e2dfd8",
    borderStrong: dark ? "#3d3d39" : "#c8c4bc",
    text: dark ? "#f0ede8" : "#1a1917",
    muted: dark ? "#8c8a85" : "#6b6860",
    faint: dark ? "#5a5956" : "#9c9890",
    accent: dark ? "#5b8df5" : "#1a56db",
    accentBg: dark ? "#0f1829" : "#eff4ff",
    accentText: dark ? "#93b4f8" : "#1e40af",
    accentBorder: dark ? "#1e3a8a" : "#bfdbfe",
    amber: dark ? "#fbbf24" : "#92400e",
    amberBg: dark ? "#1c1100" : "#fffbeb",
    amberBorder: dark ? "#78350f" : "#fde68a",
    green: dark ? "#4ade80" : "#166534",
    greenBg: dark ? "#052e16" : "#f0fdf4",
    greenBorder: dark ? "#166534" : "#86efac",
    red: dark ? "#f87171" : "#991b1b",
    redBg: dark ? "#1a0505" : "#fef2f2",
    redBorder: dark ? "#7f1d1d" : "#fecaca",
  };

  function handleReset() {
    setMdm(mkMDM());
    setTimeState(mkTime());
    setM25(mkM25());
    setAiResult(null);
    setAiLoading(false);
  }

  // ── MDM calculations ──
  const effectiveProblemScore = (() => {
    let s = mdm.problemScore;
    if (mdm.exacerbation === "yes") s = Math.max(s, 3);
    const sc = parseInt(mdm.stableCount) || 0;
    if (sc >= 3) s = Math.max(s, 3);
    else if (sc >= 2) s = Math.max(s, 2);
    return s;
  })();

  const dataScore = (() => {
    const count = [mdm.tests, mdm.external, mdm.historian, mdm.interp, mdm.discussion].filter(Boolean).length;
    if (count === 0) return 1;
    if (count === 1) return 2;
    return 3;
  })();

  const riskScore = (() => {
    if (mdm.escalation || mdm.toxicity) return 4;
    if (mdm.rx || mdm.sdoh) return 3;
    if (mdm.otc) return 2;
    return 1;
  })();

  const mdmResult = calcMDMLevel({ problemScore: effectiveProblemScore, dataScore, riskScore });
  const mdmReady = mdm.problemScore > 0 || mdm.tests || mdm.external || mdm.historian || mdm.interp || mdm.discussion || mdm.otc || mdm.rx || mdm.sdoh || mdm.toxicity || mdm.escalation || mdm.exacerbation === "yes" || parseInt(mdm.stableCount) > 0;
  const mdmCode = mdmReady ? getCode(mdmResult.level, patientType) : "—";
  const LS = LEVEL_STYLES[theme];

  // ── Time calculation ──
  const timeResult = TIME_THRESHOLDS[patientType].find(t => timeState.minutes >= t.min && timeState.minutes <= t.max);

  // ── M25 ──
  const m25AllMet = m25.wellVisit && m25.acuteProblem && m25.separateHPI && m25.separatePlan && m25.notRelated;
  const m25Partial = m25.wellVisit && m25.acuteProblem && !m25AllMet;
  const wellList = WELL_CODES[patientType];
  const selectedWell = wellList[parseInt(m25.ageGroup)] || wellList[1];

  // ── Claude API ──
  async function handleAiAnalysis() {
    if (!mdm.problemText.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const dataItems = [mdm.tests && "Ordered tests", mdm.external && "Reviewed external records", mdm.historian && "Independent historian", mdm.interp && "Independent test interpretation", mdm.discussion && "Discussion with external provider"].filter(Boolean);
      const riskItems = [mdm.otc && "OTC/minor treatment", mdm.rx && "Prescription drug management", mdm.sdoh && "SDOH limiting treatment", mdm.toxicity && "Drug requiring toxicity monitoring", mdm.escalation && "Decision re: hospitalization/escalation"].filter(Boolean);
      const prob = PROBLEM_OPTIONS.find(o => o.value === mdm.problemScore);

      const prompt = `You are a pediatric E/M coding expert (2021 AMA guidelines). Be concise and practical.

VISIT: ${patientType === "established" ? "Established" : "New"} patient
PROBLEMS: ${mdm.problemText}
PROBLEM COMPLEXITY: ${prob?.label || "Not selected"} — ${prob?.desc || ""}
STABLE CHRONIC CONDITIONS: ${mdm.stableCount}
EXACERBATION: ${mdm.exacerbation}
DATA: ${dataItems.length ? dataItems.join(", ") : "None"}
RISK: ${riskItems.length ? riskItems.join(", ") : "None"}
CURRENT RESULT: ${mdmCode} (Level ${mdmResult.level} — ${mdmResult.label})
COLUMN SCORES: Problems ${effectiveProblemScore}/4 | Data ${dataScore}/4 | Risk ${riskScore}/4

Respond in this format (no preamble):

**Current level: ${mdmCode} — ${mdmResult.label}**
One sentence explaining why.

**To reach ${mdmResult.level < 5 ? (mdmResult.level < 4 ? `99214/${patientType === "new" ? "99204" : "99214"} or 99215/${patientType === "new" ? "99205" : "99215"}` : `99215/${patientType === "new" ? "99205" : "99215"}`) : "maintain Level 5"}:**
- [specific actionable upgrade — what to add/document]
- [another specific item]
(max 3 bullets, peds-specific)

**Documentation tip:**
1 specific phrase to add to the note.`;

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 600, messages: [{ role: "user", content: prompt }] }),
      });
      const json = await resp.json();
      setAiResult(json.content?.find(b => b.type === "text")?.text || "No response.");
    } catch {
      setAiResult("Error reaching Claude API. Please try again.");
    }
    setAiLoading(false);
  }

  // ── Shared styles ──
  const cardStyle = { background: T.surface2, borderRadius: 10, padding: "12px 14px", marginBottom: 10 };
  const labelStyle = { fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: T.faint, marginBottom: 6 };
  const selectStyle = { width: "100%", padding: "8px 10px", fontSize: 13, color: T.text, background: T.surface, border: `1px solid ${T.borderStrong}`, borderRadius: 8, cursor: "pointer" };
  const checkRowStyle = { display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 0", cursor: "pointer", borderBottom: `1px solid ${T.border}` };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif", color: T.text }}>
      <div style={{ maxWidth: 660, margin: "0 auto", padding: "20px 16px 48px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>E/M Level Calculator</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>Office / Outpatient · 2021 AMA Guidelines</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleReset} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 600, background: T.surface2, color: T.muted, border: `1px solid ${T.borderStrong}`, borderRadius: 20, cursor: "pointer" }}>
              ↺ Reset
            </button>
            <button onClick={() => setDark(d => !d)} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 500, background: T.surface2, color: T.muted, border: `1px solid ${T.borderStrong}`, borderRadius: 20, cursor: "pointer" }}>
              {dark ? "☀ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>

        {/* Patient toggle */}
        <div style={{ display: "flex", background: T.surface2, borderRadius: 10, padding: 4, marginBottom: 20, border: `1px solid ${T.border}` }}>
          {["established", "new"].map(pt => (
            <button key={pt} onClick={() => setPatientType(pt)} style={{ flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none", cursor: "pointer", transition: "all 0.15s", background: patientType === pt ? T.surface : "transparent", color: patientType === pt ? T.text : T.muted, boxShadow: patientType === pt ? "0 1px 4px rgba(0,0,0,0.12)" : "none" }}>
              {pt === "established" ? "Established patient" : "New patient"}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, marginBottom: 20 }}>
          {[{ id: "mdm", label: "MDM" }, { id: "time", label: "Time" }, { id: "m25", label: "Modifier 25" }].map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)} style={{ padding: "9px 20px", fontSize: 13, fontWeight: 600, background: "transparent", border: "none", borderBottom: `2px solid ${tab === id ? T.accent : "transparent"}`, color: tab === id ? T.accent : T.muted, cursor: "pointer", marginBottom: -1 }}>
              {label}
            </button>
          ))}
        </div>

        {/* Panel wrapper */}
        <div style={{ background: T.surface, borderRadius: 12, padding: "16px 16px 20px", border: `1px solid ${T.border}` }}>

          {/* ── MDM TAB ── */}
          {tab === "mdm" && (
            <div>
              {/* Result banner */}
              {!mdmReady ? (
                <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: T.faint }}>Select problem complexity or check data/risk items to calculate level</div>
                </div>
              ) : (
                <div style={{ background: LS[mdmResult.level]?.bg, border: `1px solid ${LS[mdmResult.level]?.border}`, borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: LS[mdmResult.level]?.text, opacity: 0.7, marginBottom: 2 }}>{patientType === "established" ? "Established" : "New"} Patient</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: LS[mdmResult.level]?.text, lineHeight: 1.1 }}>{mdmCode}</div>
                    <div style={{ fontSize: 12, color: LS[mdmResult.level]?.text, opacity: 0.8, marginTop: 2 }}>Level {mdmResult.level} — {mdmResult.label} MDM</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
                    {[["Problems", effectiveProblemScore], ["Data", dataScore], ["Risk", riskScore]].map(([lbl, val]) => (
                      <div key={lbl} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: LS[mdmResult.level]?.text, opacity: 0.6 }}>{lbl}</span>
                        <div style={{ display: "flex", gap: 2 }}>
                          {[1,2,3,4].map(i => <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: LS[mdmResult.level]?.text, opacity: i <= val ? 0.9 : 0.2 }} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Problem text */}
              <div style={labelStyle}>Diagnoses / Problems Addressed</div>
              <textarea value={mdm.problemText} onChange={e => setMdm(m => ({ ...m, problemText: e.target.value }))}
                placeholder={"ADHD follow-up\nSeasonal allergies\nEar pain"} rows={3}
                style={{ width: "100%", padding: "9px 11px", fontSize: 13, color: T.text, background: T.surface2, border: `1px solid ${T.borderStrong}`, borderRadius: 8, resize: "vertical", fontFamily: "inherit", marginBottom: 12, lineHeight: 1.5, boxSizing: "border-box" }} />

              {/* Problem + stable */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={labelStyle}>Problem complexity</div>
                  <select value={mdm.problemScore} onChange={e => setMdm(m => ({ ...m, problemScore: parseInt(e.target.value) }))} style={selectStyle}>
                    <option value={0}>— Select —</option>
                    {PROBLEM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {mdm.problemScore > 0 && <div style={{ fontSize: 11, color: T.faint, marginTop: 4, lineHeight: 1.4 }}>{PROBLEM_OPTIONS.find(o => o.value === mdm.problemScore)?.eg}</div>}
                </div>
                <div>
                  <div style={labelStyle}>Stable chronic conditions</div>
                  <select value={mdm.stableCount} onChange={e => setMdm(m => ({ ...m, stableCount: e.target.value }))} style={selectStyle}>
                    <option value="0">None</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3+</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={labelStyle}>Chronic illness w/ exacerbation / progression / side effects</div>
                <select value={mdm.exacerbation} onChange={e => setMdm(m => ({ ...m, exacerbation: e.target.value }))} style={selectStyle}>
                  <option value="no">No</option>
                  <option value="yes">Yes — escalates problem score to Moderate minimum</option>
                </select>
              </div>

              {/* Data */}
              <div style={cardStyle}>
                <div style={labelStyle}>Data / Workup</div>
                {[
                  { key: "tests", label: "Ordered test(s)", hint: "labs, imaging, cultures" },
                  { key: "external", label: "Reviewed external notes / records", hint: "outside records, prior provider notes, school reports" },
                  { key: "historian", label: "Independent historian (parent, caregiver)", hint: "history from someone other than patient" },
                  { key: "interp", label: "Independent interpretation of test (not separately billed)", hint: "personally reviewing X-ray, EKG, etc." },
                  { key: "discussion", label: "Discussion with external provider / school / specialist", hint: "direct interactive communication" },
                ].map(({ key, label, hint }) => (
                  <label key={key} style={checkRowStyle}>
                    <input type="checkbox" checked={mdm[key]} onChange={e => setMdm(m => ({ ...m, [key]: e.target.checked }))} style={{ marginTop: 3, accentColor: T.accent, flexShrink: 0 }} />
                    <div><div style={{ fontSize: 13, color: T.text }}>{label}</div><div style={{ fontSize: 11, color: T.faint, marginTop: 1 }}>{hint}</div></div>
                  </label>
                ))}
              </div>

              {/* Risk */}
              <div style={cardStyle}>
                <div style={labelStyle}>Management / Risk</div>
                {[
                  { key: "otc", label: "OTC medication / minor treatment", hint: "→ Low risk" },
                  { key: "rx", label: "Prescription drug management (new or change)", hint: "→ Moderate risk" },
                  { key: "sdoh", label: "Treatment limited by social determinants of health", hint: "→ Moderate risk" },
                  { key: "toxicity", label: "Drug therapy requiring intensive monitoring for toxicity", hint: "→ High risk (methotrexate, clozapine, etc.)" },
                  { key: "escalation", label: "Decision re: hospitalization / escalation of care", hint: "→ High risk — ED, same-day specialist, admit" },
                ].map(({ key, label, hint }) => (
                  <label key={key} style={checkRowStyle}>
                    <input type="checkbox" checked={mdm[key]} onChange={e => setMdm(m => ({ ...m, [key]: e.target.checked }))} style={{ marginTop: 3, accentColor: T.accent, flexShrink: 0 }} />
                    <div><div style={{ fontSize: 13, color: T.text }}>{label}</div><div style={{ fontSize: 11, color: T.faint, marginTop: 1 }}>{hint}</div></div>
                  </label>
                ))}
              </div>

              {/* Claude API panel */}
              <div style={{ background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: 10, padding: "12px 14px", marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.accentText }}>✦ Claude MDM Analysis</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Upgrade tips & documentation guidance</div>
                  </div>
                  <button onClick={handleAiAnalysis} disabled={aiLoading || !mdm.problemText.trim()}
                    style={{ padding: "7px 16px", fontSize: 12, fontWeight: 700, background: mdm.problemText.trim() && !aiLoading ? T.accent : T.borderStrong, color: "#fff", border: "none", borderRadius: 8, cursor: mdm.problemText.trim() && !aiLoading ? "pointer" : "not-allowed", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {aiLoading ? "Analyzing…" : "Analyze"}
                  </button>
                </div>
                {!mdm.problemText.trim() && <div style={{ fontSize: 11, color: T.faint, marginTop: 6 }}>Enter diagnoses above to enable</div>}
                {(aiLoading || aiResult) && (
                  <div style={{ marginTop: 12, borderTop: `1px solid ${T.accentBorder}`, paddingTop: 12 }}>
                    {aiLoading
                      ? <div style={{ fontSize: 13, color: T.muted }}>Consulting 2021 AMA guidelines…</div>
                      : <div style={{ fontSize: 12, color: T.text, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{aiResult}</div>
                    }
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TIME TAB ── */}
          {tab === "time" && (
            <div>
              {timeResult ? (
                <div style={{ background: LS[timeResult.level]?.bg, border: `1px solid ${LS[timeResult.level]?.border}`, borderRadius: 12, padding: "14px 18px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: LS[timeResult.level]?.text, opacity: 0.7, marginBottom: 2 }}>Time-Based Billing</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: LS[timeResult.level]?.text, lineHeight: 1.1 }}>{timeResult.code}</div>
                    <div style={{ fontSize: 12, color: LS[timeResult.level]?.text, opacity: 0.8, marginTop: 2 }}>{timeResult.mdm} — {timeState.minutes} min</div>
                  </div>
                  <div style={{ fontSize: 38, opacity: 0.15 }}>⏱</div>
                </div>
              ) : (
                <div style={{ background: T.surface2, borderRadius: 12, padding: "14px 18px", marginBottom: 16, color: T.muted, fontSize: 13 }}>
                  Minimum {patientType === "established" ? 10 : 15} min required for time-based billing
                </div>
              )}

              <div style={labelStyle}>Total visit time (minutes)</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <input type="range" min={5} max={90} step={1} value={timeState.minutes} onChange={e => setTimeState({ minutes: parseInt(e.target.value) })} style={{ flex: 1, accentColor: T.accent }} />
                <div style={{ fontSize: 24, fontWeight: 700, minWidth: 52, textAlign: "right" }}>{timeState.minutes}m</div>
              </div>
              <div style={{ fontSize: 11, color: T.faint, marginBottom: 16, lineHeight: 1.5 }}>Includes all time on the date of service: pre-visit chart review, face-to-face, counseling, coordination, documentation. Does not need to be continuous.</div>

              <div style={labelStyle}>Thresholds — {patientType === "established" ? "Established" : "New"} patient</div>
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.surface2 }}>
                      {["Minutes", "CPT Code", "MDM Equiv.", "Level"].map(h => (
                        <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: T.faint, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_THRESHOLDS[patientType].map((row, i) => {
                      const active = timeResult?.code === row.code;
                      const ls = LS[row.level];
                      return (
                        <tr key={i} style={{ background: active ? ls?.bg : "transparent" }}>
                          <td style={{ padding: "7px 10px", color: active ? ls?.text : T.text, fontWeight: active ? 700 : 400, borderBottom: `1px solid ${T.border}` }}>{row.min}–{row.max === 999 ? "∞" : row.max}</td>
                          <td style={{ padding: "7px 10px", color: active ? ls?.text : T.text, fontWeight: active ? 700 : 500, borderBottom: `1px solid ${T.border}` }}>{row.code}</td>
                          <td style={{ padding: "7px 10px", color: active ? ls?.text : T.muted, borderBottom: `1px solid ${T.border}` }}>{row.mdm}</td>
                          <td style={{ padding: "7px 10px", borderBottom: `1px solid ${T.border}` }}>
                            <span style={{ background: ls?.badgeBg, color: ls?.badgeText, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>L{row.level}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 12, background: T.amberBg, border: `1px solid ${T.amberBorder}`, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: T.amber, lineHeight: 1.55 }}>
                <strong>Documentation tip:</strong> State explicitly: <em>"Total time on this encounter including chart review, face-to-face, counseling, and documentation: XX minutes."</em>
              </div>
            </div>
          )}

          {/* ── MODIFIER 25 TAB ── */}
          {tab === "m25" && (
            <div>
              {m25AllMet ? (
                <div style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.green, marginBottom: 8 }}>✓ Bill Modifier 25 — criteria met</div>
                  <div style={{ fontFamily: "monospace", fontSize: 15, color: T.green, fontWeight: 700, background: `${T.greenBorder}55`, padding: "8px 12px", borderRadius: 8, display: "inline-block", marginBottom: 8 }}>
                    {selectedWell?.code} + {m25.emCode}-25
                  </div>
                  <div style={{ fontSize: 12, color: T.green, opacity: 0.85, lineHeight: 1.5 }}>Bill the well-visit code separately. Append -25 to the E/M code to indicate a significant, separately identifiable service on the same date.</div>
                </div>
              ) : m25Partial ? (
                <div style={{ background: T.amberBg, border: `1px solid ${T.amberBorder}`, borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.amber, marginBottom: 4 }}>⚠ Modifier 25 may apply — verify documentation</div>
                  <div style={{ fontSize: 12, color: T.amber, lineHeight: 1.5 }}>Complete all criteria below to confirm billing.</div>
                </div>
              ) : (
                <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 2 }}>Modifier 25 Checker</div>
                  <div style={{ fontSize: 12, color: T.faint, lineHeight: 1.5 }}>Determine if you can bill a same-day E/M with a preventive visit.</div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={labelStyle}>Age group (preventive code)</div>
                  <select value={m25.ageGroup} onChange={e => setM25(m => ({ ...m, ageGroup: e.target.value }))} style={selectStyle}>
                    {wellList.map((w, i) => <option key={i} value={i}>{w.label}</option>)}
                  </select>
                  <div style={{ fontSize: 11, color: T.faint, marginTop: 4 }}>Code: {selectedWell?.code}</div>
                </div>
                <div>
                  <div style={labelStyle}>E/M code (append -25)</div>
                  <select value={m25.emCode} onChange={e => setM25(m => ({ ...m, emCode: e.target.value }))} style={selectStyle}>
                    {(patientType === "established" ? ["99212","99213","99214","99215"] : ["99202","99203","99204","99205"]).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={labelStyle}>Modifier 25 criteria</div>
              <div style={cardStyle}>
                {[
                  { key: "wellVisit", label: "A preventive visit (well-child check) is being billed today", hint: "Primary service that triggers the -25 question" },
                  { key: "acuteProblem", label: "An acute or chronic problem was addressed beyond routine preventive screening", hint: "Distinct problem — UTI, asthma exacerbation, new ADHD concern, etc." },
                  { key: "separateHPI", label: "Separate HPI / history documented for the acute problem", hint: "Distinct complaint section, not folded into preventive ROS" },
                  { key: "separatePlan", label: "Separate assessment & plan documented for the acute problem", hint: "Its own A/P section or clearly delineated problem" },
                  { key: "notRelated", label: "The acute problem is not the focus of the routine preventive exam", hint: "E.g. addressing a UTI is separate from developmental surveillance" },
                ].map(({ key, label, hint }) => (
                  <label key={key} style={{ ...checkRowStyle, background: m25Partial && !m25[key] ? `${T.amberBg}` : "transparent", borderRadius: 4, margin: "0 -4px", padding: "7px 4px" }}>
                    <input type="checkbox" checked={m25[key]} onChange={e => setM25(m => ({ ...m, [key]: e.target.checked }))} style={{ marginTop: 3, accentColor: T.accent, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, color: m25Partial && !m25[key] ? T.amber : T.text, lineHeight: 1.4 }}>{label}</div>
                      <div style={{ fontSize: 11, color: T.faint, marginTop: 1 }}>{hint}</div>
                    </div>
                  </label>
                ))}
              </div>

              {m25AllMet && (
                <div style={{ background: T.accentBg, border: `1px solid ${T.accentBorder}`, borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.accentText, marginBottom: 6 }}>Sample documentation phrase</div>
                  <div style={{ fontSize: 12, color: T.accentText, lineHeight: 1.65, fontStyle: "italic" }}>
                    "In addition to the routine preventive visit, the family raised a separate concern regarding [problem]. A separate history, examination, and management plan were documented for this issue, which was distinct from the preventive services rendered today. Modifier -25 is appended to {m25.emCode}."
                  </div>
                </div>
              )}

              <div style={{ background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: T.red, lineHeight: 1.55 }}>
                <strong>Audit note:</strong> Medicaid and some payers routinely deny -25 on well visits. Documentation must clearly delineate the acute problem. Shared ROS/exam is acceptable — only HPI and A/P need separation.
              </div>
            </div>
          )}

        </div>

        <div style={{ marginTop: 12, fontSize: 11, color: T.faint, textAlign: "center" }}>
          For coding guidance only · 2021 AMA E/M guidelines · Verify with your payer contracts
        </div>
      </div>
    </div>
  );
}
