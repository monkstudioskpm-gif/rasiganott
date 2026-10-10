import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, Lock, Sparkles, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'ADMIN' | 'CREATOR';
}

export function ProtectedRoute({ children, requiredRole = 'ADMIN' }: ProtectedRouteProps) {
  const location = useLocation();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userRole = localStorage.getItem('user_role');
    setRole(userRole);
    setLoading(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-400 text-xs">
        Verifying permissions...
      </div>
    );
  }

  // Check role authorization
  const isAuthorized =
    (requiredRole === 'ADMIN' && role === 'ADMIN') ||
    (requiredRole === 'CREATOR' && (role === 'CREATOR' || role === 'ADMIN'));

  if (!isAuthorized) {
    const isCreatorAttemptingAdmin = requiredRole === 'ADMIN' && role === 'CREATOR';

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-dark-card border border-white/10 rounded-3xl p-8 text-center glass-panel shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-extrabold uppercase tracking-wider border border-rose-500/20">
              <ShieldAlert className="w-3 h-3" />
              <span>{isCreatorAttemptingAdmin ? 'Creator Account Blocked' : 'Access Protected'}</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {requiredRole === 'ADMIN' ? 'Admin Access Required' : 'Creator Access Required'}
            </h1>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              {isCreatorAttemptingAdmin
                ? 'Creator accounts do not have permission to view or manage the Admin Panel.'
                : `This area is restricted to authorized ${requiredRole.toLowerCase()}s. Please sign in with your credentials.`}
            </p>
          </div>

          {/* Login / Auth Actions */}
          <div className="space-y-3 pt-2">
            <Link
              to="/login"
              className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs shadow-lg shadow-sky-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Sign In with Google</span>
            </Link>

            {/* Admin / Creator Quick Authorize Button for Vercel Deployment */}
            <button
              onClick={() => {
                localStorage.setItem('user_role', requiredRole);
                setRole(requiredRole);
              }}
              className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs border border-white/10 transition-all"
            >
              Authorize as {requiredRole} (Vercel Dev Mode)
            </button>
          </div>

          <div className="pt-2 border-t border-white/10">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Site</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
