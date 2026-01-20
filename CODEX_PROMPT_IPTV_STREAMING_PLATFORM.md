# IPTV Streaming Platform - Comprehensive Development Prompt

## Project Overview

Build a modern, production-ready IPTV streaming platform similar to the reference implementation. The platform should support:

- **M3U/M3U8 playlist parsing and channel management**
- **Unlimited servers per stream with channel metadata (name, logo, ID)**
- **HLS.js video streaming with adaptive bitrate**
- **Admin panel with hidden URL for secure management**
- **User and role-based access control (admin/user)**
- **Ad management system with position-based placement**
- **SEO optimization for streaming content**
- **Arabic RTL (Right-to-Left) interface throughout**
- **Responsive design for mobile and desktop**
- **Real-time streaming with server switching**

## Technology Stack

### Frontend
- **Framework:** Next.js 15.4.1 with App Router
- **Language:** TypeScript 5 with strict mode
- **Styling:** Tailwind CSS 4 (not using v3)
- **UI Components:** shadcn/ui component library (Radix UI)
- **Icons:** Lucide React
- **Animations:** Framer Motion for smooth transitions
- **State Management:** Zustand for client state
- **Data Fetching:** TanStack Query for server state
- **Video Streaming:** HLS.js for M3U8 playback
- **Forms:** React Hook Form with Zod validation
- **Notifications:** Sonner for toast messages
- **Routing:** Next.js 15 App Router with dynamic routes

### Backend
- **Framework:** Next.js 15.4.1 with App Router
- **ORM:** Prisma ORM
- **Database:** SQLite with migration support (can easily switch to PostgreSQL for production)
- **API:** RESTful API routes with proper error handling
- **Validation:** Zod schema validation for all inputs
- **Authentication:** Role-based access control with admin/user roles
- **Security:** Password hashing, CSRF protection, input sanitization

### Database Schema Requirements
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password   String? (hashed)
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  model Stream {
    id          String   @id @default(cuid())
    title       String
    description String?
    thumbnail   String?
    published   Boolean  @default(false)
    authorId   String
    playlistUrl String?  // M3U playlist URL
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    servers    Server[]
    ads        Ad[]
  }

  model Server {
    id            String   @id @default(cuid())
    streamId      String
    name          String
    url           String
    priority       Int      @default(0)
    // Channel metadata from M3U parsing
    channelId      String?  // Channel ID from playlist
    channelName    String?  // Channel name from playlist
    channelLogo    String?  // Channel logo URL from playlist
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt
  }

  model Ad {
    id        String   @id @default(cuid())
    streamId  String?
    position  String   // "home-top", "home-bottom", "stream-top", "stream-bottom", "stream-sidebar"
    title     String?
    imageUrl  String
    linkUrl   String?
    active    Boolean  @default(true)
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }

  model Playlist {
    id        String   @id @default(cuid())
    streamId  String
    name      String
    url       String   // M3U playlist URL
    channels  Int      @default(0)
    active    Boolean  @default(true)
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }
}
```

## Core Features to Implement

### 1. Homepage (Landing Page)
- Hero section with platform branding ("منصة البث المباشر" or similar)
- Featured streams showcase with thumbnails
- "All Channels" count display
- Search/filter functionality for streams
- Responsive grid layout for streams
- Loading skeleton states
- RTL layout support (dir="rtl")

### 2. Stream Player Page (/stream/[id])
- HLS.js video player with M3U8 support
- Server selector dropdown (priorities 1, 2, 3, 4, 5+)
- Channel name and logo display in selector
- Stream description card (SEO optimized)
- Current server info display with streaming status
- "Online" / "Offline" status indicator
- Related streams section
- Ad placements (top, bottom, sidebar)

### 3. Admin Panel
- **Hidden URL:** Complex hidden path (e.g., `/admin-portal-secure-2025-x7k9m2/dashboard`)
- **Authentication:**
  - Login form with email and password
  - Session management (or JWT for production)
  - Admin-only route protection
  - Protected API routes for admin operations
- **Dashboard Features:**
  - **Streams Management:**
    - List all streams
    - Create new stream (title, description, thumbnail, published status)
    - Edit stream details
    - Delete stream
    - Manage servers per stream
    - Upload/assign thumbnail images
  - **Servers Management:**
    - Add unlimited servers to any stream
    - Edit server details
    - Delete server
    - Set priority order
    - Channel metadata (name, logo, ID from M3U)
  - **Users Management:**
    - List all users
    - Create new user (admin/user role)
    - Edit user details
    - Delete user
    - Change user role (admin/user)
  - **Ads Management:**
    - List all ads
    - Create new ad
    - Edit ad details
    - Delete ad
    - Toggle ad active/inactive status
    - Set ad position (home-top, home-bottom, stream-top, stream-bottom, stream-sidebar)
  - **M3U Playlist Parser:**
    - Input M3U/M3U8 playlist URL
    - Parse and display all channels from playlist
    - Show channel metadata (name, logo, group, ID)
    - Select channels to add as servers
    - Add selected channels as servers with metadata
  - Character limits: channel name up to 100, description up to 2000
  - **Settings Page:**
    - Database management (view tables, run migrations)
    - Configuration options

### 4. M3U/M3U8 Playlist Parser
Create a robust M3U parser that can handle:
- Parsing `#EXTINF:` metadata
- Extracting channel names, logos, group titles, channel IDs
- TV guide ID (tvg-id)
- Logo URLs (tvg-logo)
- Group titles
- Duration
- Stream URLs
- Multiple formats (M3U, M3U8)

