# FIND_THEM - Lost & Found Pets App

> The default coordination layer for reuniting lost animals with owners across the United States.

## Mission

Build a modern, trustworthy, and emotionally intelligent app that's simple enough for everyday people and powerful enough for shelters and volunteers to rely on.

## Stack

- **Mobile**: Expo SDK 52 + React Native + TypeScript
- **Backend**: Supabase (Postgres 15 + PostGIS + Storage + Auth + Edge Functions)
- **Web Share**: Next.js 15 for public post pages
- **Push**: Expo Push Notifications
- **Maps**: react-native-maps (Apple Maps on iOS)

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Expo CLI: `npm install -g expo-cli eas-cli`
- Supabase CLI: `brew install supabase/tap/supabase` (or see [docs](https://supabase.com/docs/guides/cli))
- iOS Simulator (Xcode) or Expo Go app on physical device

### 1. Clone and Install
```bash
git clone <repo-url>
cd find-them
npm install
```

### 2. Set Up Supabase

**Option A: Local Development**
```bash
cd supabase
supabase init
supabase start
# Copy the anon key and API URL shown
```

**Option B: Hosted Supabase**
```bash
# Create project at https://app.supabase.com
# Copy API URL and anon key from project settings
```

### 3. Configure Environment
```bash
cd apps/mobile
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 4. Run Database Migrations
```bash
cd supabase
supabase db reset  # Runs all migrations
```

### 5. Start Mobile App
```bash
cd apps/mobile
npm run ios  # For iOS simulator
# or
npm run start  # For Expo Go
```

### 6. Start Web Share Site (Optional)
```bash
cd apps/web
npm run dev
# Open http://localhost:3000
```

## Project Structure

```
find-them/
├── apps/
│   ├── mobile/          # Expo React Native app
│   │   ├── app/         # Expo Router file-based routing
│   │   ├── components/  # Reusable UI components
│   │   ├── services/    # API clients, auth, push
│   │   └── assets/      # Images, fonts
│   └── web/             # Next.js public share pages
│       ├── app/         # App router
│       └── components/  # Server/client components
├── packages/
│   └── shared/          # Shared types, validation, utils
│       ├── types/       # TypeScript interfaces
│       ├── schemas/     # Zod validation schemas
│       └── utils/       # Helper functions
├── supabase/
│   ├── migrations/      # SQL schema migrations
│   ├── functions/       # Edge functions (matching engine, etc)
│   └── seed.sql         # Sample data for testing
└── docs/
    ├── PRODUCT_SPEC.md  # Detailed feature specs
    ├── API.md           # API documentation
    └── APP_STORE_CHECKLIST.md  # Submission requirements
```

## Development Workflow

### Running Migrations
```bash
cd supabase
supabase migration new <migration_name>
# Edit the generated migration file
supabase db reset  # Apply migrations
```

### Deploying Edge Functions
```bash
cd supabase
supabase functions deploy match-engine
```

### Building for Production
```bash
cd apps/mobile
eas build --platform ios --profile production
```

## Key Features (MVP)

- ✅ Apple Sign-In authentication
- ✅ Post lost pet with photos and location
- ✅ Quick sighting posts (< 20 seconds)
- ✅ Geospatial feed (sorted by distance + recency)
- ✅ Map view with clustering
- ✅ Automated matching & push notifications
- ✅ Reunited flow with karma rewards
- ✅ Public shareable post links
- ✅ Reporting & moderation
- ✅ Karma points system
- 🚧 Donations (stub for MVP)

## Upcoming Features (V2)

- Android support
- Image similarity matching (ML)
- Live Activities (iOS 16+)
- Karma redemption for partner rewards
- Shelter partnerships
- Multi-language support

## Contributing

This is a mission-driven project. PRs welcome for:
- Bug fixes
- Performance improvements
- Accessibility enhancements
- Security hardening

Avoid:
- Over-engineering
- Feature creep before MVP launch
- Dependencies with large bundle sizes

## License

TBD - Founder to decide

## Contact

For questions, see docs/ or open an issue.
