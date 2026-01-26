# Social Features Specification

> **Status:** Phase 1 Complete
> **Version:** 0.2.0
> **Last Updated:** 2026-01-25

## Overview

Add social features to the Singles Infernal Ranking App enabling users to share boards, add friends, view friends' boards, and compare rankings side-by-side.

### Core Vision
Private friends network where users connect with approved friends to share and compare their rankings. Not a public social feed—focused on meaningful comparisons between people who know each other.

---

## Tech Stack Additions

### Backend
- **Firebase** (Backend-as-a-Service)
  - Firebase Authentication (Google Sign-In)
  - Cloud Firestore (user data, boards, friendships)
  - Firebase Storage (profile images, board images)
  - Firebase Security Rules (access control)

### Data Architecture
- **Offline-first**: Full functionality offline, sync when connected
- **Conflict resolution**: Local data takes precedence in sync conflicts
- **Existing data migration**: Full bidirectional sync with local always winning conflicts

---

## Authentication

### Sign-In Method
- **Google Sign-In only** (via Firebase Auth)
- Simple, no password management
- Profile info (name, avatar) pulled from Google account

### Account Creation Flow
1. User taps "Sign In" on Friends tab or prompted when sharing
2. Google OAuth popup/redirect
3. On first sign-in:
   - Create user document in Firestore
   - Prompt for unique username
   - Offer to sync existing local boards to cloud
4. Subsequent sign-ins: sync and restore state

### Account Deletion
- Full deletion available in Settings
- Deletes: user profile, all boards, friendships, friend requests
- Removes user from others' friends lists
- Irreversible action with confirmation

---

## User Profile

### Profile Data (Minimal)
```typescript
interface UserProfile {
  uid: string;              // Firebase UID
  username: string;         // Unique, user-chosen
  displayName: string;      // From Google
  avatarUrl: string;        // From Google (or custom later)
  isSearchable: boolean;    // Can be found via username search
  createdAt: Timestamp;
  lastActive: Timestamp;
}
```

### Privacy Settings
- **Searchable toggle**: Users can opt out of username search
- Non-searchable users can only be added via invite link

---

## Friend System

### Friend Model: Hybrid
- **Following public boards**: No approval needed (view public boards)
- **Private friend connection**: Requires mutual acceptance (see all shared boards)

### Friend Discovery Methods

#### 1. Username Search
- Search by exact or partial username match
- Only returns users with `isSearchable: true`
- Shows: avatar, display name, username

#### 2. Invite Link
- Generate shareable link: `https://app.url/invite/abc123`
- Link contains encoded user ID
- Recipient clicks → opens app → friend request auto-sent
- Works for non-searchable users

### Friend Request Flow
1. User A sends request to User B
2. User B sees notification badge on Friends tab
3. User B taps badge → dropdown shows pending requests
4. User B can Accept or Decline
5. On accept: bidirectional friendship created

### Friend Data Model
```typescript
interface Friendship {
  id: string;
  users: [string, string];      // Sorted UIDs
  status: 'pending' | 'active';
  requestedBy: string;          // UID of requester
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
}
```

### Unfriend/Block
- **Unfriend**: Removes friendship, silent removal (no notification)
- **Block**: Prevents future requests, removes from friends list, hides all content
- Blocked user cannot see blocker's profile or boards

---

## Board Sharing & Visibility

### Default Visibility
- All boards are **private by default**
- User must explicitly share to make visible to others

### Per-Board Visibility Options
```typescript
type BoardVisibility =
  | 'private'           // Only owner
  | 'friends'           // All friends
  | 'specific'          // Selected friends only
  | 'public';           // Anyone with link (no account needed)
```

### Sharing Configuration
```typescript
interface BoardSharing {
  visibility: BoardVisibility;
  allowedFriends?: string[];    // For 'specific' visibility
  publicLinkEnabled: boolean;   // For 'public' visibility
  publicLinkId?: string;        // Unique ID for public URL
  shareableLinkEnabled: boolean; // Friends can re-share link
}
```

