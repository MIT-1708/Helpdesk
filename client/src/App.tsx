import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { Sparkles, LogOut, User as UserIcon } from 'lucide-react'
import { useSession, signOut } from './lib/auth-client'
import Login from './pages/Login'
import Users from './pages/Users'

// Layout component
function Layout({ children }: { children: React.ReactNode }) {
  const { data: sessionState, isPending } = useSession()
  const user = sessionState?.user

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      {/* Top Navbar */}
      <header className="border-b border-border bg-background/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-amber-500 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-all">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Helpdesk AI
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
              Management Portal
            </p>
          </div>
        </Link>
        
        <div className="flex items-center gap-5">
          {!isPending && user?.role === 'admin' && (
            <Link
              to="/users"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-all px-3 py-1.5 rounded-lg hover:bg-muted/50"
            >
              Users
            </Link>
          )}
          {/* User Section in Nav */}
          {!isPending && (
            user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pl-4 border-l border-border">
                  <div className="h-8 w-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-foreground leading-none">{user.name}</span>
                    <span className="text-[10px] text-primary capitalize mt-0.5 font-medium leading-none">{user.role}</span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await signOut()
                    window.location.href = '/login'
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/10 hover:shadow-primary/25 transition-all"
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
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground bg-background">
        &copy; {new Date().getFullYear()} Helpdesk AI <span className="text-primary font-medium">Ticket Management System</span>. All rights reserved.
      </footer>
    </div>
  )
}

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: sessionState, isPending } = useSession()

  if (isPending) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background min-h-[calc(100vh-140px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
        <span className="text-xs text-muted-foreground">Verifying session...</span>
      </div>
    )
  }

  if (!sessionState?.user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Admin-only Route Wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data: sessionState, isPending } = useSession()

  if (isPending) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background min-h-[calc(100vh-140px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
        <span className="text-xs text-muted-foreground">Verifying session...</span>
      </div>
    )
  }

  if (!sessionState?.user) {
    return <Navigate to="/login" replace />
  }

  if (sessionState.user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// Public-only route (redirects to home if already logged in)
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { data: sessionState, isPending } = useSession()

  if (isPending) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background min-h-[calc(100vh-140px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
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
      <h1 className="text-4xl font-bold text-foreground">Desktop</h1>
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
          <Route 
            path="/users" 
            element={
              <AdminRoute>
                <Users />
              </AdminRoute>
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
