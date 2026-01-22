# Singles Infernal Ranking App - Technical Specification

## Overview

A mobile-first PWA for creating and managing ranked lists with drag-and-drop reordering. Optimized for iPhone 14 Pro Max with a distinctive hand-drawn aesthetic. Initial seed data: Singles Infernal Season 5 (2026) contestants.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Vite + React 18 |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Storage | IndexedDB (images) + localStorage (data) |
| Deployment | GitHub Pages (static SPA) |
| PWA | Workbox service worker |

---

## Design System

### Hand-Drawn Aesthetic

All visual elements follow the hand-drawn design philosophy:

**Colors:**
- Background: `#fdfbf7` (Warm Paper)
- Foreground: `#2d2d2d` (Soft Pencil Black)
- Muted: `#e5e0d8` (Old Paper)
- Accent: `#ff4d4d` (Red Correction Marker)
- Secondary: `#2d5da1` (Blue Ballpoint Pen)

**Dark Mode (Chalkboard variant):**
- Prepare CSS variables for future chalkboard-style dark theme
- Inverted palette with chalk-white on slate-gray/green

**Typography:**
- Headings: `Kalam` (weight 700)
- Body: `Patrick Hand` (weight 400)

**Borders:**
- Wobbly irregular border-radius (never standard rounded classes)
- Example: `border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px`
- Minimum `border-2`, use `border-[3px]` for emphasis

**Shadows:**
- Hard offset only, no blur
- Standard: `4px 4px 0px 0px #2d2d2d`
- Emphasized: `8px 8px 0px 0px #2d2d2d`

**Background texture:**
- Dot pattern: `radial-gradient(#e5e0d8 1px, transparent 1px)`
- Size: `24px 24px`

---

## Data Model

Designed for future cloud sync capability (UUIDs, timestamps).

### Board
```typescript
interface Board {
  id: string;              // UUID
  name: string;
  coverImage: string | null; // IndexedDB key or null
  createdAt: number;       // Unix timestamp
  updatedAt: number;
  deletedAt: number | null; // Soft delete for trash (7-day recovery)
}
```

### Card
```typescript
interface Card {
  id: string;              // UUID
  boardId: string;         // Foreign key to board
  name: string;
  imageKey: string | null; // IndexedDB key for full image
  thumbnailKey: string | null; // IndexedDB key for thumbnail
  imageCrop: {             // Pinch-to-zoom crop data
    x: number;
    y: number;
    scale: number;
  } | null;
  notes: string;           // User's custom notes
  metadata: Record<string, unknown>; // Extensible for future fields
  rank: number;            // Position in list (1-indexed)
  createdAt: number;
  updatedAt: number;
}
```

### Image Storage (IndexedDB)
```typescript
interface StoredImage {
  key: string;             // UUID
  blob: Blob;              // Full resolution image
  thumbnail: Blob;         // Compressed thumbnail (~50KB)
  mimeType: string;
  createdAt: number;
}
```

---

## Navigation Structure

**Tab Bar (bottom):**
1. **Boards** - Main board list view
2. **Settings** - Minimal settings

### Boards Tab
- **Board List View**: 2-column card grid
  - Each board card shows:
    - Board name
    - Cover image (or pattern)
    - Top 3 ranked items as overlapping circular photo crops
    - Card count badge
  - Swipe left on board → reveal delete button → tap confirms → moves to trash (7-day recovery)
  - Tap board → navigate to Board Detail

- **Board Detail View**: Full-screen ranked list
  - Back button to return to list
  - Board name as header
  - Vertically scrolling list of ranked cards
  - Floating Action Button (FAB) to add new card

### Settings Tab
- Export data (JSON backup)
- Clear all data (with confirmation)
- Sounds toggle (on/off)
- About/version info

---

## Card Component

### Layout
```
┌─────────────────────────────────────┐
│ ⋮⋮  [PHOTO]  Name Here         (1) │
│ ⋮⋮           Optional notes...     │
└─────────────────────────────────────┘
```

