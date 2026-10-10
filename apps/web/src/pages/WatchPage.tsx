import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { LandscapePlayer } from '../features/player/LandscapePlayer';
import { Loader2 } from 'lucide-react';

export function WatchPage() {
  const { titleId, episodeId } = useParams<{ titleId: string; episodeId?: string }>();
  const [searchParams] = useSearchParams();
  const isTrailer = searchParams.get('type') === 'trailer';
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['watch', titleId],
    queryFn: async () => {
      // Fetch titles to find title by ID or slug
      const res = await api.getTitles({ limit: '50' });
      const found = res.titles.find((t) => t.id === titleId || t.slug === titleId);
      if (found) return { title: found };
      // Fallback: fetch home to find title
      const homeRes = await api.getHome();
      const homeFound = homeRes.trending.find((t: any) => t.id === titleId || t.slug === titleId);
      return { title: homeFound || res.titles[0] };
    },
    enabled: !!titleId,
  });

  useEffect(() => {
    if (data?.title) {
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
  }, [data?.title, navigate]);

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
