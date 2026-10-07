import { z } from 'zod';

// ==========================================
// Enums
// ==========================================
export const KindEnum = z.enum(['MOVIE', 'SHORT_FILM', 'WEB_SERIES']);
export type Kind = z.infer<typeof KindEnum>;

export const OrientationEnum = z.enum(['LANDSCAPE', 'VERTICAL']);
export type Orientation = z.infer<typeof OrientationEnum>;

export const StatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export type Status = z.infer<typeof StatusEnum>;

export const StreamTypeEnum = z.enum(['HLS', 'MP4', 'DASH']);
export type StreamType = z.infer<typeof StreamTypeEnum>;

export const PayStatusEnum = z.enum(['CREATED', 'PAID', 'FAILED', 'REFUNDED']);
export type PayStatus = z.infer<typeof PayStatusEnum>;

export const RoleEnum = z.enum(['USER', 'ADMIN']);
export type Role = z.infer<typeof RoleEnum>;

// ==========================================
// Json Sub-Structures
// ==========================================
export const SubtitleTrackSchema = z.object({
  label: z.string(),
  lang: z.string(),
  url: z.string().url(),
});
export type SubtitleTrack = z.infer<typeof SubtitleTrackSchema>;

export const AudioTrackSchema = z.object({
  label: z.string(),
  lang: z.string(),
  url: z.string().url().optional(),
});
export type AudioTrack = z.infer<typeof AudioTrackSchema>;

export const CrewCreditSchema = z.object({
  role: z.string(),
  name: z.string(),
});
export type CrewCredit = z.infer<typeof CrewCreditSchema>;

// ==========================================
// Category
// ==========================================
export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type Category = z.infer<typeof CategorySchema>;

// ==========================================
// Episode
// ==========================================
export const EpisodeSchema = z.object({
  id: z.string(),
  seasonId: z.string(),
  number: z.number().int(),
  name: z.string(),
  description: z.string().nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  durationMin: z.number().int().nullable().optional(),
  videoUrl: z.string().url(),
  streamType: StreamTypeEnum,
  subtitles: z.array(SubtitleTrackSchema).default([]),
  audioTracks: z.array(AudioTrackSchema).default([]),
  introStartSec: z.number().int().nullable().optional(),
  introEndSec: z.number().int().nullable().optional(),
  creditsStartSec: z.number().int().nullable().optional(),
  status: StatusEnum.default('PUBLISHED'),
  publishedAt: z.string().datetime().nullable().optional(),
});
export type Episode = z.infer<typeof EpisodeSchema>;

// ==========================================
// Season
// ==========================================
export const SeasonSchema = z.object({
  id: z.string(),
  titleId: z.string(),
  number: z.number().int(),
  name: z.string().nullable().optional(),
  episodes: z.array(EpisodeSchema).optional(),
});
export type Season = z.infer<typeof SeasonSchema>;

// ==========================================
// Title
// ==========================================
export const TitleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  kind: KindEnum,
  orientation: OrientationEnum,
  status: StatusEnum.default('DRAFT'),

  title: z.string(),
  tagline: z.string().nullable().optional(),
  description: z.string(),
  language: z.string().default('Tamil'),
  year: z.number().int().nullable().optional(),
  ageRating: z.string().nullable().optional(),
  durationMin: z.number().int().nullable().optional(),
  editorRating: z.number().nullable().optional(),

  posterUrl: z.string().url(),
  bannerUrl: z.string().url().nullable().optional(),
  trailerUrl: z.string().url().nullable().optional(),

  videoUrl: z.string().url().nullable().optional(),
  streamType: StreamTypeEnum.nullable().optional(),
  subtitles: z.array(SubtitleTrackSchema).default([]),
  audioTracks: z.array(AudioTrackSchema).default([]),

  castNames: z.array(z.string()).default([]),
  crewCredits: z.array(CrewCreditSchema).default([]),
  creatorName: z.string().nullable().optional(),

  isFeatured: z.boolean().default(false),
  fundingEnabled: z.boolean().default(true),
  fundingGoal: z.number().int().nullable().optional(),
  fundingRaised: z.number().int().nullable().optional(),

  publishedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),

  categories: z.array(CategorySchema).optional(),
  seasons: z.array(SeasonSchema).optional(),
});
export type Title = z.infer<typeof TitleSchema>;

// ==========================================
// User
// ==========================================
export const UserSchema = z.object({
  id: z.string(),
  googleId: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().url().nullable().optional(),
  role: RoleEnum.default('USER'),
  createdAt: z.string().datetime().optional(),
});
export type User = z.infer<typeof UserSchema>;

// ==========================================
// API DTOs & Responses
// ==========================================
export interface CategoryWithTitles extends Category {
  titles: Title[];
}

export interface HomeResponse {
  featured: Title[];
  categories: CategoryWithTitles[];
  trending: Title[];
  newReleases: Title[];
  topRated: Title[];
  mostSupported: Title[];
  continueWatching?: Title[];
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
