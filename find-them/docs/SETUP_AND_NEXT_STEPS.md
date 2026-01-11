# Find Them - Setup Instructions & Next Steps

## Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
cd find-them
npm install

cd apps/mobile
npm install

cd ../web
npm install
```

### 2. Set Up Supabase

**Option A: Hosted Supabase (Recommended for MVP)**
1. Go to https://app.supabase.com
2. Create new project: `find-them-prod`
3. Wait for project to provision (~2 minutes)
4. Go to Settings → API
5. Copy `URL` and `anon public` key

**Option B: Local Development**
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Initialize Supabase
cd find-them/supabase
supabase init

# Start local Supabase (requires Docker)
supabase start

# Note the API URL and anon key from output
```

### 3. Configure Environment Variables

**Mobile App:**
```bash
cd apps/mobile
cp .env.example .env
# Edit .env with your Supabase credentials
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Web App:**
```bash
cd apps/web
cp .env.example .env
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Database Migrations

**If using hosted Supabase:**
```bash
cd supabase
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

**If using local Supabase:**
```bash
cd supabase
supabase db reset  # Runs all migrations
```

### 5. Enable PostGIS Extension in Supabase Dashboard
1. Go to Supabase Dashboard → Database → Extensions
2. Search for "postgis"
3. Enable PostGIS
4. Refresh page and verify it's enabled

### 6. Create Storage Bucket
1. Go to Supabase Dashboard → Storage
2. Create new bucket: `pet-photos`
3. Set as **public** bucket
4. Save

### 7. Start Development Servers

**Mobile App:**
```bash
cd apps/mobile
npm start

# Then press:
# 'i' for iOS simulator
# 'a' for Android emulator
# Scan QR code with Expo Go for physical device
```

**Web App:**
```bash
cd apps/web
npm run dev
# Open http://localhost:3000
```

---

## Next 10 Execution Steps (This Week)

### Day 1-2: Complete Core Features

#### 1. Implement Remaining Screens
**Priority:** HIGH

Files to create:
- `apps/mobile/app/create-lost.tsx` - Full lost pet form with photo picker
- `apps/mobile/app/create-sighting.tsx` - Quick sighting form
- `apps/mobile/app/post/[id].tsx` - Post detail view
- `apps/mobile/app/(auth)/email-signin.tsx` - Email auth fallback

**Acceptance Criteria:**
- [ ] User can create lost post with photos
- [ ] User can create sighting in < 20 seconds
- [ ] Post detail shows all info + map
- [ ] Email auth works as fallback

**Code Template (create-lost.tsx):**
```typescript
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { createPetPost, uploadPhoto } from '@/services/api'
import { getCurrentLocation, reverseGeocode } from '@/services/location'

export default function CreateLost() {
  const [photos, setPhotos] = useState<string[]>([])
  const [petName, setPetName] = useState('')
  const [description, setDescription] = useState('')
  // ... more fields

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    })

    if (!result.canceled) {
      setPhotos([...photos, ...result.assets.map(a => a.uri)])
    }
  }

  const handleSubmit = async () => {
    // Upload photos
    const uploadedUrls = await Promise.all(
      photos.map(uri => uploadPhoto(uri))
    )

    // Get location
    const location = await getCurrentLocation()
    const address = await reverseGeocode(location.latitude, location.longitude)

    // Create post
    await createPetPost({
      pet_name: petName,
      description,
      photos: uploadedUrls,
      location,
      address,
      // ... more fields
    })

    router.back()
  }

  return (
    // Form UI here
  )
}
```

---

#### 2. Implement Map View with Markers
**Priority:** HIGH

Update `apps/mobile/app/(tabs)/map.tsx`:
- Fetch nearby posts
- Render markers (red for lost, blue for sightings)
- Implement marker clustering
- Tap marker → Show callout → Tap callout → Open detail

**Libraries needed:**
```bash
npm install react-native-map-clustering
```

---

#### 3. Add Image Compression
**Priority:** MEDIUM

Photos should be < 2MB before upload.

```bash
cd apps/mobile
npm install expo-image-manipulator
```

Update `services/api.ts`:
```typescript
import * as ImageManipulator from 'expo-image-manipulator'

async function compressImage(uri: string) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  )
  return result.uri
}
```

---

### Day 3-4: Polish & Testing

#### 4. Implement Share Functionality
**Priority:** HIGH

Use Expo's sharing API to share post links.

```typescript
import * as Sharing from 'expo-sharing'

const sharePost = async (postId: string) => {
  const url = `https://findthem.app/post/${postId}`
  await Sharing.shareAsync(url, {
    dialogTitle: 'Help find this pet',
  })
}
```

---

#### 5. Add Error Handling & Loading States
**Priority:** HIGH

Every API call should have:
- Loading spinner
- Error message display
- Retry mechanism

Example pattern:
```typescript
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

