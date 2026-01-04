# Program Structure Refactoring

## Overview
Refactoring the program creation from a section-based hierarchy to a flatter structure with optional sub-items, based on the example program "Programme 9 novembre 2025.pdf".

## Current Structure (OLD)
```
Program
├── sections[]
│   ├── Section 1
│   ├── Section 2
│   └── Section 3
└── items[]
    ├── Item 1 (sectionId: section1)
    ├── Item 2 (sectionId: section1)
    ├── Item 3 (sectionId: section2)
    └── Item 4 (sectionId: section3)
```

**Problems:**
- Forces users to create sections even for simple programs
- Rigid hierarchy doesn't match typical church program format
- Extra complexity in the UI

## New Structure (FLAT)
```
Program
└── items[]
    ├── Item 1: Mot de bienvenue
    ├── Item 2: Prière d'introduction
    ├── Item 3: Lecture (Mathieu 11v25-30)
    ├── Item 4: Moment d'adoration
    │   ├── Sub-item: Kache mwen anba zel ou
    │   ├── Sub-item: Ou pran tristes mwen yo
    │   └── Sub-item: Mwen te chwazi
    ├── Item 5: Prière dominicale
    ├── Item 6: Salutations aux visiteurs
    ...
    ├── Item 10: Deuxième moment de louange
    │   ├── Sub-item: À celui qui sera vainqueur
    │   ├── Sub-item: Sur de la victoire (refrain)
    │   ├── Sub-item: Il y a un nom
    │   └── Sub-item: Glwa pou Bondye
    ...
```

**Benefits:**
- Matches real-world church programs
- Simpler, more intuitive UI
- Optional sub-items for grouped content (songs, etc.)
- Backward compatible (sections field kept)

## Data Structure Changes

### New Types Added
```typescript
// New item types matching church program elements
export enum ProgramItemType {
  ...existing types
  WELCOME = 'Mot de bienvenue',
  GREETING = 'Salutations',
  SPECIAL_NUMBER = 'Numéro spécial',
  COLLECTION = 'Collecte',
  WORSHIP = 'Adoration',
  PRAISE = 'Louange',
  FINAL_SONG = 'Chant final',
  CLOSING_SONG = 'Chant de clôture',
  OTHER = 'Autre'
}

// Sub-items for nested content
export interface ProgramSubItem {
  id: string;
  title: string;
  resourceId?: string; // Link to resource (song)
  notes?: string;
  order: number;
}

// Updated ProgramItem with sub-items
export interface ProgramItem {
  ...existing fields
  subItems?: ProgramSubItem[]; // NEW: optional sub-items
  sectionId?: string; // DEPRECATED: kept for compatibility
}
```

### Firebase Functions Added
```typescript
// New functions for managing sub-items
addSubItemToItem(programId, itemId, subItem, userId)
updateSubItemInItem(programId, itemId, subItemId, updates, userId)
deleteSubItemFromItem(programId, itemId, subItemId, userId)
```

## UI Changes Required

### ServiceProgramPage.vue Refactoring

#### Remove Section Management
- ✅ Remove "Ajouter une section" buttons
- ✅ Remove section modal dialogs
- ✅ Remove section drag/drop functionality
- ✅ Remove section editing UI

#### Add Flat Item List
- ✅ Display all items in a single flat list (no section grouping)
- ✅ Show item order numbers (1, 2, 3...)
- ✅ Add expand/collapse for items with sub-items
- ✅ Show sub-items indented under parent items

#### Add Sub-Item Management
- ✅ Add "Add sub-item" button on items (when in edit mode)
- ✅ Sub-item modal for adding/editing
- ✅ Drag/drop reorder for sub-items
- ✅ Delete sub-item functionality

#### Update Item Addition Modal
- ✅ Remove section selection dropdown
- ✅ Add "Has sub-items?" toggle
- ✅ If toggled, show sub-items section
- ✅ Allow adding multiple sub-items during item creation

### Example UI Flow

**Adding a Worship Moment:**
1. Click "Add Item"
2. Select Type: "Adoration"
3. Enter Title: "Moment d'adoration"
4. Toggle "Has sub-items" ON
5. Click "Add sub-item"
   - Enter "Kache mwen anba zel ou"
   - Optional: Link to resource (song)
6. Click "Add sub-item"
   - Enter "Ou pran tristes mwen yo"
7. Click "Add sub-item"
   - Enter "Mwen te chwazi"
8. Save

**Result:**
```
4. Moment d'adoration
   • Kache mwen anba zel ou
   • Ou pran tristes mwen yo
   • Mwen te chwazi
```

## Migration Strategy

### Backward Compatibility
- Keep `sections` field in database (empty for new programs)
- Keep `sectionId` in items (undefined for new programs)
- Old programs with sections still render correctly
- No data migration required

### Gradual Transition
1. Phase 1: Update types and Firebase functions ✅
2. Phase 2: Update UI to support both modes
3. Phase 3: Default to flat mode for new programs
4. Phase 4: Add migration tool for old programs (optional)

## Implementation Checklist

### Backend (Firebase)
- [x] Update `program.ts` types
- [x] Add `ProgramSubItem` interface
- [x] Update `createProgram()` to handle sub-items
- [x] Add `addSubItemToItem()`
- [x] Add `updateSubItemInItem()`
- [x] Add `deleteSubItemFromItem()`

### Frontend (ServiceProgramPage.vue)
- [ ] Remove section UI components
- [ ] Add flat item list view
- [ ] Add sub-item display (expandable)
- [ ] Update add/edit item modal
- [ ] Add sub-item management modal
- [ ] Update drag/drop for flat structure
- [ ] Update drag/drop for sub-items
- [ ] Remove section-related computed properties
- [ ] Update summary stats (remove section count or show 0)

### Testing
- [ ] Test creating new flat program
- [ ] Test adding items with sub-items
- [ ] Test editing sub-items
- [ ] Test deleting sub-items
- [ ] Test reordering items
- [ ] Test reordering sub-items
- [ ] Test backward compatibility with old programs
- [ ] Test PDF/print generation
- [ ] Test SMS program sharing

## Next Steps
1. ✅ Complete backend changes
2. Refactor ServiceProgramPage.vue UI components
3. Test thoroughly with real church program data
4. Deploy and monitor
