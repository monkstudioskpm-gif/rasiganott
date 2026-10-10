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

export const CrewRoleEnum = z.enum([
  'DIRECTOR',
  'PRODUCER',
  'WRITER',
  'CINEMATOGRAPHER',
  'EDITOR',
  'MUSIC_DIRECTOR',
  'LYRICIST',
  'CHOREOGRAPHER',
  'OTHER',
]);
export type CrewRole = z.infer<typeof CrewRoleEnum>;

// Deprecated CrewCreditSchema kept for safety if needed
export const CrewCreditSchema = z.object({
  role: z.string(),
  name: z.string(),
});
export type CrewCredit = z.infer<typeof CrewCreditSchema>;

// ==========================================
// Person (Cast & Crew Member)
// ==========================================
export const PersonSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameKey: z.string(),
  photoUrl: z.string().url().nullable().optional(),
  bio: z.string().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  titlesCount: z.number().int().optional(),
  rolesUsed: z.array(z.string()).optional(),
  appearsIn: z.array(z.object({
    titleId: z.string(),
    title: z.string(),
    role: z.string(),
  })).optional(),
});
export type Person = z.infer<typeof PersonSchema>;

export const TitleCastSchema = z.object({
  titleId: z.string(),
  personId: z.string(),
  order: z.number().int().default(0),
  characterName: z.string().nullable().optional(),
  person: PersonSchema.optional(),
});
export type TitleCast = z.infer<typeof TitleCastSchema>;

export const TitleCrewSchema = z.object({
  id: z.string().optional(),
  titleId: z.string(),
  personId: z.string(),
  role: CrewRoleEnum,
  customRole: z.string().nullable().optional(),
  person: PersonSchema.optional(),
});
export type TitleCrew = z.infer<typeof TitleCrewSchema>;

// ==========================================
// Genre (replaces old Category)
// ==========================================
export const GenreSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});
export type Genre = z.infer<typeof GenreSchema>;

// Alias for Category for backward compatibility
export const CategorySchema = GenreSchema;
export type Category = Genre;

// ==========================================
// Tag
// ==========================================
export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type Tag = z.infer<typeof TagSchema>;

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
  verticalPosterUrl: z.string().url().nullable().optional(),
  trailerUrl: z.string().url().nullable().optional(),

  videoUrl: z.string().url().nullable().optional(),
  streamType: StreamTypeEnum.nullable().optional(),
  subtitles: z.array(SubtitleTrackSchema).default([]),
  audioTracks: z.array(AudioTrackSchema).default([]),

  creatorId: z.string().nullable().optional(),
  creatorName: z.string().nullable().optional(),

  isFeatured: z.boolean().default(false),
  sortRank: z.number().int().optional(),
  fundingEnabled: z.boolean().default(true),
  fundingGoal: z.number().int().nullable().optional(),
  fundingRaised: z.number().int().nullable().optional(),

  publishedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),

  genres: z.array(GenreSchema).optional(),
  tags: z.array(TagSchema).optional(),
  cast: z.array(TitleCastSchema).optional(),
  crew: z.array(TitleCrewSchema).optional(),
  categories: z.array(GenreSchema).optional(), // legacy alias
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
// Creator DTOs (B1. Creator Earnings Visibility)
// STRICT: DO NOT INCLUE creatorShareBps, grossPaise, platformSharePaise, etc.
// ==========================================
export interface CreatorTitleEarningsDto {
  titleId: string;
  title: string;
  posterUrl: string;
  viewsCount: number;
  watchTimeMinutes: number;
  supportersCount: number;
  earningsInr: number;
}

export interface CreatorEarningsSummaryDto {
  earningsInr: number;
  pendingPayoutInr: number;
  paidSoFarInr: number;
  titles: CreatorTitleEarningsDto[];
}

export interface CreatorPayoutStatementDto {
  id: string;
  cycle: string;
  period: string;
  earningsInr: number;
  adjustmentsInr: number;
  netPayableInr: number;
  status: string;
  referenceUtr?: string;
  titles: {
    titleId: string;
    title: string;
    earningsInr: number;
  }[];
}

// ==========================================
// API DTOs & Responses
// ==========================================
export interface GenreWithTitles extends Genre {
  titles: Title[];
}

export interface HomeResponse {
  featured: Title[];
  genres: GenreWithTitles[];
  categories?: GenreWithTitles[]; // legacy fallback key
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

// ==========================================
// Funding & Razorpay DTOs
// ==========================================
export const FundingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  titleId: z.string(),
  amountInr: z.number().int(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string().nullable().optional(),
  status: PayStatusEnum.default('CREATED'),
  message: z.string().nullable().optional(),
  isAnonymous: z.boolean().default(false),
  createdAt: z.string().datetime().optional(),
  paidAt: z.string().datetime().nullable().optional(),
});
export type Funding = z.infer<typeof FundingSchema>;

export interface CreateFundingOrderDto {
  titleId: string;
  amountInr: number;
  message?: string;
  isAnonymous?: boolean;
}

export interface CreateFundingOrderResponseDto {
  orderId: string;
  keyId: string;
  amount: number;
  currency: string;
  titleName: string;
}

export interface VerifyFundingPaymentDto {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  titleId?: string;
}

export interface VerifyFundingPaymentResponseDto {
  success: boolean;
  paymentId: string;
  orderId: string;
  fundingId?: string;
  amountInr?: number;
  paidAt?: string;
}

