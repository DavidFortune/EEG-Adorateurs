# Bible Verse Grabber for "Lecture biblique" Items

## Goal
Implement a verse grabber feature for "Lecture biblique" (Scripture) program items that:
1. Parses Bible references from the title field (e.g., "Jean 3:16", "Psaume 23:1-6")
2. Fetches scripture text from a Bible API (French Louis Segond 1910)
3. Displays the fetched verses in a modal
4. Stores the fetched text for offline access

## Recommended Bible API

### bolls.life API
- **Free**: No API key required
- **French Louis Segond**: Available as `FRLSG` (Bible Segond 1910)
- **Well-structured**: Clean REST endpoints with JSON responses
- **Reliable**: Active project with good documentation

**Endpoints:**
```
# Single verse
GET https://bolls.life/get-verse/FRLSG/{book}/{chapter}/{verse}/

# Full chapter
GET https://bolls.life/get-text/FRLSG/{book}/{chapter}/

# Multiple verses (range)
POST https://bolls.life/get-verses/
Body: { "translation": "FRLSG", "book": 43, "chapter": 3, "verses": [16, 17, 18] }
```

**Book IDs:** 1=Genesis, 43=John, 19=Psalms, etc. (standard ordering)

## Data Structure Changes

### 1. Update ProgramItem Interface
**File:** `src/types/program.ts`

```typescript
export interface ProgramItem {
  // ... existing fields ...

  // New fields for scripture
  scriptureReference?: string;    // Parsed reference (e.g., "Jean 3:16-18")
  scriptureText?: string;         // Fetched verse text
  scriptureVersion?: string;      // Bible version used (default: "LSG")
}
```

### 2. Create Bible Reference Types
**File:** `src/types/bible.ts` (new file)

```typescript
export interface BibleReference {
  book: string;           // French book name
  bookId: number;         // API book ID
  chapter: number;
  verseStart: number;
  verseEnd?: number;      // Optional for ranges
}

export interface BibleVerse {
  book: number;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleApiResponse {
  pk: number;
  verse: number;
  text: string;
}
```

## New Service: Bible Service

**File:** `src/services/bibleService.ts`

### Features:
1. **Reference Parser**: Parse French Bible references
   - Single verse: "Jean 3:16" → { book: "Jean", chapter: 3, verseStart: 16 }
   - Range: "Psaume 23:1-6" → { book: "Psaume", chapter: 23, verseStart: 1, verseEnd: 6 }
   - Multi-chapter: "Matthieu 5:1-7:29" (stretch goal)

2. **Book Name Mapping**: French to API book IDs
   ```typescript
   const FRENCH_BOOKS: Record<string, number> = {
     'genèse': 1, 'genesis': 1, 'gen': 1,
     'exode': 2, 'ex': 2,
     // ... all 66 books with common abbreviations
     'jean': 43, 'jn': 43,
     'psaume': 19, 'psaumes': 19, 'ps': 19,
     // ...
   };
   ```

3. **Fetch Verses**: Call bolls.life API
4. **Format Text**: Join verses with proper formatting
5. **Cache**: Optional localStorage caching for offline

### Key Functions:
```typescript
parseBibleReference(input: string): BibleReference | null
fetchVerses(reference: BibleReference): Promise<string>
formatVersesForDisplay(verses: BibleVerse[]): string
```

## UI Changes

### 1. Item Form Enhancement (Lecture biblique only)
**File:** `src/views/services/ServiceProgramPage.vue`

When type is `SCRIPTURE`:
- Add "Chercher les versets" button next to title input
- Button triggers reference parsing and API fetch
- Show loading spinner while fetching
- Auto-populate `scriptureText` field