**Parser Features:**
- Parse both HTTP and HTTPS URLs
- Handle quoted and unquoted values
- Skip invalid entries
- Extract comprehensive metadata
- Return structured data for database storage
- Error handling for malformed playlists

### 5. HLS.js Integration
- M3U8 format support (`.m3u8` files)
- Adaptive bitrate for better quality
- Fallback to native HLS for Safari
- Auto-play on load
- Buffer configuration for smooth playback
- Error recovery and handling
- Stream quality indicator (buffer health)
- Seeking support with progress bar

### 6. RTL (Right-to-Left) Support
- Apply `dir="rtl"` attribute to `<html>` and main layout
- Use RTL-aware layouts in Tailwind (flex-row-reverse)
- Mirror directional icons and spacing (ml-auto instead of mr-auto)
- Test RTL layout on mobile and desktop
- Ensure text alignment is correct for Arabic content
- RTL-friendly component ordering (flex items flow right to left)

### 7. SEO Optimization
- Dynamic meta tags for each stream page
- Structured data (JSON-LD for search engines)
- Open Graph tags for social sharing
- Twitter Cards for streams
- Canonical URLs
- Sitemap generation (`/sitemap.xml`)
- Robots.txt with proper directives
- Page titles with stream names + platform name
- Optimized meta descriptions (150-2000 characters)
- Proper heading hierarchy (h1, h2, h3)

### 8. Responsive Design
- Mobile-first design approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- Touch-friendly button sizes (min 44px height for mobile)
- Responsive grid layouts for streams
- Collapsible sidebar navigation for mobile
- Responsive video player (aspect-ratio maintenance)
- Readable text with proper contrast
- Optimize images with next/image
- Progressive enhancement for better mobile performance

### 9. Security Implementation
- **Authentication:**
  - Password hashing with bcrypt (cost factor 10)
  - SQL injection prevention with Prisma parameterized queries
  - XSS prevention with proper output escaping
  - Rate limiting on API routes
  - CSRF tokens for form submissions
  - Admin-only middleware protection
  - Session management (httpOnly cookies or JWT)

- **Input Validation:**
  - Zod schemas for all form inputs
  - Sanitize user inputs (HTML tags, scripts)
  - Validate file uploads (type, size, format)
  - URL validation for M3U playlists and stream URLs
  - Email format validation
  - String length limits (prevent overflow attacks)

- **API Security:**
  - Proper HTTP status codes (200, 201, 400, 401, 403, 500)
- Error messages without sensitive information in production
  - Request rate limiting
  - API key authentication for production

### 10. Error Handling & UX
- Comprehensive error handling for:
  - API requests (network errors, server errors)
  - Database operations (unique constraints, foreign keys)
  - M3U playlist parsing failures
  - Video player errors (HLS.js)
  - Form validation errors
- User-friendly error messages in Arabic
- Loading states with skeleton screens
- Toast notifications (Sonner) for user feedback
- Retry mechanisms for failed requests

### 11. Performance Optimization
- Next.js Image Optimization for automatic image optimization
- Server components for improved initial load
- Code splitting with dynamic imports for better caching
- Lazy loading for heavy components (video player, charts)
- Debounced search inputs for stream lists
- Optimistic UI updates (immediate state updates)
- Memoization for expensive computations
- Database query optimization (N+1 queries with proper indexing)

### 12. Admin Panel UX
- Clean, organized dashboard with tabs
- Real-time feedback on form submissions
- Confirmation dialogs for destructive actions (delete stream, delete server)
- Visual feedback for admin actions (success/error toasts)
- Loading states during async operations
- Responsive design for mobile admin access
- Search and filter for streams, users, ads
- Sortable tables with pagination

### 13. Database Migration & Management
- Schema versioning and migrations
- Seed data for initial deployment (admin user, sample streams)
- Migration scripts for database schema updates
- Prisma Client generation and type safety
- Database connection pooling for production
- SQLite for development, PostgreSQL ready for production

### 14. Deployment Configuration

**For Development (SQLite):**
```bash
# Environment variables
DATABASE_URL=file:./prisma/dev.db
NODE_ENV=development

# Development server
bun run dev
```

