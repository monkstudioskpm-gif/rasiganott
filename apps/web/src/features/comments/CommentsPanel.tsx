import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Send,
  Heart,
  IndianRupee,
  MessageSquare,
  AlertCircle,
  Loader2,
  Trash2,
  Flag,
  ArrowUp,
  User as UserIcon,
  LogIn,
} from 'lucide-react';
import { Comment, Title } from '@rasigan/shared';
import { commentsApi, authApi } from '../../lib/api';
import { SUPPORT_CREATOR_COPY, NO_COMMENTS_COPY } from '../../lib/copy';
import { SupportModal } from '../../components/SupportModal';

interface AuthUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  role?: string;
}

interface GoogleCredentialResponse {
  credential?: string;
}

export interface CommentsPanelProps {
  titleId: string;
  episodeId?: string | null;
  titleObj?: Title | {
    id?: string;
    title?: string;
    creatorName?: string;
    fundingEnabled?: boolean;
    fundingGoal?: number;
    fundingRaised?: number;
    [key: string]: unknown;
  } | null;
  layout: 'side' | 'sheet';
  isOpen: boolean;
  onClose: () => void;
  onInputFocusChange?: (focused: boolean) => void;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const timestamp = new Date(dateStr).getTime();
    if (isNaN(timestamp)) return '';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 45) return 'just now';
    if (diffSec < 90) return '1m ago';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay}d ago`;
    const diffMonth = Math.floor(diffDay / 30);
    if (diffMonth < 12) return `${diffMonth}mo ago`;
    return `${Math.floor(diffMonth / 12)}y ago`;
  } catch {
    return '';
  }
}

export function CommentsPanel({
  titleId,
  episodeId,
  titleObj,
  layout,
  isOpen,
  onClose,
  onInputFocusChange,
}: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetchingMore, setIsFetchingMore] = useState<boolean>(false);
  const [inputBody, setInputBody] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);
  const [unreadNewCount, setUnreadNewCount] = useState<number>(0);
  const [keyboardOffset, setKeyboardOffset] = useState<number>(0);

  // Current User & Auth Modal
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('rasigan_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [showAuthGate, setShowAuthGate] = useState<boolean>(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const googleBtnContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync auth state
  useEffect(() => {
    const handleAuthChange = () => {
      try {
        const stored = localStorage.getItem('rasigan_user');
        setCurrentUser(stored ? JSON.parse(stored) : null);
      } catch {
        setCurrentUser(null);
      }
    };
    window.addEventListener('storage', handleAuthChange);
    return () => window.removeEventListener('storage', handleAuthChange);
  }, []);

  // Fetch Initial Comments
  const fetchComments = useCallback(async () => {
    if (!titleId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await commentsApi.getComments({
        titleId,
        episodeId: episodeId || undefined,
        limit: 20,
      });
      setComments(res.comments);
      setTotalCount(res.totalCount);
      setNextCursor(res.nextCursor);
    } catch (err: unknown) {
      console.warn('Failed to load comments:', err);
      setErrorMessage('Could not load comments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [titleId, episodeId]);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      setUnreadNewCount(0);
    }
  }, [isOpen, fetchComments]);

  // Infinite Scroll Handler
  const handleScroll = () => {
    const el = listContainerRef.current;
    if (!el) return;

    // Reset unread indicator if user scrolled to top
    if (el.scrollTop < 60) {
      setUnreadNewCount(0);
    }

    // Check if near bottom to fetch more
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom && nextCursor && !isFetchingMore) {
      loadMoreComments();
    }
  };

  const loadMoreComments = async () => {
    if (!nextCursor || isFetchingMore) return;
    setIsFetchingMore(true);
    try {
      const res = await commentsApi.getComments({
        titleId,
        episodeId: episodeId || undefined,
        cursor: nextCursor,
        limit: 20,
      });
      setComments((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newItems = res.comments.filter((c) => !existingIds.has(c.id));
        return [...prev, ...newItems];
      });
      setNextCursor(res.nextCursor);
    } catch (err) {
      console.warn('Failed to load more comments:', err);
    } finally {
      setIsFetchingMore(false);
    }
  };

  // Realtime Server-Sent Events (SSE)
  useEffect(() => {
    if (!isOpen || !titleId) return;

    const baseApi = import.meta.env.VITE_API_URL || '/api';
    const sseUrl = `${baseApi}/comments/stream?titleId=${encodeURIComponent(titleId)}${
      episodeId ? `&episodeId=${encodeURIComponent(episodeId)}` : ''
    }`;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(sseUrl, { withCredentials: true });

      eventSource.addEventListener('comment.created', (event: MessageEvent) => {
        try {
          const newComment: Comment = JSON.parse(event.data);
          setComments((prev) => {
            // Check if already present (e.g. optimistic match)
            const exists = prev.some((c) => c.id === newComment.id);
            if (exists) return prev;

            // Check if user had an optimistic placeholder
            const optimisticIndex = prev.findIndex(
              (c) => c.id.startsWith('temp_') && c.userId === newComment.userId && c.body === newComment.body
            );
            if (optimisticIndex !== -1) {
              const updated = [...prev];
              updated[optimisticIndex] = newComment;
              return updated;
            }

            return [newComment, ...prev];
          });
          setTotalCount((c) => c + 1);

          // If user is scrolled down, increment unread pill
          const el = listContainerRef.current;
          if (el && el.scrollTop > 80) {
            setUnreadNewCount((n) => n + 1);
          } else if (el) {
            // Smoothly keep at top
            el.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } catch (e) {
          console.warn('Failed to parse SSE comment.created:', e);
        }
      });

      eventSource.addEventListener('comment.deleted', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.id) {
            setComments((prev) => prev.filter((c) => c.id !== payload.id));
            setTotalCount((c) => Math.max(0, c - 1));
          }
        } catch (e) {
          console.warn('Failed to parse SSE comment.deleted:', e);
        }
      });

      eventSource.onerror = () => {
        // EventSource will automatically retry in background
      };
    } catch (err) {
      console.warn('SSE connection initialization error:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isOpen, titleId, episodeId]);

  // Mobile visualViewport Keyboard Inset Handler
  useEffect(() => {
    if (layout !== 'sheet') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const handleViewportChange = () => {
      const offset = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
      setKeyboardOffset(offset);
    };

    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);
    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, [layout]);

  // Google Identity Services Button for Guest Auth Gate
  useEffect(() => {
    if (!showAuthGate) return;

    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '102651788040-f80qjr6hok5b2i1nt8pcke7bnnr035j8.apps.googleusercontent.com';

    const handleGsiCredential = async (res: GoogleCredentialResponse) => {
      if (!res.credential) return;
      try {
        const loginRes = await authApi.loginWithGoogle(res.credential);
        if (loginRes?.user) {
          setCurrentUser(loginRes.user);
          localStorage.setItem('rasigan_user', JSON.stringify(loginRes.user));
          localStorage.setItem('user_role', loginRes.user.role);
          setShowAuthGate(false);
        }
      } catch (err) {
        console.error('Comment login error:', err);
      }
    };

    const googleObj = window.google;
    if (googleObj?.accounts?.id && googleBtnContainerRef.current) {
      googleBtnContainerRef.current.innerHTML = '';
      googleObj.accounts.id.initialize({
        client_id: clientId,
        callback: handleGsiCredential,
        auto_select: false,
      });
      googleObj.accounts.id.renderButton(googleBtnContainerRef.current, {
        type: 'standard',
        shape: 'pill',
        theme: 'filled_black',
        text: 'signin_with',
        size: 'medium',
        width: 240,
      });
    }
  }, [showAuthGate]);

  const scrollToTop = () => {
    if (listContainerRef.current) {
      listContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      setUnreadNewCount(0);
    }
  };

  // Submit Comment
  const handlePostComment = async () => {
    const trimmed = inputBody.trim();
    if (!trimmed || isSubmitting) return;

    if (!currentUser) {
      setShowAuthGate(true);
      return;
    }

    if (trimmed.length > 500) {
      setErrorMessage('Comment cannot exceed 500 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Optimistic comment insert
    const tempId = `temp_${Date.now()}`;
    const optimisticComment: Comment = {
      id: tempId,
      titleId,
      episodeId: episodeId || null,
      userId: currentUser.id,
      body: trimmed,
      status: 'VISIBLE',
      createdAt: new Date().toISOString(),
      user: {
        id: currentUser.id,
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl || null,
      },
    };

    setComments((prev) => [optimisticComment, ...prev]);
    setTotalCount((c) => c + 1);
    setInputBody('');
    scrollToTop();

    try {
      const res = await commentsApi.postComment({
        titleId,
        episodeId: episodeId || undefined,
        body: trimmed,
      });

      // Replace optimistic entry with confirmed server model
      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? res.comment : c))
      );
    } catch (err: unknown) {
      console.error('Failed to post comment:', err);
      // Rollback optimistic comment
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setTotalCount((c) => Math.max(0, c - 1));
      setInputBody(trimmed); // Restore draft
      const msg = err instanceof Error ? err.message : "Failed to post comment. You're commenting too fast.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await commentsApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotalCount((c) => Math.max(0, c - 1));
    } catch (err: unknown) {
      console.error('Failed to delete comment:', err);
      alert('Failed to delete comment. Please try again.');
    }
  };

  // Report Comment
  const handleOpenReport = (commentId: string) => {
    if (!currentUser) {
      setShowAuthGate(true);
      return;
    }
    setReportingCommentId(commentId);
    setReportReason('');
    setReportSuccess(null);
  };

  const handleConfirmReport = async () => {
    if (!reportingCommentId) return;
    try {
      await commentsApi.reportComment(reportingCommentId, reportReason.trim() || undefined);
      setReportSuccess('Thank you for reporting. Our moderation team will review this comment.');
      setTimeout(() => {
        setReportingCommentId(null);
        setReportSuccess(null);
      }, 2000);
    } catch (err: unknown) {
      console.error('Failed to report comment:', err);
      alert('Failed to submit report. Please try again.');
    }
  };

  if (!isOpen) return null;

  const isFundingEnabled = titleObj?.fundingEnabled !== false;

  const panelContent = (
    <div
      className="flex flex-col h-full w-full select-auto"
      onKeyDown={(e) => {
        // Prevent player shortcut bubbling from entire comments panel
        e.stopPropagation();
      }}
    >
      {/* Support Creator Razorpay Modal */}
      {titleObj && (
        <SupportModal
          title={titleObj as Title}
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
        />
      )}

      {/* Sheet Drag Pill (Mobile Only) */}
      {layout === 'sheet' && (
        <div
          onClick={onClose}
          className="pt-2.5 pb-1 flex justify-center cursor-pointer active:opacity-70"
          title="Dismiss Comments"
        >
          <div className="w-12 h-1 bg-white/30 rounded-full" />
        </div>
      )}

      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold text-white tracking-tight">
            Comments {totalCount > 0 ? `(${totalCount})` : ''}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close comments"
          className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Support Creator Banner directly under Header */}
      {isFundingEnabled && (
        <div className="mx-3 my-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/15 to-sky-500/10 border border-amber-500/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Heart className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400/20" />
            <span className="text-[11px] sm:text-xs text-amber-100/90 font-medium truncate">
              {SUPPORT_CREATOR_COPY}
            </span>
          </div>
          <button
            onClick={() => setShowSupportModal(true)}
            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black shrink-0 transition-all active:scale-95 shadow-sm"
          >
            Support
          </button>
        </div>
      )}

      {/* Floating 'New Comments' indicator pill */}
      {unreadNewCount > 0 && (
        <div className="relative z-30 flex justify-center -mb-7 pointer-events-none">
          <button
            onClick={scrollToTop}
            className="pointer-events-auto px-3 py-1 rounded-full bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/30 flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>{unreadNewCount} new {unreadNewCount === 1 ? 'comment' : 'comments'}</span>
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="mx-3 mt-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 shrink-0">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="flex-1 text-[11px]">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 font-bold hover:underline text-[10px]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Comments List Container */}
      <div
        ref={listContainerRef}
        onScroll={handleScroll}
        onTouchMove={(e) => {
          // Prevent scroll from propagating to feed swipe on mobile
          e.stopPropagation();
        }}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-sm divide-y divide-white/5"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
            <span className="text-xs">Loading comments...</span>
          </div>
        ) : comments.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-center text-gray-400 space-y-3 p-4">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-300">
              {NO_COMMENTS_COPY}
            </p>
            {isFundingEnabled && (
              <button
                onClick={() => setShowSupportModal(true)}
                className="mt-1 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <IndianRupee className="w-3.5 h-3.5" /> Support Creator
              </button>
            )}
          </div>
        ) : (
          comments.map((comment) => {
            const isAuthor = currentUser?.id === comment.userId;
            const isAdmin = currentUser?.role === 'ADMIN';
            const canDelete = isAuthor || isAdmin;

            return (
              <div key={comment.id} className="pt-3 first:pt-0 group/comment">
                <div className="flex items-start gap-2.5">
                  {/* User Avatar */}
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 shrink-0 border border-white/15 flex items-center justify-center">
                    {comment.user?.avatarUrl ? (
                      <img
                        src={comment.user.avatarUrl}
                        alt={comment.user.name || 'User'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-gray-300 uppercase">
                        {(comment.user?.name || 'U').charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Body & Author Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-gray-200 truncate">
                          {comment.user?.name || 'Viewer'}
                        </span>
                        {comment.createdAt && (
                          <span className="text-[10px] text-gray-500 shrink-0">
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        )}
                        {comment.id.startsWith('temp_') && (
                          <span className="text-[9px] text-sky-400 font-mono italic">
                            Posting...
                          </span>
                        )}
                      </div>

                      {/* Comment Actions (Delete / Report) */}
                      <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover/comment:opacity-100 transition-opacity">
                        {canDelete && !comment.id.startsWith('temp_') && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 text-gray-400 hover:text-rose-400 rounded transition-colors"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {!isAuthor && !comment.id.startsWith('temp_') && (
                          <button
                            onClick={() => handleOpenReport(comment.id)}
                            className="p-1 text-gray-400 hover:text-amber-400 rounded transition-colors"
                            title="Report comment"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="mt-1 text-xs text-gray-300 whitespace-pre-wrap break-words leading-relaxed font-normal">
                      {comment.body}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Load More Spinner */}
        {isFetchingMore && (
          <div className="py-2 flex justify-center text-xs text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin text-sky-400 mr-2" />
            Loading more...
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportingCommentId && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-neutral-900 border border-white/20 rounded-2xl p-4 space-y-3 text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold flex items-center gap-1.5 text-amber-300">
                <Flag className="w-3.5 h-3.5" /> Report Comment
              </h3>
              <button
                onClick={() => setReportingCommentId(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            {reportSuccess ? (
              <p className="text-xs text-emerald-300">{reportSuccess}</p>
            ) : (
              <>
                <p className="text-[11px] text-gray-400">
                  Help us keep the community safe. Why are you reporting this comment?
                </p>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value.slice(0, 200))}
                  placeholder="Reason (spam, harassment, spoiler, etc.)"
                  className="w-full h-20 p-2 text-xs bg-neutral-950 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setReportingCommentId(null)}
                    className="px-3 py-1 text-xs text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReport}
                    className="px-3 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-lg transition-colors"
                  >
                    Submit Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Guest Login Gate Prompt */}
      {showAuthGate && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-neutral-900 border border-white/20 rounded-2xl p-5 space-y-4 text-center text-white">
            <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Sign In to Comment</h3>
              <p className="text-xs text-gray-400 mt-1">
                Join the conversation and support Tamil indie filmmakers.
              </p>
            </div>
            <div className="flex justify-center min-h-[40px]">
              <div ref={googleBtnContainerRef} />
            </div>
            <button
              onClick={() => setShowAuthGate(false)}
              className="text-xs text-gray-400 hover:underline pt-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sticky Bottom Input Bar */}
      <div
        style={{ paddingBottom: layout === 'sheet' && keyboardOffset > 0 ? `${keyboardOffset}px` : undefined }}
        className="p-3 border-t border-white/10 bg-neutral-950/80 backdrop-blur-md shrink-0 transition-all duration-150"
      >
        <div className="flex items-end gap-2">
          {/* User Avatar / Guest Icon */}
          <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 shrink-0 border border-white/15 flex items-center justify-center mb-1">
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-3.5 h-3.5 text-gray-400" />
            )}
          </div>

          {/* Comment Textarea */}
          <div className="flex-1 relative min-w-0">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputBody}
              maxLength={500}
              placeholder={currentUser ? 'Add a comment...' : 'Sign in to add a comment...'}
              onFocus={() => onInputFocusChange?.(true)}
              onBlur={() => onInputFocusChange?.(false)}
              onChange={(e) => setInputBody(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handlePostComment();
                }
              }}
              className="w-full max-h-24 py-2 pl-3 pr-14 text-xs bg-white/5 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-sky-500 resize-none transition-colors"
            />
            {/* Character count counter */}
            {inputBody.length > 0 && (
              <span
                className={`absolute right-2 bottom-2 text-[10px] font-mono ${
                  inputBody.length >= 480 ? 'text-rose-400 font-bold' : 'text-gray-500'
                }`}
              >
                {inputBody.length}/500
              </span>
            )}
          </div>

          {/* Send / Post Button */}
          <button
            onClick={handlePostComment}
            disabled={!inputBody.trim() || isSubmitting || inputBody.length > 500}
            className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:hover:bg-sky-500 text-white shrink-0 transition-all active:scale-95 shadow-md shadow-sky-500/20 mb-0.5"
            title="Post comment (Enter)"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Return layout specific wrapper
  if (layout === 'sheet') {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Semi-transparent Backdrop: Allows video to play visibly above it */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/40 transition-opacity"
        />

        {/* 70% Bottom Sheet */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full md:max-w-md md:mx-auto h-[72vh] max-h-[75vh] bg-neutral-900/95 backdrop-blur-2xl border-t border-white/15 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up"
        >
          {panelContent}
        </div>
      </div>
    );
  }

  // layout === 'side'
  return (
    <div
      className="w-full md:w-[380px] lg:w-[400px] h-full shrink-0 border-l border-white/10 bg-neutral-950/95 backdrop-blur-xl text-white flex flex-col z-40 select-auto animate-fade-in"
    >
      {panelContent}
    </div>
  );
}
