import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Star } from 'lucide-react';
import { GridCatalogSkeleton } from '../components/Skeleton';

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => api.getTitles({ category: slug || '', limit: '50' }),
    enabled: !!slug,
  });

  const titles = data?.titles || [];

  return (
    <div className="space-y-8 pb-24 md:pb-12 max-w-7xl mx-auto">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight capitalize">
          {slug?.replace('-', ' ')} Category
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">All published titles in {slug?.replace('-', ' ')}</p>
      </div>

      {isLoading && <GridCatalogSkeleton count={10} />}

      {!isLoading && titles.length === 0 && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-6 space-y-3 glass-panel rounded-3xl">
          <h3 className="text-lg font-bold text-white">No Titles in this Category</h3>
        </div>
      )}

      {!isLoading && titles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {titles.map((title) => (
            <Link key={title.id} to={`/title/${title.slug}`} className="group space-y-2 block">
              <div className="relative aspect-poster rounded-2xl overflow-hidden glass-card transition-all duration-300 group-hover:scale-[1.03] shadow-lg">
                <img src={title.verticalPosterUrl || title.posterUrl} alt={title.title} className="w-full h-full object-cover" />
                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-black/70 border border-white/10 backdrop-blur-md flex items-center gap-1 text-[11px] font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{title.editorRating ? title.editorRating.toFixed(1) : '8.8'}</span>
                </div>
              </div>
              <div className="px-1">
                <h4 className="font-bold text-sm text-gray-100 group-hover:text-sky-400 transition-colors truncate" title={title.title}>
                  {title.title.includes('|') ? title.title.split('|')[0].trim() : title.title}
                </h4>
                <p className="text-xs text-gray-400">{title.language}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