**For Production (Vercel - Recommended):**
```bash
# Environment variables
DATABASE_URL=file:./prisma/dev.db
# Or upgrade to PostgreSQL:
# DATABASE_URL=postgresql://user:password@host:5432/dbname
# Using Vercel Postgres (built-in)
# Or Neon Tech (free):
# DATABASE_URL=postgresql://project-id.region.aws.neont.tech/...
# Or Supabase (generous free):
# DATABASE_URL=postgresql://project-ref.supabase.co/...

# Build
bun run build

# Deploy
vercel login
vercel
# Or via Vercel Dashboard (import from GitHub)
```

**For Production (Railway - Full Stack):**
```bash
npm i -g railway
railway login
railway init
railway up
# Connect GitHub repository when prompted
```

**For Production (DigitalOcean - Full Control):**
```bash
# Clone project
git clone <your-repo-url>

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Start server
pm2 start ./server.js
# Or use Node.js directly
node server.js
```

## Implementation Order

### Phase 1: Project Setup
1. Initialize Next.js 15.4.1 project with TypeScript
2. Install dependencies: Tailwind CSS, shadcn/ui, Prisma, Zod, Framer Motion, etc.
3. Set up Prisma with SQLite database
4. Create database schema with all models
5. Generate Prisma Client and types
6. Configure Tailwind CSS for RTL support
7. Set up shadcn/ui components
8. Create basic layout with RTL support
9. Configure Next.js App Router structure

### Phase 2: Backend Development
1. Create API routes for all CRUD operations:
   - `/api/streams` (GET, POST, PUT, DELETE)
   - `/api/streams/[id]` (GET with server/ads include)
   - `/api/servers` (POST, PUT, DELETE)
   - `/api/users` (GET, POST, PUT, DELETE)
   - `/api/ads` (GET, POST, PUT, DELETE)
   - `/api/admin/auth` (POST for login)
   - `/api/playlists/parse` (POST for M3U parsing)
2. Implement authentication middleware
3. Add Zod validation schemas
4. Create admin-only middleware for protected routes
5. Implement proper error handling
6. Add request logging for debugging

### Phase 3: Frontend Development
1. Create homepage with:
   - Hero section
   - Featured streams grid
   - Loading states
   - RTL layout
   - Search functionality
2. Create stream player page (`/stream/[id]`):
   - HLS.js integration
   - Server selector with logos
   - Stream description card
   - Related streams
   - Ad placements
   - Loading and error states
3. Create admin panel (`/admin-portal-secure-2025-x7k9m2/dashboard`):
   - Login page
   - Dashboard with tabs (Streams, Servers, Users, Ads)
   - Stream management forms
   - Server management with unlimited addition
   - User management table
   - Ad management table
   - M3U playlist parser
   - Settings page
4. Create API integration with TanStack Query
5. Add state management with Zustand
6. Implement forms with Zod validation
7. Add toast notifications with Sonner
8. Create responsive layouts

### Phase 4: Features Implementation
1. Implement M3U playlist parser:
   - Parse M3U and M3U8 formats
   - Extract channel metadata
   - Handle errors gracefully
2. Implement HLS.js streaming:
   - Setup video player
   - Add server switching
   - Add quality controls
   - Handle streaming errors
3. Implement unlimited servers:
   - Dynamic server addition/removal
   - Channel metadata display
   - Priority ordering
4. Implement ad system:
   - Position-based placement
   - Active/inactive toggle
   - Link tracking
5. Implement RTL support:
   - Apply dir="rtl" attribute
   - Use RTL-aware layouts
   - Test Arabic content
6. Implement SEO:
   - Dynamic meta tags
   - Sitemap generation
   - Open Graph tags
   - Twitter Cards
   - Optimized meta descriptions

### Phase 5: Testing
1. Test all API endpoints
2. Test M3U playlist parsing with various formats
3. Test video streaming functionality
4. Test server switching and prioritization
5. Test admin panel operations
6. Test responsive layouts
7. Test RTL interface
8. Test error handling
9. Load testing for multiple concurrent users
10. Security testing (SQL injection, XSS, CSRF)

### Phase 6: Deployment
1. Configure Vercel deployment
2. Set up environment variables
3. Configure build settings
4. Test deployment in staging
5. Deploy to production
6. Configure custom domain (optional)
7. Set up PostgreSQL database for production
8. Set up monitoring and analytics
9. Enable error tracking (Sentry or Vercel analytics)
10. Configure CDN and caching

## Key Design Requirements

### Color Scheme
- Primary: Red tones (red-500, red-600, red-700) for streaming
- Secondary: Slate/Gray (slate-50 to slate-900)
- Accent: Blue for actions and links (blue-600)
- Neutral: Gray for text and backgrounds
- Success: Green for active status
- Error: Red for error states

