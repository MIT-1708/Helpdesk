import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { Sparkles, LogOut, User as UserIcon } from 'lucide-react'
import { useSession, signOut } from './lib/auth-client'
import Login from './pages/Login'

// Layout component
function Layout({ children }: { children: React.ReactNode }) {
  const { data: sessionState, isPending } = useSession()
  const user = sessionState?.user

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all">
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
        </Link>
        
        <div className="flex items-center gap-5">
          {/* User Section in Nav */}
          {!isPending && (
            user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
                  <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-200 leading-none">{user.name}</span>
                    <span className="text-[10px] text-indigo-400 capitalize mt-0.5 font-medium leading-none">{user.role}</span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await signOut()
                    window.location.href = '/login'
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-850 bg-slate-900/60 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 hover:border-slate-700/60 transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-xs font-semibold text-white shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all"
              >
                Sign In
              </Link>
            )
          )}
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

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: sessionState, isPending } = useSession()

  if (isPending) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 min-h-[calc(100vh-140px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mb-2"></div>
        <span className="text-xs text-slate-500">Verifying session...</span>
      </div>
    )
  }

  if (!sessionState?.user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Public-only route (redirects to home if already logged in)
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { data: sessionState, isPending } = useSession()

  if (isPending) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 min-h-[calc(100vh-140px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mb-2"></div>
      </div>
    )
  }

  if (sessionState?.user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// Home page
function HomePage() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <h1 className="text-4xl font-bold text-slate-100">Desktop</h1>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/login" 
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            } 
          />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