### Public Link Sharing
- Static URL format: `/board/{publicLinkId}`
- Anyone can view without account (read-only)
- Owner can **revoke** link at any time (invalidates existing links)
- Regenerates new link ID on revoke

---

## Board Templates

### Concept
Admin-curated board templates that users can use as starting points. All instances share the same `templateId` enabling automatic comparison matching.

### Template Structure
```typescript
interface BoardTemplate {
  id: string;                   // Unique template ID
  name: string;                 // Locked, not editable
  description: string;
  category: string;             // e.g., "TV Shows", "Movies", "Music"
  items: TemplateItem[];        // The contestants/items to rank
  createdAt: Timestamp;
  isActive: boolean;            // Admin can disable
}

interface TemplateItem {
  id: string;
  name: string;                 // Locked
  defaultImageUrl?: string;     // Default image
}
```

### User's Board from Template
```typescript
interface BoardFromTemplate {
  // ... standard board fields ...
  templateId: string;           // Links to template
  items: UserRankedItem[];
}

interface UserRankedItem {
  templateItemId: string;       // Links to template item
  rank: number;
  nickname?: string;            // User's custom nickname
  notes?: string;               // User's notes
  customImageUrl?: string;      // User-uploaded image (overrides default)
}
```

### Template Rules
- Template `name` is **locked** (not modifiable by users)
- Item names are **locked**
- Users CAN customize:
  - Nicknames for items
  - Notes for items
  - Photos (replaces default image)
- Rankings are user-specific

### Custom Boards (Non-Template)
- Users can still create fully custom boards
- Matching for comparison uses **exact title match**

---

## Board Comparison

### Matching Logic

#### Template-based Boards
- Boards with same `templateId` are automatically matchable
- Comparison suggestion appears when viewing a friend's template board you also have

#### Custom Boards
- Exact title match only
- Case-insensitive comparison

### Comparison Trigger
- **Auto-suggestion**: When viewing friend's board that matches yours, show "Compare with yours" button
- **Manual**: Can select any two compatible boards to compare

### Comparison View: Side-by-Side

#### Layout
```
┌─────────────────────────────────────────┐
│  Your Ranking vs. [Friend Name]'s       │
│  [Board Name]                           │
│  🎯 78% Agreement                        │
├─────────────────────────────────────────┤
│   YOU          │    THEM                │
├─────────────────────────────────────────┤
│ #1 [Photo]     │ #3 [Photo]             │
│    Item A      │    Item A              │
├─────────────────────────────────────────┤
│ #2 [Photo]     │ #1 [Photo]             │
│    Item B      │    Item B              │
├─────────────────────────────────────────┤
│ #3 [Photo]     │ — Not Ranked           │
│    Item C      │                        │
├─────────────────────────────────────────┤
│ — Not Ranked   │ #2 [Photo]             │
│                │    Item D              │
└─────────────────────────────────────────┘
```

#### Features
- **Agreement percentage**: Overall match score displayed at top
- **Position display**: Shows rank number for each item
- **Photos**: Uses each user's chosen photo (custom or default)
- **Not ranked indicator**: Items in one board but not the other show "Not Ranked"
- **All items shown**: Union of both boards' items, not just intersection

### Agreement Calculation
```typescript
function calculateAgreement(board1: RankedItem[], board2: RankedItem[]): number {
  // Find common items
  // Compare relative positions
  // Score based on position proximity
  // Return percentage (0-100)
}
```

---

## Friends Tab & Navigation

### Bottom Navigation
Add new **Friends** tab to existing bottom nav:
```
[ Boards ] [ + ] [ Friends ] [ Settings ]
```

### Friends Tab Structure

#### Header
- "Friends" title
- Notification badge (pending requests count)
- Dropdown for pending requests on badge tap

#### Main Content
1. **Templates Section**
   - Horizontal scrollable list of available templates
   - Tap to create board from template
   - Shows template name + item count