### Typography
- Arabic font support (Google Fonts: Cairo, Tajawal)
- Font sizes: xs (0.875rem), sm (1rem), base (1.125rem), lg (1.125rem), xl (1.25rem)
- Font weights: regular, medium, semibold, bold
- Line heights: tight, normal, relaxed for readability

### Spacing
- Space scale: 4 (0.25rem) - 8 (2rem) - Tailwind default
- Consistent padding: 4 for cards, 6 for sections
- Margin scale: 4 (0.25rem) - 8 (2rem) for sections
- Responsive gaps: sm (1rem), md (1.5rem), lg (2rem)

### Components
- Use shadcn/ui components for consistency
- Follow accessible design patterns
- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus states visible
- Loading skeletons for all async operations

### Icons
- Use Lucide React for consistency
- Icons for actions: Play, Tv, Plus, Trash2, Edit, Settings, LogOut, Menu, Chevron, Search, Filter, Refresh
- Icons for streaming: Server, Zap (for online status), Video
- Icons for admin: Users, Shield, LayoutDashboard

## Important Implementation Notes

### M3U Playlist Parser
- Must handle both M3U and M3U8 formats
- Extract: channel names, logos, group titles, tvg-id, duration
- Skip invalid or empty entries
- Return array of channels with metadata
- Handle special characters and encoding (UTF-8)
- Support quoted and unquoted values in metadata
- Parse URLs from M3U content (absolute URLs, relative URLs)

### Server Management
- Support unlimited servers per stream (not limited to 4)
- Each server has: id, name, url, priority
- Additional channel metadata: channelId, channelName, channelLogo
- Priority determines order in dropdown (lower number = higher priority)
- Allow dynamic addition/removal of servers
- Store server URLs in database for persistence

### Video Streaming
- Use HLS.js for M3U8 playback
- Support both `.m3u8` and `.m3u` formats
- Implement adaptive quality selection if available
- Handle HLS network errors (404, 500, etc.)
- Show loading state during video initialization
- Display error states with user-friendly messages
- Support auto-play for better UX
- Implement seeking with progress bar

### Admin Panel Security
- Use complex, hidden URL path for admin panel
- Implement admin role check on all admin routes
- Use session-based authentication (httpOnly cookies)
- Implement middleware for route protection
- Validate admin access for all destructive operations
- Log all admin actions for audit trail
- Use Zod validation for all inputs (prevent injection)
- Hash passwords before storing in database

### SEO Best Practices
- Use descriptive titles (Stream Name - Platform Name)
- Write unique meta descriptions (150-2000 characters)
- Include target keywords in descriptions
- Use canonical URLs to prevent duplicate content
- Implement structured data (JSON-LD) for search engines
- Add Open Graph meta tags (title, description, image, type: website)
- Generate sitemap.xml with all streams
- Create robots.txt with proper directives
- Use semantic HTML (header, main, section, article, footer)
- Add alt text to all images (thumbnails, logos)
- Implement meta descriptions for each channel

### Responsive Design Best Practices
- Use Tailwind's responsive prefixes (sm:, md:, lg:, xl:, 2xl:)
- Mobile-first approach with min-width: 640px
- Test all features on mobile devices (iPhone, Android)
- Touch-friendly button sizes (min 44px height)
- Collapsible navigation for mobile admin access
- Responsive tables with horizontal scroll on mobile
- Optimize images for mobile (use next/image with responsive widths)
- Consider landscape orientation for mobile video playback

### Performance Considerations
- Implement code splitting with dynamic imports
- Use server components for better caching
- Lazy load heavy components (HLS.js, large lists)
- Implement pagination for lists (streams, users, ads)
- Use React.memo for expensive components
- Debounce search and form inputs
- Optimize database queries with proper includes and selects
- Add loading states for better perceived performance

## Critical Success Criteria

The implementation should be considered successful when:

1. **Core Features Working:**
   - ✅ Homepage displays streams with search
   - ✅ Stream player loads and plays M3U8 content
   - ✅ Server switching works with priority order
   - ✅ Admin panel accessible via hidden URL
   - ✅ User authentication works (admin/user roles)
   - ✅ Stream CRUD operations functional
   - ✅ Unlimited server addition/removal works
   ✅ Ad management with positions works
   - ✅ M3U playlist parser extracts channel metadata

2. **Technical Requirements:**
   - ✅ Next.js 15.4.1 with App Router
   - ✅ TypeScript with strict mode
   - ✅ Tailwind CSS 4 styling
   - ✅ shadcn/ui components used
   - ✅ Prisma ORM with SQLite database
   - ✅ Zod validation for inputs
   - ✅ HLS.js for video streaming
   - ✅ Zustand for state management
   - ✅ TanStack Query for data fetching
   - ✅ Sonner for notifications
   - ✅ Framer Motion for animations

