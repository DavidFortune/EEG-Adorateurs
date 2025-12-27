# Program Item Participant Feature

## Goal
Allow linking existing members or custom names to program items. If a member is selected who isn't part of a team required for the service, automatically add them as a guest.

## User Flow

```
┌─────────────────────────────────────────────────────────┐
│ User editing a program item (e.g., "Prédication")       │
│ Clicks on participant field                             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Modal opens with two tabs:                              │
│ [Membres]  [Autre]                                      │
└─────────────────────────────────────────────────────────┘
         ↓                              ↓
┌─────────────────────┐      ┌─────────────────────────────┐
│ Tab: Membres        │      │ Tab: Autre                  │
│ - Search input      │      │ - Text input for name       │
│ - Member list       │      │ - Optional role input       │
│ - Avatar + name     │      │ - "Confirmer" button        │
│ - Click to select   │      └─────────────────────────────┘
└─────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ If member not in service teams → Add as guest           │
│ Modal closes, participant shown in form                 │
└─────────────────────────────────────────────────────────┘
```

## Technical Approach

### 1. Create ParticipantSelector Component
**New file:** `src/components/ParticipantSelector.vue`

A lightweight modal-based selector following `ResourceSelector` patterns:

```vue
<template>
  <!-- Display selected participant or button to open modal -->
  <div class="participant-selector">
    <div v-if="selectedParticipant" class="selected-participant">
      <ion-avatar>
        <img v-if="selectedParticipant.avatar" :src="selectedParticipant.avatar" />
        <span v-else class="initials">{{ getInitials(selectedParticipant.name) }}</span>
      </ion-avatar>
      <span class="participant-name">{{ selectedParticipant.name }}</span>
      <ion-button fill="clear" size="small" color="danger" @click="removeParticipant">
        <ion-icon :icon="closeOutline" />
      </ion-button>
    </div>

    <ion-button v-else @click="openModal" fill="outline" size="small">
      <ion-icon :icon="personAddOutline" slot="start" />
      Ajouter un participant
    </ion-button>
  </div>

  <!-- Selection Modal -->
  <ion-modal :is-open="isOpen" @will-dismiss="closeModal">
    <ion-header>
      <ion-toolbar>
        <ion-title>Sélectionner un participant</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="closeModal"><ion-icon :icon="closeOutline" /></ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="activeTab">
          <ion-segment-button value="members"><ion-label>Membres</ion-label></ion-segment-button>
          <ion-segment-button value="custom"><ion-label>Autre</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Members Tab -->
      <div v-if="activeTab === 'members'">
        <ion-searchbar v-model="searchQuery" placeholder="Rechercher..." :debounce="300" />
        <ion-list>
          <ion-item v-for="member in filteredMembers" :key="member.id" @click="selectMember(member)">
            <ion-avatar slot="start">...</ion-avatar>
            <ion-label>{{ member.fullName }}</ion-label>
            <ion-icon v-if="isSelected(member.id)" :icon="checkmarkCircle" color="primary" slot="end" />
          </ion-item>
        </ion-list>
      </div>

      <!-- Custom Tab -->
      <div v-if="activeTab === 'custom'" class="ion-padding">
        <ion-item>
          <ion-label position="stacked">Nom *</ion-label>
          <ion-input v-model="customName" placeholder="Ex: Pasteur Jean" />
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Rôle (optionnel)</ion-label>
          <ion-input v-model="customRole" placeholder="Ex: Invité spécial" />
        </ion-item>
        <ion-button expand="block" @click="confirmCustom" :disabled="!customName.trim()">
          Confirmer
        </ion-button>
      </div>
    </ion-content>
  </ion-modal>
</template>
```

**Props:**
```typescript
interface Props {
  modelValue: ProgramParticipant | null;
  serviceId: string;  // For guest check
}
```

**Emits:**
```typescript
const emit = defineEmits<{
  'update:modelValue': [value: ProgramParticipant | null];
  'guest-added': [memberId: string];  // Optional: notify parent when guest added
}>();
```

### 2. Component Logic

