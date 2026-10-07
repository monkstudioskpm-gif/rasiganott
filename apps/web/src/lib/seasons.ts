import { Title } from '@rasigan/shared';

export interface Episode {
  id: string;
  number: number;
  name: string;
  description?: string;
  durationMin?: number;
  thumbnailUrl?: string;
  videoUrl: string;
}

export interface Season {
  id: string;
  number: number;
  name: string;
  episodes: Episode[];
}

export function getSeasonsForTitle(title: Title): Season[] {
  if (title.seasons && title.seasons.length > 0 && title.seasons[0].episodes && title.seasons[0].episodes.length > 0) {
    return title.seasons as Season[];
  }

  const defaultVideo = title.videoUrl || title.trailerUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const defaultTrailer = title.trailerUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

  // Fallback seasons & episodes generator for any web series with missing episodes array
  return [
    {
      id: `season-1-${title.id}`,
      number: 1,
      name: 'Season 1',
      episodes: [
        {
          id: `ep-1-${title.id}`,
          number: 1,
          name: 'Episode 1: The Beginning',
          description: 'The story commences as secrets unfold in the city.',
          durationMin: 28,
          thumbnailUrl: title.posterUrl,
          videoUrl: defaultVideo,
        },
        {
          id: `ep-2-${title.id}`,
          number: 2,
          name: 'Episode 2: Turning Point',
          description: 'Rising conflicts force tough decisions.',
          durationMin: 32,
          thumbnailUrl: title.bannerUrl || title.posterUrl,
          videoUrl: defaultTrailer,
        },
        {
          id: `ep-3-${title.id}`,
          number: 3,
          name: 'Episode 3: The Climax',
          description: 'The dramatic conclusion of the first chapter.',
          durationMin: 35,
          thumbnailUrl: title.posterUrl,
          videoUrl: defaultVideo,
        },
      ],
    },
  ];
}