```
┌─────────────────────────────────────────────────────┐
│ Type: [Lecture biblique]                            │
├─────────────────────────────────────────────────────┤
│ Titre: [Jean 3:16-18____________] [📖 Chercher]    │
│                                                     │
│ ┌─ Versets ───────────────────────────────────────┐ │
│ │ 16 Car Dieu a tant aimé le monde qu'il a donné  │ │
│ │ son Fils unique, afin que quiconque croit en    │ │
│ │ lui ne périsse point, mais qu'il ait la vie     │ │
│ │ éternelle...                                    │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 2. Scripture Display Modal
**File:** `src/views/services/ServiceProgramPage.vue`

New modal for viewing full scripture text:
- Triggered by clicking scripture item or "Voir les versets" chip
- Displays formatted verses with verse numbers
- Copy to clipboard button
- Reference displayed as header

```
┌─────────────────────────────────────────────────────┐
│ Jean 3:16-18 (Louis Segond 1910)               [X] │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 16 Car Dieu a tant aimé le monde qu'il a donné    │
│    son Fils unique, afin que quiconque croit en   │
│    lui ne périsse point, mais qu'il ait la vie    │
│    éternelle.                                      │
│                                                     │
│ 17 Dieu, en effet, n'a pas envoyé son Fils dans   │
│    le monde pour qu'il juge le monde, mais pour   │
│    que le monde soit sauvé par lui.               │
│                                                     │
│ 18 Celui qui croit en lui n'est point jugé; mais  │
│    celui qui ne croit pas est déjà jugé...        │
│                                                     │
├─────────────────────────────────────────────────────┤
│                              [📋 Copier] [Fermer]  │
└─────────────────────────────────────────────────────┘
```

### 3. Scripture Chip in View Mode
Add a special chip for scripture items that have fetched text:
- Icon: `bookOutline` or `readerOutline`
- Label: "Versets" or reference
- Click opens Scripture Display Modal

## Files to Create

| File | Purpose |
|------|---------|
| `src/types/bible.ts` | Bible reference and verse types |
| `src/services/bibleService.ts` | API calls, parsing, formatting |

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/program.ts` | Add scripture fields to ProgramItem |
| `src/views/services/ServiceProgramPage.vue` | Add fetch button, scripture modal, scripture chip |

## Implementation Steps

### Phase 1: Types and Service
1. Create `src/types/bible.ts` with types
2. Create `src/services/bibleService.ts`:
   - French book name mapping (all 66 books + abbreviations)
   - Reference parser with regex
   - API fetch function
   - Text formatter

### Phase 2: Data Structure
3. Update `ProgramItem` in `src/types/program.ts`

### Phase 3: UI - Form Enhancement
4. Add scripture fetch button to item form (SCRIPTURE type only)
5. Add scripture text preview area in form
6. Wire up fetch logic with loading state

### Phase 4: UI - Display Modal
7. Add scripture modal state and template
8. Add scripture chip to item display
9. Wire up modal open/close

### Phase 5: Firebase Integration
10. Ensure scripture fields save/load correctly
11. Test with existing program items

## French Book Names Reference

```typescript
const FRENCH_BOOKS = {
  // Old Testament
  'genèse': 1, 'exode': 2, 'lévitique': 3, 'nombres': 4, 'deutéronome': 5,
  'josué': 6, 'juges': 7, 'ruth': 8, '1 samuel': 9, '2 samuel': 10,
  '1 rois': 11, '2 rois': 12, '1 chroniques': 13, '2 chroniques': 14,
  'esdras': 15, 'néhémie': 16, 'esther': 17, 'job': 18, 'psaume': 19,
  'proverbes': 20, 'ecclésiaste': 21, 'cantique': 22, 'ésaïe': 23,
  'jérémie': 24, 'lamentations': 25, 'ézéchiel': 26, 'daniel': 27,
  'osée': 28, 'joël': 29, 'amos': 30, 'abdias': 31, 'jonas': 32,
  'michée': 33, 'nahum': 34, 'habakuk': 35, 'sophonie': 36, 'aggée': 37,
  'zacharie': 38, 'malachie': 39,
  // New Testament
  'matthieu': 40, 'marc': 41, 'luc': 42, 'jean': 43, 'actes': 44,
  'romains': 45, '1 corinthiens': 46, '2 corinthiens': 47, 'galates': 48,
  'éphésiens': 49, 'philippiens': 50, 'colossiens': 51,
  '1 thessaloniciens': 52, '2 thessaloniciens': 53, '1 timothée': 54,
  '2 timothée': 55, 'tite': 56, 'philémon': 57, 'hébreux': 58,
  'jacques': 59, '1 pierre': 60, '2 pierre': 61, '1 jean': 62,
  '2 jean': 63, '3 jean': 64, 'jude': 65, 'apocalypse': 66
};
```

## Reference Parsing Regex

```typescript
// Matches: "Jean 3:16", "1 Corinthiens 13:1-13", "Psaume 23", "Gen. 1:1-2:3"
const REFERENCE_REGEX = /^(\d?\s?[a-zéèêëàâäùûüôöîïç]+\.?)\s*(\d+)(?::(\d+)(?:-(\d+))?)?$/i;

// Groups: [book, chapter, verseStart?, verseEnd?]
```

## Error Handling

- Invalid reference format → Show toast "Format de référence invalide"
- Book not found → Show toast "Livre non reconnu"
- API error → Show toast "Erreur de connexion" + retry button
- No verses returned → Show toast "Versets non trouvés"

## Backward Compatibility

- New fields are optional in ProgramItem
- Existing items without scripture data display normally
- Feature only activates for SCRIPTURE type items

---

## Implementation Checklist

