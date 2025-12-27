# Service Invitation Link Feature

## Goal
Allow users to generate and share invitation links to specific services. When recipients open the link:
- **Existing members**: Redirect to the service after login
- **New users**: Complete onboarding, then redirect to the service

## User Flow

```
┌─────────────────────────────────────────────────────┐
│ Admin clicks "Partager" on ServiceDetailPage        │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ Native share sheet opens with link + message        │
│ (WhatsApp, SMS, Email, Copy, etc.)                  │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ Recipient opens link in browser                     │
│ https://adorateurs.eglisegalilee.com/invite/svc123  │
└─────────────────────────────────────────────────────┘
                         ↓
         ┌──────────────┴──────────────┐
         ↓                             ↓
┌─────────────────┐         ┌─────────────────────────┐
│ Already logged  │         │ Not logged in           │
│ in?             │         │ → Save redirect URL     │
│ → Redirect to   │         │ → Show LoginPage        │
│   service       │         └─────────────────────────┘
└─────────────────┘                    ↓
                            ┌──────────┴──────────┐
                            ↓                     ↓
                    ┌───────────────┐    ┌───────────────┐
                    │ Existing user │    │ New user      │
                    │ → Login       │    │ → Onboarding  │
                    │ → Redirect    │    │ → Redirect    │
                    └───────────────┘    └───────────────┘
```

## Technical Approach

### 1. Install Capacitor Share Plugin
```bash
npm install @capacitor/share
npx cap sync
```

### 2. Create Invitation Service
**New file:** `src/services/invitationService.ts`

```typescript
import { Share } from '@capacitor/share';

const BASE_URL = 'https://adorateurs.eglisegalilee.com';
const REDIRECT_KEY = 'postLoginRedirect';

export const invitationService = {
  // Generate shareable link
  generateInviteLink(serviceId: string): string {
    return `${BASE_URL}/invite/${serviceId}`;
  },

  // Share via native share sheet
  async shareServiceInvite(service: Service): Promise<void> {
    const link = this.generateInviteLink(service.id);
    const formattedDate = formatServiceDate(service.date, service.time);

    await Share.share({
      title: `Invitation: ${service.title}`,
      text: `Tu es invité(e) au service "${service.title}" le ${formattedDate}. Rejoins-nous!`,
      url: link,
      dialogTitle: 'Partager l\'invitation'
    });
  },

  // Store redirect URL for after login/onboarding
  setPostLoginRedirect(path: string): void {
    localStorage.setItem(REDIRECT_KEY, path);
  },

  // Get and clear redirect URL
  getAndClearPostLoginRedirect(): string | null {
    const path = localStorage.getItem(REDIRECT_KEY);
    localStorage.removeItem(REDIRECT_KEY);
    return path;
  }
};
```

### 3. Add Invite Route
**File:** `src/router/index.ts`

```typescript
{
  path: '/invite/:serviceId',
  component: () => import('@/views/InvitePage.vue'),
  meta: { requiresAuth: false } // Public route - handles auth internally
}
```

### 4. Create InvitePage Component
**New file:** `src/views/InvitePage.vue`

Handles the invitation link:
1. Extract `serviceId` from route params
2. Check if user is authenticated
3. If authenticated + onboarding complete → redirect to `/service-detail/:serviceId`
4. If not authenticated → save redirect, go to `/login`
5. If authenticated but onboarding incomplete → save redirect, go to onboarding

```typescript
// Pseudo-code
const serviceId = route.params.serviceId;
const redirectPath = `/service-detail/${serviceId}`;

if (user.value) {
  const completed = await hasCompletedOnboarding(user.value.uid);
  if (completed) {
    router.replace(redirectPath);
  } else {
    invitationService.setPostLoginRedirect(redirectPath);
    router.replace('/onboarding/welcome');
  }
} else {
  invitationService.setPostLoginRedirect(redirectPath);
  router.replace('/login');
}
```

### 5. Update Login Flow
**File:** `src/views/LoginPage.vue`

After successful login, check for pending redirect:

