import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from '../lib/auth-client';
import { Sparkles, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

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
    <div className="flex-1 flex items-center justify-center p-6 min-h-[calc(100vh-140px)] relative overflow-hidden bg-background">
      {/* Background glow effects with orange tone */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse duration-5000" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Login Card */}
      <Card className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-border shadow-2xl p-6 transition-all duration-300 hover:border-primary/30">
        <CardHeader className="text-center mb-4">
          <div className="mx-auto inline-flex h-12 w-12 rounded-xl bg-primary items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1.5">
            Log in to the Helpdesk AI portal
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-6 p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive flex items-start gap-3 text-sm animate-bounce">
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
              <Label htmlFor="email" className="text-xs font-semibold text-foreground tracking-wide block">
                Email Address
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </span>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                  className={`pl-9 py-2.5 h-10 ${
                    errors.email ? 'border-destructive focus-visible:ring-destructive/30' : ''
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive mt-1 pl-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground tracking-wide block">
                  Password
                </Label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </span>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                  className={`pl-9 py-2.5 h-10 ${
                    errors.password ? 'border-destructive focus-visible:ring-destructive/30' : ''
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive mt-1 pl-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 h-10 bg-primary text-primary-foreground font-semibold text-sm rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/35 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
