# Find Them - Product Specification

## Mission Statement

Build the default coordination layer for reuniting lost animals with owners across the United States. The app must feel modern (2026 UX), trustworthy, and emotionally intelligent while remaining simple enough for everyday people and powerful enough for shelters and volunteers.

## Core Value Proposition

When someone sees a lost pet, they can **instantly**:
1. Post a sighting with minimal friction (< 20 seconds)
2. Notify nearby owners automatically via smart matching
3. Coordinate help through in-app messaging
4. Close the loop when reunited
5. Earn Karma Points for verified helpful actions

## MVP Feature Set

### 1. Authentication & Onboarding
- **Apple Sign-In** (primary)
- Email/password (fallback)
- Minimal profile creation: display name, optional avatar
- Location permission with clear justification
- Notification permission opt-in

**Acceptance Criteria:**
- User can sign in via Apple ID in < 30 seconds
- Location permission explains "to show nearby lost pets"
- No unnecessary friction during signup

### 2. Lost Pet Posting
**User Flow:**
1. Tap "Report Lost Pet"
2. Upload 1-5 photos (camera or library)
3. Fill form: Name, Species, Breed, Colors, Distinguishing marks
4. Set last-seen location (map pin, defaults to current location)
5. Set last-seen time
6. Choose contact method (in-app only or allow phone reveal)
7. Preview and submit

**Acceptance Criteria:**
- Complete post in < 60 seconds
- Generates shareable public URL immediately
- Post appears in nearby users' feeds within 5 minutes
- Photo upload handles failures gracefully

### 3. Sighting Posting
**User Flow:**
1. Tap floating action button (FAB)
2. Optional: Capture photo
3. Auto-capture GPS and timestamp
4. Quick form: Description, Animal type, Color tags
5. Submit

**Acceptance Criteria:**
- Complete in < 20 seconds
- Works offline (queues for upload)
- GPS locked to moment of sighting
- Appears in matching engine within 5 minutes

### 4. Feed View
**Features:**
- Card-based infinite scroll
- Sorted by: distance × recency × match potential
- Filter chips: Lost/Sightings, Species, Distance (1-50 miles)
- Pull to refresh
- Status badges: "Lost", "Sighting", "Reunited ✨"

**Acceptance Criteria:**
- Loads within 2 seconds on 4G
- Pagination (20 posts per page)
- Empty state encourages first post

### 5. Map View
**Features:**
- Centered on user location
- Red pins: Lost pets
- Blue pins: Sightings
- Clustering for dense areas
- Tap pin → Mini card → Tap → Full detail
- Same filters as feed
- Radius circle overlay

**Acceptance Criteria:**
- Loads within 3 seconds
- Pins cluster when > 10 in area
- Real-time updates via Supabase subscriptions (stretch)

### 6. Post Detail
**Features:**
- Full-screen image carousel
- All details with map embed
- Action buttons: Share, Report, Message Owner
- "I saw this pet!" → Quick sighting form (for lost posts)
- "This is my pet!" → Claim flow (for sightings)
- Comment thread for coordination

