# Apple App Store Submission Checklist

## Pre-Submission Requirements

### 1. App Metadata

#### Required Information
- [ ] **App Name:** Find Them - Lost & Found Pets (max 30 chars)
- [ ] **Subtitle:** Reunite pets with their families (max 30 chars)
- [ ] **Primary Language:** English (U.S.)
- [ ] **Category:** Primary: Lifestyle, Secondary: Social Networking
- [ ] **Content Rights:** You own all rights or have permission
- [ ] **Age Rating:** 4+ (Infrequent/Mild: None)

#### Privacy Information
- [ ] **Privacy Policy URL:** https://findthem.app/privacy (must be live)
- [ ] **Privacy Practices:**
  - [ ] Data collection: Location, Photos, Name, Email
  - [ ] Data usage: Service functionality only
  - [ ] Data sharing: No third-party sharing
  - [ ] User data deletion: Available via in-app settings

#### App Description
```
Help reunite lost pets with their families.

Find Them is the national coordination layer for lost and found pets across the United States. When you see a lost pet, you can instantly post a sighting, notify nearby owners, and help bring animals home.

KEY FEATURES:
• Report lost pets in under 60 seconds
• Post sightings in under 20 seconds
• Smart matching connects sightings with lost pet reports
• Real-time push notifications for nearby matches
• Public shareable links for viral reach
• Earn Karma Points for helping reunite pets
• Privacy-first: location control, in-app messaging

MISSION-DRIVEN:
Every reunion matters. Join thousands of caring people helping lost animals find their way home. Free to use, ad-free, built for impact.

SAFETY FIRST:
• Do not confront suspected pet thieves
• Meet in public places
• Verify ownership before handoff
• Report suspicious activity
```

#### Keywords (max 100 chars)
```
lost pet,found pet,pet finder,lost dog,cat,animal rescue,pet reunion
```

### 2. Screenshots & Previews

#### iPhone 6.7" Display (Required)
- [ ] Screenshot 1: Home feed with nearby lost pets
- [ ] Screenshot 2: Map view with pins
- [ ] Screenshot 3: Create lost pet post form
- [ ] Screenshot 4: Match notification with side-by-side comparison
- [ ] Screenshot 5: Reunited flow with gratitude screen

#### iPhone 6.5" Display (Required)
- [ ] Same 5 screenshots resized

#### iPhone 5.5" Display (Optional but recommended)
- [ ] Same 5 screenshots resized

#### iPad Pro 12.9" (If supporting iPad)
- [ ] 5 screenshots optimized for iPad

#### App Preview Video (Optional but highly recommended)
- [ ] 15-30 second video showing:
  - See lost pet → Post sighting → Get notified → Reunite
  - Should be emotional, authentic, mission-driven

### 3. Technical Requirements

#### Build Configuration
- [ ] **Bundle ID:** com.findthem.app (must match in Xcode)
- [ ] **Version:** 0.1.0 (or 1.0.0 for launch)
- [ ] **Build Number:** 1
- [ ] **Minimum iOS Version:** 15.0
- [ ] **Deployment Target:** iOS 15.0+
- [ ] **App Icon:** 1024x1024px (no transparency, no alpha channel)

#### EAS Build
```bash
cd apps/mobile
eas build --platform ios --profile production
```

#### Code Signing
- [ ] Apple Developer Account (individual or organization)
- [ ] App Store Connect app created
- [ ] Distribution certificate configured
- [ ] Provisioning profile (App Store)
- [ ] Push notification certificate configured
- [ ] App Groups configured (if using)

### 4. Permissions & Entitlements

#### Info.plist Descriptions (Must be clear and justified)

**NSLocationWhenInUseUsageDescription:**
```
We need your location to show nearby lost pets and help reunite animals with their owners. Your exact location is never shared publicly without your permission.
```

**NSLocationAlwaysAndWhenInUseUsageDescription:**
```
We need your location to show nearby lost pets and send you alerts when pets are found near you. You can change this in Settings at any time.
```

**NSCameraUsageDescription:**
```
We need camera access to let you take photos of lost or found pets.
```

**NSPhotoLibraryUsageDescription:**
```
We need photo library access to let you upload photos of lost or found pets.
```