const loadData = async () => {
  setLoading(true)
  setError(null)
  try {
    const data = await fetchData()
    setData(data)
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

---

#### 6. Deploy Edge Function
**Priority:** HIGH

```bash
cd supabase

# Deploy match-engine function
supabase functions deploy match-engine

# Set up cron job to run every 5 minutes
# In Supabase Dashboard → Database → Extensions → enable pg_cron
# Then create cron job:
```

SQL:
```sql
SELECT cron.schedule(
  'match-engine-cron',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    'https://your-project.supabase.co/functions/v1/match-engine',
    '{}',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  )
  $$
);
```

---

#### 7. Test Push Notifications End-to-End
**Priority:** HIGH

1. Create test lost post
2. Create test sighting nearby
3. Wait 5 minutes (or manually trigger match-engine)
4. Verify push notification received on physical device
5. Tap notification → App opens to match detail

**Debug checklist:**
- [ ] Expo push token saved in database
- [ ] Match-engine function executed successfully
- [ ] Notification sent via Expo push API
- [ ] Notification appears on device

---

### Day 5-6: App Store Preparation

#### 8. Create App Icons & Screenshots
**Priority:** HIGH

**App Icon:**
- Design 1024x1024 icon (no transparency)
- Use Figma, Canva, or hire designer on Fiverr ($20-50)
- Export as PNG

**Screenshots (use simulator or physical device):**
- iPhone 6.7" (iPhone 14 Pro Max or later)
- Capture 5 screens: Feed, Map, Create Post, Match, Reunited
- Use tools:
  - Xcode Simulator: Cmd+S to save screenshot
  - Or use Screenshot.app (https://screenshot.app) for beautiful frames

**Store in:**
```
find-them/assets/app-store/
  - icon-1024.png
  - screenshot-1-feed.png
  - screenshot-2-map.png
  - screenshot-3-create.png
  - screenshot-4-match.png
  - screenshot-5-reunited.png
```

---

#### 9. Write Privacy Policy & Terms
**Priority:** HIGH

**Quick solution:** Use generators
- https://www.privacypolicygenerator.info/
- https://www.termsandconditionsgenerator.com/

**Host at:**
- Netlify (free)
- Vercel (free)
- Or add to Next.js web app at `/privacy` and `/terms`

**Must include:**
- What data you collect (location, photos, name, email)
- Why you collect it (to reunite pets)
- How it's stored (Supabase, encrypted)
- User rights (view, delete data)
- GDPR/CCPA compliance
- Contact email for privacy requests

---

#### 10. Build & Submit to App Store
**Priority:** HIGH

**Step-by-step:**

1. **Create Expo account:**
```bash
npm install -g eas-cli
eas login
```

2. **Configure EAS:**
```bash
cd apps/mobile
eas init
```

3. **Create eas.json:**
```json
{
  "build": {
    "production": {
      "ios": {
        "buildType": "release"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      }
    }
  }
}
```

4. **Build for iOS:**
```bash
eas build --platform ios --profile production
```

This will:
- Prompt for Apple Developer credentials
- Generate distribution certificate
- Build .ipa file
- Upload to EAS servers

5. **Download .ipa and upload to App Store Connect:**
```bash
# OR use EAS Submit (easier)
eas submit --platform ios --profile production
```

6. **Fill out App Store Connect:**
- Go to https://appstoreconnect.apple.com
- Create new app
- Fill metadata (see APP_STORE_CHECKLIST.md)
- Upload screenshots
- Add privacy policy URL
- Submit for review

**Timeline:** 24-48 hours for review

---

## Production Deployment Checklist

### Supabase Production Setup
- [ ] Create production Supabase project
- [ ] Run all migrations
- [ ] Enable PostGIS extension
- [ ] Create `pet-photos` storage bucket (public)
- [ ] Set up Row Level Security policies
- [ ] Deploy Edge Functions
- [ ] Set up cron job for match-engine
- [ ] Configure custom domain (optional): `api.findthem.app`

### Mobile App Production Build
- [ ] Update `app.json` with correct bundle ID and version
- [ ] Add production Supabase URL to `.env`
- [ ] Test on physical device
- [ ] Build with EAS: `eas build --platform ios --profile production`
- [ ] Submit to App Store

### Web App Deployment
- [ ] Deploy to Vercel (free):
  ```bash
  cd apps/web
  vercel --prod
  ```
- [ ] Add environment variables in Vercel dashboard
- [ ] Configure custom domain: `findthem.app`
- [ ] Verify public post pages work

### Monitoring & Analytics
- [ ] Set up Sentry for error tracking
- [ ] Configure PostHog or Mixpanel for analytics (privacy-respecting)
- [ ] Set up Supabase email alerts for database issues
- [ ] Monitor Edge Function logs

### Security Hardening
- [ ] Enable Supabase RLS on all tables
- [ ] Rate limit API endpoints (Supabase settings)
- [ ] Add CAPTCHA for signup (optional, v2)
- [ ] Enable 2FA for Supabase/Expo/Vercel accounts
- [ ] Review and rotate API keys quarterly

---

## Common Issues & Solutions

### Issue: "No PostGIS extension found"
**Solution:**
```sql
-- In Supabase SQL Editor:
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Issue: Push notifications not working
**Solutions:**
1. Verify Expo push token saved in database
2. Test on physical device (not simulator)
3. Check Expo push notification credentials
4. Verify Edge Function is sending to correct endpoint

### Issue: Location permissions denied
**Solution:**
- Ensure Info.plist has correct permission descriptions
- Guide user to Settings > Find Them > Location > While Using

### Issue: Photos not uploading
**Solutions:**
1. Check Supabase storage bucket is public
2. Verify image size < 50MB (see Supabase settings)
3. Add error handling for network failures
4. Compress images before upload

### Issue: Geospatial queries slow
**Solutions:**
1. Verify GIST index exists on location columns
2. Reduce search radius (default 25 miles)
3. Add pagination (limit 20 posts per query)

---

## Development Tips

### Hot Reload
Expo hot reload works best when you:
- Save files frequently
- Avoid changing native modules (requires rebuild)
- Keep simulator/device connected

### Debugging
- **React Native Debugger:** `npm install -g react-native-debugger`
- **Supabase Logs:** Check Dashboard → Logs for SQL queries
- **Network Requests:** Use Reactotron or Flipper

### Testing Users
Create test users in Supabase Dashboard:
1. Go to Authentication → Users
2. Add user manually
3. Copy user ID for test data

---

## Resources

### Documentation
- **Expo:** https://docs.expo.dev
- **Supabase:** https://supabase.com/docs
- **React Native:** https://reactnative.dev
- **PostGIS:** https://postgis.net/docs

### Community
- **Expo Discord:** https://chat.expo.dev
- **Supabase Discord:** https://discord.supabase.com
- **Reddit:** r/reactnative, r/Supabase

### Design
- **Icons:** https://icons.expo.fyi (Ionicons)
- **Colors:** https://coolors.co (palette generator)
- **Fonts:** Built-in iOS system fonts

### Hire Help
- **Fiverr:** App icons, screenshots, UI design ($20-100)
- **Upwork:** React Native developers ($30-100/hr)
- **Toptal:** Senior engineers for code review ($100-200/hr)

---

## Success Metrics to Track

### Week 1 (Post-Launch)
- [ ] 100 downloads
- [ ] 10 active users
- [ ] 5 lost pet posts
- [ ] 10 sightings posted
- [ ] 1 reunion (🎉)

### Month 1
- [ ] 1,000 downloads
- [ ] 100 DAU
- [ ] 50 lost pet posts
- [ ] 100 sightings
- [ ] 5 reunions

### Month 3
- [ ] 10,000 downloads
- [ ] 500 DAU
- [ ] 200 lost pet posts
- [ ] 500 sightings
- [ ] 20 reunions

---

## Next Steps After MVP

### V2 Features (Priority Order)
1. **Android app** - Double your potential users
2. **Image ML matching** - Improve match accuracy
3. **Karma redemption** - Partner with Chewy, Petco
4. **Shelter partnerships** - Verified accounts, bulk imports
5. **In-app messaging** - Real-time chat
6. **Live Activities** - iOS lock screen updates

### Fundraising (If Applicable)
- [ ] Product-market fit validated (100+ reunions)
- [ ] Build deck with metrics
- [ ] Apply to Y Combinator, Techstars
- [ ] Approach pet-focused VCs (e.g., Mars Petcare)

### Monetization (Future)
- **Donations:** Users donate to shelters via app
- **Premium features:** Advanced filters, priority matching (ethical pricing)
- **Shelter subscriptions:** Enhanced features for verified shelters
- **Partner commissions:** Affiliate links to pet products

---

## Contact & Support

**For bugs or questions:**
- Open GitHub issue
- Email: dev@findthem.app (set this up!)

**For users:**
- Email: support@findthem.app
- In-app feedback form (v2)

---

**This guide will evolve as you build. Update it weekly with learnings!**

**Version:** 1.0
**Last Updated:** 2026-01-11
**Next Review:** After MVP launch

---

## One-Week Sprint Plan

### Monday
- [ ] Implement create-lost and create-sighting screens
- [ ] Add image picker and compression
- [ ] Test photo upload to Supabase Storage

### Tuesday
- [ ] Implement map view with markers
- [ ] Add marker clustering
- [ ] Implement post detail view

### Wednesday
- [ ] Deploy Edge Function for match-engine
- [ ] Set up cron job
- [ ] Test end-to-end matching and notifications

### Thursday
- [ ] Create app icons and screenshots
- [ ] Write privacy policy and terms
- [ ] Host legal docs

### Friday
- [ ] Build production .ipa with EAS
- [ ] Fill out App Store Connect metadata
- [ ] Submit for review

### Weekend
- [ ] Monitor review status
- [ ] Fix any issues
- [ ] Prepare launch marketing (social posts, press release)

**You can ship an MVP to the App Store in 7 days. Let's do this. 🚀**