- **Drag Handle**: Left side, 3 horizontal wobbly lines
- **Photo**: Square crop with wobbly border, left of name
- **Name**: Primary text, `Patrick Hand` font
- **Notes**: Secondary text, muted color, truncated to 1 line
- **Rank Badge**: Right side, bold circled number (hand-drawn style)
  - Updates live during drag

### Rank-Based Decoration
- **#1**: Gold thumbtack/star accent
- **#2**: Silver thumbtack/star accent
- **#3**: Bronze thumbtack/star accent
- **#4+**: No decoration

### Visual States
| State | Treatment |
|-------|-----------|
| Default | Standard shadow `4px 4px`, no rotation |
| Hover/Touch | Slight rotation jiggle |
| Dragging | Scale 105%, shadow `8px 8px`, elevated z-index |
| Displaced | Slide + slight rotation wobble animation |

---

## Drag & Drop Behavior

### Initiation
- **Trigger**: Touch/click on dedicated drag handle only
- Rest of card remains scrollable

### During Drag
- Dragged card scales to 105%
- Shadow increases to `8px 8px`
- Card follows finger/cursor
- **Haptic feedback**: Light tap on pickup (iOS)

### Displacement Animation
- Other cards slide up/down with spring physics
- Subtle rotation wobble (-1° to +1°) during movement
- **Rank Threshold**: 50% overlap required to swap positions
- Rank badges update live as positions change

### Drop
- Card snaps to new position
- Scale returns to 100%
- Shadow returns to `4px 4px`
- **Haptic feedback**: Medium tap on release (iOS)
- Smooth spring settle animation

### Performance
- Max ~20 cards per board (no virtualization needed)
- Use `will-change: transform` during drag
- 60fps target on iPhone 14 Pro Max

---

## Modals & Sheets

### Card Detail Modal (iOS Bottom Sheet)
- **Trigger**: Tap anywhere on card (except drag handle)
- **Animation**: Slide up from bottom (Framer Motion)
- **Dismiss**: Swipe down OR tap X button
- **Content**:
  - Large photo (pinch to zoom/reposition)
  - Name input field
  - Notes textarea
  - Delete button (with confirmation)
  - Save button

### Photo Crop Modal
- **Trigger**: After selecting/capturing photo
- **Features**:
  - Pinch to zoom
  - Pan to reposition
  - Confirm/cancel buttons
- **Output**: Crop data stored in card, applied on render

### Board Creation Modal
- **Fields**:
  - Board name (required)
  - Cover image (optional, camera + library picker)
- **Action**: Create → navigate to new empty board

---

## Photo Handling

### Input Methods
1. **Camera**: Native camera capture (iOS)
2. **Photo Library**: Native image picker

### Storage Strategy
- Full resolution stored in IndexedDB
- Thumbnail (~50KB compressed) generated on upload
- Card displays thumbnail for performance
- Detail modal loads full resolution

### Crop Data
```typescript
{
  x: number,      // Pan offset X (0-1)
  y: number,      // Pan offset Y (0-1)
  scale: number   // Zoom level (1 = fit, 2 = 2x zoom)
}
```

---

## Board List Empty States

### No Boards Yet
- Hand-drawn illustration
- "Create your first ranking!" CTA
- Large FAB to create board

### Empty Board (No Cards)
- Template suggestions:
  - "Singles Infernal S5" (pre-loaded)
  - "My Top 10 Movies"
  - "Best Restaurants"
  - "Favorite Songs"
- Tapping template pre-populates board name
- Or tap FAB to add cards manually

---

## PWA Configuration

