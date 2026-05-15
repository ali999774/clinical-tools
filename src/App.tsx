import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import EMCalculator from "./artifacts/EMCalculator";

// ── Artifact Manifest ──────────────────────────────
// Add new entries here when you drop files into src/artifacts/ or public/artifacts/
const ARTIFACTS = [
  {
    id: "em-calculator",
    name: "E/M Level Calculator",
    description: "AMA 2021 E/M coding calculator for established and new patients. Includes prolonged service codes, modifier -25 guidance, and well-visit sick overlay.",
    type: "jsx",
    path: "/em",
    tags: ["pediatrics", "clinical", "coding"],
  },
  {
    id: "bp-calculator",
    name: "Blood Pressure Percentile Calculator",
    description: "AAP pediatric BP percentile calculator based on age, height, and sex reference tables.",
    type: "html",
    path: "/artifacts/bp-calculator.html",
    tags: ["pediatrics", "clinical"],
  },
  {
    id: "dyslexia-screen",
    name: "Bedside Dyslexia Screen",
    description: "Phonological bedside screening tool by age group. Quick in-office dyslexia risk assessment for pediatric patients.",
    type: "html",
    path: "/artifacts/dyslexia-bedside-screen.html",
    tags: ["pediatrics", "clinical", "screening"],
  },
];

function Gallery() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>🩺 Clinical Tools</h1>
      <p style={{ color: "#666", marginBottom: 32, fontSize: 14 }}>
        Quick-access pediatric tools for use at the office.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {ARTIFACTS.map((a) => (
          <a
            key={a.id}
            href={a.type === "html" ? a.path : undefined}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: 12,
                padding: "20px 24px",
                background: "#fff",
                transition: "box-shadow 0.15s, border-color 0.15s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                e.currentTarget.style.borderColor = "#4f46e5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "#e0e0e0";
              }}
            >
              <Link
                to={a.path}
                style={{ textDecoration: "none", color: "inherit", display: "block" }}
                onClick={(e) => {
                  if (a.type === "html") {
                    e.preventDefault();
                    window.open(a.path, "_blank");
                  }
                }}
              >
                <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#111" }}>
                  {a.name}
                  {a.type === "html" ? (
                    <span style={{ fontSize: 11, color: "#999", marginLeft: 10, fontFamily: "monospace" }}>
                      HTML →
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: "#6366f1", marginLeft: 10, fontFamily: "monospace" }}>
                      JSX
                    </span>
                  )}
                </h3>
                <p style={{ margin: "0 0 12px", fontSize: 14, color: "#555", lineHeight: 1.5 }}>
                  {a.description}
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {a.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        background: "#f3f4f6",
                        color: "#666",
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const current = ARTIFACTS.find(a => a.path === location.pathname);
  return (
    <>
      {!isHome && (
        <header style={{
          borderBottom: "1px solid #e5e7eb",
          background: "#fff",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}>
          <Link to="/" style={{
            color: "#4f46e5",
            textDecoration: "none",
            fontWeight: 500,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <span style={{ fontSize: 16 }}>←</span> Clinical Tools
          </Link>
          {current && (
            <span style={{ fontSize: 13, color: "#9ca3af" }}>{current.name}</span>
          )}
        </header>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
        <Layout />
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/em" element={<EMCalculator />} />
        </Routes>
        <footer style={{ textAlign: "center", padding: "32px 20px", color: "#bbb", fontSize: 12 }}>
          Pediatric Clinical Tools · Dr. Ali Naqvi
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
