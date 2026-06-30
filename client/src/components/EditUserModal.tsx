import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateUserSchema, type UpdateUserFormData } from '@helpdesk/core';
import { AlertCircle, Edit2, X } from 'lucide-react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditUserModal({ isOpen, user, onClose, onSuccess }: EditUserModalProps) {
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        password: '',
      });
      setUpdateError(null);
    }
  }, [user, reset]);

  const handleClose = () => {
    reset();
    setUpdateError(null);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleEditUserSubmit = async (data: UpdateUserFormData) => {
    if (!user) return;
    setUpdateError(null);
    setUpdateLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.put(`${baseUrl}/api/admin/users/${user.id}`, {
        name: data.name.trim(),
        email: data.email.toLowerCase(),
        password: data.password ? data.password : undefined,
      }, {
        withCredentials: true,
      });

      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error('Error updating user:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update user.';
      setUpdateError(msg);
    } finally {
      setUpdateLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div 
      onClick={handleClose}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      data-testid="edit-modal-backdrop"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
      >
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
            <Edit2 className="h-5 w-5 text-primary" />
            <span>Edit User Details</span>
          </h2>
          <p className="text-xs text-muted-foreground text-left">
            Modify name, email, or set a new password for the agent.
          </p>
        </div>

        {/* Form Error */}
        {updateError && (
          <div className="mb-4 p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive flex items-start gap-2.5 text-xs text-left">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span className="font-medium">{updateError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(handleEditUserSubmit)} className="space-y-4" autoComplete="off">
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
            <label className="text-xs font-semibold text-foreground tracking-wide block text-left flex items-center justify-between">
              <span>New Password</span>
              <span className="text-[10px] text-muted-foreground font-normal">Leave blank to keep unchanged</span>
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
              disabled={updateLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95"
              disabled={updateLoading}
            >
              {updateLoading ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
