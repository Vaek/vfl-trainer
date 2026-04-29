import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './modes/Home'
import Study from './modes/Study'
import Practice from './modes/Practice'
import Mock from './modes/Mock'
import Dashboard from './modes/Dashboard'
import Oral from './modes/Oral'

const NAV = [
  { to: '/', label: 'Domů' },
  { to: '/study', label: 'Studium' },
  { to: '/practice', label: 'Procvičování' },
  { to: '/mock', label: 'Cvičná zkouška' },
  { to: '/oral', label: 'Ústní zkouška' },
  { to: '/dashboard', label: 'Statistiky' },
]

function Header() {
  const loc = useLocation()
  return (
    <header className="border-b border-ink/10 bg-paper/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <Link to="/" className="group">
          <div className="font-mono text-[10px] tracking-[0.25em] text-muted uppercase">
            ČTÚ § 2 písm. a)
          </div>
          <div className="h-display text-2xl leading-none">
            VFL <span className="text-signal">Trainer</span>
          </div>
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {NAV.map((n) => {
            const active = loc.pathname === n.to
            return (
              <Link
                key={n.to}
                to={n.to}
                className={
                  active
                    ? 'text-ink font-medium border-b-2 border-signal pb-1'
                    : 'text-muted hover:text-ink pb-1 border-b-2 border-transparent'
                }
              >
                {n.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-ink/10">
      <div className="max-w-5xl mx-auto px-6 py-8 text-xs text-muted leading-relaxed">
        <p className="mb-2">
          <strong>Disclaimer:</strong> Tento nástroj je studijní pomůcka. Není oficiálním produktem
          Českého telekomunikačního úřadu. Otázky vycházejí z veřejně publikovaných materiálů ČTÚ
          (čj. ČTÚ‑79 329/2017‑613, vydání 2018_05 V5; osnovy ústních zkoušek 2018_01).
        </p>
        <p>
          Závazné znění a aktuální verzi otázek vždy ověřujte na webu ČTÚ. Pravopis ICAO a frazeologie
          dle Předpisu L Frazeologie a L 10/II.
        </p>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/study" element={<Study />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/mock" element={<Mock />} />
          <Route path="/oral" element={<Oral />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
