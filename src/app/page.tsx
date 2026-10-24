import './globals.css';

export default function HomePage() {
  return (
    <main className="page-shell">
      <div className="hero-card">
        <p className="eyebrow">Harbour OS</p>
        <h1>Modern operations for a calmer digital harbour.</h1>
        <p className="subtitle">
          This app is ready for local development, Docker deployment, and Portainer-based orchestration.
        </p>
        <div className="pill-row">
          <span>Next.js</span>
          <span>TypeScript</span>
          <span>Drizzle</span>
          <span>Docker</span>
        </div>
      </div>
    </main>
  );
}