```typescript
const handleLoginSuccess = async () => {
  const redirect = invitationService.getAndClearPostLoginRedirect();
  const completed = await hasCompletedOnboarding(user.uid);

  if (completed) {
    router.replace(redirect || '/accueil');
  } else {
    // Keep redirect stored, onboarding will use it
    if (redirect) invitationService.setPostLoginRedirect(redirect);
    router.push('/onboarding/welcome');
  }
};
```

### 6. Update Onboarding Completion
**File:** `src/views/onboarding/CongratulationsPage.vue`

After onboarding completes, check for pending redirect:

```typescript
const completeOnboarding = async () => {
  // ... save user data ...

  const redirect = invitationService.getAndClearPostLoginRedirect();
  router.replace(redirect || '/accueil');
};
```

### 7. Add Share Button to ServiceDetailPage
**File:** `src/views/services/ServiceDetailPage.vue`

Add share button to admin actions or header:

```vue
<ion-button @click="shareService" fill="clear">
  <ion-icon :icon="shareOutline" />
</ion-button>
```

```typescript
import { invitationService } from '@/services/invitationService';
import { shareOutline } from 'ionicons/icons';

const shareService = async () => {
  if (!service.value) return;

  try {
    await invitationService.shareServiceInvite(service.value);
  } catch (error) {
    // Fallback: copy link to clipboard
    const link = invitationService.generateInviteLink(service.value.id);
    await navigator.clipboard.writeText(link);
    showToast('Lien copié dans le presse-papiers');
  }
};
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/services/invitationService.ts` | Link generation, sharing, redirect storage |
| `src/views/InvitePage.vue` | Handle invite links, route to login/service |

## Files to Modify

| File | Changes |
|------|---------|
| `src/router/index.ts` | Add `/invite/:serviceId` route |
| `src/views/LoginPage.vue` | Check for post-login redirect |
| `src/views/onboarding/CongratulationsPage.vue` | Check for post-onboarding redirect |
| `src/views/services/ServiceDetailPage.vue` | Add share button |
| `package.json` | Add `@capacitor/share` dependency |

## Implementation Steps

### Phase 1: Core Infrastructure
1. Install `@capacitor/share` plugin
2. Create `invitationService.ts` with link generation and localStorage helpers
3. Add `/invite/:serviceId` route to router

### Phase 2: Invite Page
4. Create `InvitePage.vue` to handle incoming invite links
5. Implement auth check and redirect logic

### Phase 3: Redirect After Auth
6. Update `LoginPage.vue` to check for pending redirect after login
7. Update `CongratulationsPage.vue` to redirect after onboarding

### Phase 4: Share UI
8. Add share button to `ServiceDetailPage.vue`
9. Implement native sharing with fallback to clipboard

### Phase 5: Testing
10. Test full flow: share → open link → login → redirect
11. Test new user flow: share → open link → login → onboarding → redirect
12. Test web fallback when native share unavailable

## Share Message Format

```
Tu es invité(e) au service "Culte du dimanche" le dimanche 5 janvier 2025 à 10h00.
Rejoins-nous!

https://adorateurs.eglisegalilee.com/invite/abc123
```

## Edge Cases

- **User already on service page**: Show toast "Vous êtes déjà sur ce service"
- **Service doesn't exist**: Show error page with link to home
- **Share not supported**: Fallback to clipboard copy with toast
- **User cancels share**: Silently handle, no error

## Security Considerations

- Links are public but service access still requires authentication
- Service visibility respects existing team/guest permissions
- No sensitive data in URL (just service ID)

---

## Implementation Checklist

### Phase 1: Core Infrastructure

- [x] **1.1** Install Capacitor Share plugin
  - [x] Run `npm install @capacitor/share`
  - [x] Run `npx cap sync`
  - [x] Verify plugin appears in `package.json`

