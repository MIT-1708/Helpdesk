import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import axios from 'axios';
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

interface DeleteUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteUserModal({ isOpen, user, onClose, onSuccess }: DeleteUserModalProps) {
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDeleteError(null);
    }
  }, [isOpen]);

  const handleClose = () => {
    setDeleteError(null);
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

  const handleDeleteUser = async () => {
    if (!user) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.delete(`${baseUrl}/api/admin/users/${user.id}`, {
        withCredentials: true,
      });

      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to delete user.';
      setDeleteError(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div 
      onClick={handleClose}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      data-testid="delete-modal-backdrop"
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

        {/* Title & Warning Icon */}
        <div className="flex gap-4 items-start mb-5 text-left">
          <div className="p-3 bg-destructive/10 text-destructive rounded-xl shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Delete User Account
            </h2>
            <p className="text-xs text-muted-foreground">
              Are you sure you want to delete <strong>{user.name}</strong> ({user.email})? This action will immediately terminate all active sessions for this user.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {deleteError && (
          <div className="mb-4 p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive flex items-start gap-2.5 text-xs text-left">
            <span className="font-medium">{deleteError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="cursor-pointer"
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/95"
            onClick={handleDeleteUser}
            disabled={deleteLoading}
            data-testid="confirm-delete-button"
          >
            {deleteLoading ? 'Deleting...' : 'Delete User'}
          </Button>
        </div>
      </div>
    </div>
  );
}
