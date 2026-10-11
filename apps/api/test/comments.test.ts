import { describe, it, expect, vi } from 'vitest';
import { commentBus, formatCommentChannel } from '../src/services/commentBus.js';
import {
  CreateCommentSchema,
  ReportCommentSchema,
  CommentStatusEnum,
} from '@rasigan/shared';

describe('Realtime CommentBus & Channels', () => {
  it('correctly formats channels for titles and episodes', () => {
    expect(formatCommentChannel('title-123')).toBe('title:title-123');
    expect(formatCommentChannel('title-123', null)).toBe('title:title-123');
    expect(formatCommentChannel('title-123', '')).toBe('title:title-123');
    expect(formatCommentChannel('title-123', 'ep-456')).toBe('title:title-123:ep:ep-456');
  });

  it('delivers comment.created events to active subscribers', () => {
    const received: any[] = [];
    const unsubscribe = commentBus.subscribe('title-test', null, (evt) => {
      received.push(evt);
    });

    const createdEvt = commentBus.emitCreated('title-test', null, {
      id: 'cmt-1',
      body: 'Incredible cinematography!',
      userId: 'usr-1',
    });

    expect(received.length).toBe(1);
    expect(received[0].id).toBe(createdEvt.id);
    expect(received[0].type).toBe('comment.created');
    expect(received[0].data.body).toBe('Incredible cinematography!');

    unsubscribe();

    // After unsubscribe, no new events should be received
    commentBus.emitCreated('title-test', null, { id: 'cmt-2', body: 'Second' });
    expect(received.length).toBe(1);
  });

  it('delivers comment.deleted events to active subscribers', () => {
    const received: any[] = [];
    const unsubscribe = commentBus.subscribe('title-series', 'ep-1', (evt) => {
      received.push(evt);
    });

    const deletedEvt = commentBus.emitDeleted('title-series', 'ep-1', 'cmt-to-delete');

    expect(received.length).toBe(1);
    expect(received[0].id).toBe(deletedEvt.id);
    expect(received[0].type).toBe('comment.deleted');
    expect(received[0].data.id).toBe('cmt-to-delete');

    unsubscribe();
  });

  it('replays missed events for Last-Event-ID reconnection', () => {
    const e1 = commentBus.emitCreated('replay-chan', null, { id: 'c1' });
    const e2 = commentBus.emitCreated('replay-chan', null, { id: 'c2' });
    const e3 = commentBus.emitCreated('replay-chan', null, { id: 'c3' });

    const missed = commentBus.getMissedEvents('replay-chan', null, e1.id);
    expect(missed.length).toBe(2);
    expect(missed[0].id).toBe(e2.id);
    expect(missed[1].id).toBe(e3.id);
  });
});

describe('Comments Shared Schemas & Validation', () => {
  it('validates comment body between 1 and 500 characters', () => {
    // Valid
    const valid = CreateCommentSchema.safeParse({
      titleId: 'title-abc',
      body: 'Amazing movie!',
    });
    expect(valid.success).toBe(true);

    // Empty body after trimming
    const empty = CreateCommentSchema.safeParse({
      titleId: 'title-abc',
      body: '   ',
    });
    expect(empty.success).toBe(false);

    // Missing titleId
    const missingTitle = CreateCommentSchema.safeParse({
      titleId: '',
      body: 'Good film',
    });
    expect(missingTitle.success).toBe(false);

    // Over 500 characters
    const over500 = CreateCommentSchema.safeParse({
      titleId: 'title-abc',
      body: 'a'.repeat(501),
    });
    expect(over500.success).toBe(false);
  });

  it('validates report reason up to 200 characters', () => {
    const valid = ReportCommentSchema.safeParse({ reason: 'Spam or advertisement' });
    expect(valid.success).toBe(true);

    const over200 = ReportCommentSchema.safeParse({ reason: 'x'.repeat(201) });
    expect(over200.success).toBe(false);
  });

  it('validates comment status enum values', () => {
    expect(CommentStatusEnum.options).toEqual(['VISIBLE', 'HIDDEN', 'DELETED']);
    expect(CommentStatusEnum.safeParse('VISIBLE').success).toBe(true);
    expect(CommentStatusEnum.safeParse('HIDDEN').success).toBe(true);
    expect(CommentStatusEnum.safeParse('DELETED').success).toBe(true);
    expect(CommentStatusEnum.safeParse('ARCHIVED').success).toBe(false);
  });
});