**NSUserTrackingUsageDescription** (ATT - If doing analytics)
```
We use this to provide you with relevant lost pet alerts in your area. We do not sell your data.
```

#### Entitlements
- [ ] Sign in with Apple (required if using Apple Auth)
- [ ] Push Notifications
- [ ] Background Modes: Remote notifications (optional)
- [ ] App Groups (if sharing data)

### 5. App Review Information

#### Contact Information
- [ ] **First Name:** [Your Name]
- [ ] **Last Name:** [Your Last Name]
- [ ] **Phone Number:** [Valid phone number with country code]
- [ ] **Email:** support@findthem.app (must be monitored)

#### Demo Account (If login required)
- [ ] **Username:** reviewer@findthem.app
- [ ] **Password:** [Secure password]
- [ ] **Notes:** "This is a demo account. Location services work best on physical device."

#### Notes for Reviewer
```
Thank you for reviewing Find Them!

TESTING INSTRUCTIONS:
1. Sign in with Apple or use the demo account provided
2. Allow location permissions (critical for core functionality)
3. Tap "Report Lost Pet" to see the posting flow (you can use sample photos)
4. Tap the FAB (floating action button) to post a quick sighting
5. View the feed to see nearby posts sorted by distance
6. Tap the Map tab to see pins on a map
7. Tap any post to see details and sharing options

LOCATION TESTING:
The app works best with location services enabled. Core features (nearby feed, map, matching) depend on geolocation. If testing on simulator, you can set a custom location (San Francisco recommended for sample data).

PUSH NOTIFICATIONS:
Push notifications are sent when the matching algorithm finds a high-confidence match between a sighting and a lost pet report. This is automated via a server-side Edge Function.

SAFETY:
We include safety guidelines: "Do not confront suspected pet thieves" and encourage meeting in public places for pet handoff.

MISSION:
This app exists to reunite lost pets with their families. It's free, ad-free, and mission-driven.

Thank you for helping us launch!
```

### 6. Legal & Compliance

#### Required Documents (must be live before submission)
- [ ] **Privacy Policy:** https://findthem.app/privacy
  - Covers: Data collection, usage, sharing, retention, user rights
  - GDPR/CCPA compliant
  - COPPA compliant (13+)
- [ ] **Terms of Service:** https://findthem.app/terms
  - User responsibilities
  - Content guidelines
  - Liability disclaimers
  - Termination policy
- [ ] **Support Page:** https://findthem.app/support or support@findthem.app

#### App Store Review Guidelines Compliance
- [ ] **2.1 Performance:** No crashes, bugs, or incomplete features
- [ ] **2.3 Accurate Metadata:** Description matches functionality
- [ ] **4.0 Design:** Professional UI, follows iOS design guidelines
- [ ] **5.1.1 Data Collection:** Privacy policy covers all data collected
- [ ] **5.1.2 Data Use:** Data used only for stated purposes
- [ ] **5.2 Privacy:** Apple Sign-In implemented correctly
- [ ] **5.3.3 Payments:** No circumventing App Store payments (Stripe donations are OK if disclosed)

### 7. Testing Checklist

#### Functional Testing
- [ ] Sign in with Apple works
- [ ] Email sign in/sign up works
- [ ] Create lost pet post (with photo upload)
- [ ] Create sighting post
- [ ] View feed (sorts by distance)
- [ ] View map (pins appear correctly)
- [ ] Tap post → Detail view loads
- [ ] Share post generates link
- [ ] Mark as reunited flow works
- [ ] Karma awarded correctly
- [ ] Push notification received (test on physical device)
- [ ] Report post works
- [ ] Block user works
- [ ] Sign out works

#### Edge Cases
- [ ] No location permission granted (graceful degradation)
- [ ] No network connection (offline queuing for sightings)
- [ ] Photo upload fails (error message, retry option)
- [ ] GPS unavailable (allow manual location entry)
- [ ] Empty states (no posts nearby)

#### Performance
- [ ] Feed loads in < 2 seconds on 4G
- [ ] Map loads in < 3 seconds
- [ ] Photo upload completes in < 10 seconds
- [ ] No memory leaks (test with Xcode Instruments)
- [ ] Battery usage is reasonable (< 5% per hour active use)

