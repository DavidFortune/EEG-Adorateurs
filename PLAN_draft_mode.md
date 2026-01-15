# Plan: Draft Mode for Programs

## Overview
Implement draft mode for programs allowing programs to be visible/editable only by admins and specific members until published. Publishing is a one-way action.

## Requirements
- Programs have draft/published state (new programs default to draft)
- In draft: only admins + specific members (per-program list) can view/edit
- Publishing is one-way (cannot unpublish)
- Once published: visible to all service participants

---

## Files to Modify

### 1. Type Definitions
**File:** `src/types/program.ts`

Add to `ServiceProgram` interface (line 69):
```typescript
isDraft: boolean;              // true = draft, false = published
draftViewerIds: string[];      // Firebase UIDs allowed to view/edit when draft
publishedAt?: Date;            // Timestamp when published
publishedBy?: string;          // Firebase UID who published
```

### 2. Firebase Programs Service
**File:** `src/firebase/programs.ts`

Changes:
- Update `FirestoreProgram` interface to include `publishedAt?: Timestamp`
- Modify `createProgram()` to set `isDraft: true` and `draftViewerIds: []` by default
- Add migration defaults in `subscribeToProgramByServiceId()` and `getProgramByServiceId()` for existing programs (default `isDraft: false`)
- Add new functions:

```typescript
// Publish program (one-way)
export const publishProgram = async (programId: string, userId: string): Promise<void>

// Update draft viewers list
export const updateDraftViewers = async (programId: string, viewerIds: string[], userId: string): Promise<void>

// Check if user can view program
export const canUserViewProgram = (program: ServiceProgram | null, firebaseUid: string | undefined, isAdmin: boolean): boolean
```

### 3. Firestore Security Rules
**File:** `firestore.rules`

Replace programs rules (lines 63-69) with:
```javascript
match /programs/{programId} {
  // Read: published OR admin OR in draftViewerIds
  allow read: if request.auth != null && (
    resource.data.isDraft == false ||
    get(/databases/$(database)/documents/members/$(request.auth.uid)).data.isAdmin == true ||
    request.auth.uid in resource.data.draftViewerIds
  );

  allow create: if request.auth != null;

  // Update: admin OR in draftViewerIds (when draft)
  allow update: if request.auth != null && (
    get(/databases/$(database)/documents/members/$(request.auth.uid)).data.isAdmin == true ||
    (resource.data.isDraft == true && request.auth.uid in resource.data.draftViewerIds)
  );

  // Delete: admin only
  allow delete: if request.auth != null &&
    get(/databases/$(database)/documents/members/$(request.auth.uid)).data.isAdmin == true;
}
```

### 4. Program Page UI
**File:** `src/views/services/ServiceProgramPage.vue`

Add:
- Import new functions from `programs.ts`
- State: `showDraftViewersModal`, `draftViewerIds`, `allMembers`
- Computed: `canViewProgram`, `isDraft`, `canPublish`
- Methods: `confirmPublish()`, `handlePublish()`, `openDraftViewersModal()`, `saveDraftViewers()`
- Template:
  - Draft badge in header (ion-chip with lock icon)
  - Draft controls card (admin only): viewer count, "Gérer les accès" button, "Publier" button
  - Access denied card for unauthorized users
  - Modal for managing draft viewers (member list with checkboxes)

### 5. Program Overview Component
**File:** `src/components/service-detail/ProgramOverview.vue`

Add:
- Props: `canView: boolean`
- Draft badge display
- Access denied state when `!canView`

### 6. Service Detail Page
**File:** `src/views/services/ServiceDetailPage.vue`

Add:
- Import `canUserViewProgram` helper
- Computed: `canViewProgram`
- Pass `canView` prop to `ProgramOverview`

---

## Data Migration

For existing programs (no `isDraft` field), handle in code:
- In `subscribeToProgramByServiceId()` and `getProgramByServiceId()`: default `isDraft: false`, `draftViewerIds: []`
- Existing programs are treated as published

---

## Implementation Checklist

### Phase 1: Data Layer
- [x] Update `ServiceProgram` interface in `src/types/program.ts`
- [x] Update `FirestoreProgram` interface in `src/firebase/programs.ts`
- [x] Modify `createProgram()` to set draft defaults
- [x] Add migration defaults in `getProgramByServiceId()`
- [x] Add migration defaults in `subscribeToProgramByServiceId()`
- [x] Implement `publishProgram()` function
- [x] Implement `updateDraftViewers()` function
- [x] Implement `canUserViewProgram()` helper

### Phase 2: Security Rules
- [x] Update `firestore.rules` for programs collection

### Phase 3: UI Components
- [x] Add draft badge to `ServiceProgramPage.vue` header
- [x] Add draft controls card (admin only) to `ServiceProgramPage.vue`
- [x] Add access denied card to `ServiceProgramPage.vue`
- [x] Implement draft viewers modal in `ServiceProgramPage.vue`
- [x] Add `confirmPublish()` and `handlePublish()` methods
- [x] Add `openDraftViewersModal()` and `saveDraftViewers()` methods
- [x] Update `ProgramOverview.vue` with `canView` prop
- [x] Add draft badge to `ProgramOverview.vue`
- [x] Update `ServiceDetailPage.vue` to pass `canView` prop

### Phase 4: Testing & Verification
- [ ] Test: Create new program → verify `isDraft: true`
- [ ] Test: Non-admin without access sees "Programme en préparation"
- [ ] Test: Add draft viewer → member can now see program
- [ ] Test: Publish program → all participants can see
- [ ] Test: Firestore rules block unauthorized access
- [ ] Test: Existing programs still visible (treated as published)

---

## Verification

1. **Create new program**: Verify `isDraft: true` and empty `draftViewerIds`
2. **Draft visibility**: Non-admin user without access sees "Programme en préparation" message
3. **Add draft viewer**: Admin adds member, that member can now see the program
4. **Publish**: Admin publishes → all service participants can see the program
5. **Firestore rules**: Test that unauthenticated and unauthorized reads are blocked
6. **Existing programs**: Verify old programs still visible (treated as published)