- [x] **1.2** Create `src/services/invitationService.ts`
  - [x] Define `BASE_URL` constant (`https://adorateurs.eglisegalilee.com`)
  - [x] Define `REDIRECT_KEY` constant for localStorage
  - [x] Implement `generateInviteLink(serviceId: string): string`
  - [x] Implement `shareServiceInvite(service: Service): Promise<void>`
  - [x] Implement `setPostLoginRedirect(path: string): void`
  - [x] Implement `getAndClearPostLoginRedirect(): string | null`
  - [x] Export `invitationService` object

- [x] **1.3** Add invite route to `src/router/index.ts`
  - [x] Add `/invite/:serviceId` route
  - [x] Set `meta: { requiresAuth: false }`
  - [x] Import `InvitePage.vue` component

### Phase 2: Invite Page

- [x] **2.1** Create `src/views/InvitePage.vue`
  - [x] Create basic Vue component structure
  - [x] Add loading spinner UI while processing
  - [x] Extract `serviceId` from route params

- [x] **2.2** Implement auth check and redirect logic
  - [x] Import `authService` and `invitationService`
  - [x] Wait for auth state with `authService.waitForAuth()`
  - [x] Check if user is authenticated
  - [x] If authenticated: check onboarding status
  - [x] If onboarding complete: redirect to `/service-detail/:serviceId`
  - [x] If onboarding incomplete: save redirect, go to `/onboarding/welcome`
  - [x] If not authenticated: save redirect, go to `/login`

- [x] **2.3** Add error handling
  - [x] Handle case where serviceId is missing
  - [x] Show user-friendly loading message

### Phase 3: Redirect After Auth

- [x] **3.1** Update `src/views/LoginPage.vue`
  - [x] Import `invitationService`
  - [x] In `handleGoogleSignIn` success: check for pending redirect
  - [x] In `onMounted` for already logged-in users: check for pending redirect
  - [x] If redirect exists and onboarding complete: navigate to redirect URL
  - [x] If redirect exists and onboarding incomplete: re-save redirect, go to onboarding
  - [x] If no redirect: navigate to `/accueil` (existing behavior)

- [x] **3.2** Update `src/views/onboarding/CongratulationsPage.vue`
  - [x] Import `invitationService`
  - [x] After saving user data: check for pending redirect
  - [x] If redirect exists: navigate to redirect URL
  - [x] If no redirect: navigate to `/accueil` (existing behavior)

### Phase 4: Share UI

- [x] **4.1** Update `src/views/services/ServiceDetailPage.vue`
  - [x] Import `invitationService`
  - [x] Import `shareOutline` icon from ionicons
  - [x] Add share button to header (next to admin actions)
  - [x] Create `shareService()` async function

- [x] **4.2** Implement sharing functionality
  - [x] Call `invitationService.shareServiceInvite(service)`
  - [x] Handle share success (native share sheet opens)
  - [x] Implement fallback: copy link to clipboard if share fails
  - [x] Show toast on clipboard copy success
  - [x] Handle user cancel (no error toast)

### Phase 5: Build & Verification

- [x] **5.1** Build verification
  - [x] TypeScript compilation passes (`npm run build`)
  - [x] Vite build completes successfully

- [ ] **5.2** Manual testing - Existing user flow
  - [ ] Share service → open link in new browser
  - [ ] Verify redirect to login page
  - [ ] Login with existing account
  - [ ] Verify redirect to service detail page

- [ ] **5.3** Manual testing - New user flow
  - [ ] Share service → open link in new browser (incognito)
  - [ ] Verify redirect to login page
  - [ ] Login with new Google account
  - [ ] Verify redirect to onboarding
  - [ ] Complete onboarding
  - [ ] Verify redirect to service detail page

- [ ] **5.4** Manual testing - Already logged in
  - [ ] Open invite link while already logged in
  - [ ] Verify immediate redirect to service detail page

- [ ] **5.5** Manual testing - Share fallback
  - [ ] Test share on web (should copy to clipboard)
  - [ ] Verify toast message appears
  - [ ] Test share on mobile (should open native share sheet)

### Phase 6: Deployment

- [ ] **6.1** Update version and release notes
- [ ] **6.2** Build production (`npm run build`)
- [ ] **6.3** Deploy to Firebase Hosting
- [ ] **6.4** Commit and push to repository
