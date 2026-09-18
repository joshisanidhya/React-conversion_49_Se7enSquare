import { AppRole } from '../../modules/rbac/role.enum';
import * as fs from 'fs';
import * as path from 'path';

const DB_FILE = path.join(process.cwd(), 'db.json');


export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'escalated';

export interface UserRecord {
  id: number;
  username: string;
  email: string;
  role: AppRole;
  bio?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string | null;
}

export interface CommunityRecord {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  tags: string[];
  channels?: Array<string | { id?: string; name: string; type?: string }>;   // user-created channels from the wizard/settings
  // enriched fields for frontend display
  icon?: string;
  category?: string;
  slug?: string;
  memberCount?: number;
  onlineCount?: number;
  banner?: string;
  bannerImage?: string;
  visibility?: 'public' | 'private';
  rules?: string[]; // owner-editable via community-settings.html; falls back to generic defaults in the UI when empty
}

export interface MembershipRecord {
  id: number;
  userId: number;
  communityId: number;
  joinedAt: string;
}

export interface EventRecord {
  id: number;
  title: string;
  description: string;
  communityId: number;
  date: string;
  // enriched fields for frontend display
  time?: string;
  type?: string;
  attendees?: number;
  maxAttendees?: number;
  status?: string;
  createdBy?: string;
  organiserId?: number; // links to UserRecord.id — used for organizer-plan limit checks (createdBy is just a display string)
  entryFee?: number; // ₹ per player, doc §16 revenue sharing — 0/undefined means a free event
  prizePool?: number; // ₹ displayed to players; not auto-derived from entryFee, organiser sets it directly
}

export interface PostRecord {
  id: number;
  title: string;
  content: string;
  communityId: number;
  authorId: number;
  upvotes?: number;
  commentCount?: number;
  createdAt?: string;
}

export interface ReportRecord {
  id: number;
  reporterId: number;
  targetType: 'post' | 'user' | 'community';
  targetId: number;
  reason: string;
  status: ReportStatus;
  escalatedTo?: string;
}

export interface EventRegistrationRecord {
  id: number;
  eventId: number;
  userId: number;
  registeredAt: string;
  // Registration-time contact details, collected via the register form (see
  // events.js's registration modal) rather than pulled implicitly from the
  // user's profile — a tournament registrant's in-game identity/contact info
  // can differ from their platform account.
  fullName?: string;
  contactEmail?: string;
  phone?: string;
  inGameId?: string;
}

