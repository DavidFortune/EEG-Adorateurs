# Plan: Resource CRUD UX Improvements for Program Editor

## Executive Summary

Redesign the resource management experience when editing programs to minimize clicks, simplify interfaces, and optimize for mobile-first usage.

---

## Current State Analysis

### Pain Points Identified

| Issue | Current State | Impact |
|-------|---------------|--------|
| **Click count** | 3-5 clicks to add existing resource | Slow, tedious |
| **Modal depth** | 8 modals total, up to 3 nested | Confusing navigation |
| **YouTube flow** | 5-7 clicks to add from YouTube | Complex for common action |
| **No quick remove** | Must open edit modal to unlink | Extra steps |
| **No inline editing** | All actions require modal | Interrupts flow |
| **No recent resources** | Must search every time | Repetitive work |
| **No smart suggestions** | Manual search always | Missed efficiency |

### Current Click Flow

```
Add Resource to Item (Current):
1. Click edit item (pencil) ─────────────────────────────> Modal 1
2. Click "Lier une ressource" ───────────────────────────> Modal 2
3. (Optional) Switch tab ────────────────────────────────>
4. Search or scroll ─────────────────────────────────────>
5. Click resource to select ─────────────────────────────>
6. Click "Confirmer" ────────────────────────────────────>
7. Click "Modifier" to save item ────────────────────────>

Total: 5-7 clicks + typing
```

---

## Proposed UX Improvements

### Design Principles

1. **One-tap actions** - Primary actions accessible in single tap
2. **Progressive disclosure** - Show more options only when needed
3. **Mobile gestures** - Swipe, long-press, drag-drop
4. **Context-aware** - Suggest based on item type and history
5. **Inline editing** - Modify without leaving current view

---

## Phase 1: Inline Resource Actions (High Impact)

### 1.1 Inline Resource Quick-Add Button

**Current**: Must open item edit modal → open resource selector

**Proposed**: Add resource directly from program item card

```
┌─────────────────────────────────────────────────────┐
│ 1  Chant                                            │
│    ♪ Louange à Dieu                                 │
│    ┌─────────────────────────────────┐              │
│    │ [+] Ajouter une ressource       │  ← NEW      │
│    └─────────────────────────────────┘              │
│    10 min · Jean Dupont                             │
└─────────────────────────────────────────────────────┘
```

**When resource exists**:
```
┌─────────────────────────────────────────────────────┐
│ 1  Chant                                            │
│    ♪ Louange à Dieu                                 │
│    ┌─────────────────────────────────┐              │
│    │ 🎵 Grâce Infinie [CAI]    [×]   │  ← Tap to   │
│    │ Paroles · YouTube               │    preview  │
│    └─────────────────────────────────┘    × remove │
│    10 min · Jean Dupont                             │
└─────────────────────────────────────────────────────┘
```

**Clicks saved**: 3-4 clicks → 1 click

### 1.2 Swipe Actions (Mobile)

**Swipe left on resource chip**:
- Reveal red "Supprimer" button
- One-tap to unlink (with haptic feedback)

**Swipe right on resource chip**:
- Reveal blue "Remplacer" button
- Opens resource selector directly

**Long-press on resource chip**:
- Quick action menu: Preview | Replace | Remove

### 1.3 Remove Resource Without Modal

**Current**: Edit item → click × in selector → save item (3 clicks)

**Proposed**: Tap × on resource chip directly (1 click + confirm)

---

## Phase 2: Bottom Sheet Resource Selector (Mobile-First)

### 2.1 Replace Modal with Bottom Sheet

**Current**: Full-screen modal, feels heavy

**Proposed**: Slide-up bottom sheet (50% height initially, expandable)

