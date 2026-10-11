import { EventEmitter } from 'events';

export interface CommentBusEvent {
  id: string;
  channel: string;
  type: 'comment.created' | 'comment.deleted';
  data: Record<string, unknown>;
  timestamp: number;
}

export interface ICommentBus {
  emitCreated(titleId: string, episodeId: string | null | undefined, comment: Record<string, unknown>): CommentBusEvent;
  emitDeleted(titleId: string, episodeId: string | null | undefined, commentId: string): CommentBusEvent;
  subscribe(
    titleId: string,
    episodeId: string | null | undefined,
    listener: (event: CommentBusEvent) => void
  ): () => void;
  getMissedEvents(
    titleId: string,
    episodeId: string | null | undefined,
    lastEventId: string
  ): CommentBusEvent[];
}

export function formatCommentChannel(titleId: string, episodeId?: string | null): string {
  if (episodeId && episodeId.trim().length > 0) {
    return `title:${titleId}:ep:${episodeId}`;
  }
  return `title:${titleId}`;
}

class InMemoryCommentBus implements ICommentBus {
  private emitter = new EventEmitter();
  // Keep ring buffer of last 150 events per channel for reconnection playback
  private history = new Map<string, CommentBusEvent[]>();
  private counter = 0;

  constructor() {
    this.emitter.setMaxListeners(500);
  }

  private nextEventId(): string {
    this.counter += 1;
    return `evt_${Date.now()}_${this.counter}`;
  }

  private appendHistory(channel: string, event: CommentBusEvent) {
    let list = this.history.get(channel);
    if (!list) {
      list = [];
      this.history.set(channel, list);
    }
    list.push(event);
    if (list.length > 150) {
      list.shift();
    }
  }

  emitCreated(
    titleId: string,
    episodeId: string | null | undefined,
    comment: Record<string, unknown>
  ): CommentBusEvent {
    const channel = formatCommentChannel(titleId, episodeId);
    const event: CommentBusEvent = {
      id: this.nextEventId(),
      channel,
      type: 'comment.created',
      data: comment,
      timestamp: Date.now(),
    };

    this.appendHistory(channel, event);
    this.emitter.emit(channel, event);
    return event;
  }

  emitDeleted(
    titleId: string,
    episodeId: string | null | undefined,
    commentId: string
  ): CommentBusEvent {
    const channel = formatCommentChannel(titleId, episodeId);
    const event: CommentBusEvent = {
      id: this.nextEventId(),
      channel,
      type: 'comment.deleted',
      data: { id: commentId },
      timestamp: Date.now(),
    };

    this.appendHistory(channel, event);
    this.emitter.emit(channel, event);
    return event;
  }

  subscribe(
    titleId: string,
    episodeId: string | null | undefined,
    listener: (event: CommentBusEvent) => void
  ): () => void {
    const channel = formatCommentChannel(titleId, episodeId);
    this.emitter.on(channel, listener);
    return () => {
      this.emitter.off(channel, listener);
    };
  }

  getMissedEvents(
    titleId: string,
    episodeId: string | null | undefined,
    lastEventId: string
  ): CommentBusEvent[] {
    const channel = formatCommentChannel(titleId, episodeId);
    const list = this.history.get(channel);
    if (!list || list.length === 0 || !lastEventId) return [];

    const index = list.findIndex((e) => e.id === lastEventId);
    if (index === -1) {
      // If lastEventId is too old or unknown, return the recent buffer
      return [...list];
    }
    return list.slice(index + 1);
  }
}

export const commentBus: ICommentBus = new InMemoryCommentBus();
