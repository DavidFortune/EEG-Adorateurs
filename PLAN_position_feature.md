# Plan: Position (Poste) Feature

## Overview
Add a "position" (poste) feature where each team can have a list of positions, members are assigned a default position in their team, and the position can be overridden during scheduling or service consultation.

## Requirements Summary
- Positions are CRUD managed per team
- Members have a default position in their team
- Position can be overwritten when scheduling (TeamSchedulingView)
- Position can be overwritten in service members view (ServiceDetailPage)
- Reuse existing UI patterns for consistency
- Must be simple and intuitive

---

## 1. Data Model Changes

### 1.1 Add Position type (`src/types/team.ts`)
```typescript
export interface TeamPosition {
  id: string;       // Format: "teamname-positionname" (lowercase, "-" as separator)
  name: string;     // Display name (original casing)
  order: number;    // For display ordering
}
```

### 1.1.1 Position ID Generation

The `positionId` follows a specific format for consistency and readability:

**Format:** `{teamname}-{positionname}`

**Rules:**
- All lowercase
- Spaces replaced with `-`
- Special characters removed
- Accents normalized (é → e, à → a, etc.)

**Examples:**
| Team Name | Position Name | Position ID |
|-----------|---------------|-------------|
| Louange | Guitariste | `louange-guitariste` |
| Louange | Chef de louange | `louange-chef-de-louange` |
| Accueil | Responsable | `accueil-responsable` |
| Son & Lumière | Ingénieur son | `son-lumiere-ingenieur-son` |

**Helper function:**
```typescript
function generatePositionId(teamName: string, positionName: string): string {
  const normalize = (str: string) => str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '')    // Remove special chars
    .replace(/\s+/g, '-')            // Replace spaces with -
    .replace(/-+/g, '-')             // Collapse multiple -
    .replace(/^-|-$/g, '');          // Trim - from ends

  return `${normalize(teamName)}-${normalize(positionName)}`;
}
```

### 1.2 Update TeamMember interface (`src/types/team.ts`)
```typescript
export interface TeamMember {
  id: string;
  memberId: string;
  role: TeamRole;
  status: TeamMemberStatus;
  joinedAt: string;
  positionId?: string; // Default position for this member in this team
}
```

### 1.3 Update Team interface (`src/types/team.ts`)
```typescript
export interface Team {
  id: string;
  name: string;
  description: string;
  icon: string;
  ownerId: string;
  members: TeamMember[];
  positions: TeamPosition[]; // Available positions for this team
  createdAt: string;
  updatedAt: string;
}
```

### 1.4 Update ServiceAssignment interface (`src/types/assignment.ts`)
```typescript
export interface ServiceAssignment {
  id: string;
  serviceId: string;
  teamId: string;
  teamName: string;
  memberId: string;
  memberName: string;
  positionId?: string; // Override position for this specific assignment
  positionName?: string; // Denormalized for display
  assignedAt: string;
  assignedBy: string;
}
```

### 1.5 Update MemberAssignment interface (`src/types/scheduling.ts`)
```typescript
export interface MemberAssignment {
  id: string;
  name: string;
  availability: MemberAvailability;
  isAssigned: boolean;
  isAssignedToOtherTeam?: boolean;
  assignedTeamName?: string;
  avatar?: string;
  positionId?: string; // Default position from team membership
  positionName?: string; // For display
  assignedPositionId?: string; // Override for this service if assigned
  assignedPositionName?: string;
}
```

---

## 2. Firebase/Firestore Updates

### 2.1 Update teams service (`src/firebase/teams.ts`)

Add position ID generator and CRUD functions:
```typescript
// Generate position ID from team name and position name
function generatePositionId(teamName: string, positionName: string): string {
  const normalize = (str: string) => str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${normalize(teamName)}-${normalize(positionName)}`;
}

// Add a position to a team (generates ID automatically)
async addPosition(teamId: string, teamName: string, positionName: string): Promise<TeamPosition>
// Returns position with id like "louange-guitariste"

// Update a position name (regenerates ID, updates member references)
async updatePosition(teamId: string, teamName: string, oldPositionId: string, newPositionName: string): Promise<void>

// Delete a position (if no members use it as default)
async deletePosition(teamId: string, positionId: string): Promise<void>

// Reorder positions
async reorderPositions(teamId: string, positionIds: string[]): Promise<void>

// Update member's default position
async updateMemberPosition(teamId: string, memberId: string, positionId: string | null): Promise<void>
```

### 2.2 Update assignments service (`src/firebase/assignments.ts`)

Update createAssignment to accept position:
```typescript
async createAssignment(
  request: CreateAssignmentRequest,
  memberName: string,
  teamName: string,
  positionId?: string,
  positionName?: string
): Promise<ServiceAssignment>

