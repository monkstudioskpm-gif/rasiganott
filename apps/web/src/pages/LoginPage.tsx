import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, LogOut, ArrowRight, User as UserIcon, Sparkles, Shield, Bookmark } from 'lucide-react';
import { authApi } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export interface AuthUser {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: 'USER' | 'ADMIN' | 'CREATOR' | string;
}

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

interface GoogleButtonConfig {
  type?: string;
  shape?: string;
  theme?: string;
  text?: string;
  size?: string;
  logo_alignment?: string;
  width?: number;
}

interface GoogleAccountsId {
  initialize: (options: {
    client_id: string;
    callback: (res: GoogleCredentialResponse) => void;
    auto_select?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: GoogleButtonConfig) => void;
  prompt: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isGsiRendered, setIsGsiRendered] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('rasigan_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser) as AuthUser);
      } catch {}
    }

    // Also check server auth session
    authApi.getMe().then((res) => {
      if (res?.user) {
        setCurrentUser(res.user);
        localStorage.setItem('user_role', res.user.role);
        localStorage.setItem('rasigan_user', JSON.stringify(res.user));
      }
    }).catch(() => {});
  }, []);

  const handleCredentialResponse = async (response: GoogleCredentialResponse) => {
    if (!response?.credential) {
      setErrorMessage('No Google credentials received. Please try again.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await authApi.loginWithGoogle(response.credential);
      if (res?.user) {
        const user = res.user;
        setCurrentUser(user);
        localStorage.setItem('user_role', user.role);
        localStorage.setItem('rasigan_user', JSON.stringify(user));

        const redirectParam = new URLSearchParams(window.location.search).get('redirect');
        setTimeout(() => {
          if (redirectParam) {
            navigate(redirectParam);
          } else if (user.role === 'ADMIN') {
            navigate('/admin');
          } else if (user.role === 'CREATOR') {
            navigate('/creator');
          } else {
            navigate('/library');
          }
        }, 1000);
      } else {
        throw new Error('Authentication succeeded but user profile was not returned');
      }
    } catch (err: unknown) {
      console.error('Google Sign-In Error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to authenticate with Google. Please check your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

    const loadGsiScript = () => {
      if (window.google?.accounts?.id) {
        initializeGsi();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGsi;
      script.onerror = () => {
        setErrorMessage('Failed to load Google Identity Services script. Please check your internet connection.');
      };
      document.body.appendChild(script);
    };

    const initializeGsi = () => {
      if (!window.google?.accounts?.id) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId || '102651788040-f80qjr6hok5b2i1nt8pcke7bnnr035j8.apps.googleusercontent.com',
          callback: handleCredentialResponse,
          auto_select: false,
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            shape: 'pill',
            theme: 'filled_black',
            text: 'continue_with',
            size: 'large',
            logo_alignment: 'left',
            width: 280,
          });
          setIsGsiRendered(true);
        }
      } catch (err) {
        console.warn('GSI initialize notice:', err);
      }
    };

    loadGsiScript();
  }, []);

  const handlePrompt = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setErrorMessage('Google Sign-In is initializing. Please wait a moment or configure VITE_GOOGLE_CLIENT_ID.');
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem('user_role');
    localStorage.removeItem('rasigan_user');
    setCurrentUser(null);
    setIsLoading(false);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gradient-to-b from-[#111625] to-[#0c0f1a] border border-white/10 sm:border-sky-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center backdrop-blur-xl">
        
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-blue-600 flex items-center justify-center mx-auto shadow-xl shadow-sky-500/30 text-white font-black text-2xl tracking-tighter">
          R
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {currentUser ? 'Welcome Back' : 'Sign In to Rasigan'}
          </h1>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            {currentUser
              ? 'Your account has been automatically recognized and authenticated.'
              : 'Stream indie Tamil movies, short films & web series seamlessly.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 text-left">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="leading-snug">{errorMessage}</p>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-[11px] text-rose-400 hover:underline font-bold"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {currentUser ? (
          /* Already Logged In State */
          <div className="space-y-5 pt-2">
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-sky-500/20 border-2 border-sky-400/40 mx-auto flex items-center justify-center shadow-lg">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-8 h-8 text-sky-400" />
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-base text-white">{currentUser.name}</h3>
                <p className="text-xs text-gray-400 font-mono">{currentUser.email}</p>
              </div>

              {/* Automatically Detected Role Badge */}
              <div className="pt-2 flex items-center justify-center gap-2">
                {currentUser.role === 'ADMIN' && (
                  <span className="px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/50 text-sky-300 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow">
                    <Shield className="w-3.5 h-3.5 text-sky-400" />
                    <span>Administrator</span>
                  </span>
                )}
                {currentUser.role === 'CREATOR' && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Creator</span>
                  </span>
                )}
                {currentUser.role !== 'ADMIN' && currentUser.role !== 'CREATOR' && (
                  <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-gray-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>Member</span>
                  </span>
                )}
              </div>
            </div>

            {/* Portal Navigation based on detected role */}
            <div className="space-y-2">
              <button
                onClick={() => navigate('/library')}
                className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Bookmark className="w-4 h-4" />
                <span>View My Profile & Library</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {currentUser.role === 'ADMIN' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Shield className="w-3.5 h-3.5 text-sky-400" />
                  <span>Open Admin Panel</span>
                </button>
              )}

              {currentUser.role === 'CREATOR' && (
                <button
                  onClick={() => navigate('/creator')}
                  className="w-full py-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Open Creator Studio</span>
                </button>
              )}

              <button
                onClick={() => navigate('/')}
                className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs border border-white/10 transition-colors"
              >
                Go to Home Catalog
              </button>

              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Sign-In Screen with ONLY ONE Google Button */
          <div className="pt-2">
            <div className="flex justify-center min-h-[44px]">
              <div ref={googleBtnRef} className={isGsiRendered ? 'flex justify-center' : 'hidden'} />
              {!isGsiRendered && (
                <button
                  onClick={handlePrompt}
                  disabled={isLoading}
                  className="w-full max-w-[280px] py-3 rounded-full bg-white hover:bg-gray-100 text-gray-900 font-extrabold text-xs shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gray-900" />
                      <span>Verifying with Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
