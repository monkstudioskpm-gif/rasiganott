import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';
import { adminApi, api } from '../../lib/api';
import { Title } from '@rasigan/shared';
import { Link } from 'react-router-dom';

interface AdminCommentItem {
  id: string;
  titleId: string;
  episodeId?: string | null;
  userId: string;
  body: string;
  status: 'VISIBLE' | 'HIDDEN' | 'DELETED';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string | null;
  };
  title?: {
    id: string;
    title: string;
    slug: string;
    posterUrl: string | null;
  };
  reportCount: number;
  reports?: Array<{
    id: string;
    userId: string;
    reason: string | null;
    createdAt: string;
  }>;
}

export function AdminCommentsPage() {
  const [comments, setComments] = useState<AdminCommentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [reportedOnly, setReportedOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [titleFilter, setTitleFilter] = useState<string>('');
  const [titlesList, setTitlesList] = useState<Title[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch all titles for the dropdown filter
  useEffect(() => {
    api
      .getTitles({ limit: '100' })
      .then((res) => {
        if (res?.titles) setTitlesList(res.titles);
      })
      .catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getComments({
        status: statusFilter || undefined,
        reportedOnly: reportedOnly || undefined,
        titleId: titleFilter || undefined,
        q: searchQuery.trim() || undefined,
        page,
        limit: 15,
      });
      setComments(res.comments as AdminCommentItem[]);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load admin comments:', err);
      showToast('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, reportedOnly, titleFilter, searchQuery, page]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleStatusChange = async (id: string, newStatus: 'VISIBLE' | 'HIDDEN' | 'DELETED') => {
    setActionLoadingId(id);
    try {
      await adminApi.updateCommentStatus(id, newStatus);
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
      showToast(
        newStatus === 'HIDDEN'
          ? 'Comment hidden from public'
          : newStatus === 'VISIBLE'
          ? 'Comment unhidden & made visible'
          : 'Comment deleted'
      );
    } catch (err) {
      console.error('Status update error:', err);
      showToast('Failed to update comment status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently soft-delete this comment?')) return;
    setActionLoadingId(id);
    try {
      await adminApi.deleteComment(id);
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'DELETED' } : c))
      );
      showToast('Comment marked as deleted');
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete comment');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-neutral-900 border border-sky-400/50 text-sky-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-sky-400" />
            Comments & Community Moderation
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Review user feedback, moderate discussions in realtime, and address flagged reports.
          </p>
        </div>

        <button
          onClick={() => fetchComments()}
          disabled={isLoading}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by comment body or author..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-950 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Title Filter */}
        <select
          value={titleFilter}
          onChange={(e) => {
            setTitleFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs bg-neutral-950 border border-white/15 rounded-xl text-white focus:outline-none focus:border-sky-500"
        >
          <option value="">All Catalog Titles</option>
          {titlesList.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs bg-neutral-950 border border-white/15 rounded-xl text-white focus:outline-none focus:border-sky-500"
        >
          <option value="">All Statuses</option>
          <option value="VISIBLE">Visible Only</option>
          <option value="HIDDEN">Hidden Only</option>
          <option value="DELETED">Deleted Only</option>
        </select>

        {/* Reported Checkbox */}
        <label className="flex items-center gap-2 px-3 py-2 bg-neutral-950 border border-white/15 rounded-xl text-xs text-gray-300 cursor-pointer hover:border-white/30 transition-colors select-none">
          <input
            type="checkbox"
            checked={reportedOnly}
            onChange={(e) => {
              setReportedOnly(e.target.checked);
              setPage(1);
            }}
            className="rounded border-gray-600 text-sky-500 focus:ring-0 focus:ring-offset-0"
          />
          <span className="flex items-center gap-1.5 font-semibold text-amber-300">
            <ShieldAlert className="w-3.5 h-3.5" /> Flagged / Reported
          </span>
        </label>
      </div>

      {/* Comments List Table */}
      <div className="rounded-2xl border border-white/10 bg-neutral-900/60 overflow-hidden backdrop-blur-xl">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
            <p className="text-xs">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 text-center p-6 space-y-3">
            <MessageSquare className="w-10 h-10 text-gray-600" />
            <p className="text-sm font-semibold text-gray-300">No comments match the selected filters.</p>
            <p className="text-xs text-gray-500">Try clearing your search query or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Comment</th>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Reports</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comments.map((comment) => {
                  const isActionLoading = actionLoadingId === comment.id;

                  return (
                    <tr
                      key={comment.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Author */}
                      <td className="py-3.5 px-4 align-top w-48">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                            {comment.user?.avatarUrl ? (
                              <img
                                src={comment.user.avatarUrl}
                                alt={comment.user.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-gray-300">
                                {(comment.user?.name || 'U').charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate text-xs">
                              {comment.user?.name || 'Unknown'}
                            </p>
                            {comment.user?.email && (
                              <p className="text-[10px] text-gray-500 truncate font-mono">
                                {comment.user.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Comment Body */}
                      <td className="py-3.5 px-4 align-top min-w-[280px]">
                        <p className="text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
                          {comment.body}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {new Date(comment.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </td>

                      {/* Title Reference */}
                      <td className="py-3.5 px-4 align-top w-44">
                        {comment.title ? (
                          <Link
                            to={`/title/${comment.title.slug}`}
                            target="_blank"
                            className="flex items-center gap-2 text-sky-400 hover:text-sky-300 group/link"
                          >
                            {comment.title.posterUrl && (
                              <img
                                src={comment.title.posterUrl}
                                alt={comment.title.title}
                                className="w-6 h-8 object-cover rounded shadow shrink-0"
                              />
                            )}
                            <span className="font-semibold text-xs truncate">
                              {comment.title.title}
                            </span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
                          </Link>
                        ) : (
                          <span className="text-gray-500 text-[11px]">Title #{comment.titleId.slice(0, 8)}</span>
                        )}
                        {comment.episodeId && (
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            Episode: {comment.episodeId.slice(0, 8)}
                          </span>
                        )}
                      </td>

                      {/* Reports */}
                      <td className="py-3.5 px-4 align-top w-36">
                        {comment.reportCount > 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              {comment.reportCount} {comment.reportCount === 1 ? 'Report' : 'Reports'}
                            </span>
                            {comment.reports && comment.reports.length > 0 && (
                              <div className="text-[10px] text-gray-400 italic space-y-0.5">
                                {comment.reports.slice(0, 2).map((r, i) => (
                                  <p key={i} className="truncate">
                                    • {r.reason || 'No reason specified'}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-600 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 align-top w-28">
                        {comment.status === 'VISIBLE' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                            Visible
                          </span>
                        )}
                        {comment.status === 'HIDDEN' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[10px]">
                            Hidden
                          </span>
                        )}
                        {comment.status === 'DELETED' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-[10px]">
                            Deleted
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right w-36">
                        <div className="flex items-center justify-end gap-1.5">
                          {comment.status === 'VISIBLE' && (
                            <button
                              onClick={() => handleStatusChange(comment.id, 'HIDDEN')}
                              disabled={isActionLoading}
                              className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors"
                              title="Hide comment from public"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {comment.status === 'HIDDEN' && (
                            <button
                              onClick={() => handleStatusChange(comment.id, 'VISIBLE')}
                              disabled={isActionLoading}
                              className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors"
                              title="Make comment visible again"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {comment.status !== 'DELETED' && (
                            <button
                              onClick={() => handleDelete(comment.id)}
                              disabled={isActionLoading}
                              className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
          <div>
            Showing {comments.length} of {total} comments (Page {page} of {totalPages})
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
