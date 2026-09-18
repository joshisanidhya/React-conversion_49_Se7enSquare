export enum AppRole {
  ADMIN = 'admin',
  OWNER = 'owner', // platform owner — read-only access to statistics/health only
  COMMUNITY_MANAGER = 'community_manager',
  ORGANIZER = 'organizer', // certified organizer — creates/manages tournaments (events)
  MODERATOR = 'moderator',
  USER = 'user',
  GAMER = 'gamer', // alias accepted from frontend sessions
}

export const ALL_ROLES: string[] = [
  'admin',
  'owner',
  'community_manager',
  'organizer',
  'moderator',
  'user',
  'gamer',
];
