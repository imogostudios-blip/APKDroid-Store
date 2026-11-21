export type FriendshipRelation = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  currentStatus?: string;
  needsOnboarding?: boolean;
  avatarColor: string;
  avatarUrl?: string | null;
  chatWallpaper?: string;
  online: boolean;
  lastSeen: number;
  friendshipStatus?: FriendshipRelation;
}

export type MessageType = 'text' | 'voice' | 'file' | 'call';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type CallStatus = 'completed' | 'missed' | 'rejected' | 'busy';

export interface FileAttachment {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ReplyPreview {
  id: string;
  senderId: string;
  type: MessageType;
  content: string;
  fileOriginalName?: string | null;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  file?: FileAttachment | null;
  durationSec?: number | null;
  callStatus?: CallStatus | null;
  replyTo?: ReplyPreview | null;
  reactions?: MessageReaction[];
  status: MessageStatus;
  createdAt: number;
}

export interface ConversationSummary {
  id: string;
  peer: PublicUser;
  lastMessage: ChatMessage | null;
  pinnedMessage?: ChatMessage | null;
  unreadCount: number;
  updatedAt: number;
}

export interface ExtraLink {
  label: string;
  url: string;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatarColor: string;
  senderAvatarUrl?: string | null;
  type: 'text' | 'voice' | 'file';
  content: string;
  file?: FileAttachment | null;
  durationSec?: number | null;
  createdAt: number;
}

export interface GroupSummary {
  id: string;
  name: string;
  description: string;
  promoText: string;
  extraLinks: ExtraLink[];
  avatarUrl?: string | null;
  inviteCode: string;
  ownerId: string;
  isOwner: boolean;
  memberCount: number;
  members: PublicUser[];
  lastMessage: GroupMessage | null;
  createdAt: number;
  updatedAt: number;
}

export interface UsernameCheckResult {
  available: boolean;
  valid: boolean;
  username: string;
  reason?: string;
  suggestions: string[];
}

export interface ChannelSummary {
  id: string;
  handle: string;
  name: string;
  description: string;
  avatarUrl?: string | null;
  ownerId: string;
  ownerName: string;
  memberCount: number;
  isMember: boolean;
  isOwner: boolean;
  lastPostContent: string | null;
  lastPostAt: number | null;
  createdAt: number;
}

export interface ChannelPost {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: number;
}

export type RsvpStatus = 'going' | 'interested' | 'none';
export type EventType = 'post' | 'video';

export interface AppEvent {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatarColor: string;
  creatorAvatarUrl?: string | null;
  eventType: EventType;
  title: string;
  description: string;
  eventTime: string;
  location: string;
  mediaUrls: string[];
  links: ExtraLink[];
  goingCount: number;
  interestedCount: number;
  myRsvp: RsvpStatus;
  createdAt: number;
}
