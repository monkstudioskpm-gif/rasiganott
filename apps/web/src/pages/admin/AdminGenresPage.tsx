import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';
import { Plus, Trash2, Edit, Loader2, Tag as TagIcon } from 'lucide-react';

export function AdminGenresPage() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<any>(null);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-genres'],
    queryFn: adminApi.getGenres,
  });

  const genres = data?.genres || [];

  const handleOpenAdd = () => {
    setEditingGenre(null);
    setName('');
    setSortOrder('0');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (g: any) => {
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
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteGenre(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-genres'] });
    },
  });

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Genre Management</h1>
          <p className="text-xs text-gray-400">Manage categories and genres for content categorization.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Genre
        </button>
      </div>

      {isLoading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-xs text-gray-400">Loading genres...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {genres.map((g: any) => (
            <div key={g.id} className="glass-card p-4 rounded-2xl flex items-center justify-between gap-3 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                  <TagIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{g.name}</h4>
                  <p className="text-[10px] font-mono text-gray-400">slug: /{g.slug}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(g)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(g.id)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl space-y-4 border border-white/20">
            <h3 className="text-lg font-black text-white">{editingGenre ? 'Edit Genre' : 'Add Genre'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Genre Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Action"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-gray-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={!name.trim() || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs disabled:opacity-40"
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