```
┌─────────────────────────────────────────────────────┐
│                    Program Editor                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Program items list...]                            │
│                                                     │
╔═════════════════════════════════════════════════════╗
║  ━━━ (drag handle)                                  ║
║                                                     ║
║  🔍 Rechercher une ressource...                     ║
║                                                     ║
║  ── Récents ──────────────────────────────────     ║
║  🎵 Grâce Infinie        🎵 Victoire               ║
║  🎵 Hosanna              🎵 Tu es saint            ║
║                                                     ║
║  ── Suggestions ──────────────────────────────     ║
║  🎵 [Based on "Chant" type...]                     ║
║                                                     ║
║  [Voir toutes les ressources →]                    ║
╚═════════════════════════════════════════════════════╝
```

**Gestures**:
- Drag up to expand full screen
- Drag down to dismiss
- Tap outside to close

### 2.2 Search-First Interface

**Current**: Tabs (Existantes | YouTube | Créer) then search

**Proposed**: Universal search bar with smart results

```
┌─────────────────────────────────────────────────────┐
│  🔍 "grâce"                                    [×]  │
├─────────────────────────────────────────────────────┤
│  ── Vos ressources ─────────────────────────────── │
│  🎵 Grâce Infinie                    [CAI] [+]     │
│  🎵 Grâce Merveilleuse               [HYM] [+]     │
│                                                     │
│  ── YouTube ───────────────────────────────────── │
│  ▶️ Amazing Grace - Hillsong          [+]          │
│  ▶️ Grace - Laura Story               [+]          │
│                                                     │
│  ── Créer ────────────────────────────────────── │
│  [+ Créer "grâce" comme nouvelle ressource]        │
└─────────────────────────────────────────────────────┘
```

**Benefits**:
- One search queries all sources
- Tap [+] to add directly (1 click)
- No tab switching needed

### 2.3 Recent Resources Section

Show last 8 resources used across all programs:
- Persisted in localStorage
- Updated on each resource link
- Quick tap to add

---

## Phase 3: Smart Suggestions

### 3.1 Context-Aware Suggestions

Based on item type:
- **"Chant"** → Show songs from collections
- **"Lecture biblique"** → Show scripture resources
- **"Prédication"** → Show sermon notes/outlines

Based on item title:
- Parse title for keywords
- Fuzzy match against resource titles
- Show top 3 matches automatically

### 3.2 Quick-Link from Search

When searching, show instant link button:
```
🎵 Grâce Infinie [CAI]         [Lier ↵]
```
- Tap "Lier" adds immediately
- No confirmation needed (instant feedback with toast)

---

## Phase 4: Simplified Item Creation

### 4.1 Combined Title + Resource Input

**Current**: Create item → set title → open resource selector → search → select

**Proposed**: Smart input that detects resource names

```
┌─────────────────────────────────────────────────────┐
│  Nouvel élément                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Type: [Chant ▼]                                   │
│                                                     │
│  Titre/Ressource:                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ Grâce Inf...                             │   │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🎵 Grâce Infinie [CAI]           [Utiliser]│   │ ← Auto-suggest
│  └─────────────────────────────────────────────┘   │
│                                                     │
│           [Ajouter l'élément]                       │
└─────────────────────────────────────────────────────┘
```

**Flow**:
1. Select type
2. Start typing title
3. Suggestions appear as you type
4. Tap suggestion → auto-fills title + links resource
5. Tap "Ajouter" → done

**Clicks**: 3 clicks total (type + suggestion + add)

### 4.2 Quick-Add Templates

Pre-configured quick-add buttons for common items:

```
[+ Chant] [+ Prière] [+ Lecture] [+ Prédication]
```

Tap → Opens minimal form with type pre-selected

---

## Phase 5: Batch Operations

### 5.1 Multi-Select Mode

Long-press on item → Enter selection mode
- Checkboxes appear on all items
- Bottom action bar: [Supprimer] [Déplacer]

### 5.2 Drag-to-Reorder with Resource Preview

While dragging, show resource preview tooltip

---

## Implementation Priority