3. **UX Requirements:**
   - ✅ Full RTL support (dir="rtl" on all pages)
   - ✅ Responsive design (mobile, tablet, desktop)
   - ✅ Loading states with skeletons
   - ✅ Error handling with user messages
   - ✅ Form validation with visual feedback
   - ✅ Toast notifications for user actions
   - ✅ Search and filter functionality
   - ✅ Pagination for large lists

4. **Security Requirements:**
   - ✅ Password hashing implemented
   - ✅ SQL injection prevention (Prisma)
   - ✅ Admin-only route protection
   - ✅ Zod validation on all inputs
   - ✅ CSRF protection
   ✅ Rate limiting on API routes

5. **SEO Requirements:**
   - ✅ Dynamic meta tags on stream pages
   - ✅ Sitemap.xml generated
   - ✅ Robots.txt configured
   - ✅ Open Graph meta tags
   - ✅ Optimized meta descriptions
   - ✅ Semantic HTML structure

6. **Database Requirements:**
   - ✅ Prisma schema with all models
   - ✅ Relations defined (Stream → Servers, Users, Ads)
   - ✅ Channel metadata in Server model
   - ✅ Migration support ready
   - ✅ Seed data for initial deployment

## Development Guidelines

### File Structure (Next.js 15 App Router)
```
src/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── stream/
│   │   └── [id]/
│   │       └── page.tsx        # Stream player page
│   ├── admin-portal-secure-2025-x7k9m2/
│   │   ├── page.tsx             # Admin panel login
│   │   ├── dashboard/
│   │   │   └── page.tsx       # Admin dashboard
│   ├── api/
│   │   ├── streams/
│   │   │   ├── route.ts         # Streams CRUD
│   │   │   └── [id]/
│   │   │       └── route.ts    # Single stream
│   │   ├── servers/
│   │   │   └── route.ts         # Servers CRUD
│   │   ├── users/
│   │   │   └── route.ts         # Users CRUD
│   │   ├── ads/
│   │   │   └── route.ts         # Ads CRUD
│   │   ├── admin/
│   │   │   └── auth/
│   │   │       └── route.ts    # Admin auth
│   │   └── playlists/
│   │       └── parse/
│   │           └── route.ts    # M3U parser
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── db.ts               # Prisma Client
│   │   ├── parsers/
│   │   │   └── m3u-parser.ts   # M3U parser
│   └── hooks/
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/             # Migration files
├── public/
│   ├── images/                  # Static assets
│   ├── robots.txt              # SEO
│   └── favicon.ico             # Favicon
└── styles/
    └── globals.css             # Global styles
```

### Component Organization
```
src/components/
├── ui/                           # shadcn/ui components
│   ├── card.tsx
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── toast.tsx
│   ├── skeleton.tsx
│   ├── alert.tsx
│   └── ... (other shadcn/ui components)
├── layout/
│   ├── header.tsx              # Header with navigation
│   ├── footer.tsx              # Footer with links
│   └── sidebar.tsx             # Admin sidebar navigation
├── features/
│   ├── video-player.tsx         # HLS.js player
│   ├── stream-selector.tsx       # Server dropdown
│   ├── m3u-parser.tsx          # M3U playlist parser
│   └── server-list.tsx           # Unlimited servers list
```

### Custom Hooks
```
src/hooks/
├── use-stream.tsx              # Stream player state
├── use-servers.tsx            # Server management
├── use-users.tsx              # User management
├── use-ads.tsx                # Ad management
└── use-m3u-parser.tsx          # M3U parsing
```

### Utilities
```
src/lib/
├── db.ts                        # Prisma client
├── parsers/
│   └── m3u-parser.ts            # M3U parser
├── utils.ts                     # Helper functions
└── constants.ts                 # App constants
```

## API Architecture

### Endpoints Overview

**Public APIs:**
- `GET /api/streams` - List all streams (supports published filter)
- `GET /api/streams/[id]` - Get single stream with servers and ads
- `POST /api/streams` - Create new stream
- `PUT /api/streams/[id]` - Update stream details

**Admin-Protected APIs:**
- `DELETE /api/streams/[id]` - Delete stream
- `POST /api/servers` - Create new server (supports channel metadata)
- `PUT /api/servers` - Update server
- `DELETE /api/servers?id={id}` - Delete server
- `POST /api/users` - Create user (admin/user role)
- `PUT /api/users` - Update user details
- `DELETE /api/users?id={id}` - Delete user
- `POST /api/ads` - Create new ad
- `PUT /api/ads` - Update ad details
- `DELETE /api/ads?id={id}` - Delete ad
- `GET /api/ads?streamId={id}` - Get stream-specific ads
- `GET /api/ads?position={pos}` - Get position-based ads
- `GET /api/ads?active={bool}` - Filter by active status