### Phase 1: Types and Bible Service

- [x] **1.1** Create `src/types/bible.ts`
  - [x] Define `BibleReference` interface
  - [x] Define `BibleVerse` interface
  - [x] Define `BibleApiResponse` interface
  - [x] Export all types

- [x] **1.2** Create `src/services/bibleService.ts`
  - [x] Add `FRENCH_BOOKS` mapping (all 66 books + abbreviations)
  - [x] Implement `parseBibleReference(input: string): BibleReference | null`
  - [x] Implement `fetchVerses(reference: BibleReference): Promise<BibleVerse[]>`
  - [x] Implement `formatVersesForDisplay(verses: BibleVerse[]): string`
  - [x] Add error handling for API failures
  - [ ] Test with sample references (Jean 3:16, Psaume 23:1-6, 1 Corinthiens 13:4-7)

### Phase 2: Data Structure Update

- [x] **2.1** Update `src/types/program.ts`
  - [x] Add `scriptureReference?: string` to `ProgramItem`
  - [x] Add `scriptureText?: string` to `ProgramItem`
  - [x] Add `scriptureVersion?: string` to `ProgramItem`

### Phase 3: UI - Item Form Enhancement

- [x] **3.1** Update item form in `ServiceProgramPage.vue`
  - [x] Add `scriptureText` to `itemForm` ref
  - [x] Add `fetchingScripture` loading state ref
  - [x] Add conditional UI for SCRIPTURE type items

- [x] **3.2** Add "Chercher les versets" button
  - [x] Show button only when `itemForm.type === 'Lecture biblique'`
  - [x] Position button below title input
  - [x] Add book icon (`bookOutline`)
  - [x] Disable button when title is empty

- [x] **3.3** Implement fetch handler
  - [x] Create `handleFetchScripture()` function
  - [x] Parse reference from title
  - [x] Show loading spinner on button
  - [x] Call `bibleService.getScripture()`
  - [x] Update `itemForm.scriptureText` with result
  - [x] Show error toast on failure

- [x] **3.4** Add scripture preview area
  - [x] Show preview only when `scriptureText` has content
  - [x] Display formatted verses in readonly div
  - [x] Add "Effacer" button to clear fetched text
  - [x] Style with appropriate background and border

### Phase 4: UI - Scripture Display Modal

- [x] **4.1** Add modal state
  - [x] Add `showScriptureModalState` ref
  - [x] Add `selectedScriptureItem` ref

- [x] **4.2** Create scripture modal template
  - [x] Add `<ion-modal>` with proper structure
  - [x] Header with reference title and close button
  - [x] Content area with formatted verses
  - [x] Footer with "Copier les versets" button

- [x] **4.3** Implement modal functions
  - [x] Create `openScriptureModal(item: ProgramItem)` function
  - [x] Create `closeScriptureModal()` function
  - [x] Create `copyScriptureToClipboard()` function
  - [x] Show success toast after copy

### Phase 5: UI - Scripture Chip in View Mode

- [x] **5.1** Add scripture chip to item display
  - [x] Show chip only for items with `scriptureText`
  - [x] Use `bookOutline` icon
  - [x] Label: reference or "Versets"
  - [x] Add click handler to open scripture modal

- [x] **5.2** Style the scripture chip
  - [x] Use tertiary color
  - [x] Match existing chip styling

### Phase 6: Save/Load Integration

- [x] **6.1** Update `addItem()` function
  - [x] Include `scriptureReference` if present
  - [x] Include `scriptureText` if present
  - [x] Include `scriptureVersion` if present

- [x] **6.2** Update `updateItem()` function
  - [x] Include scripture fields in update payload

- [x] **6.3** Update `showEditItemModalForItem()` function
  - [x] Load existing scripture fields into form

### Phase 7: Testing & Polish

- [x] **7.1** Build verification
  - [x] TypeScript compilation passes
  - [x] Vite build completes successfully

- [ ] **7.2** Test reference parsing (manual testing needed - CORS fix applied)
  - [ ] Single verse: "Jean 3:16"
  - [ ] Verse range: "Psaume 23:1-6"
  - [ ] Numbered book: "1 Corinthiens 13:4-7"
  - [ ] Abbreviated: "Gen 1:1", "Mt 5:3-12"
  - [ ] French accents: "Ésaïe 53:5"

- [ ] **7.3** Test error scenarios (manual testing needed)
  - [ ] Invalid reference format
  - [ ] Unknown book name
  - [ ] API timeout/failure

- [ ] **7.4** Test backward compatibility (manual testing needed)
  - [ ] Existing SCRIPTURE items display correctly
  - [ ] Items without scripture fields work normally
  - [ ] Other item types unaffected