2. **Friends Section**
   - Vertical list of friends
   - Each friend shows:
     - Avatar
     - Display name
     - Number of shared boards
   - Tap friend → see their shared boards

3. **Add Friend Button**
   - Opens modal with:
     - Username search input
     - "Share invite link" option
     - Pending outgoing requests

### Friend Profile View
When tapping a friend:
```
┌─────────────────────────────────────────┐
│  ← [Avatar] Friend Name                 │
│     @username                           │
├─────────────────────────────────────────┤
│  Shared Boards (3)                      │
├─────────────────────────────────────────┤
│  [Board Card] [Board Card] [Board Card] │
│                                         │
│  Compare Suggestions                    │
│  "You both ranked [Board Name]!"        │
│  [ Compare Now ]                        │
└─────────────────────────────────────────┘
```

### Board Actions (Viewing Friend's Board)
- **View**: Full read-only view of their ranking
- **Compare**: If you have matching board, compare side-by-side
- **Share link**: Copy link (if owner allows resharing)
- **Report**: Flag inappropriate content

---

## Notifications (In-App Only)

### Notification Types
- Friend request received
- Friend request accepted
- Friend shared a new board (that matches your template)
- Your content was reported (admin action)

### Notification Display
- Badge count on Friends tab
- Dropdown list on badge tap
- Mark as read on view

### No Push Notifications
- All notifications in-app only
- No system push notifications

---

## Data Sync & Offline

### Sync Strategy
1. **On sign-in**: Download all user's cloud data
2. **Offline changes**: Queue locally, sync on reconnect
3. **Conflict resolution**: Local always wins
4. **Real-time listeners**: Firestore listeners for friends' shared boards

### Local Storage (Existing)
- IndexedDB: Images
- localStorage: Board data

### Cloud Storage (New)
- Firestore: User profiles, boards, friendships, templates
- Firebase Storage: User-uploaded images

### Migration Flow
1. User signs in
2. App detects existing local boards
3. Uploads local boards to cloud (preserves IDs)
4. Future: bidirectional sync

---

## Moderation & Safety

### Report System
Users can report:
- Boards (inappropriate content)
- Users (harassment, spam)

Report flow:
1. User taps "Report" on board/profile
2. Select reason (dropdown)
3. Optional: add details
4. Submit → stored in Firestore for admin review

### Rate Limits
- Friend requests: Max 20 per day
- Board creation: Max 50 per day
- Report submissions: Max 10 per day

### Admin Actions
- Review reported content
- Warn users
- Suspend accounts
- Remove content
- Ban users

### Content Policy
- No explicit/adult content
- No harassment
- No spam
- No impersonation

---

## Security Rules (Firestore)

### Key Rules
```javascript
// Users can only read/write their own profile
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
}

// Boards visibility check
match /boards/{boardId} {
  allow read: if canViewBoard(resource.data);
  allow write: if request.auth.uid == resource.data.ownerId;
}

// Friendships
match /friendships/{friendshipId} {
  allow read: if request.auth.uid in resource.data.users;
  allow create: if request.auth.uid == request.resource.data.requestedBy;
  allow update: if request.auth.uid in resource.data.users;
}
```

---

## UI Components (New)

### Pages
- `FriendsPage.tsx` - Main friends tab
- `FriendProfilePage.tsx` - Individual friend view
- `ComparePage.tsx` - Side-by-side comparison
- `TemplatePickerPage.tsx` - Browse/select templates
- `BoardSettingsPage.tsx` - Sharing/visibility settings

### Components
- `FriendCard.tsx` - Friend list item
- `FriendRequestCard.tsx` - Pending request item
- `TemplateCard.tsx` - Template preview card
- `ComparisonView.tsx` - Side-by-side ranking display
- `AgreementBadge.tsx` - Percentage match indicator
- `ShareModal.tsx` - Sharing options modal
- `ReportModal.tsx` - Report content modal
- `InviteLinkModal.tsx` - Generate/copy invite link

