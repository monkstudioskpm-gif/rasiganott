import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, getPersonInitials } from '../../lib/api';
import { Check, X, Plus, Trash2, Eye, Loader2, Tv, CheckCircle2, AlertTriangle } from 'lucide-react';

export function AdminContentFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  // Autosave status state
  const [lastAutosaved, setLastAutosaved] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form Fields (1 to 9 + Additional)
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<'MOVIE' | 'SHORT_FILM' | 'WEB_SERIES'>('MOVIE');
  const [orientation, setOrientation] = useState<'LANDSCAPE' | 'VERTICAL'>('LANDSCAPE');

  // Genres & Tags
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Cast & Crew
  const [cast, setCast] = useState<{ personId: string; person: any; characterName: string; order: number }[]>([]);
  const [crew, setCrew] = useState<{ personId: string; person: any; role: string; customRole: string }[]>([]);

  // Cast Typeahead state
  const [castSearch, setCastSearch] = useState('');
  const [castSuggestions, setCastSuggestions] = useState<any[]>([]);
  const [isCastSearching, setIsCastSearching] = useState(false);

  // Links & Test URL status
  const [movieLink, setMovieLink] = useState('');
  const [trailerLink, setTrailerLink] = useState('');
  const [movieValidation, setMovieValidation] = useState<any>(null);
  const [trailerValidation, setTrailerValidation] = useState<any>(null);
  const [isValidatingMovie, setIsValidatingMovie] = useState(false);
  const [isValidatingTrailer, setIsValidatingTrailer] = useState(false);

  // Artwork & Details
  const [posterUrl, setPosterUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [verticalPosterUrl, setVerticalPosterUrl] = useState('');
  const [year, setYear] = useState('2025');
  const [language, setLanguage] = useState('Tamil');
  const [ageRating, setAgeRating] = useState('U/A');
  const [durationMin, setDurationMin] = useState('90');
  const [editorRating, setEditorRating] = useState('9.0');
  const [tagline, setTagline] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [fundingEnabled, setFundingEnabled] = useState(true);
  const [fundingGoal, setFundingGoal] = useState('500000');
  const [creatorName, setCreatorName] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');

  // Episodes Builder (Web Series only)
  const [seasons, setSeasons] = useState<any[]>([
    {
      number: 1,
      name: 'Season 1',
      episodes: [
        { number: 1, name: 'Episode 1', description: '', videoUrl: '', durationMin: '30', thumbnailUrl: '' },
      ],
    },
  ]);

  // Inline Genre Create Modal
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);
  const [newGenreName, setNewGenreName] = useState('');

  // Submission Status Pop-up Modal State
  const [submitResult, setSubmitResult] = useState<{
    isOpen: boolean;
    status: 'SUCCESS' | 'ERROR';
    titleSlug?: string;
    savedId?: string;
    message?: string;
    details?: string[];
  } | null>(null);

  // Fetch Genres & Tags
  const { data: genresData } = useQuery({ queryKey: ['admin-genres'], queryFn: adminApi.getGenres });
  const allGenres = genresData?.genres || [];

  // Fetch Title details if editing
  const { data: existingTitleData } = useQuery({
    queryKey: ['admin-title-detail', id],
    queryFn: () => adminApi.getTitleById(id!),
    enabled: isEdit,
  });

  // Load title data into state if editing
  useEffect(() => {
    if (existingTitleData?.title) {
      const t = existingTitleData.title;
      setTitle(t.title);
      setSlug(t.slug);
      setDescription(t.description);
      setKind(t.kind as any);
      setOrientation(t.orientation as any);
      setPosterUrl(t.posterUrl);
      setBannerUrl(t.bannerUrl || '');
      setVerticalPosterUrl(t.verticalPosterUrl || '');
      setMovieLink(t.videoUrl || '');
      setTrailerLink(t.trailerUrl || '');
      setTagline(t.tagline || '');
      setYear(t.year?.toString() || '2025');
      setLanguage(t.language || 'Tamil');
      setAgeRating(t.ageRating || 'U/A');
      setDurationMin(t.durationMin?.toString() || '90');
      setEditorRating(t.editorRating?.toString() || '9.0');
      setIsFeatured(Boolean(t.isFeatured));
      setFundingEnabled(Boolean(t.fundingEnabled));
      setFundingGoal(t.fundingGoal?.toString() || '500000');
      setCreatorName(t.creatorName || '');
      setStatus(t.status as any);

      if (t.genres) setSelectedGenreIds(t.genres.map((g: any) => g.id));
      if (t.tags) setTags(t.tags.map((tg: any) => typeof tg === 'string' ? tg : tg.name));
      if (t.cast) setCast(t.cast.map((c: any) => ({ personId: c.personId, person: c.person, characterName: c.characterName || '', order: c.order || 0 })));
      if (t.crew) setCrew(t.crew.map((cr: any) => ({ personId: cr.personId, person: cr.person, role: cr.role || 'DIRECTOR', customRole: cr.customRole || '' })));
      if (t.seasons && t.seasons.length > 0) setSeasons(t.seasons);
    }
  }, [existingTitleData]);

  // Auto-generate Slug from Title
  useEffect(() => {
    if (!isEdit && title) {
      const auto = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setSlug(auto);
    }
  }, [title, isEdit]);

  // Track Unsaved Changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [title, description, kind, orientation, selectedGenreIds, tags, cast, crew, movieLink, trailerLink, seasons, posterUrl]);

  // 10-Second Autosave to localStorage
  useEffect(() => {
    const timer = setInterval(() => {
      const draftState = { title, description, kind, orientation, selectedGenreIds, tags, cast, movieLink, trailerLink, seasons, posterUrl };
      localStorage.setItem('rasigan_admin_form_draft', JSON.stringify(draftState));
      setLastAutosaved(new Date().toLocaleTimeString());
    }, 10000);
    return () => clearInterval(timer);
  }, [title, description, kind, orientation, selectedGenreIds, tags, cast, movieLink, trailerLink, seasons, posterUrl]);

  // Debounced Cast Typeahead Search
  useEffect(() => {
    if (!castSearch.trim()) {
      setCastSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsCastSearching(true);
      try {
        const res = await adminApi.suggestPeople(castSearch, 8);
        setCastSuggestions(res.people || []);
      } catch {
        setCastSuggestions([]);
      } finally {
        setIsCastSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [castSearch]);

  // Add Cast Chip
  const handleSelectCastPerson = (person: any) => {
    if (cast.some((c) => c.personId === person.id)) return;
    setCast([...cast, { personId: person.id, person, characterName: '', order: cast.length }]);
    setCastSearch('');
    setCastSuggestions([]);
  };

  // Instant Auto-Save New Person on Enter or Dropdown Click (B4.4)
  const handleCreateNewCastPerson = async (nameToAdd: string, allowDup = false) => {
    try {
      const res = await adminApi.createPerson({ name: nameToAdd, allowDuplicate: allowDup });
      const newPerson = res.person;
      handleSelectCastPerson(newPerson);
    } catch (err: any) {
      alert(err.message || 'Failed to auto-create person');
    }
  };

  // Add Tag Chip (B4.1)
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().toLowerCase().replace(/^,|,$/g, '');
      if (val && !tags.includes(val) && tags.length < 20 && val.length <= 30) {
        setTags([...tags, val]);
        setTagInput('');
      }
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  // Video URL Validation Tool (B4.5)
  const handleTestMovieUrl = async () => {
    if (!movieLink) return;
    setIsValidatingMovie(true);
    try {
      const res = await adminApi.validateVideoUrl(movieLink);
      setMovieValidation(res);
      if (res.durationSec) {
        setDurationMin(Math.round(res.durationSec / 60).toString());
      }
    } catch (err: any) {
      setMovieValidation({ isValid: false, message: err.message || 'Validation failed' });
    } finally {
      setIsValidatingMovie(false);
    }
  };

  const handleTestTrailerUrl = async () => {
    if (!trailerLink) return;
    setIsValidatingTrailer(true);
    try {
      const res = await adminApi.validateVideoUrl(trailerLink);
      setTrailerValidation(res);
    } catch (err: any) {
      setTrailerValidation({ isValid: false, message: err.message || 'Validation failed' });
    } finally {
      setIsValidatingTrailer(false);
    }
  };

  // Episode Operations (B4.3)
  const handleAddEpisode = (seasonIdx: number) => {
    const newSeasons = [...seasons];
    const s = newSeasons[seasonIdx];
    const nextNum = s.episodes.length + 1;
    s.episodes.push({
      number: nextNum,
      name: `Episode ${nextNum}`,
      description: '',
      videoUrl: '',
      durationMin: '30',
      thumbnailUrl: '',
    });
    setSeasons(newSeasons);
  };

  // Save Title Mutation
  const saveMutation = useMutation({
    mutationFn: async (targetStatus: 'DRAFT' | 'PUBLISHED') => {
      const payload = {
        title,
        description,
        kind,
        orientation,
        genreIds: selectedGenreIds,
        tags,
        cast,
        crew,
        videoUrl: movieLink,
        trailerUrl: trailerLink,
        seasons: kind === 'WEB_SERIES' ? seasons : [],
        posterUrl,
        bannerUrl,
        verticalPosterUrl,
        year,
        language,
        ageRating,
        durationMin,
        editorRating,
        tagline,
        isFeatured,
        fundingEnabled,
        fundingGoal,
        creatorName,
        status: targetStatus,
      };

      if (isEdit) {
        return adminApi.updateTitle(id!, payload);
      } else {
        return adminApi.createTitle(payload);
      }
    },
    onSuccess: () => {
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['admin-title-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-titles'] });
      queryClient.invalidateQueries({ queryKey: ['titles'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    },
  });

  // Handle Submit with Pop-up Status Modal & Preserved Content
  const handleFormSubmit = async (targetStatus: 'DRAFT' | 'PUBLISHED') => {
    const errors: string[] = [];

    if (!title.trim()) {
      errors.push('Title Name is required.');
    }

    if (!verticalPosterUrl.trim()) {
      errors.push('Vertical Banner URL (9:16) is mandatory and required for all titles.');
    }

    if (targetStatus === 'PUBLISHED') {
      if (!description.trim()) {
        errors.push('About / Description is required for publishing.');
      }
      if (selectedGenreIds.length === 0) {
        errors.push('At least one Genre must be selected for publishing.');
      }
      if (!posterUrl.trim()) {
        errors.push('Poster Artwork URL is required for publishing.');
      }
      if (kind !== 'WEB_SERIES' && !movieLink.trim()) {
        errors.push('Movie Video Link is required for publishing Movies and Short Films.');
      }
    }

    if (errors.length > 0) {
      setSubmitResult({
        isOpen: true,
        status: 'ERROR',
        message: 'Please complete all required fields before submitting:',
        details: errors,
      });
      return;
    }

    try {
      const res = await saveMutation.mutateAsync(targetStatus);
      const createdTitle = (res as any)?.title || res;
      const finalSlug = createdTitle?.slug || slug || (title ? title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') : 'title');
      const finalId = createdTitle?.id || id;

      setSubmitResult({
        isOpen: true,
        status: 'SUCCESS',
        titleSlug: finalSlug,
        savedId: finalId,
        message: targetStatus === 'PUBLISHED'
          ? `"${title}" has been successfully published to Rasigan OTT!`
          : `"${title}" draft has been saved successfully!`,
      });
    } catch (err: any) {
      setSubmitResult({
        isOpen: true,
        status: 'ERROR',
        message: err?.message || 'Failed to save content to database.',
        details: [err?.message || 'Database error occurred. Please try again.'],
      });
    }
  };

  return (
    <div className="min-h-screen pb-32 pt-4 px-2 sm:px-4 max-w-7xl mx-auto space-y-6 text-gray-100">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-white/10">
        <div>
          <h1 className="text-2xl font-black text-white">{isEdit ? `Edit Title: ${title || id}` : 'Add New Content'}</h1>
          <p className="text-xs text-gray-400">Add or modify content titles with instant cast auto-save, test URLs, and episode builder.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
            Status: {status}
          </span>
          {hasUnsavedChanges && (
            <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
              Unsaved draft changes
            </span>
          )}
          {lastAutosaved && (
            <span className="text-[11px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Autosaved at {lastAutosaved}
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Form Left (Scrolling), Live Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Fields 1 to 9 + Additional */}
        <div className="lg:col-span-2 space-y-6">
          {/* Field 1: Title & Slug */}
          <div className="glass-card p-6 rounded-3xl space-y-4 border border-white/10">
            <h3 className="text-base font-bold text-white flex items-center gap-2">1. Title & Identifier</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Title Name *</label>
                <input
                  type="text"
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Vetri: The Triumph"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Slug (Auto-generated)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-gray-400 text-xs focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Field 2: About / Description */}
          <div className="glass-card p-6 rounded-3xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">2. About / Description *</h3>
              <span className="text-[10px] text-gray-400 font-mono">{description.length}/2000</span>
            </div>
            <textarea
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description for viewers..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400 resize-none"
            />
          </div>

          {/* Field 3: Category Segmented Control */}
          <div className="glass-card p-6 rounded-3xl space-y-4 border border-white/10">
            <h3 className="text-base font-bold text-white">3. Category (Content Kind) *</h3>
            <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-dark-card border border-white/15">
              {(['MOVIE', 'SHORT_FILM', 'WEB_SERIES'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (kind === 'WEB_SERIES' && k !== 'WEB_SERIES' && seasons.some((s) => s.episodes.length > 0)) {
                      if (!confirm('Episodes will be kept as drafts but hidden. Proceed?')) return;
                    }
                    setKind(k);
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    kind === k ? 'bg-sky-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {k === 'MOVIE' ? 'Movie' : k === 'SHORT_FILM' ? 'Short Film' : 'Web Series'}
                </button>
              ))}
            </div>
          </div>

          {/* Field 4: Episodes Builder (Only shown when Category = Web Series) */}
          {kind === 'WEB_SERIES' && (
            <div className="glass-card p-6 rounded-3xl space-y-6 border border-sky-500/30">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Tv className="w-5 h-5 text-sky-400" /> 4. Episodes Builder
                </h3>
              </div>

              {seasons.map((season, sIdx) => (
                <div key={sIdx} className="space-y-3 p-4 rounded-2xl bg-dark-card border border-white/10">
                  <h4 className="font-bold text-sm text-sky-300">Season {season.number}</h4>

                  <div className="space-y-3">
                    {season.episodes.map((ep: any, epIdx: number) => (
                      <div key={epIdx} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-sky-400 font-bold">E{ep.number}</span>
                          <input
                            type="text"
                            value={ep.name}
                            onChange={(e) => {
                              const update = [...seasons];
                              update[sIdx].episodes[epIdx].name = e.target.value;
                              setSeasons(update);
                            }}
                            placeholder="Episode Title"
                            className="flex-1 px-3 py-1.5 rounded-lg bg-dark-bg border border-white/15 text-white text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const update = [...seasons];
                              update[sIdx].episodes.splice(epIdx, 1);
                              setSeasons(update);
                            }}
                            className="p-1.5 text-rose-400 hover:text-rose-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <input
                            type="url"
                            value={ep.videoUrl}
                            onChange={(e) => {
                              const update = [...seasons];
                              update[sIdx].episodes[epIdx].videoUrl = e.target.value;
                              setSeasons(update);
                            }}
                            placeholder="Episode Video Link (HLS .m3u8 or MP4)"
                            className="w-full px-3 py-1.5 rounded-lg bg-dark-bg border border-white/15 text-white text-xs font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddEpisode(sIdx)}
                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-sky-300 border border-sky-400/20"
                  >
                    ＋ Add Episode to Season {season.number}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Field 5: Genres Multi-select Chips */}
          <div className="glass-card p-6 rounded-3xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">5. Genres *</h3>
              <button
                type="button"
                onClick={() => setIsGenreModalOpen(true)}
                className="text-xs font-semibold text-sky-400 hover:underline"
              >
                ＋ Create Genre Inline
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allGenres.map((g: any) => {
                const isSelected = selectedGenreIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedGenreIds(selectedGenreIds.filter((id) => id !== g.id));
                      } else {
                        setSelectedGenreIds([...selectedGenreIds, g.id]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected ? 'bg-sky-500/20 border-sky-400 text-sky-300' : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Field 6: Free-form Tags Chip Input */}
          <div className="glass-card p-6 rounded-3xl space-y-4 border border-white/10">
            <h3 className="text-base font-bold text-white">6. Tags</h3>
            <div className="p-3 rounded-2xl bg-dark-card border border-white/15 space-y-2">
              <div className="flex flex-wrap gap-2">
                {tags.map((t, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-xl bg-sky-500/20 text-sky-300 text-xs font-semibold flex items-center gap-1">
                    #{t}
                    <button type="button" onClick={() => setTags(tags.filter((_, i) => i !== idx))}>
                      <X className="w-3 h-3 text-sky-400" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type tag & press Enter or comma..."
                  className="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none flex-1 min-w-[140px]"
                />
              </div>
            </div>
          </div>

          {/* Field 7: Cast Typeahead with Instant Auto-Save (B4.4) */}
          <div className="glass-card p-6 rounded-3xl space-y-4 border border-white/10 relative z-40">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">7. Cast (Instant Auto-Save)</h3>
              <span className="text-[10px] text-sky-400 font-mono">Press Enter to auto-create character</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={castSearch}
                onChange={(e) => setCastSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && castSearch.trim()) {
                    e.preventDefault();
                    // If exact match found in suggestions, select it; otherwise auto-create new person in DB!
                    const exactMatch = castSuggestions.find((p) => p.name.toLowerCase().trim() === castSearch.toLowerCase().trim());
                    if (exactMatch) {
                      handleSelectCastPerson(exactMatch);
                    } else {
                      handleCreateNewCastPerson(castSearch.trim());
                    }
                  }
                }}
                placeholder="Type cast member name (e.g. Mohan) & press Enter..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400"
              />

              {/* Suggestions Dropdown (Z-50 & Elevated dark background) */}
              {castSearch.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#0f121d] border border-sky-500/40 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2 space-y-1">
                  {isCastSearching ? (
                    <div className="p-3 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-sky-400" /> Searching database...
                    </div>
                  ) : (
                    <>
                      {castSuggestions.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectCastPerson(p)}
                          className="p-2.5 rounded-xl hover:bg-sky-500/20 flex items-center justify-between cursor-pointer text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            {p.photoUrl ? (
                              <img src={p.photoUrl} alt={p.name} className="w-8 h-8 rounded-full object-cover border border-sky-400/30" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center border border-sky-400/40 shadow-sm">
                                {getPersonInitials(p.name)}
                              </div>
                            )}
                            <div>
                              <span className="text-white font-semibold block">{p.name}</span>
                              {p.bio && <span className="text-[10px] text-gray-400 line-clamp-1">{p.bio}</span>}
                            </div>
                          </div>
                          <span className="text-[10px] text-sky-400 font-mono bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">{p.titlesCount || 0} titles</span>
                        </div>
                      ))}

                      {/* Prompt banner when no matches found */}
                      {castSuggestions.length === 0 && (
                        <div className="p-2 text-[11px] text-amber-300/90 bg-amber-500/10 rounded-xl border border-amber-500/20 text-center font-medium">
                          No existing character found for "{castSearch}". Click below or press Enter to auto-create!
                        </div>
                      )}

                      {/* "+ Add Name as new person" Option (Auto-saves to DB) */}
                      <button
                        type="button"
                        onClick={() => handleCreateNewCastPerson(castSearch)}
                        className="w-full p-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold text-xs text-left flex items-center gap-2 border border-sky-400/30 transition-colors"
                      >
                        <Plus className="w-4 h-4 text-sky-400" /> Auto-Create & Save "{castSearch}" to Database
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Added Cast Chips with DP Initials / Photo */}
            <div className="space-y-2">
              {cast.map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-500">#{idx + 1}</span>
                    
                    {/* DP Avatar Badge */}
                    {item.person?.photoUrl ? (
                      <img src={item.person.photoUrl} alt={item.person.name} className="w-7 h-7 rounded-full object-cover border border-sky-400/30" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-[11px] flex items-center justify-center border border-sky-400/40 shadow-sm">
                        {getPersonInitials(item.person?.name || 'DP')}
                      </div>
                    )}

                    <span className="font-bold text-xs text-white">{item.person?.name}</span>
                    <input
                      type="text"
                      value={item.characterName}
                      onChange={(e) => {
                        const update = [...cast];
                        update[idx].characterName = e.target.value;
                        setCast(update);
                      }}
                      placeholder="plays (character name)..."
                      className="px-2.5 py-1 rounded-lg bg-dark-bg border border-white/15 text-xs text-gray-200"
                    />
                  </div>
                  <button type="button" onClick={() => setCast(cast.filter((_, i) => i !== idx))}>
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Field 7.5: Creator / Studio Selection (Assigned Creator) */}
          <div className="glass-card p-6 rounded-3xl space-y-4 border border-white/10 relative z-20">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>Creator / Studio Assignment *</span>
              <span className="text-[10px] text-sky-400 font-mono">Assigned for Payouts & Analytics</span>
            </h3>
            <p className="text-xs text-gray-400">Select an existing creator studio or enter a custom studio name to assign revenue & analytics ownership.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Select Registered Creator</label>
                <select
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs focus:outline-none font-semibold focus:border-sky-400"
                >
                  <option value="">-- Choose Studio / Creator --</option>
                  <option value="Studio 1 Originals">Studio 1 Originals</option>
                  <option value="Indie Mobile Cinema">Indie Mobile Cinema</option>
                  <option value="Madras Digital Studio">Madras Digital Studio</option>
                  <option value="Kaveri Short Films">Kaveri Short Films</option>
                  <option value="Vetrivelo Pictures">Vetrivelo Pictures</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Or Type Custom Creator / Studio</label>
                <input
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="e.g. DreamLock Studios"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>
          </div>

          {/* Field 8 & 9: Movie Link & Trailer Link with Test URL Tool (B4.5) */}
          {kind !== 'WEB_SERIES' && (
            <div className="glass-card p-6 rounded-3xl space-y-4 border border-white/10 relative z-10">
              <h3 className="text-base font-bold text-white flex items-center justify-between">
                <span>8. Movie Video Link *</span>
                <span className="text-[10px] text-gray-400 font-mono">HLS / MP4 / DASH</span>
              </h3>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={movieLink}
                  onChange={(e) => setMovieLink(e.target.value)}
                  placeholder="https://... (.m3u8, .mp4, or .mpd)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400 font-mono"
                />
                <button
                  type="button"
                  onClick={handleTestMovieUrl}
                  disabled={!movieLink || isValidatingMovie}
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-40"
                >
                  {isValidatingMovie && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Test URL
                </button>
              </div>

              {/* Supported Video Types Info */}
              <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">HLS (.m3u8)</span>
                <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">MP4 (.mp4)</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">DASH (.mpd)</span>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">CDN / S3 / Mux / Cloudflare</span>
              </div>

              {movieValidation && (
                <div className={`p-3 rounded-2xl text-xs font-semibold border ${movieValidation.isValid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                  {movieValidation.message}
                </div>
              )}
            </div>
          )}

          <div className="glass-card p-6 rounded-3xl space-y-4 border border-white/10 relative z-10">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>9. Trailer Video Link</span>
              <span className="text-[10px] text-gray-400 font-mono">HLS / MP4 / YouTube / Vimeo</span>
            </h3>
            <div className="flex gap-2">
              <input
                type="url"
                value={trailerLink}
                onChange={(e) => setTrailerLink(e.target.value)}
                placeholder="https://... (HLS, MP4, YouTube, Vimeo)"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400 font-mono"
              />
              <button
                type="button"
                onClick={handleTestTrailerUrl}
                disabled={!trailerLink || isValidatingTrailer}
                className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-40"
              >
                {isValidatingTrailer && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Test URL
              </button>
            </div>

            {/* Supported Video Types Info */}
            <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">HLS (.m3u8)</span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">MP4 (.mp4)</span>
              <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 font-mono">YouTube</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">Vimeo</span>
            </div>

            {trailerValidation && (
              <div className={`p-3 rounded-2xl text-xs font-semibold border ${trailerValidation.isValid ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                {trailerValidation.message}
              </div>
            )}
          </div>

          {/* Grouped Additional Sections: Artwork & Details */}
          <div className="glass-card p-6 rounded-3xl space-y-4 border border-white/10">
            <h3 className="text-base font-bold text-white">Artwork & Metadata</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Poster URL (Required) *</label>
                <input
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-sky-300 mb-1 flex items-center justify-between">
                  <span>Vertical Banner URL (9:16) *</span>
                  <span className="text-[9px] text-amber-400 uppercase tracking-wider font-extrabold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Mandatory</span>
                </label>
                <input
                  type="url"
                  value={verticalPosterUrl}
                  onChange={(e) => setVerticalPosterUrl(e.target.value)}
                  placeholder="https://... (9:16 aspect ratio vertical banner)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-sky-400/40 text-white text-xs focus:outline-none focus:border-sky-400 font-mono"
                />
                {verticalPosterUrl ? (
                  <div className="mt-1.5 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Vertical Banner attached
                  </div>
                ) : (
                  <div className="mt-1.5 text-[10px] text-amber-400/90 font-mono flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Mandatory for all sections
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Banner URL (Landscape 16:9)</label>
                <input
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Orientation *</label>
                <select
                  value={orientation}
                  onChange={(e: any) => setOrientation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs focus:outline-none font-bold"
                >
                  <option value="LANDSCAPE">Landscape (16:9)</option>
                  <option value="VERTICAL">Vertical Reel (9:16)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Editor Rating (0–10)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editorRating}
                  onChange={(e) => setEditorRating(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Card Preview (Desktop Sticky Card) */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-4 border border-white/10 sticky top-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-400" /> Live Preview Card
            </h3>

            <div className="bg-[#0b0d15] rounded-2xl overflow-hidden border border-white/15 shadow-2xl space-y-3">
              <div className="aspect-video bg-dark-card relative overflow-hidden">
                {posterUrl ? (
                  <img src={posterUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Poster Preview</div>
                )}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase">
                  {kind}
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-white truncate">{title || 'Untitled Title'}</h4>
                  {creatorName && (
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-mono truncate max-w-[120px]">
                      {creatorName}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 line-clamp-2">{description || 'No description entered yet.'}</p>
                <div className="flex items-center justify-between text-[10px] text-sky-400 font-mono pt-1">
                  <span>Rating: {editorRating || '9.0'}★</span>
                  <span>{orientation}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar (B4) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b0d15]/95 backdrop-blur-md border-t border-white/15 py-3 px-6 shadow-2xl flex items-center justify-between max-w-7xl mx-auto rounded-t-3xl">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 font-semibold text-xs"
        >
          Cancel
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => handleFormSubmit('DRAFT')}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 disabled:opacity-40"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => handleFormSubmit('PUBLISHED')}
            className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/25 disabled:opacity-40 flex items-center gap-2"
          >
            {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Publish Content
          </button>
        </div>
      </div>

      {/* Submission Status Pop-up Modal (Success / Error) */}
      {submitResult?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-card max-w-md w-full p-6 sm:p-8 rounded-3xl space-y-6 border border-white/20 shadow-2xl relative overflow-hidden bg-[#0e111c]">
            {submitResult.status === 'SUCCESS' ? (
              <>
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">Content Saved Successfully!</h2>
                  <p className="text-xs text-gray-300 max-w-sm">{submitResult.message}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-gray-400">
                    <span>Title:</span>
                    <strong className="text-white font-bold truncate max-w-[200px]">{title}</strong>
                  </div>
                  <div className="flex justify-between items-center text-gray-400">
                    <span>Kind:</span>
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px]">{kind}</span>
                  </div>
                  {creatorName && (
                    <div className="flex justify-between items-center text-gray-400">
                      <span>Studio:</span>
                      <span className="text-emerald-400 font-semibold">{creatorName}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const targetSlug = submitResult.titleSlug || slug;
                      navigate(`/title/${targetSlug}`);
                    }}
                    className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all"
                  >
                    <Eye className="w-4 h-4" /> View Content
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-gray-200 font-bold text-xs flex items-center justify-center gap-2 border border-white/15 transition-all"
                  >
                    <X className="w-4 h-4" /> Close (Admin)
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-400 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/20">
                    <AlertTriangle className="w-10 h-10" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">Form Validation & Error Status</h2>
                  <p className="text-xs text-rose-300 font-semibold max-w-sm">{submitResult.message}</p>
                </div>

                {submitResult.details && submitResult.details.length > 0 && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2 text-xs">
                    <h4 className="font-bold text-rose-300 text-xs">Required Fields to Complete:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-[11px]">
                      {submitResult.details.map((detail, idx) => (
                        <li key={idx} className="text-rose-200 font-medium">{detail}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setSubmitResult(null)}
                    className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition-all"
                  >
                    Dismiss & Fix Errors (Content Preserved)
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Inline Genre Create Modal */}
      {isGenreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 rounded-3xl space-y-4 border border-white/20">
            <h3 className="text-base font-bold text-white">Create Genre Inline</h3>
            <input
              type="text"
              value={newGenreName}
              onChange={(e) => setNewGenreName(e.target.value)}
              placeholder="e.g. Cyberpunk"
              className="w-full px-3.5 py-2.5 rounded-xl bg-dark-card border border-white/15 text-white text-xs"
            />
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setIsGenreModalOpen(false)} className="px-3 py-1.5 text-xs text-gray-300">Cancel</button>
              <button
                onClick={async () => {
                  if (newGenreName.trim()) {
                    const res = await adminApi.createGenre({ name: newGenreName });
                    queryClient.invalidateQueries({ queryKey: ['admin-genres'] });
                    setSelectedGenreIds([...selectedGenreIds, res.genre.id]);
                    setNewGenreName('');
                    setIsGenreModalOpen(false);
                  }
                }}
                className="px-4 py-1.5 bg-sky-500 text-white font-bold text-xs rounded-xl"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
