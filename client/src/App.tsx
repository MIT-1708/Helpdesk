import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Server, Activity, ShieldAlert, Sparkles, Database, CheckCircle2 } from 'lucide-react'

// Layout component
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Helpdesk AI
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
              Management Portal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Phase 1 Active
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 bg-slate-950">
        &copy; {new Date().getFullYear()} Helpdesk AI Ticket Management System. All rights reserved.
      </footer>
    </div>
  )
}

// Welcome/Status screen for Phase 1
function PhaseOneStatus() {
  const [health, setHealth] = useState<{
    status: string;
    database: string;
    timestamp: string;
    error?: string;
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const checkHealth = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/health')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setHealth(data)
    } catch (err: any) {
      setHealth({
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
        error: err.message || 'Could not connect to Express server'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
      {/* Visual background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Welcome Banner */}
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Full-Stack Setup Complete
        </span>
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
          AI-Powered Support Desk
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-base sm:text-lg leading-relaxed">
          Welcome to your new Helpdesk project. Express backend, React frontend, Tailwind CSS, TypeScript, and Bun are successfully configured.
        </p>
      </div>

      {/* API Health Message Banner */}
      {!loading && health && (
        <div className={`w-full p-4 rounded-xl border mb-6 flex items-start gap-3 transition-all duration-300 ${
          health.status === 'healthy' && health.database === 'connected'
            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
            : 'border-rose-500/20 bg-rose-500/5 text-rose-400'
        }`}>
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">
              {health.status === 'healthy' && health.database === 'connected'
                ? 'API & Database Connection Successful'
                : 'System Connection Error'}
            </p>
            <p className="text-xs opacity-90 mt-0.5 font-mono">
              {health.status === 'healthy' && health.database === 'connected'
                ? `Response: status=healthy, database=connected, timestamp=${health.timestamp}`
                : `Error response: ${health.error || 'Database is disconnected'}`}
            </p>
          </div>
        </div>
      )}

      {/* Grid of System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-10">
        {/* Core Tech Stack */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-400" />
            Configured Tech Stack
          </h3>
          <ul className="space-y-3.5 text-sm text-slate-400">
            <li className="flex justify-between items-center border-b border-slate-800/40 pb-2">
              <span>Frontend Library</span>
              <span className="font-semibold text-slate-200">React + TypeScript</span>
            </li>
            <li className="flex justify-between items-center border-b border-slate-800/40 pb-2">
              <span>CSS Framework</span>
              <span className="font-semibold text-slate-200">Tailwind CSS v4</span>
            </li>
            <li className="flex justify-between items-center border-b border-slate-800/40 pb-2">
              <span>Routing Module</span>
              <span className="font-semibold text-slate-200">React Router v7</span>
            </li>
            <li className="flex justify-between items-center border-b border-slate-800/40 pb-2">
              <span>Backend Engine</span>
              <span className="font-semibold text-slate-200">Express + Bun Runtime</span>
            </li>
            <li className="flex justify-between items-center">
              <span>ORM & Database</span>
              <span className="font-semibold text-slate-200">Prisma (PostgreSQL)</span>
            </li>
          </ul>
        </div>

        {/* Integration Status Check */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Server className="h-4 w-4 text-indigo-400" />
                Connection & Integration Status
              </span>
              <button 
                onClick={checkHealth}
                disabled={loading}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline disabled:opacity-50 transition-all cursor-pointer"
              >
                Refresh
              </button>
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mb-2"></div>
                <span className="text-xs text-slate-500">Checking api health...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Express Server Health */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <Server className="h-5 w-5 text-indigo-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Express API Server</p>
                      <p className="text-[10px] text-slate-500">http://localhost:5000</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    health?.status === 'healthy' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {health?.status === 'healthy' ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Database Connectivity */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-indigo-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">PostgreSQL (Prisma)</p>
                      <p className="text-[10px] text-slate-500">
                        {health?.database === 'connected' ? 'Connected successfully' : 'Not reachable'}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    health?.database === 'connected' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {health?.database === 'connected' ? 'Connected' : 'Pending Db Start'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {!loading && health?.status !== 'healthy' && (
            <div className="mt-4 flex gap-2 items-start text-xs text-amber-500/90 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Backend offline. Run <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-400">bun run dev:server</code> in another terminal window.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Next Step / Phase Transition Callout */}
      <div className="w-full text-center">
        <h4 className="text-sm font-semibold text-slate-400 mb-2">Phase 1 Complete! Ready for Phase 2:</h4>
        <div className="inline-flex flex-col sm:flex-row gap-3 items-center justify-center bg-slate-900/30 border border-slate-800/60 p-4 rounded-xl max-w-lg mx-auto w-full">
          <span className="text-xs text-slate-300 font-medium">Next: Database Authentication & Sessions</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Database Schema Prepared
          </span>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<PhaseOneStatus />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