| Phase | Feature | Impact | Effort | Priority |
|-------|---------|--------|--------|----------|
| 1.1 | Inline resource quick-add | High | Medium | **P0** |
| 1.3 | Remove without modal | High | Low | **P0** |
| 2.1 | Bottom sheet selector | High | High | **P1** |
| 2.2 | Universal search | High | Medium | **P1** |
| 2.3 | Recent resources | Medium | Low | **P1** |
| 1.2 | Swipe actions | Medium | Medium | **P2** |
| 3.1 | Smart suggestions | Medium | Medium | **P2** |
| 4.1 | Combined title/resource | Medium | High | **P3** |
| 4.2 | Quick-add templates | Low | Low | **P3** |
| 5.x | Batch operations | Low | High | **P4** |

---

## Click Count Comparison

| Action | Current | Proposed | Savings |
|--------|---------|----------|---------|
| Add existing resource | 5-7 | 2-3 | 50-60% |
| Add from YouTube | 6-8 | 3-4 | 50% |
| Remove resource | 3 | 1 | 66% |
| Replace resource | 5-7 | 2 | 60-70% |
| Create new item + resource | 7-9 | 3-4 | 55% |

---

## Files to Modify

### Core Changes

| File | Changes |
|------|---------|
| `src/views/services/ServiceProgramPage.vue` | Inline resource actions, swipe gestures |
| `src/components/ResourceSelector.vue` | Convert to bottom sheet, universal search |
| `src/components/ResourceQuickAdd.vue` | **NEW** - Inline resource chip component |
| `src/components/ResourceBottomSheet.vue` | **NEW** - Bottom sheet selector |

### Supporting Changes

| File | Changes |
|------|---------|
| `src/composables/useRecentResources.ts` | **NEW** - Recent resources hook |
| `src/utils/resource-suggestions.ts` | **NEW** - Smart suggestion logic |
| `src/stores/recentResources.ts` | **NEW** - Pinia store for recents |

---

## Mobile-First Considerations

1. **Touch targets**: Minimum 44×44px for all interactive elements
2. **Haptic feedback**: Vibration on swipe actions and confirmations
3. **One-handed use**: Primary actions within thumb zone
4. **Gesture hints**: Visual indicators for swipe actions
5. **Bottom sheet**: Native-feeling slide interaction
6. **Keyboard avoidance**: Input fields adjust for virtual keyboard

---

## Web Adaptations

1. **Hover states**: Show action buttons on hover
2. **Right-click context menu**: Alternative to long-press
3. **Keyboard shortcuts**:
   - `R` - Add resource
   - `Delete` - Remove resource
   - `Enter` - Confirm selection
4. **Drag-and-drop**: Drop resource onto item from sidebar
5. **Bottom sheet → Side panel**: On larger screens

---

## Verification Plan

1. **Usability testing**: 5 users perform add/remove/replace tasks
2. **Click tracking**: Measure average clicks per action
3. **Time tracking**: Measure time to complete common flows
4. **A/B testing**: Compare new vs old selector
5. **Mobile testing**: Test on iOS and Android devices

---

## Implementation Checklist

### Phase 1: Inline Resource Actions
- [ ] Create ResourceQuickAdd component
- [ ] Add inline add button to program items
- [ ] Add inline resource chip display
- [ ] Implement tap-to-remove with confirmation
- [ ] Add swipe gesture support (Hammer.js or custom)
- [ ] Add haptic feedback

### Phase 2: Bottom Sheet Selector
- [ ] Create ResourceBottomSheet component
- [ ] Implement drag-to-expand behavior
- [ ] Add universal search across sources
- [ ] Implement recent resources section
- [ ] Add instant link buttons

### Phase 3: Smart Suggestions
- [ ] Create suggestion utility functions
- [ ] Implement type-based filtering
- [ ] Add title-based fuzzy matching
- [ ] Show suggestions inline

### Phase 4: Simplified Creation
- [ ] Add autocomplete to title input
- [ ] Implement suggestion selection
- [ ] Create quick-add type buttons