export interface AppealRecord {
  id: number;
  userId?: number;
  actionId: string;
  text: string;
  acknowledgement: string;
  resolution: string;
  evidence: string[];
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ChatMessageRecord {
  id: number;
  channelId: string;
  communityId?: number;
  authorId?: number;
  authorName: string;
  content: string;
  attachments: string[];
  reactions: Record<string, number>;
  pinned: boolean;
  createdAt: string;
}

export interface AuditLogRecord {
  id: number;
  action: string;
  actor: string;
  target?: string;
  reason?: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: number;
  userId: number; // recipient
  type: 'reaction' | 'report_status' | 'system';
  text: string;
  channelId?: string;
  targetId?: number;
  read: boolean;
  createdAt: string;
}

export interface PlatformConfigRecord {
  registrationEnabled: boolean;
  eventApprovalRequired: boolean;
  reportEscalationEnabled: boolean;
  maxEventCapacity: number;
  autoModEnabled: boolean;
  maxChannelsPerCommunity: number;
  maxCommunitiesPerUser: number;
}

export type SubscriptionPlan = 'free' | 'plus' | 'ultra_pro';

export interface SubscriptionRecord {
  id: number;
  userId: number;
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled';
  startedAt: string;
}

export type OrganiserStatus = 'pending' | 'verified' | 'rejected';
export type OrganiserPlan = 'free' | 'premium';

export interface OrganiserRecord {
  id: number;
  userId: number;
  status: OrganiserStatus;
  plan: OrganiserPlan;
  experienceNote?: string;
  appliedAt: string;
  verifiedAt?: string;
}

export interface FeaturedEventRecord {
  id: number;
  eventId: number;
  userId: number;
  startAt: string;
  endAt: string;
  status: 'active' | 'expired';
}

export type PaymentType = 'subscription' | 'organiser_subscription' | 'featured_event' | 'tournament_commission';

export interface PaymentRecord {
  id: number;
  userId: number;
  type: PaymentType;
  amount: number;
  description: string;
  createdAt: string;
}

export type ModeratorApplicationStatus = 'pending' | 'certified' | 'rejected';

export interface ModeratorApplicationRecord {
  id: number;
  userId: number;
  status: ModeratorApplicationStatus;
  quizScore: number; // 0–100
  appliedAt: string;
  certifiedAt?: string;
}

export type RatingTargetType = 'organiser' | 'moderator';

export interface RatingRecord {
  id: number;
  targetType: RatingTargetType;
  targetUserId: number;
  raterId: number;
  score: number; // 1–5
  comment?: string;
  createdAt: string;
}

const counters = {
  user: 7,
  community: 3,
  membership: 5,
  event: 4,
  post: 4,
  report: 4,
  eventRegistration: 1,
  appeal: 1,
  message: 4,
  auditLog: 3,
  notification: 1,
  subscription: 1,
  organiser: 2,
  featuredEvent: 1,
  payment: 1,
  moderatorApplication: 1,
  rating: 1,
};

let seedDb = {
  users: [
    { id: 1, username: 'admin01', email: 'admin@gameunity.local', role: AppRole.ADMIN, bio: 'Platform administrator' },
    { id: 2, username: 'mod01', email: 'mod@gameunity.local', role: AppRole.MODERATOR, bio: 'Community moderator' },
    { id: 3, username: 'cm01', email: 'cm@gameunity.local', role: AppRole.COMMUNITY_MANAGER, bio: 'Community event manager' },
    { id: 4, username: 'player01', email: 'player@gameunity.local', role: AppRole.USER, bio: 'Loves FPS and RPG games' },
    { id: 5, username: 'sanidhya', email: 'sanidhya@gameunity.local', role: AppRole.OWNER, firstName: 'Sanidhya', lastName: 'Joshi', bio: 'Platform owner' },
    { id: 6, username: 'org01', email: 'organizer@gameunity.local', role: AppRole.ORGANIZER, bio: 'Certified tournament organizer' },
  ] as UserRecord[],
  communities: [
    {
      id: 1,
      name: 'FPS Arena',
      description: 'Competitive FPS players and tournaments',
      ownerId: 4,
      tags: ['fps', 'esports'],
      icon: '⚡',
      category: 'Gaming',
      slug: 'fps-arena',
      memberCount: 12400,
      onlineCount: 842,
    },
    {
      id: 2,
      name: 'Indie Dev Hub',
      description: 'A space for indie game creators',
      ownerId: 2,
      tags: ['indie', 'dev'],
      icon: '🎮',
      category: 'Gaming',
      slug: 'indie-dev-hub',
      memberCount: 15300,
      onlineCount: 1205,
    },
  ] as CommunityRecord[],
  memberships: [
    { id: 1, userId: 2, communityId: 1, joinedAt: '2026-01-10T09:00:00.000Z' },
    { id: 2, userId: 4, communityId: 1, joinedAt: '2026-01-15T11:30:00.000Z' },
    { id: 3, userId: 3, communityId: 2, joinedAt: '2026-02-01T08:00:00.000Z' },
    { id: 4, userId: 1, communityId: 2, joinedAt: '2026-02-05T10:00:00.000Z' },
  ] as MembershipRecord[],
  events: [
    {
      id: 1,
      title: 'Friday Scrim Night',
      description: 'Weekly custom matches',
      communityId: 1,
      date: '2026-05-09',
      time: '6:00 PM',
      type: 'tournament',
      attendees: 48,
      maxAttendees: 100,
      status: 'approved',
      createdBy: 'admin01',
    },
    {
      id: 2,
      title: 'Pixel Jam',
      description: '48-hour game jam kickoff',
      communityId: 2,
      date: '2026-05-10',
      time: '9:00 AM',
      type: 'hackathon',
      attendees: 120,
      maxAttendees: 200,
      status: 'approved',
      createdBy: 'cm01',
    },
    {
      id: 3,
      title: 'UI Design Workshop',
      description: 'Learn UI design fundamentals for games',
      communityId: 2,
      date: '2026-05-15',
      time: '5:00 PM',
      type: 'workshop',
      attendees: 35,
      maxAttendees: 50,
      status: 'pending',
      createdBy: 'player01',
    },
  ] as EventRecord[],
  posts: [
    {
      id: 1,
      title: 'Looking for squad',
      content: 'Need two players for ranked grind',
      communityId: 1,
      authorId: 4,
      upvotes: 14,
      commentCount: 5,
      createdAt: '2026-04-28T10:00:00.000Z',
    },
    {
      id: 2,
      title: 'Show your prototype',
      content: 'Drop your latest indie demos in comments',
      communityId: 2,
      authorId: 2,
      upvotes: 28,
      commentCount: 12,
      createdAt: '2026-04-29T15:00:00.000Z',
    },
    {
      id: 3,
      title: 'Tournament rules update',
      content: 'Check the pinned post for updated ruleset',
      communityId: 1,
      authorId: 1,
      upvotes: 42,
      commentCount: 8,
      createdAt: '2026-04-30T09:00:00.000Z',
    },
  ] as PostRecord[],
  reports: [
    {
      id: 1,
      reporterId: 4,
      targetType: 'post',
      targetId: 1,
      reason: 'Potential abusive language in replies',
      status: 'pending',
    },
    {
      id: 2,
      reporterId: 2,
      targetType: 'user',
      targetId: 4,
      reason: 'Spam-like behavior',
      status: 'reviewed',
    },
    {
      id: 3,
      reporterId: 1,
      targetType: 'community',
      targetId: 2,
      reason: 'Misleading community description',
      status: 'pending',
    },
  ] as ReportRecord[],
  eventRegistrations: [] as EventRegistrationRecord[],
  appeals: [] as AppealRecord[],
  messages: [
    {
      id: 1,
      channelId: 'general',
      communityId: 1,
      authorId: 1,
      authorName: 'admin01',
      content: 'Welcome to the FPS Arena general channel.',
      attachments: [],
      reactions: { '👍': 2 },
      pinned: true,
      createdAt: '2026-05-01T09:00:00.000Z',
    },
    {
      id: 2,
      channelId: 'general',
      communityId: 1,
      authorId: 4,
      authorName: 'player01',
      content: 'Anyone queueing ranked tonight?',
      attachments: [],
      reactions: {},
      pinned: false,
      createdAt: '2026-05-01T09:05:00.000Z',
    },
    {
      id: 3,
      channelId: 'announcements',
      communityId: 2,
      authorId: 3,
      authorName: 'cm01',
      content: 'Pixel Jam registration opens this week.',
      attachments: [],
      reactions: {},
      pinned: false,
      createdAt: '2026-05-01T10:00:00.000Z',
    },
  ] as ChatMessageRecord[],
  auditLog: [
    { id: 1, action: 'System Boot', actor: 'system', target: 'backend', reason: 'Seed data loaded', createdAt: '2026-05-01T08:00:00.000Z' },
    { id: 2, action: 'Community Created', actor: 'admin01', target: 'FPS Arena', reason: 'Seed community', createdAt: '2026-05-01T08:10:00.000Z' },
  ] as AuditLogRecord[],
  notifications: [] as NotificationRecord[],
  subscriptions: [] as SubscriptionRecord[],
  organisers: [
    { id: 1, userId: 6, status: 'verified', plan: 'free', appliedAt: '2026-04-01T09:00:00.000Z', verifiedAt: '2026-04-02T09:00:00.000Z' },
  ] as OrganiserRecord[],
  featuredEvents: [] as FeaturedEventRecord[],
  payments: [] as PaymentRecord[],
  moderatorApplications: [] as ModeratorApplicationRecord[],
  ratings: [] as RatingRecord[],
  platformConfig: {
    registrationEnabled: true,
    eventApprovalRequired: true,
    reportEscalationEnabled: true,
    maxEventCapacity: 500,
    autoModEnabled: true,
    maxChannelsPerCommunity: 50,
    maxCommunitiesPerUser: 10,
  } as PlatformConfigRecord,
};

export let db = seedDb;

// Load from file if exists
if (fs.existsSync(DB_FILE)) {
  try {
    const rawData = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(rawData);
    // Merge counters
    if (parsed.counters) {
      Object.assign(counters, parsed.counters);
    }
    db = parsed.db;
  } catch (err) {
    console.error('Failed to load db.json, falling back to seed data:', err);
  }
}

export function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify({ counters, db }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save db.json:', err);
  }
}

export function nextId(entity: keyof typeof counters): number {
  const value = counters[entity];
  counters[entity] += 1;
  saveDb();
  return value;
}