// Add function to update position on existing assignment
async updateAssignmentPosition(
  assignmentId: string,
  positionId: string | null,
  positionName: string | null
): Promise<void>
```

---

## 3. UI: Position Management in TeamDetailPage

### 3.1 Add Positions Section

Add a new card section between "Quick Actions" and "Pending Members Section":

```vue
<!-- Positions Section -->
<ion-card class="positions-card" v-if="canManageMembers">
  <ion-card-header>
    <div class="card-header-with-action">
      <ion-card-title class="section-title">
        <ion-icon :icon="ribbonOutline" class="section-icon"></ion-icon>
        Postes ({{ team.positions?.length || 0 }})
      </ion-card-title>
      <ion-button fill="clear" size="small" @click="showAddPositionModal = true">
        <ion-icon :icon="addOutline" slot="icon-only"></ion-icon>
      </ion-button>
    </div>
  </ion-card-header>
  <ion-card-content>
    <div v-if="!team.positions || team.positions.length === 0" class="empty-positions">
      <p>Aucun poste défini</p>
      <ion-button fill="outline" size="small" @click="showAddPositionModal = true">
        Ajouter un poste
      </ion-button>
    </div>
    <ion-reorder-group v-else :disabled="false" @ionItemReorder="handlePositionReorder">
      <ion-item v-for="position in team.positions" :key="position.id">
        <ion-icon :icon="ribbonOutline" slot="start" />
        <ion-label>{{ position.name }}</ion-label>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="editPosition(position)">
            <ion-icon :icon="pencilOutline" slot="icon-only" />
          </ion-button>
        </ion-buttons>
        <ion-reorder slot="end"></ion-reorder>
      </ion-item>
    </ion-reorder-group>
  </ion-card-content>
</ion-card>
```

### 3.2 Add/Edit Position Modal

Simple modal with:
- Input for position name
- Create/Update button
- Delete button (only if no members have this as default)

### 3.3 Update Member Display

In the member list, show the member's default position:
```vue
<p class="member-position" v-if="getMemberPosition(teamMember)">
  {{ getMemberPosition(teamMember) }}
</p>
```

### 3.4 Add Position Selection in Member Actions

When clicking "..." on a member, add option:
- "Changer le poste" - Opens position selector

---

## 4. UI: Position in TeamSchedulingView

### 4.1 Update MemberItem.vue

Add position display below member name:
```vue
<div class="member-info">
  <div class="member-name">{{ member.name }}</div>
  <div class="member-position" v-if="member.positionName || member.assignedPositionName">
    {{ member.assignedPositionName || member.positionName }}
  </div>
  <div class="member-status-text">{{ getStatusText() }}</div>
</div>
```

### 4.2 Position Override on Assignment

When assigning a member (clicking), show a quick action sheet or popover:
1. If team has positions, show position selector
2. Pre-select the member's default position
3. Allow selecting different position or "Sans poste"

### 4.3 Update schedulingStore

- Load positions when loading teams
- Include position info in MemberAssignment
- Pass position when creating assignment

---

## 5. UI: Position in ServiceDetailPage

### 5.1 Members Segment

When viewing assigned members per team, display their position:
```
[Avatar] John Doe
         Guitariste (default) or [custom position]
```

### 5.2 Position Override

Allow changing position by clicking on the member:
- Show modal/popover with team's positions
- Update assignment with new position

---

## 6. Implementation Checklist

### Phase 1: Data Model & Firebase
- [x] 1.1 Update `src/types/team.ts` with TeamPosition type
- [x] 1.2 Update TeamMember interface with positionId
- [x] 1.3 Update Team interface with positions array
- [x] 1.4 Update `src/types/assignment.ts` with position fields
- [x] 1.5 Update `src/types/scheduling.ts` MemberAssignment
- [x] 1.6 Create `generatePositionId()` helper in `src/firebase/teams.ts`
- [x] 1.7 Add position CRUD functions to `src/firebase/teams.ts`
- [x] 1.8 Update `src/firebase/assignments.ts` for positions

### Phase 2: Team Position Management UI
- [x] 2.1 Add positions section to TeamDetailPage
- [x] 2.2 Create add/edit position modal
- [x] 2.3 Implement position reordering with drag-and-drop
- [x] 2.4 Add member position display
- [x] 2.5 Add "change position" action for members

### Phase 3: Scheduling Integration
- [x] 3.1 Update schedulingStore to load and handle positions
- [x] 3.2 Update MemberItem.vue to display position
- [x] 3.3 Add position selector when assigning member (uses default position automatically)
- [x] 3.4 Pass position to createAssignment

### Phase 4: Service Detail Integration (Optional - can be added later)
- [ ] 4.1 Display member positions in service members view
- [ ] 4.2 Allow position override from service detail

---

## 7. UI/UX Guidelines

### Consistency
- Use `ribbonOutline` icon for positions (badge/role concept)
- Follow existing modal patterns from ResourceCollectionsPage
- Use ion-reorder-group for position ordering (like ServiceProgramPage)

### Simplicity
- Position selector should be a simple popover or action-sheet
- Default to member's team position when assigning
- Show position inline (no extra clicks needed to see it)

### Labels (French)
- "Poste" (singular), "Postes" (plural)
- "Aucun poste" for no position
- "Ajouter un poste"
- "Modifier le poste"
- "Supprimer le poste"
- "Poste par défaut" when showing default
- "Changer le poste"

---

## 8. Edge Cases

1. **Delete position with members using it**:
   - Warn and prevent deletion, or
   - Set those members' positionId to null

2. **Member with position assigned to different team for service**:
   - Each team has its own positions
   - When assigned to a team, use that team's position list

3. **Position renamed after assignment**:
   - Assignment stores positionName (denormalized)
   - Historical assignments keep old name

4. **Member removed from team**:
   - No impact on position - just member cleanup

5. **Team without positions**:
   - Feature is optional - team can have 0 positions
   - Assignment works normally without position

6. **Position ID collision**:
   - If a position with the same normalized name exists, show validation error
   - Example: "Chef de Louange" and "Chef De Louange" would both generate `louange-chef-de-louange`
   - Prevent creating duplicate positions

7. **Position renamed**:
   - When renaming a position, the ID must be regenerated
   - Update all team members' positionId references
   - Keep historical assignment positionName unchanged (denormalized)
