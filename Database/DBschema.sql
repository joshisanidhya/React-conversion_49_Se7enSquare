-- =============================================================================
--  Se7enSquare / Gameunity - Final Minimal Backend Schema
--  Based on current frontend workflows + old Database/DBschema.sql
-- =============================================================================
--  Kept workflows:
--   - auth/users/profile/admin user management
--   - communities/discovery/community settings
--   - community memberships/join-leave
--   - channels/chat/messages
--   - events/event approval/event registrations
--   - reports/moderation actions/appeals/notifications
--
--  Removed from old schema because current frontend does not use it:
--   - Roles table         : frontend uses role enum directly on Users
--   - UserSessions        : no server session/token storage workflow
--   - XPTransactions      : no XP UI or API usage in current build
--   - EventFeedback       : no post-event feedback workflow implemented
--   - AutoModerationRules : platform config is UI-only, no rule builder built
--   - ModerationLogs      : mod panel uses Reports + status flow instead
-- =============================================================================

DROP DATABASE IF EXISTS gaming_platform;
CREATE DATABASE gaming_platform;
USE gaming_platform;


-- =============================================================================
-- TABLE 1: Users
-- =============================================================================
CREATE TABLE Users (
    user_id       INT           NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)   NOT NULL,
    email         VARCHAR(120)  NOT NULL,
    password_hash VARCHAR(255)  NULL,
    first_name    VARCHAR(80)   NULL,
    last_name     VARCHAR(80)   NULL,
    full_name     VARCHAR(160)  NULL,
    handle        VARCHAR(50)   NULL,
    bio           VARCHAR(500)  NULL,
    phone         VARCHAR(30)   NULL,
    avatar_url    TEXT          NULL,
    role          ENUM('user','gamer','audience','moderator','manager',
                       'community_manager','admin')
                                NOT NULL DEFAULT 'user',
    status        ENUM('active','muted','banned','suspended')
                                NOT NULL DEFAULT 'active',
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NULL     ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_users          PRIMARY KEY (user_id),
    CONSTRAINT uq_users_username UNIQUE      (username),
    CONSTRAINT uq_users_email    UNIQUE      (email)
);


-- =============================================================================
-- TABLE 2: Communities
-- =============================================================================
CREATE TABLE Communities (
    community_id INT          NOT NULL AUTO_INCREMENT,
    name         VARCHAR(100) NOT NULL,
    slug         VARCHAR(120) NULL,
    description  TEXT         NOT NULL,
    category     VARCHAR(80)  NULL,
    icon         VARCHAR(50)  NULL,
    banner_url   TEXT         NULL,
    tags         JSON         NULL,
    privacy      ENUM('public','private')   NOT NULL DEFAULT 'public',
    status       ENUM('active','archived')  NOT NULL DEFAULT 'active',
    member_count INT          NOT NULL DEFAULT 0,
    online_count INT          NOT NULL DEFAULT 0,
    owner_id     INT          NOT NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NULL     ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_communities      PRIMARY KEY (community_id),
    CONSTRAINT uq_communities_slug UNIQUE      (slug),
    CONSTRAINT fk_communities_owner FOREIGN KEY (owner_id)
        REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);