### Hooks
- `useAuth.ts` - Firebase auth state
- `useFriends.ts` - Friends list and requests
- `useBoards.ts` - Update for cloud sync
- `useTemplates.ts` - Fetch available templates
- `useComparison.ts` - Comparison logic
- `useNotifications.ts` - In-app notifications

---

## Implementation Phases

### Phase 1: Foundation ✅ COMPLETE
- [x] Firebase project setup (lazy initialization for bundle size)
- [x] Authentication (Google Sign-In)
- [x] Mock auth for local development (no Firebase needed)
- [x] User profile creation with username validation
- [x] Username uniqueness enforcement
- [x] Reserved usernames protection (admin, root, support, etc.)
- [ ] Basic data sync (boards to cloud) - **NEXT**

#### Phase 1 Implementation Notes
- **Files added:**
  - `src/lib/firebase.ts` - Lazy Firebase initialization
  - `src/lib/mockAuth.ts` - Mock auth for dev mode
  - `src/lib/socialTypes.ts` - TypeScript types for social features
  - `src/lib/usernameValidation.ts` - Username rules and validation
  - `src/hooks/useAuth.ts` - Authentication hook
  - `src/components/modals/UsernameSetupModal.tsx` - First-time username entry
  - `src/pages/FriendsPage.tsx` - Friends tab with sign-in flow
  - `src/pages/SettingsPage.tsx` - Updated with Account section
- **Dev mode:** Set `VITE_USE_MOCK_AUTH=true` (default in dev) to bypass Firebase
- **Username rules:** 3-20 chars, alphanumeric + underscore, no consecutive underscores, reserved names blocked

### Phase 2: Friends System
- [ ] Friend requests (send/accept/decline)
- [ ] Username search
- [ ] Invite links
- [ ] Friends list UI
- [ ] Privacy settings (searchable toggle)

### Phase 3: Board Sharing
- [ ] Per-board visibility settings
- [ ] Public link generation/revocation
- [ ] View friend's boards
- [ ] Share settings UI

### Phase 4: Templates & Comparison
- [ ] Template data model
- [ ] Template picker UI
- [ ] Board from template flow
- [ ] Comparison matching logic
- [ ] Side-by-side comparison view
- [ ] Agreement percentage calculation

### Phase 5: Moderation & Polish
- [ ] Report system
- [ ] Block/unfriend flows
- [ ] Rate limiting
- [ ] Admin dashboard (separate)
- [ ] Error handling & edge cases

---

## Open Questions

1. **Template seeding**: What initial templates to create?
2. **Admin dashboard**: Build in-app or separate admin panel?
3. **Analytics**: Track comparison views, popular templates?
4. **Future**: Reactions/comments as v2 feature?

---

## Appendix: Data Models

### Complete Firestore Schema

```typescript
// /users/{uid}
interface User {
  uid: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isSearchable: boolean;
  createdAt: Timestamp;
  lastActive: Timestamp;
  blockedUsers: string[];
}

// /boards/{boardId}
interface Board {
  id: string;
  ownerId: string;
  title: string;
  templateId?: string;
  items: RankedItem[];
  visibility: BoardVisibility;
  allowedFriends?: string[];
  publicLinkEnabled: boolean;
  publicLinkId?: string;
  shareableLinkEnabled: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// /friendships/{friendshipId}
interface Friendship {
  id: string;
  users: [string, string];
  status: 'pending' | 'active';
  requestedBy: string;
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
}

// /templates/{templateId}
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  items: TemplateItem[];
  isActive: boolean;
  createdAt: Timestamp;
}

// /reports/{reportId}
interface Report {
  id: string;
  reporterId: string;
  targetType: 'board' | 'user';
  targetId: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'actioned';
  createdAt: Timestamp;
}

// /notifications/{notificationId}
interface Notification {
  id: string;
  userId: string;
  type: 'friend_request' | 'request_accepted' | 'board_shared' | 'report_action';
  data: Record<string, any>;
  read: boolean;
  createdAt: Timestamp;
}
```
