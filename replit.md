# TerraNova Land Marketplace

## Overview

TerraNova is an AI-first land marketplace platform designed for buying, selling, and managing land properties. It aims to provide an immersive experience for all stakeholders—buyers, sellers, agents, and developers—by integrating cutting-edge design with intelligent, AI-powered tools and robust data management. The platform seeks to offer a comprehensive solution for land transactions, enhancing user experience and streamlining property dealings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework & Build**: React with TypeScript, Vite
- **Styling**: Tailwind CSS with custom theming, Radix UI for components
- **State Management**: React Query
- **Routing**: React Router
- **Mapping**: Interactive mapping with coordinate-based boundaries, automatic zoom, and synchronized search/map states.
- **UI/UX Decisions**: Award-winning design featuring premium gradient hero sections, modern search interfaces, sticky filters, responsive design with custom CSS animations, and patterned backgrounds. Specific mobile optimizations include a bottom navigation bar, compact headers, touch-optimized property cards, and dedicated mobile filter sheets.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom system
- **File Uploads**: Multer for property media
- **Performance Optimization**: Database query optimization, in-memory caching, GZIP compression, React Query optimization, virtualized lists, lazy image loading, and memoized map markers.

### Core Features
- **AI-Powered Search**: Natural language search using advanced AI models (OpenAI GPT-4o, Claude) with autocomplete, geocoding via MapBox, and fallbacks to basic database search for filtering properties.
- **Property Management System**: Supports various land types (residential, commercial, agricultural, recreational, industrial) with comprehensive filtering, dynamic state detection, geospatial search, and media/document management.
- **Agent Directory**: Features comprehensive agent profiles including certifications, specialties, reviews, and AI-powered expertise matching.
- **Communication System**: Professional contact forms for email/SMS (Twilio integration) on property and agent pages, including agent notifications and user confirmations.
- **Web Scraping Integration**: Capability to import property data from external websites using multiple extractors.

### System Design Choices
- **SSR-safe data handling**: Implemented helper functions to ensure synchronous and SSR-compatible retrieval of initial viewport and bounds from session storage for consistent map rendering.
- **Stale Closure Prevention**: Utilized ref-based state updates (`updateVisiblePropertiesRef`, `searchCounterRef`) in map and search components to ensure event handlers always access the latest state, resolving issues with map marker display and sidebar updates.
- **Search Logic Enhancements**: Implemented priority-based location filtering (City+State > City > State > Any-term match) and a fallback mechanism to display the 20 nearest properties when a specific search yields no results.
- **Homepage Search Flow**: Geocodes search queries before navigation and populates session storage to ensure the properties page initializes the map correctly upon arrival.
- **Search Mode Stability**: Implemented three-layer protection against premature search mode exit: (1) `isZoomingRef` for programmatic zooms, (2) `pendingSearchTransitionRef` for pending transitions, (3) 2-second grace period via `searchTransitionCompleteTimeRef` set before `fitBounds` calls.

### Mobile UI Redesign
- **Glassmorphism Search Capsule**: Fixed position below header with backdrop-blur, z-[70] stacking, pointer-events-none background for tap-through.
- **Mobile Geocoding**: Full MapBox geocoding integration matching desktop ExactSearchBar with state extraction, zoom level determination, and sessionStorage sync.
- **Safe-Area Layout**: Map controls positioned with safe-area-inset padding to avoid MobileBottomNav overlap, 44px touch targets.
- **Mobile Filters Parity**: 21 property types, terrain/activities, residence features, special features matching desktop filter options.

### Property Details Page Redesign (Jan 2026)
- **Modern Icon-Based Features Grid**: PropertyFeaturesGrid component with lucide icons (Ruler, Home, Mountain, Plug, Car, Scale, Droplet) for acreage, property type, terrain, zoning, road access, utilities, water features.
- **Unified Land & Boundaries Section**: LandBoundariesSection component combining property location, map, and multi-tract visualization with color-coded tract details and legends.
- **Resources Section**: Clean two-column "Attachments" layout with blue external links and ExternalLink icons.
- **Property Video Section**: Standalone PropertyVideoSection with YouTube thumbnail preview and click-to-play.
- **Property Location Section**: Aspect-video sizing matching video frame width with rounded-xl corners and satellite map.
- **Premium Agent Profile Card**: World-class AgentProfileCard component with gradient cover, rounded profile photo, verified badge, star ratings, stats grid (years exp, deals, listings), bio section, specialization tags, and contact/profile buttons. Matches design standards of major social/commerce platforms.
- **Conditional Related Properties**: Shows AgentListings when agent has other properties, falls back to NearbyProperties (4-8 proximity-sorted cards) when agent has no other listings.
- **Mobile Accordion Layout**: Overview, Property Features, Location & Boundaries, Resources & Documents sections with aria-expanded/aria-controls for accessibility.

### Zillow-Style Map Interactions (Jan 2026)
- **Property Popup on Marker Click**: Clicking a map marker shows a Zillow-style popup with property image, price, acreage, property type, and location. DOM-based construction for XSS safety.
- **Marker Highlight State**: Selected marker grows larger (16px → 24px) and turns darker blue (#1d4ed8) with enhanced shadow, mimicking Zillow's visual feedback.
- **SPA Navigation**: Clicking popup navigates via onPropertySelect for proper SPA routing without page reload.
- **Consistent Behavior**: Same popup logic applies after map style toggle (satellite/streets) via showPropertyPopupRef.

### Multi-Tract Property Display (Jan 2026)
- **Auto-Show Boundaries**: Properties with multiple tracts automatically show all tract boundaries on page load
- **Current Tract Highlighting**: The current tract is highlighted in bright green (#22c55e) with a glowing white border, while other tracts show in muted amber/emerald/violet colors
- **Tract Labels**: Each tract displays a numbered label with acreage (e.g., "1" with "20.2 ac") positioned at polygon centroid
- **Pulsing Animation**: Current tract label has a subtle green glow pulse animation for visual emphasis
- **Interactive Legend**: Top-left legend shows "This Tract" (green) vs "Other Tracts" color coding
- **Tract Indicator Badge**: Green pill below map shows "Tract X of Y • Z acres" for multi-tract properties
- **Toggle Controls**: "Hide Boundary", "This Tract Only / All X Tracts", and label visibility toggle buttons
- **ClassicCountryLand-Inspired Design**: Multi-tract visualization inspired by classiccountryland.com with professional subdivision-style display

## External Dependencies

- **Database**: PostgreSQL (via Neon serverless)
- **ORM**: Drizzle Kit
- **AI Providers**: OpenAI GPT-4o, Anthropic AI SDK (Claude)
- **Mapping**: MapBox (geocoding, interactive maps), @turf/turf (geospatial analysis)
- **Communication**: Twilio (SMS/email), SendGrid (email notifications)