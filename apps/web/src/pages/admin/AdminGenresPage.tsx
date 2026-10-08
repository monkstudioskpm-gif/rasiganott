import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';
import { Plus, Trash2, Edit, Loader2, Tag as TagIcon, Sparkles } from 'lucide-react';

interface GenreItem {
  id: string;
  name: string;
  slug: string;
  sortOrder?: number;
}

export function AdminGenresPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<GenreItem | null>(null);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-genres'],
    queryFn: adminApi.getGenres,
  });

  const genres: GenreItem[] = data?.genres || [];

  const handleOpenAdd = () => {
    setEditingGenre(null);
    setName('');
    setSortOrder('0');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (g: GenreItem) => {
    setEditingGenre(g);
    setName(g.name);
    setSortOrder(g.sortOrder?.toString() || '0');
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingGenre) {
        return adminApi.updateGenre(editingGenre.id, { name, sortOrder: parseInt(sortOrder, 10) });
      } else {
        return adminApi.createGenre({ name, sortOrder: parseInt(sortOrder, 10) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-genres'] });
      queryClient.invalidateQueries({ queryKey: ['genres'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteGenre(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-genres'] });
      queryClient.invalidateQueries({ queryKey: ['genres'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0E172A] to-[#0A0F1D] border border-cyan-500/25 shadow-2xl backdrop-blur-2xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Taxonomy Management</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Genre & Tag Management</h1>
          <p className="text-xs text-gray-400">Add, edit, or reorganize genres and content tags across Rasigan OTT.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/30 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Genre
        </button>
      </div>

      {isLoading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-xs text-gray-400 font-semibold">Loading genres from database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {genres.map((g: GenreItem) => (
            <div key={g.id} className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-xl flex items-center justify-between gap-3 hover:border-cyan-400/40 transition-all shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-inner">
                  <TagIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">{g.name}</h4>
                  <p className="text-[10px] font-mono text-cyan-300/70">/{g.slug}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(g)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                >
                  <Edit className="w-4 h-4 text-cyan-400" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(g.id)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#0F172A] max-w-md w-full p-6 md:p-8 rounded-3xl space-y-5 border border-cyan-500/30 shadow-2xl">
            <h3 className="text-xl font-black text-white">{editingGenre ? 'Edit Genre' : 'Add New Genre'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">Genre Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Action"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">Sort Order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-cyan-400 font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!name.trim() || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs disabled:opacity-40 shadow-lg shadow-cyan-500/25 transition-all"
              >
                Save Genre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