**Acceptance Criteria:**
- Images load progressively
- Share generates rich preview for iMessage/WhatsApp
- Message owner uses in-app chat (phone # hidden)

### 7. Matching & Notifications
**Automated Process:**
1. Edge function runs every 5 minutes
2. Compares new sightings to active lost posts within radius
3. Calculates match score (distance + time + animal type + colors)
4. If score > 70: Create match, send push notifications

**Acceptance Criteria:**
- Owner notified within 5 minutes of high-confidence match
- Notification deep-links to side-by-side comparison
- User can dismiss match ("Not my pet")
- False positive rate < 20%

### 8. Reunited Flow
**User Flow:**
1. Owner taps "Mark as Reunited"
2. Select helpful sightings/users
3. Gratitude screen with confetti
4. Karma awarded to helpers
5. Post archived (viewable via link, removed from feed)
6. Optional: Share reunion story

**Acceptance Criteria:**
- 2-tap flow
- Helpers notified: "🎉 Max was reunited! You earned 50 Karma."
- Post removed from active feeds after 24h
- Public link still works (shows "Reunited" banner)

### 9. Karma System (Non-Crypto MVP)

**Earning Karma:**
| Action | Points | Validation |
|--------|--------|------------|
| Post sighting | +10 | Auto (max 5/day) |
| Sighting marked helpful | +50 | Owner confirmation |
| Assisted reunion | +100 | Owner marks users |
| Photo improves match | +20 | Algorithm boost |
| Complete profile | +5 | One-time |

**Anti-Gaming:**
- Cooldowns: Max 5 sightings/day for credit
- Trust score: New users earn 50% karma first 7 days
- Spam penalties: Reported posts forfeit karma

**MVP Usage:**
- Display only: Profile badge, leaderboard
- V2: Redeem for shelter donations, partner rewards

**Badges:**
- 🏆 First Sighter
- 👀 Eagle Eye (5 helpful sightings)
- 💫 Reuniter (1 reunion)
- 🌟 Hero (5 reunions)
- 👑 Legend (1000+ karma)

### 10. Reporting & Moderation
**Features:**
- Report button on posts/profiles
- Reasons: Spam, Scam, Inappropriate, Suspected abuse, Other
- Block user (hides all content)
- Auto-shadow-ban: 3+ reports pending review

**Acceptance Criteria:**
- Report in < 10 seconds
- Blocked users can't contact reporter
- Safety disclaimer: "Do not confront suspected thieves"

### 11. Profile & Settings
**Features:**
- Avatar, name, join date
- Karma score & breakdown
- Badges display
- Posts history (lost, sightings, comments)
- Privacy toggles:
  - Make profile public/private
  - Show exact vs approximate location
- Notification preferences

### 12. Donations (MVP Stub)
**MVP Approach:**
- Info page: "Support verified shelters"
- Email collection for v2 launch
- **Stretch:** Stripe Checkout ($5, $10, $25, Custom)

---

## Technical Architecture

### Stack
- **Mobile:** Expo SDK 52 + React Native + TypeScript
- **Backend:** Supabase (Postgres + PostGIS + Auth + Edge Functions + Storage)
- **Web:** Next.js 15 (public share pages)
- **Maps:** react-native-maps (Apple Maps on iOS)
- **Push:** Expo Push Notifications
- **State:** Zustand
- **Payments (v2):** Stripe

### Database Schema
See `supabase/migrations/` for full schema.

**Key Tables:**
- `profiles` - User data, karma, trust score
- `pet_posts` - Lost pet reports
- `sighting_posts` - Found/seen pets
- `matches` - System-generated potential matches
- `karma_ledger` - Karma transactions
- `reports`, `blocks` - Moderation
- `comments` - Coordination threads
- `push_tokens` - Expo push notification tokens
- `donations` - Pledge/payment records (stub)

**Geospatial:**
- PostGIS `GEOGRAPHY(POINT, 4326)` for locations
- `ST_DWithin`, `ST_Distance` for radius queries
- Indexed with GIST for performance

---

## Matching Algorithm (MVP)

### Score Components (0-100 total)

**Distance Score (0-40 points):**
- 0-0.25 mi: 40 pts
- 0.25-1 mi: 30 pts
- 1-5 mi: 20 pts
- 5-10 mi: 10 pts
- 10+ mi: 0 pts

**Time Score (0-30 points):**
- 0-6 hrs: 30 pts
- 6-24 hrs: 20 pts
- 24-72 hrs: 10 pts
- 72+ hrs: 0 pts

**Animal Type (0-20 points):**
- Match: 20 pts
- No match: 0 pts

**Color Overlap (0-10 points):**
- Each matching color: +5 pts (max 10)

**Threshold:** Score ≥ 70 → Notify owner + sighter

### Future Enhancements (V2)
- Image similarity (ML model)
- Breed detection
- Collar/tag recognition
- Facial recognition for pets
- User reputation weighting

---

## Safety & Privacy

### Anti-Abuse Measures
1. **Rate Limits:**
   - Max 10 posts per day
   - Max 5 karma-eligible sightings per day
2. **Shadow Banning:**
   - 3+ reports → Auto-shadow-ban pending review
3. **Trust Score:**
   - New users: 0.5x karma multiplier for 7 days
   - Spam reports reduce trust
4. **Location Privacy:**
   - Default: Approximate location (1km radius)
   - Owner can toggle exact location
5. **Contact Privacy:**
   - No phone numbers shown publicly
   - In-app messaging only (unless user opts in)

### Safety Guidelines (In-App)
- **Do not confront suspected pet thieves**
- Meet in public places for pet handoff
- Verify ownership (photos, vet records, microchip)
- Report suspicious behavior

### Content Moderation
- User reports queue for review
- Flagged content includes snapshot
- Admins can:
  - Remove posts
  - Ban users
  - Reverse shadow bans
  - Adjust karma

---

## 2026 UX Enhancements

### Implemented (MVP)
1. **Public share links** - Non-users can view posts instantly
2. **Smart notifications** - Only high-confidence matches
3. **Reunited flow** - Gratitude + karma closure

### Roadmap (V2)
1. **Auto-summary** - AI-generated 1-liner for posts
2. **Smart prompts** - "Did you see a collar?" during posting
3. **Poster generator** - Social media shareable image
4. **iOS Live Activities** - Real-time match updates on lock screen
5. **Home screen widget** - Nearby lost pets at a glance
6. **Nearby helper mode** - Toggle to see all nearby posts (with quiet hours)

---

## App Store Requirements

### Permissions Justifications
**Location (When In Use):**
> "We need your location to show nearby lost pets and help reunite animals with their owners. Your exact location is never shared publicly without your permission."

**Camera:**
> "We need camera access to let you take photos of lost or found pets."

**Photo Library:**
> "We need photo library access to let you upload photos of lost or found pets."

**Notifications:**
> "We'll notify you when someone reports a sighting that matches your lost pet, or when your sighting helps reunite a pet."

### Privacy Policy (Key Points)
- No selling of user data
- Location data used only for matching
- Photos stored securely (Supabase Storage)
- Users can delete all data
- COPPA compliant (13+)
- GDPR/CCPA rights honored

### App Store Metadata
**Name:** Find Them - Lost & Found Pets
**Subtitle:** Reunite pets with their families
**Keywords:** lost pet, found pet, pet finder, lost dog, lost cat, animal rescue, pet reunion
**Category:** Lifestyle
**Age Rating:** 4+ (no objectionable content)

---

## Success Metrics (Post-Launch)

### North Star Metric
**Reunions per week** - Direct measure of impact

### Supporting Metrics
- MAU (Monthly Active Users)
- Avg time to reunion (days)
- Sightings per lost post
- Match accuracy (% confirmed matches)
- Karma distribution (engagement proxy)
- Retention (D1, D7, D30)
- Share rate (viral coefficient)

### Quality Metrics
- False positive match rate (target < 20%)
- Report rate (target < 2%)
- App Store rating (target ≥ 4.7)

---

## V2 Features (Post-MVP)

### High Priority
1. **Android app** - Expand reach
2. **Image ML** - Improve match accuracy
3. **Karma redemption** - Partner rewards (Chewy, Petco)
4. **Shelter partnerships** - Verified shelter accounts
5. **Live Activities** - iOS 16+ lock screen updates

### Medium Priority
1. **Multi-language** - Spanish, Mandarin
2. **Breed detection** - Auto-tag from photos
3. **Microchip registry** - Integration with national DBs
4. **In-app chat** - Real-time messaging
5. **Success stories** - Highlight reunions

### Low Priority (Nice to Have)
1. **Pet passport** - Digital profile for owned pets
2. **Lost pet insurance** - Partner integration
3. **Community alerts** - Notify neighborhood volunteers
4. **API for shelters** - Bulk post import
5. **Desktop web app** - Full-featured web version

---

## Launch Checklist

- [ ] Complete App Store submission
- [ ] Privacy policy live
- [ ] Terms of service live
- [ ] Support email set up
- [ ] Analytics configured (privacy-respecting)
- [ ] Crash reporting (Sentry or similar)
- [ ] Edge function deployed and tested
- [ ] Database backups configured
- [ ] Rate limiting tested
- [ ] App Store screenshots and metadata
- [ ] Beta test with 20+ users
- [ ] Social media presence (Instagram, Twitter)
- [ ] PR outreach to pet blogs/influencers

---

**Document Version:** 1.0
**Last Updated:** 2026-01-11
**Owner:** Founder
