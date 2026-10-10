import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, getPersonInitials } from '../../lib/api';
import { User, Search, Plus, Trash2, Edit, Merge, AlertTriangle, Loader2, CheckCircle2, X } from 'lucide-react';
import { AdminTableSkeleton } from '../../components/Skeleton';

interface PersonItem {
  id: string;
  name: string;
  nameKey?: string;
  photoUrl?: string | null;
  bio?: string | null;
  titlesCount?: number;
  appearsIn?: Array<{ id: string; title: string; roles?: string[] }>;
  _count?: { cast: number; crew: number };
}

export function AdminPeoplePage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'missing-photo' | 'missing-bio' | 'unused'>('all');
  const [sort, setSort] = useState<'name' | 'recent' | 'titles'>('name');
  const [page, setPage] = useState(1);

  // Toast Notification Banner State
  const [toast, setToast] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Edit / Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formBio, setFormBio] = useState('');
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Merge Modal State
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [sourcePerson, setSourcePerson] = useState<PersonItem | null>(null);
  const [targetPersonId, setTargetPersonId] = useState('');

  // Delete Prompt Modal State
  const [deletePrompt, setDeletePrompt] = useState<{ person: PersonItem; count: number } | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-people', search, filter, sort, page],
    queryFn: () => adminApi.getPeople({ q: search, filter, sort, page, limit: 24 }),
  });

  const people = data?.people || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleOpenAdd = () => {
    setEditingPerson(null);
    setFormName('');
    setFormPhotoUrl('');
    setFormBio('');
    setAllowDuplicate(false);
    setDuplicateWarning(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (person: PersonItem) => {
    try {
      const detailed = await adminApi.getPersonById(person.id);
      const p = detailed.person;
      setEditingPerson(p);
      setFormName(p.name);
      setFormPhotoUrl(p.photoUrl || '');
      setFormBio(p.bio || '');
      setAllowDuplicate(false);
      setDuplicateWarning(null);
      setIsModalOpen(true);
    } catch {
      setEditingPerson(person);
      setFormName(person.name);
      setFormPhotoUrl(person.photoUrl || '');
      setFormBio(person.bio || '');
      setIsModalOpen(true);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingPerson) {
        return adminApi.updatePerson(editingPerson.id, {
          name: formName,
          photoUrl: formPhotoUrl || null,
          bio: formBio || null,
        });
      } else {
        return adminApi.createPerson({
          name: formName,
          photoUrl: formPhotoUrl || null,
          bio: formBio || null,
          allowDuplicate,
        });
      }
    },
    onSuccess: (res: { isDuplicateMatch?: boolean; person?: { name: string } }) => {
      if (res?.isDuplicateMatch && !allowDuplicate && res.person) {
        setDuplicateWarning(`A person with name "${res.person.name}" already exists in Supabase database.`);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['admin-people'] });
      setIsModalOpen(false);
      setToast({
        type: 'success',
        title: 'Saved to Supabase DB',
        message: `Successfully saved person "${res?.person?.name || formName}" to Supabase database!`,
      });
    },
    onError: (err: Error) => {
      setToast({
        type: 'error',
        title: 'Supabase DB Error',
        message: err.message || 'Failed to save person to Supabase database.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, force }: { id: string; force: boolean }) => {
      return adminApi.deletePerson(id, force);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-people'] });
      setDeletePrompt(null);
      setToast({
        type: 'success',
        title: 'Deleted from Supabase DB',
        message: 'Person record successfully removed from Supabase database.',
      });
    },
    onError: (err: Error, variables) => {
      if (err.message?.includes('Used in')) {
        const countMatch = err.message.match(/Used in (\d+)/);
        const count = countMatch ? parseInt(countMatch[1], 10) : 1;
        const target = people.find((p: PersonItem) => p.id === variables.id);
        if (target) {
          setDeletePrompt({ person: target, count });
        }
      } else {
        setToast({
          type: 'error',
          title: 'Supabase DB Error',
          message: err.message || 'Failed to delete person from Supabase database.',
        });
      }
    },
  });

  const mergeMutation = useMutation({
    mutationFn: async () => {
      if (!sourcePerson) return;
      return adminApi.mergePerson(sourcePerson.id, targetPersonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-people'] });
      setIsMergeOpen(false);
      setSourcePerson(null);
      setTargetPersonId('');
      setToast({
        type: 'success',
        title: 'Merged in Supabase DB',
        message: 'Person records successfully merged in Supabase database.',
      });
    },
    onError: (err: Error) => {
      setToast({
        type: 'error',
        title: 'Supabase DB Merge Error',
        message: err.message || 'Failed to merge person records.',
      });
    },
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Cast & Crew Management</h1>
          <p className="text-xs text-gray-400">Manage cast members, directors, and crew profiles across Rasigan OTT.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Person
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-dark-card border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-sky-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filters */}
          <select
            value={filter}
            onChange={(e: any) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-dark-card border border-white/10 text-white text-xs font-semibold focus:outline-none"
          >
            <option value="all">All People</option>
            <option value="missing-photo">Missing Photo</option>
            <option value="missing-bio">Missing Bio</option>
            <option value="unused">Unused in Titles</option>
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e: any) => setSort(e.target.value)}
            className="px-3 py-2 rounded-xl bg-dark-card border border-white/10 text-white text-xs font-semibold focus:outline-none"
          >
            <option value="name">Name A–Z</option>
            <option value="recent">Recently Added</option>
            <option value="titles">Most Titles</option>
          </select>
        </div>
      </div>

      {/* People Grid */}
      {isLoading ? (
        <AdminTableSkeleton rows={8} />
      ) : isError ? (
        <div className="glass-card p-8 rounded-2xl text-center space-y-3 border border-rose-500/30 bg-rose-500/10">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Database API Connection Error</h3>
          <p className="text-xs text-rose-300 max-w-md mx-auto font-medium">
            {(error as Error)?.message || 'Failed to communicate with Supabase PostgreSQL database via Express API.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-500/20"
          >
            Retry Database Query
          </button>
        </div>
      ) : people.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl text-center space-y-3">
          <User className="w-10 h-10 text-gray-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No People Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">No records match your filter criteria. Click "Add Person" above to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {people.map((person: any) => (
            <div key={person.id} className="glass-card p-4 rounded-2xl flex flex-col justify-between space-y-3 group hover:border-white/20 transition-all">
              <div className="flex items-start gap-3">
                {/* Photo Preview or Initials Avatar */}
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-dark-card border border-white/10 flex-none relative">
                  {person.photoUrl ? (
                    <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center border border-sky-400/40 shadow-sm">
                      {getPersonInitials(person.name)}
                    </div>
                  )}
                  {(!person.photoUrl || !person.bio) && (
                    <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-dark-bg" title="Missing details (photo or bio)" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm text-white truncate group-hover:text-sky-400 transition-colors">{person.name}</h4>
                  <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">{person.bio || <span className="italic text-gray-500">No bio specified</span>}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                <span className="font-semibold text-sky-400">{person.titlesCount || 0} titles</span>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-md text-gray-300">{person.rolesUsed?.join(', ') || 'Unspecified'}</span>
              </div>

              {/* Card Actions */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={() => handleOpenEdit(person)}
                  className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => {
                    setSourcePerson(person);
                    setIsMergeOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white"
                  title="Merge Duplicates"
                >
                  <Merge className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteMutation.mutate({ id: person.id, force: false })}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300"
                  title="Delete Person"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-gray-400">
          <span>Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Drawer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 rounded-3xl space-y-4 border border-white/20 relative animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-white">{editingPerson ? 'Edit Person' : 'Add Person'}</h3>

            {duplicateWarning && (
              <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> {duplicateWarning}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAllowDuplicate(true);
                    setDuplicateWarning(null);
                  }}
                  className="px-3 py-1 bg-amber-500 text-black font-bold rounded-lg text-xs"
                >
                  Create another "{formName}" anyway
                </button>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Name (Required 2–80 chars)</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Vijay Sethupathi"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Profile Picture URL (https)</label>
                <input
                  type="url"
                  value={formPhotoUrl}
                  onChange={(e) => setFormPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400"
                />
                {formPhotoUrl && (
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-[10px] text-gray-400">Live square crop preview:</span>
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-sky-400">
                      <img src={formPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-300">Short Bio (Max 300 chars)</label>
                  <span className="text-[10px] text-gray-400">{formBio.length}/300</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Brief bio for popover display..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400 resize-none"
                />
              </div>

              {/* Appears In Section (If Editing) */}
              {editingPerson?.appearsIn && editingPerson.appearsIn.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="text-xs font-bold text-gray-300">Appears In ({editingPerson.appearsIn.length} titles)</label>
                  <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                    {editingPerson.appearsIn.map((item: { title: string; roles?: string[] }, idx: number) => (
                      <div key={idx} className="p-2 rounded-xl bg-white/5 flex items-center justify-between text-xs">
                        <span className="text-white font-medium truncate">{item.title}</span>
                        <span className="text-[10px] text-sky-400">{item.roles?.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saveMutation.isPending || formName.trim().length < 2}
                onClick={() => saveMutation.mutate()}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-40"
              >
                {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Person
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Prompt */}
      {deletePrompt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl space-y-4 border border-rose-500/30 text-center">
            <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
            <h3 className="text-lg font-black text-white">Confirm Delete</h3>
            <p className="text-xs text-gray-300">
              <strong>{deletePrompt.person?.name}</strong> is currently linked to <strong>{deletePrompt.count} titles</strong>.
              Remove from all titles and delete?
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletePrompt(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-gray-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate({ id: deletePrompt.person.id, force: true })}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Yes, Force Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {isMergeOpen && sourcePerson && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl space-y-4 border border-white/20">
            <h3 className="text-lg font-black text-white">Merge Duplicates</h3>
            <p className="text-xs text-gray-300">
              Merge <strong>{sourcePerson.name}</strong> into another person. All title credits will move to the selected target, and {sourcePerson.name} will be deleted.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Select Target Person to Keep</label>
              <select
                value={targetPersonId}
                onChange={(e) => setTargetPersonId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400"
              >
                <option value="">-- Choose person --</option>
                {people
                  .filter((p: PersonItem) => p.id !== sourcePerson.id)
                  .map((p: PersonItem) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.titlesCount || 0} titles)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => setIsMergeOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-gray-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={!targetPersonId || mergeMutation.isPending}
                onClick={() => mergeMutation.mutate()}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs disabled:opacity-40"
              >
                Confirm Merge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Supabase Toast Banner */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-top-5 duration-300">
          <div className={`p-4 rounded-2xl glass-card border shadow-2xl flex items-start gap-3 backdrop-blur-md ${
            toast.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-extrabold text-sm text-white">{toast.title}</h4>
              <p className="text-xs font-medium opacity-90 mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