### manifest.json
```json
{
  "name": "Rank It",
  "short_name": "Rank It",
  "description": "Create and share your rankings",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fdfbf7",
  "theme_color": "#2d2d2d",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker (Workbox)
- Cache static assets (app shell)
- Cache Google Fonts
- IndexedDB for user data (no SW caching)
- Offline-capable after first load

### iOS-Specific
- `apple-mobile-web-app-capable`: yes
- `apple-mobile-web-app-status-bar-style`: default
- Safe area insets for notch/home indicator

---

## Sound Effects (Optional)

Toggle in Settings (default: off)

| Action | Sound |
|--------|-------|
| Drag start | Soft paper lift |
| Card swap | Quick paper shuffle |
| Drop | Paper settle |
| Delete | Crumple |

Audio files: MP3, <50KB each, loaded on-demand.

---

## Seed Data: Singles Infernal Season 5 (2026)

### Data to Fetch
- All contestant names
- Headshot photos (official or sourced online, cropped to square)
- Basic metadata (age, occupation if available)

### Implementation
1. Search online for official contestant list
2. Download/source headshot images
3. Process images:
   - Crop to square (face-centered)
   - Resize to 400x400px max
   - Compress to <100KB
4. Create seed data JSON with base64 images or bundled assets
5. On first launch, check if "Singles Infernal S5" board exists
6. If not, create board and populate with contestants at random order

---

## Responsive Design

### Target Device
iPhone 14 Pro Max (430 x 932 logical pixels)

### Breakpoints
- Mobile: default (< 768px)
- Tablet: `md:` (768px+) - optional enhancements
- Desktop: `lg:` (1024px+) - optional enhancements

### Touch Targets
- Minimum 48x48px for all interactive elements
- Adequate spacing between drag handles

### Safe Areas
- Respect iOS safe area insets
- Bottom tab bar above home indicator
- Content doesn't hide behind notch

---

## File Structure

```
/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icons/
│   └── sounds/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   └── TabBar.tsx
│   │   ├── RankCard.tsx
│   │   ├── RankList.tsx
│   │   ├── BoardCard.tsx
│   │   ├── BoardGrid.tsx
│   │   ├── PhotoCropper.tsx
│   │   └── DragHandle.tsx
│   ├── pages/
│   │   ├── BoardsPage.tsx
│   │   ├── BoardDetailPage.tsx
│   │   └── SettingsPage.tsx
│   ├── hooks/
│   │   ├── useBoards.ts
│   │   ├── useCards.ts
│   │   ├── useImageStorage.ts
│   │   └── useHaptics.ts
│   ├── lib/
│   │   ├── db.ts           # IndexedDB wrapper
│   │   ├── storage.ts      # localStorage wrapper
│   │   ├── imageUtils.ts   # Compression, thumbnails
│   │   └── sounds.ts       # Audio manager
│   ├── styles/
│   │   └── wobbly.ts       # Border-radius presets
│   └── data/
│       └── seedData.ts     # Singles Infernal contestants
└── README.md
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Vite + React + Tailwind setup
- [ ] Design tokens and wobbly border utilities
- [ ] Basic component library (Button, Card, Input)
- [ ] Tab bar navigation shell

### Phase 2: Data Layer
- [ ] IndexedDB setup for images
- [ ] localStorage setup for boards/cards
- [ ] CRUD hooks for boards and cards
- [ ] Image compression and thumbnail generation

### Phase 3: Board List
- [ ] Board grid with previews
- [ ] Board creation modal
- [ ] Swipe-to-delete with trash
- [ ] Empty state with templates

### Phase 4: Drag & Drop
- [ ] Framer Motion drag implementation
- [ ] Displacement animations with wobble
- [ ] Live rank badge updates
- [ ] Haptic feedback integration

### Phase 5: Card Management
- [ ] Card detail bottom sheet
- [ ] Photo capture and library picker
- [ ] Pinch-to-zoom crop modal
- [ ] Notes and metadata editing

### Phase 6: Polish
- [ ] PWA manifest and service worker
- [ ] Sound effects (optional toggle)
- [ ] Seed data: Singles Infernal S5
- [ ] iOS safe area handling
- [ ] Performance optimization

### Phase 7: Dark Mode (Future)
- [ ] CSS variable architecture
- [ ] Chalkboard theme design
- [ ] Theme toggle in settings

---

## Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Drag animation | 60fps |
| Displacement animation | 60fps |
| Image load (thumbnail) | < 100ms |

---

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Focus management in modals
- Reduced motion preference respected
- Color contrast ratios maintained

---

## Future Considerations

- Cloud sync (Firebase/Supabase)
- Share board as link (read-only)
- Multiple ranking criteria per card
- Board templates marketplace
- Social features (follow boards)
