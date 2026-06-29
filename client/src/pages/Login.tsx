import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from '../lib/auth-client';
import { Sparkles, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';

// ── Zod schema ──────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ── Component ───────────────────────────────────────────────────────
export default function Login() {
  const [serverError, setServerError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      const { error: signInError } = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        setServerError(signInError.message || 'Invalid email or password');
      } else {
        // Successful login, redirect to home page
        navigate('/');
      }
    } catch (err: any) {
      setServerError(err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[calc(100vh-140px)] relative overflow-hidden bg-slate-950">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900/55 border border-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 transition-all duration-300 hover:border-slate-700/60">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            Log in to the Helpdesk AI portal
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 flex items-start gap-3 text-sm animate-shake">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Failed</p>
              <p className="text-xs opacity-90 mt-0.5">{serverError}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 tracking-wide block" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                id="email"
                type="email"
                placeholder="admin@example.com"
                {...register('email')}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-950/65 border rounded-xl text-slate-100 placeholder:text-slate-650 text-sm focus:outline-none transition-all ${
                  errors.email
                    ? 'border-rose-500/60 focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/30'
                    : 'border-slate-800/80 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-400 mt-1 pl-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300 tracking-wide block" htmlFor="password">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-950/65 border rounded-xl text-slate-100 placeholder:text-slate-650 text-sm focus:outline-none transition-all ${
                  errors.password
                    ? 'border-rose-500/60 focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/30'
                    : 'border-slate-800/80 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30'
                }`}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-rose-400 mt-1 pl-1">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