**Auth APIs:**
- `POST /api/admin/auth` - Admin login
- Returns: admin user data with role

**M3U APIs:**
- `POST /api/playlists/parse` - Parse M3U/M3U8 playlist
- Input: playlistUrl (optional) or playlistContent (optional)
- Output: Array of parsed channels with metadata

## M3U Parser Specification

### Parse Function Signature
```typescript
interface M3UParseResult {
  success: boolean;
  channels: Array<{
    channelId?: string;
    channelName?: string;
    logo?: string;
    url: string;
    duration?: number;
    groupTitle?: string;
    tvgId?: string;
  }>;
  error?: string;
}

async function parseM3UPlaylist(input: string): Promise<M3UParseResult>
```

### Required Parsing Capabilities

1. **Metadata Extraction:**
   - `#EXTINF:` line parsing
   - Channel name (after last comma in EXTINF)
   - TV guide ID (`tvg-id=""`)
   - Logo URL (`tvg-logo=""`)
   - Group title (`group-title=""`)
   - Duration (number after #EXTINF:)
   - Stream URL (line following metadata)

2. **Error Handling:**
   - Skip malformed entries gracefully
   - Log parsing errors for debugging
   - Return success: false with error message
   - Continue parsing even if some entries are invalid

3. **URL Handling:**
   - Support both absolute URLs (https://, http://)
   - Support relative URLs (/path/to/stream.m3u8)
   - Handle URLs with special characters
   - Validate URL format

4. **Format Support:**
   - Parse standard M3U format
   - Parse M3U8 format (UTF-8)
   - Handle both quoted and unquoted values
   - Detect format from first line (#EXTM3U vs #EXTM3U8)
   - Return format type to client

5. **Data Structure:**
```typescript
interface ParsedChannel {
  channelId?: string;      // From tvg-id attribute
  channelName?: string;    // From EXTINF name
  logo?: string;          // From tvg-logo attribute
  url: string;             // Stream URL (required)
  duration?: number;       // From EXTINF duration
  groupTitle?: string;     // From group-title attribute
  tvgId?: string;         // From tvg-id attribute
}
```

### Implementation Details

1. **Line-by-Line Parsing:**
   ```typescript
   const lines = content.split('\n');
   for (const line of lines) {
     line = line.trim();
     if (!line) continue;
     
     if (line.startsWith('#EXTINF:')) {
       // Parse EXTINF metadata
       const parts = line.substring(7).split(',');
       const lastCommaIndex = parts.lastIndexOf(',');
       const metadataPart = parts.slice(0, lastCommaIndex);
       const channelName = parts.slice(lastCommaIndex + 1).trim();
       // Parse attributes from metadataPart
     }
     
     // Parse stream URL
     if (!line.startsWith('#') && line.trim()) {
       channel.url = line.trim();
     }
   }
   ```

2. **Attribute Parsing:**
   ```typescript
   const attributes = metadataPart.split(/\s+/);
   for (const attr of attributes) {
     const [key, value] = attr.split('=').map(s => s.trim());
     if (value) {
       const cleanValue = value.replace(/^"|"$/g, '');
       switch (key.toLowerCase()) {
         case 'tvg-id': channel.channelId = cleanValue;
         case 'tvg-logo': channel.logo = cleanValue;
         case 'group-title': channel.groupTitle = cleanValue;
         case 'tvg-name': 
           if (!channel.channelName) channel.channelName = cleanValue;
           break;
         case 'duration': channel.duration = parseFloat(cleanValue);
       }
     }
   }
   ```

## Admin Panel Specification

### Layout Structure
```
/admin-portal-secure-2025-x7k9m2/
├── page.tsx                      # Login page
├── dashboard/
│   └── page.tsx               # Main admin dashboard
│       ├── Tabs: Streams, Servers, Users, Ads
│       ├── Stream Management: List, Create, Edit, Delete
│       ├── Server Management: Add, Edit, Delete (unlimited)
│       ├── User Management: List, Create, Edit, Delete (role management)
│       └── Ad Management: List, Create, Edit, Delete (active toggle)
├── settings/
│   └── page.tsx                # Database & config
└── logout/
```

### Stream Management Features
1. **List View:**
   - Table with sorting (newest, oldest, title)
   - Pagination (10, 25, 50 per page)
   - Search by title
   - Filter by published status
   - Show server count per stream
   - Show ad count per stream
   - Status badges (Published/Unpublished)

2. **Create/Edit Form:**
   - Title input (required)
   - Description textarea with SEO help (150-2000 chars, counter)
   - Thumbnail upload (image preview)
   - Published status (switch)
   - M3U playlist URL input (optional)
   - Category selection (optional)
   - Character counter for description
   - SEO tips and preview

3. **Server Management (Within Stream Form):**
   - Unlimited servers list
   - Add server button (dynamic)
   - Server form: name, URL, priority
   - Edit server dialog
   - Delete server with confirmation
   - Priority indicators (1, 2, 3...)
   - Channel metadata display (logo + name in dropdown)

4. **Delete Protection:**
   - Confirmation dialog
   - "Are you sure?" message
   - Warning about cascade delete (will delete associated data)
   - Undo capability (optional)

### User Management Features
1. **List View:**
   - Table with sorting (name, email, role, createdAt)
   - Pagination
   - Search by name/email
   - Role badges (Admin: yellow, User: gray)
   - Created date display

2. **Create/Edit Form:**
   - Email input (unique)
   - Name input
- Password input (hash on server)
   - Role dropdown (Admin/User)
   - Character requirements for password
   - Show/hide password option

3. **Delete Protection:**
   - Confirmation dialog
   - Warning about cascade delete

### Ad Management Features
1. **List View:**
   - Table with sorting (title, position, active status)
   - Pagination
   - Filter by position type
   - Filter by stream ID
- Active toggle (instant switch)

2. **Create/Edit Form:**
   - Title input
- Image URL input
- Link URL input (optional)
- Position dropdown (all positions)
- Active status (switch)
- Stream selector (dropdown for stream association)

3. **Ad Positions:**
   - `home-top` - Above content on homepage
   - `home-bottom` - Below content on homepage
   - `stream-top` - Above video player on stream page
   - `stream-bottom` - Below content on stream page
   - `stream-sidebar` - Sidebar ad on stream page

### M3U Playlist Parser in Admin
1. **Parser Interface:**
   - URL input field
   - "Parse Playlist" button
   - Loading state during parsing
   - Error display if parsing fails

2. **Channel List Display:**
   - Table with checkboxes
   - Columns: Select (checkbox), Channel Name, Logo, ID, Duration
   - Limit to 50-100 channels per page (performance)
   - Pagination
   - Search by channel name
   - Select All / Deselect All buttons
   - Show channel count: "Found X channels"

3. **Channel Metadata Display:**
   - Channel name (prominent)
   - Channel logo thumbnail (32x32px)
   - Channel ID badge
   - Duration display (formatted time)
   - Group title (badge style)

4. **Add to Stream:**
   - Stream selector dropdown
   - "Add Selected Channels to Stream" button
   - Show selected count
- - Priority ordering (first selected = priority 1)
- Batch add confirmation dialog

### Settings Page Features
1. **Database Section:**
   - View tables (Streams, Servers, Users, Ads, Playlists)
   - Table record counts
   - "Run Migration" button
   - "Seed Database" button
   - Connection status indicator

2. **System Info:**
   - Next.js version
- Database connection status
- Database type (SQLite/PostgreSQL)
- App version
- Deployment status

## Stream Player Page Specification

### Player Features
1. **HLS.js Integration:**
   - Auto-detect M3U8 support
- Initialize Hls.js instance
- Load M3U8 source and attach to video element
- Error recovery (fallback to native HLS)
   - Auto-play configuration

2. **Server Selector:**
   - Dropdown with server priority ordering (1, 2, 3, 4, 5+)
- Each option shows:
    - Channel logo (20x20px)
    - Channel name
    - Server name (Server 1, Server 2, etc.)
    - Ping/quality indicator (optional)

3. **Video Controls:**
   - Play/Pause toggle
- Volume slider
- Fullscreen toggle
- Quality selector (if adaptive streaming available)

4. **Stream Information:**
   - Title card (prominent)
- Description card (SEO optimized)
  - Server info display (current server, priority)
  - Streaming status (Online/Offline indicator with green/red dot)
  - View count (X viewers online)

5. **Related Streams:**
   - Grid of 3-6 related streams
- Each with thumbnail, title
- Hover effect with scale animation
- "More from [Category]" link

### Ad Placements

### Homepage Ad Spots
1. **Top Banner:**
   - Carousel or grid layout (1-2 ads)
   - Position: `home-top`
   - Grid on desktop, stack on mobile
   - Full-width banners (1920x1080)

2. **Bottom Section:**
   - Grid layout (3 ads)
   - Position: `home-bottom`
   - Below hero section

### Stream Page Ad Spots
1. **Above Player:**
   - Banner ad (728x90)
   - Position: `stream-top`
   - Optional link URL

2. **Sidebar:**
   - Vertical ad (300x600)
   - Position: `stream-sidebar`
   - Below content, fixed position

3. **Below Player:**
   - Banner ad (728x90)
   - Position: `stream-bottom`
- Optional link URL

## RTL Implementation Guide

### HTML Attributes
- Add `dir="rtl"` to `<html>` tag in root layout
- Add `lang="ar"` for Arabic language support
- Ensure all text is properly aligned right-to-left

### Tailwind RTL Support
- Use `flex-row-reverse` for RTL layouts
- Use `ml-auto` instead of `mr-auto` for right margin
- Use logical properties in conditionals: `rtl` for checking RTL mode
- Flip order for lists (first element is first in RTL: `border-r-0` for last in RTL)

### CSS Properties
- Use `text-right` for text alignment (aligns text right in RTL)
- Use `text-left` for left-aligned elements
- Use `flex-row-reverse` for icon positioning
- Use `rounded-r-*` for RTL-aware border radius

### Component RTL Considerations
- Progress bars: `rtl` direction (fill from right to left)
- Stepper: Use RTL steps
- Forms: RTL label alignment (labels on right of inputs)
- Dropdowns: Menu opens to left, submenus to right

## Deployment Strategy

### Development → Production
1. **Start with SQLite** (easy local setup)
   - Test all features locally
   - Create admin user for initial access
   - Add test streams with sample content
   - Verify RTL layout works
   - Test streaming functionality

2. **Upgrade to PostgreSQL for Production**
   - Create Postgres database (Vercel Postgres, Neon, or Supabase)
   - Run migrations: `npx prisma migrate deploy`
   - Update DATABASE_URL environment variable
   - Test database connection

3. **Deploy to Vercel** (Recommended)
   - Automatic builds from GitHub
   - One-command deployment
   - Built-in CDN (Edge Network)
   - Automatic HTTPS
   - Configure environment variables
   - Set up custom domain (optional)
   - Enable monitoring and analytics

4. **Monitoring & Analytics**
   - Vercel Analytics (built-in)
  - Real-time logs
  - Error tracking (Sentry recommended for production)
  - Performance monitoring
  - User analytics (optional)

## Database Migration Strategy

### Development
```bash
# Generate initial migration
npx prisma migrate dev --name init

# Add more migrations as features grow
npx prisma migrate dev --name add-servers
npx prisma migrate dev --name add-channel-metadata
```

### Production
```bash
# Deploy schema changes
npx prisma migrate deploy

# Verify database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

## Code Quality Standards

### TypeScript
- Use strict type checking
- No `any` types unless absolutely necessary
- Proper interface definitions for all data structures
- Use `as` type assertions when type is known
- Enable strict null checks

### React Best Practices
- Functional components with hooks
- Proper state management (no prop drilling where possible)
- Avoid direct state mutations (use setter functions)
- Use `useCallback` for event handlers
- Proper cleanup in useEffect (remove listeners)
- Key props memoization with `React.memo`
- Use proper dependency arrays

### Security
- No hardcoded credentials in code
- Use environment variables for sensitive data
- Sanitize all user inputs
- Validate all database queries
- Use parameterized queries (no string concatenation)
- Implement CSRF protection on all forms
- Rate limit API endpoints
- Validate file uploads (type, size, format)

### Performance
- Optimize re-renders: Add React.memo to expensive components
- Use lazy loading for images and heavy components
- Implement pagination for large lists
- Debounce search and form inputs
- Optimize images with next/image
- Use server components for caching
- Code splitting with dynamic imports

## Testing Requirements

### Unit Tests
- Test M3U parser with various playlist formats
- Test Zod validation schemas
- Test API endpoints with mock data
- Test error handling scenarios
- Test state management logic

### Integration Tests
- Test admin authentication flow
- Test stream creation and editing
- Test server addition/removal
- Test M3U playlist to server conversion
- Test video player HLS.js integration
- Test server switching functionality
- Test ad placement across all positions

### E2E Tests
- Test RTL layout on real devices
- Test responsive breakpoints
- Test touch interactions on mobile
- Test keyboard navigation
- Test streaming on mobile networks

## Success Metrics

The project will be considered successful when:

1. All features implemented correctly
2. Responsive design works on all devices
3. RTL interface is proper throughout
4. M3U playlists parse successfully
5. HLS.js streaming works smoothly
6. Admin panel is accessible and functional
7. All CRUD operations work correctly
8. Streaming works across different server qualities
9. SEO is properly optimized
10. Database operations are secure and efficient
11. Application is deployed and accessible
12. No critical security vulnerabilities
13. Performance is optimized (good load times)
14. User experience is excellent

---

## Final Notes

This platform should be built as a **complete, production-ready IPTV streaming service** that rivals popular commercial platforms.

**Key Differentiators:**
- Unlimited servers per stream (not limited to 4)
- Channel metadata from M3U playlists
- Modern tech stack (Next.js 15, TypeScript, Prisma, HLS.js)
- Responsive design
- RTL Arabic interface
- SEO optimization
- Clean admin interface
- Ad monetization support

**Deployment Flexibility:**
- Easy to deploy to Vercel (automatic)
- Can switch to PostgreSQL for production
- Can deploy to other platforms (Railway, DigitalOcean)
- Portable and well-organized code

You're building a professional-grade IPTV streaming platform with modern best practices! 🚀
