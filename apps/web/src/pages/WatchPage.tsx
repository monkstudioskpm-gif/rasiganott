import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, authApi } from '../lib/api';
import { LandscapePlayer } from '../features/player/LandscapePlayer';
import { Loader2, Lock, ArrowLeft, Film } from 'lucide-react';

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

export function WatchPage() {
  const { titleId, episodeId } = useParams<{ titleId: string; episodeId?: string }>();
  const [searchParams] = useSearchParams();
  const isTrailer = searchParams.get('type') === 'trailer';
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const u = localStorage.getItem('rasigan_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isGsiRendered, setIsGsiRendered] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['watch', titleId],
    queryFn: async () => {
      const res = await api.getTitles({ limit: '50' });
      const found = res.titles.find((t) => t.id === titleId || t.slug === titleId);
      if (found) return { title: found };
      const homeRes = await api.getHome();
      const homeFound = homeRes.trending.find((t: any) => t.id === titleId || t.slug === titleId);
      return { title: homeFound || res.titles[0] };
    },
    enabled: !!titleId,
  });

  // Verify server session if local storage is missing
  useEffect(() => {
    if (!currentUser) {
      authApi.getMe().then((res) => {
        if (res?.user) {
          setCurrentUser(res.user);
          localStorage.setItem('rasigan_user', JSON.stringify(res.user));
          localStorage.setItem('user_role', res.user.role);
        }
      }).catch(() => {});
    }
  }, [currentUser]);

  // Handle Google OAuth response for the in-player sign in gate
  const handleCredentialResponse = async (response: GoogleCredentialResponse) => {
    if (!response?.credential) {
      setAuthError('No Google credentials received. Please try again.');
      return;
    }

    setIsAuthLoading(true);
    setAuthError(null);

    try {
      const res = await authApi.loginWithGoogle(response.credential);
      if (res?.user) {
        setCurrentUser(res.user);
        localStorage.setItem('user_role', res.user.role);
        localStorage.setItem('rasigan_user', JSON.stringify(res.user));
      } else {
        throw new Error('Authentication succeeded but user profile was not returned');
      }
    } catch (err: unknown) {
      console.error('Watch Google Sign-In Error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to authenticate with Google.';
      setAuthError(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Mount Google Identity Services button if user is not signed in
  useEffect(() => {
    if (currentUser) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '102651788040-f80qjr6hok5b2i1nt8pcke7bnnr035j8.apps.googleusercontent.com';

    const loadGsiScript = () => {
      const googleObj = (window as any).google;
      if (googleObj?.accounts?.id) {
        initGsi();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    };

    const initGsi = () => {
      const googleObj = (window as any).google;
      if (!googleObj?.accounts?.id) return;
      try {
        googleObj.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          googleObj.accounts.id.renderButton(googleBtnRef.current, {
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
      } catch (e) {
        console.warn('Watch GSI init notice:', e);
      }
    };

    loadGsiScript();
  }, [currentUser]);

  const handlePrompt = () => {
    const googleObj = (window as any).google;
    if (googleObj?.accounts?.id) {
      googleObj.accounts.id.prompt();
    } else {
      setAuthError('Google Sign-In is initializing. Please wait a moment.');
    }
  };

  useEffect(() => {
    if (data?.title && currentUser) {
      if (data.title.orientation === 'VERTICAL') {
        navigate(`/reels?titleId=${data.title.id}`, { replace: true });
        return;
      }
      try {
        const history: any[] = JSON.parse(localStorage.getItem('rasigan_watch_history') || '[]');
        const updated = [
          {
            id: data.title.id,
            slug: data.title.slug,
            title: data.title.title,
            posterUrl: data.title.posterUrl,
            verticalPosterUrl: data.title.verticalPosterUrl,
            language: data.title.language || 'Tamil',
            year: data.title.year || 2025,
            watchedAt: new Date().toISOString(),
          },
          ...history.filter((h) => h.id !== data.title.id && h.slug !== data.title.slug),
        ].slice(0, 20);
        localStorage.setItem('rasigan_watch_history', JSON.stringify(updated));
      } catch {}
    }
  }, [data?.title, currentUser, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3 text-white">
        <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
        <p className="text-xs text-gray-400 font-medium">Loading your content...</p>
      </div>
    );
  }

  if (isError || !data?.title) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center space-y-4 text-white">
        <h2 className="text-2xl font-bold">Unable to Load Player</h2>
        <p className="text-gray-400 text-sm max-w-md">{error?.message || 'Video content could not be loaded.'}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2.5 bg-sky-500 rounded-xl font-bold text-sm">
          Go Back
        </button>
      </div>
    );
  }

  const title = data.title;

  // USER MUST SIGN IN TO WATCH VIDEO GATE
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 bg-[#090b10] flex items-center justify-center p-4 overflow-hidden">
        {/* Background Poster Artwork with Blur */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-2xl scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${title.bannerUrl || title.posterUrl || ''})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/70 pointer-events-none" />

        {/* Modal Container */}
        <div className="relative z-10 w-full max-w-md bg-gradient-to-b from-[#121727] to-[#0a0d16] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center backdrop-blur-2xl">
          {/* Lock Icon */}
          <div className="w-16 h-16 rounded-2xl bg-sky-500/15 border border-sky-400/30 text-sky-400 flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 text-sky-300 text-[10px] font-extrabold uppercase tracking-wider border border-sky-400/25">
              <Film className="w-3 h-3" />
              <span>Sign-In Required</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Sign In to Watch</h1>
            <p className="text-sm font-semibold text-gray-200 truncate">{title.title}</p>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              Please sign in with your Google account to start streaming this title.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-left">
              {authError}
            </div>
          )}

          {/* Single Clean Google Sign-In Button */}
          <div className="pt-1">
            <div className="flex justify-center min-h-[44px]">
              <div ref={googleBtnRef} className={isGsiRendered ? 'flex justify-center' : 'hidden'} />
              {!isGsiRendered && (
                <button
                  onClick={handlePrompt}
                  disabled={isAuthLoading}
                  className="w-full max-w-[280px] py-3 rounded-full bg-white hover:bg-gray-100 text-gray-900 font-extrabold text-xs shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {isAuthLoading ? (
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

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs border border-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back to Browse</span>
          </button>
        </div>
      </div>
    );
  }

  let playingVideoUrl = isTrailer
    ? title.trailerUrl || title.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    : title.videoUrl || title.trailerUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  let subtitleLabel = isTrailer ? 'Official Trailer' : '';

  if (!isTrailer && title.kind === 'WEB_SERIES' && episodeId && title.seasons) {
    for (const season of title.seasons) {
      const ep = season.episodes?.find((e: any) => e.id === episodeId);
      if (ep) {
        playingVideoUrl = ep.videoUrl;
        subtitleLabel = `S${season.number} E${ep.number} • ${ep.name}`;
        break;
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <LandscapePlayer
        videoUrl={playingVideoUrl}
        streamType={title.streamType || 'HLS'}
        titleName={title.title}
        subtitleLabel={subtitleLabel}
        titleObj={title}
        onBack={() => navigate(-1)}
      />
    </div>
  );
}