```typescript
// Load members on mount
const members = ref<Member[]>([]);
onMounted(async () => {
  members.value = await membersService.getAllMembers();
});

// Filter by search
const filteredMembers = computed(() => {
  if (!searchQuery.value) return members.value;
  const q = searchQuery.value.toLowerCase();
  return members.value.filter(m =>
    m.fullName.toLowerCase().includes(q) ||
    m.firstName.toLowerCase().includes(q) ||
    m.lastName.toLowerCase().includes(q)
  );
});

// Select member from list
async function selectMember(member: Member) {
  // Check if member needs to be added as guest
  await addAsGuestIfNeeded(member.id);

  // Create participant object
  const participant: ProgramParticipant = {
    id: member.id,
    name: member.fullName,
    isCustom: false
  };

  emit('update:modelValue', participant);
  closeModal();
}

// Add custom participant
function confirmCustom() {
  const participant: ProgramParticipant = {
    id: `custom_${Date.now()}`,
    name: customName.value.trim(),
    role: customRole.value.trim() || undefined,
    isCustom: true
  };

  emit('update:modelValue', participant);
  closeModal();
}

// Check and add as guest using existing invitationService
async function addAsGuestIfNeeded(memberId: string) {
  await invitationService.addMemberAsGuest(props.serviceId, memberId);
}
```

### 3. Update ServiceProgramPage

**File:** `src/views/services/ServiceProgramPage.vue`

Replace the simple text input with the new component:

```vue
<!-- Before -->
<ion-item>
  <ion-label position="stacked">Participant (optionnel)</ion-label>
  <ion-input v-model="itemForm.participantName" placeholder="Ex: Pasteur Hugues-Dieu"></ion-input>
</ion-item>

<!-- After -->
<ion-item lines="none">
  <ion-label position="stacked">Participant (optionnel)</ion-label>
  <ParticipantSelector
    v-model="itemForm.participant"
    :service-id="serviceId"
  />
</ion-item>
```

**Update form state:**
```typescript
// Before
const itemForm = ref({
  ...
  participantName: '',
  ...
});

// After
const itemForm = ref({
  ...
  participant: null as ProgramParticipant | null,
  ...
});
```

**Update save logic:**
```typescript
// Before (in addItem/updateItem)
participant: itemForm.value.participantName ? {
  id: `custom_${Date.now()}`,
  name: itemForm.value.participantName,
  isCustom: true
} : undefined

// After
participant: itemForm.value.participant || undefined
```

### 4. Styling (following existing patterns)

```css
.participant-selector {
  width: 100%;
  padding: 8px 0;
}

.selected-participant {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--ion-color-light);
  border-radius: 8px;
}

.selected-participant ion-avatar {
  width: 32px;
  height: 32px;
}

.selected-participant .initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--ion-color-primary);
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 50%;
}

.participant-name {
  flex: 1;
  font-weight: 500;
}
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/ParticipantSelector.vue` | Reusable participant selection component |

## Files to Modify

| File | Changes |
|------|---------|
| `src/views/services/ServiceProgramPage.vue` | Replace text input with ParticipantSelector, update form state |

## Implementation Checklist

### Phase 1: Create Component
- [x] 1. Create `ParticipantSelector.vue` with modal structure
- [x] 2. Implement member loading and search/filter
- [x] 3. Implement tab switching (Members/Custom)
- [x] 4. Add member selection with guest auto-add logic
- [x] 5. Add custom participant entry and styling

### Phase 2: Integrate
- [x] 6. Import component in `ServiceProgramPage.vue`
- [x] 7. Replace text input with `ParticipantSelector`
- [x] 8. Update `itemForm` to use participant object instead of string
- [x] 9. Update `addItem()` and `updateItem()` save logic
- [x] 10. Update `openEditItemModal()` to populate participant correctly

### Phase 3: Build & Test
- [x] 11. Build project and fix any errors
- [x] 12. Deployed to https://eeg-adorateurs.web.app - Ready for testing

### Phase 4: Enhancements
- [x] 13. Added avatar field to ProgramParticipant type
- [x] 14. Display avatar (or initials fallback) instead of person icon in program items
- [x] 15. Applied ParticipantSelector to Program conductor (same pattern as program items)
- [x] 16. Display conductor avatar (or initials fallback) instead of person icon

## UI Considerations

- **Lightweight**: Single modal, no nested navigation
- **Consistent**: Follows `ResourceSelector` patterns (search, tabs, selection indicator)
- **Fast**: Members loaded once on mount, filtered client-side
- **Mobile-friendly**: Touch targets, clear visual states
- **French labels**: All text in French

## Edge Cases

- **No members in system**: Show empty state message
- **Member already a guest**: `addMemberAsGuest` handles this (no duplicate)
- **Member in required team**: `addMemberAsGuest` skips adding (already has access)
- **Editing existing item**: Populate selector with existing participant
- **Clear participant**: X button to remove selection

## Type Reference

```typescript
// Existing type (no changes needed)
interface ProgramParticipant {
  id: string;
  name: string;
  role?: string;
  isCustom: boolean;
}
```