-- =============================================================================
-- TABLE 3: CommunityMembers
-- =============================================================================
CREATE TABLE CommunityMembers (
    membership_id INT      NOT NULL AUTO_INCREMENT,
    user_id       INT      NOT NULL,
    community_id  INT      NOT NULL,
    role          ENUM('Owner','Manager','Moderator','Member') NOT NULL DEFAULT 'Member',
    status        ENUM('active','pending','banned')            NOT NULL DEFAULT 'active',
    joined_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_community_members  PRIMARY KEY (membership_id),
    CONSTRAINT uq_community_member   UNIQUE      (user_id, community_id),
    CONSTRAINT fk_members_user       FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_members_community  FOREIGN KEY (community_id)
        REFERENCES Communities(community_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);


-- =============================================================================
-- TABLE 4: Channels
-- =============================================================================
CREATE TABLE Channels (
    channel_id   INT          NOT NULL AUTO_INCREMENT,
    community_id INT          NOT NULL,
    name         VARCHAR(100) NOT NULL,
    type         ENUM('Text','Voice','Announcement') NOT NULL DEFAULT 'Text',
    description  VARCHAR(255) NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_channels                PRIMARY KEY (channel_id),
    CONSTRAINT uq_channel_per_community   UNIQUE      (community_id, name),
    CONSTRAINT fk_channels_community      FOREIGN KEY (community_id)
        REFERENCES Communities(community_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);


-- =============================================================================
-- TABLE 5: Messages
-- =============================================================================
CREATE TABLE Messages (
    message_id      INT          NOT NULL AUTO_INCREMENT,
    channel_id      INT          NOT NULL,
    user_id         INT          NOT NULL,
    content         TEXT         NOT NULL,
    reply_to_id     INT          NULL,
    attachment_name VARCHAR(255) NULL,
    attachment_type VARCHAR(100) NULL,
    attachment_url  TEXT         NULL,
    is_pinned       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      DATETIME     NULL,

    CONSTRAINT pk_messages          PRIMARY KEY (message_id),
    CONSTRAINT fk_messages_channel  FOREIGN KEY (channel_id)
        REFERENCES Channels(channel_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_messages_user     FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_messages_reply    FOREIGN KEY (reply_to_id)
        REFERENCES Messages(message_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);


-- =============================================================================
-- TABLE 6: MessageReactions
-- =============================================================================
CREATE TABLE MessageReactions (
    reaction_id INT          NOT NULL AUTO_INCREMENT,
    message_id  INT          NOT NULL,
    user_id     INT          NOT NULL,
    emoji       VARCHAR(20)  NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_message_reactions PRIMARY KEY (reaction_id),
    CONSTRAINT uq_message_reaction  UNIQUE      (message_id, user_id, emoji),
    CONSTRAINT fk_reactions_message FOREIGN KEY (message_id)
        REFERENCES Messages(message_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_reactions_user    FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);


-- =============================================================================
-- TABLE 7: Events
-- =============================================================================
CREATE TABLE Events (
    event_id      INT          NOT NULL AUTO_INCREMENT,
    community_id  INT          NOT NULL,
    title         VARCHAR(120) NOT NULL,
    description   TEXT         NOT NULL,
    event_date    DATE         NOT NULL,
    event_time    VARCHAR(20)  NOT NULL,
    type          ENUM('Online','In-Person','Hybrid') NOT NULL DEFAULT 'Online',
    category      VARCHAR(80)  NOT NULL,
    attendees     INT          NOT NULL DEFAULT 0,
    max_attendees INT          NOT NULL,
    status        ENUM('draft','pending','approved','rejected') NOT NULL DEFAULT 'pending',
    cover_image   TEXT         NULL,
    created_by    INT          NULL,
    reviewed_at   DATETIME     NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NULL     ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_events          PRIMARY KEY (event_id),
    CONSTRAINT ck_events_capacity CHECK       (max_attendees > 0),
    CONSTRAINT ck_events_attendees CHECK      (attendees >= 0),
    CONSTRAINT fk_events_community FOREIGN KEY (community_id)
        REFERENCES Communities(community_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_events_creator   FOREIGN KEY (created_by)
        REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);


-- =============================================================================
-- TABLE 8: EventRegistrations
-- =============================================================================
CREATE TABLE EventRegistrations (
    registration_id INT      NOT NULL AUTO_INCREMENT,
    event_id        INT      NOT NULL,
    user_id         INT      NOT NULL,
    status          ENUM('registered','cancelled') NOT NULL DEFAULT 'registered',
    registered_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_event_registrations PRIMARY KEY (registration_id),
    CONSTRAINT uq_event_registration  UNIQUE      (event_id, user_id),
    CONSTRAINT fk_registrations_event FOREIGN KEY (event_id)
        REFERENCES Events(event_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_registrations_user  FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);


-- =============================================================================
-- TABLE 9: Reports
-- =============================================================================
CREATE TABLE Reports (
    report_id    INT          NOT NULL AUTO_INCREMENT,
    reporter_id  INT          NOT NULL,
    target_type  ENUM('post','user','community') NOT NULL,
    target_id    INT          NOT NULL,
    reason       VARCHAR(200) NOT NULL,
    status       ENUM('pending','reviewed','escalated','resolved')
                              NOT NULL DEFAULT 'pending',
    escalated_to VARCHAR(50)  NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NULL     ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_reports          PRIMARY KEY (report_id),
    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id)
        REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);


-- =============================================================================
-- TABLE 10: ModerationActions
-- =============================================================================
CREATE TABLE ModerationActions (
    action_id      INT      NOT NULL AUTO_INCREMENT,
    report_id      INT      NOT NULL,
    moderator_id   INT      NOT NULL,
    target_user_id INT      NULL,
    community_id   INT      NULL,
    action_type    ENUM('warn','mute','ban7','banperm','dismiss','escalate','resolve')
                            NOT NULL,
    notes          TEXT     NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_moderation_actions   PRIMARY KEY (action_id),
    CONSTRAINT fk_actions_report       FOREIGN KEY (report_id)
        REFERENCES Reports(report_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_actions_moderator    FOREIGN KEY (moderator_id)
        REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_actions_target_user  FOREIGN KEY (target_user_id)
        REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_actions_community    FOREIGN KEY (community_id)
        REFERENCES Communities(community_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);


-- =============================================================================
-- TABLE 11: Appeals
-- =============================================================================
CREATE TABLE Appeals (
    appeal_id       INT          NOT NULL AUTO_INCREMENT,
    user_id         INT          NOT NULL,
    action_id       INT          NULL,
    action_ref      VARCHAR(80)  NULL,
    appeal_text     TEXT         NOT NULL,
    acknowledgement VARCHAR(80)  NOT NULL,
    resolution      VARCHAR(120) NOT NULL,
    status          ENUM('pending','resolved') NOT NULL DEFAULT 'pending',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at     DATETIME     NULL,

    CONSTRAINT pk_appeals       PRIMARY KEY (appeal_id),
    CONSTRAINT fk_appeals_user  FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_appeals_action FOREIGN KEY (action_id)
        REFERENCES ModerationActions(action_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);


-- =============================================================================
-- TABLE 12: Notifications
-- =============================================================================
CREATE TABLE Notifications (
    notification_id INT         NOT NULL AUTO_INCREMENT,
    user_id         INT         NOT NULL,
    type            VARCHAR(50) NOT NULL,
    message         TEXT        NOT NULL,
    reference_id    INT         NULL,
    reference_type  VARCHAR(50) NULL,
    is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_notifications      PRIMARY KEY (notification_id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);


-- =============================================================================
-- SEED DATA — mirrors in-memory-db.ts initial state
-- =============================================================================

-- ─── Users ───────────────────────────────────────────────────────────────────
INSERT INTO Users (user_id, username, email, role, bio, status) VALUES
(1, 'admin01',  'admin@gameunity.local',  'admin',            'Platform administrator',    'active'),
(2, 'mod01',    'mod@gameunity.local',    'moderator',        'Community moderator',       'active'),
(3, 'cm01',     'cm@gameunity.local',     'community_manager','Community event manager',   'active'),
(4, 'player01', 'player@gameunity.local', 'user',             'Loves FPS and RPG games',  'active');

-- ─── Communities ─────────────────────────────────────────────────────────────
INSERT INTO Communities
    (community_id, name, slug, description, category, icon, tags, privacy, status, member_count, online_count, owner_id)
VALUES
(1, 'FPS Arena',
    'fps-arena',
    'Competitive FPS players and tournaments',
    'Gaming', '⚡', '["fps","esports"]',
    'public', 'active', 12400, 842, 4),

(2, 'Indie Dev Hub',
    'indie-dev-hub',
    'A space for indie game creators',
    'Gaming', '🎮', '["indie","dev"]',
    'public', 'active', 15300, 1205, 2);

-- ─── Channels ────────────────────────────────────────────────────────────────
INSERT INTO Channels (channel_id, community_id, name, type, description) VALUES
(1, 1, 'general',      'Text',         'General discussion for FPS Arena'),
(2, 1, 'announcements','Announcement', 'Official FPS Arena announcements'),
(3, 2, 'general',      'Text',         'General discussion for Indie Dev Hub'),
(4, 2, 'showcase',     'Text',         'Share your indie game projects');

-- ─── CommunityMembers ────────────────────────────────────────────────────────
INSERT INTO CommunityMembers (membership_id, user_id, community_id, role, status, joined_at) VALUES
(1, 2, 1, 'Moderator', 'active', '2026-01-10 09:00:00'),
(2, 4, 1, 'Member',    'active', '2026-01-15 11:30:00'),
(3, 3, 2, 'Manager',   'active', '2026-02-01 08:00:00'),
(4, 1, 2, 'Owner',     'active', '2026-02-05 10:00:00');

-- ─── Events ──────────────────────────────────────────────────────────────────
INSERT INTO Events
    (event_id, community_id, title, description, event_date, event_time,
     type, category, attendees, max_attendees, status, created_by)
VALUES
(1, 1, 'Friday Scrim Night',
    'Weekly custom matches',
    '2026-05-09', '6:00 PM',
    'Online', 'tournament', 48, 100, 'approved', 1),

(2, 2, 'Pixel Jam',
    '48-hour game jam kickoff',
    '2026-05-10', '9:00 AM',
    'Online', 'hackathon', 120, 200, 'approved', 3),

(3, 2, 'UI Design Workshop',
    'Learn UI design fundamentals for games',
    '2026-05-15', '5:00 PM',
    'Online', 'workshop', 35, 50, 'pending', 4);

-- ─── Reports ─────────────────────────────────────────────────────────────────
INSERT INTO Reports
    (report_id, reporter_id, target_type, target_id, reason, status)
VALUES
(1, 4, 'post',      1, 'Potential abusive language in replies',  'pending'),
(2, 2, 'user',      4, 'Spam-like behavior',                     'reviewed'),
(3, 1, 'community', 2, 'Misleading community description',       'pending');

-- ─── Notifications ───────────────────────────────────────────────────────────
INSERT INTO Notifications
    (notification_id, user_id, type, message, reference_id, reference_type, is_read)
VALUES
(1, 4, 'report_submitted',
    'Your report has been submitted and is under review.',
    1, 'report', FALSE),

(2, 4, 'join_approved',
    'Your membership to FPS Arena has been confirmed.',
    1, 'community', FALSE),

(3, 1, 'event_approved',
    'Friday Scrim Night has been approved and is scheduled for May 9.',
    1, 'event', FALSE);


-- =============================================================================
-- END OF DBschema_final.sql
-- =============================================================================
