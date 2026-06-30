import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { Sparkles, LogOut, User as UserIcon } from 'lucide-react'
import { useSession, signOut } from './lib/auth-client'
import Login from './pages/Login'
import Users from './pages/Users'
import Tickets from './pages/Tickets'
import TicketDetails from './pages/TicketDetails'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserRole } from '@helpdesk/core'

const queryClient = new QueryClient()

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
          {!isPending && user && (
            <Link
              to="/tickets"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-all px-3 py-1.5 rounded-lg hover:bg-muted/50"
            >
              Tickets
            </Link>
          )}
          {!isPending && user?.role === UserRole.ADMIN && (
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

function ContentSkeleton() {
  return (
    <div className="flex-1 p-6 md:p-10 bg-background relative min-h-[calc(100vh-140px)] overflow-hidden">
      {/* Dynamic background glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none -z-10 animate-pulse duration-[12s]" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-4 bg-muted rounded w-80" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 bg-muted rounded w-24" />
            <div className="h-8 bg-muted rounded w-24" />
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-card/40 border border-border p-4 rounded-2xl">
          <div className="h-10 bg-muted rounded-xl w-full sm:flex-1" />
          <div className="h-10 bg-muted rounded-xl w-full sm:w-48" />
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card/45 border border-border/80 p-6 rounded-2xl space-y-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-muted shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="h-5 bg-muted rounded-full w-16" />
                <div className="h-3 bg-muted rounded w-12" />
              </div>
              <div className="border-t border-border/50 pt-4 flex justify-between">
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[calc(100vh-140px)] relative overflow-hidden bg-background">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="w-full max-w-md bg-card/60 border border-border p-6 rounded-2xl shadow-2xl space-y-6 animate-pulse">
        <div className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-xl bg-muted" />
          <div className="h-6 w-32 bg-muted rounded-md mx-auto" />
          <div className="h-4 w-48 bg-muted rounded-md mx-auto" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-10 bg-muted rounded-xl w-full" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-10 bg-muted rounded-xl w-full" />
          </div>
          <div className="h-10 bg-muted rounded-xl w-full pt-2" />
        </div>
      </div>
    </div>
  );
}

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: sessionState, isPending } = useSession()

  if (isPending) {
    return <ContentSkeleton />
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
    return <ContentSkeleton />
  }

  if (!sessionState?.user) {
    return <Navigate to="/login" replace />
  }

  if (sessionState.user.role !== UserRole.ADMIN) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// Public-only route (redirects to home if already logged in)
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { data: sessionState, isPending } = useSession()

  if (isPending) {
    return <LoginSkeleton />
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
    <QueryClientProvider client={queryClient}>
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
            <Route
              path="/tickets"
              element={
                <ProtectedRoute>
                  <Tickets />
                </ProtectedRoute>
              }
            />
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