#### Accessibility
- [ ] VoiceOver support for key actions
- [ ] Dynamic type support (text scales)
- [ ] Sufficient color contrast (WCAG AA)
- [ ] Tap targets ≥ 44x44 pt

#### Localization (if supporting multiple languages)
- [ ] English (U.S.) complete
- [ ] Spanish (optional for v1)
- [ ] Date/time formats respect locale

### 8. App Store Connect Configuration

#### Pricing & Availability
- [ ] **Price:** Free
- [ ] **Availability:** All territories (or U.S. only for MVP)
- [ ] **Pre-order:** No

#### App Store Listing
- [ ] Promotional text (170 chars max, can update without review):
  ```
  Help reunite lost pets! Post sightings in seconds, get smart match alerts, earn karma for helping. Free, ad-free, mission-driven.
  ```
- [ ] Description (4000 chars max): See above
- [ ] Keywords: See above
- [ ] Support URL: https://findthem.app/support
- [ ] Marketing URL: https://findthem.app

#### App Review Information
- [ ] Demo account credentials provided
- [ ] Notes for reviewer provided (see above)
- [ ] Contact information current

#### Version Release
- [ ] **Automatic release:** After approval (recommended for v1)
- [ ] **Manual release:** Hold for manual release (if coordinating launch)

### 9. Marketing Materials (Pre-Launch)

#### Website
- [ ] Landing page live: https://findthem.app
- [ ] Privacy policy page live
- [ ] Terms of service page live
- [ ] Support/FAQ page live

#### Social Media
- [ ] Instagram account created: @findthemapp
- [ ] Twitter/X account created: @findthemapp
- [ ] Initial posts prepared (launch day announcement)

#### Press Kit
- [ ] App icon (high-res PNG, SVG)
- [ ] Screenshots (6.7" device)
- [ ] Press release draft
- [ ] Founder/team bios
- [ ] Mission statement

### 10. Post-Submission Monitoring

#### After Submission
- [ ] Monitor App Store Connect for review status
- [ ] Respond to reviewer questions within 24 hours
- [ ] Test push notifications in production
- [ ] Monitor Supabase for database performance
- [ ] Check Edge Function logs for errors

#### Upon Approval
- [ ] Announce on social media
- [ ] Send press release to pet blogs/influencers
- [ ] Post in relevant Reddit communities (r/dogs, r/cats)
- [ ] Monitor crash reports (Sentry or Firebase Crashlytics)
- [ ] Gather user feedback
- [ ] Monitor App Store reviews, respond quickly

---

## Common Rejection Reasons & How to Avoid

### 1. Incomplete App Information
**Reason:** Missing privacy policy or terms
**Fix:** Ensure all URLs are live and working before submission

### 2. Inaccurate Metadata
**Reason:** Screenshots don't match app functionality
**Fix:** Use actual in-app screenshots, not mockups

### 3. Privacy Policy Issues
**Reason:** Policy doesn't cover location data collection
**Fix:** Explicitly mention location, photos, and how they're used

### 4. Permission Justifications Unclear
**Reason:** "We need your location" is too vague
**Fix:** Use the detailed descriptions provided above

### 5. Crash or Bug
**Reason:** App crashed during review
**Fix:** Test thoroughly on physical devices, multiple iOS versions

### 6. Guideline 4.3 (Spam)
**Reason:** App is too similar to existing apps
**Fix:** Emphasize unique value prop (national coordination, karma system, smart matching)

### 7. Sign in with Apple Issues
**Reason:** Apple Sign-In not implemented correctly
**Fix:** Follow Apple's guidelines, don't require additional sign-in if Apple is primary

---

## Timeline Estimate

- **Preparation:** 1-2 days (screenshots, metadata, testing)
- **Submission:** 1 hour
- **Review Time:** 24-48 hours (typical)
- **If Rejected:** Fix issues, resubmit (add 24-48 hours)

**Target Launch Date:** [Fill in based on readiness]

---

## Support Contacts

- **App Store Connect:** developer.apple.com/contact
- **Apple Developer Support:** developer.apple.com/support
- **Expo EAS Build Support:** docs.expo.dev/eas

---

**Checklist Version:** 1.0
**Last Updated:** 2026-01-11
**Next Review:** Before submission
