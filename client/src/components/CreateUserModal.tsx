import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, type CreateUserFormData } from '@helpdesk/core';
import { AlertCircle, UserPlus, X } from 'lucide-react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const resetForm = () => {
    reset();
    setCreateError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreateUserSubmit = async (data: CreateUserFormData) => {
    setCreateError(null);
    setCreateLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.post(`${baseUrl}/api/admin/users`, {
        name: data.name.trim(),
        email: data.email.toLowerCase(),
        password: data.password,
      }, {
        withCredentials: true,
      });

      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error('Error creating user:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create user.';
      setCreateError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        <div className="space-y-1 mb-5">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <span>Create New User</span>
          </h2>
          <p className="text-xs text-muted-foreground text-left">
            Register a new support agent account in the database.
          </p>
        </div>

        {/* Form Error */}
        {createError && (
          <div className="mb-4 p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive flex items-start gap-2.5 text-xs text-left">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span className="font-medium">{createError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(handleCreateUserSubmit)} className="space-y-4" autoComplete="off">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground tracking-wide block text-left">
              Full Name
            </label>
            <Input
              type="text"
              placeholder="John Doe"
              {...register('name')}
              autoComplete="off"
              className={`bg-background/50 ${errors.name ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
            />
            {errors.name && (
              <p className="text-[10px] text-destructive pl-0.5 text-left">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground tracking-wide block text-left">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="john@example.com"
              {...register('email')}
              autoComplete="new-password"
              className={`bg-background/50 ${errors.email ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
            />
            {errors.email && (
              <p className="text-[10px] text-destructive pl-0.5 text-left">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground tracking-wide block text-left">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              {...register('password')}
              autoComplete="new-password"
              className={`bg-background/50 ${errors.password ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
            />
            {errors.password && (
              <p className="text-[10px] text-destructive pl-0.5 text-left">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="cursor-pointer"
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95"
              disabled={createLoading}
            >
              {createLoading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
