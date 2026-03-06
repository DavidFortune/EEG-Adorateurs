## Why

Creating a resource currently requires too many steps: users must first create a resource shell (title + metadata) on the form page, then navigate to the detail page to add actual content (lyrics, media, YouTube links). This two-phase flow with separate screens is unintuitive and slow, especially on mobile. Music metadata fields (key, beat, tempo, style) are always visible even when irrelevant, adding visual clutter to the form.

## What Changes

- **Integrate content/media creation into the resource form page** — users can add lyrics, YouTube links, audio, and other media directly during creation, eliminating the need to navigate to the detail page
- **Collapse music metadata into an expandable section** — hide the 4 music property fields behind a toggle so they don't clutter the form for non-musical resources
- **Flatten collection creation** — replace the nested modal-in-modal pattern with an inline expandable section within the collection selector, reducing modal depth
- **Auto-navigate to detail page after creation** — after saving a new resource, route to its detail page (not back to the list) so users can immediately see and refine their resource

## Capabilities

### New Capabilities

### Modified Capabilities

- `resource-library`: The resource creation form requirements are changing — content/media can now be added during creation (not only on the detail page), music metadata is collapsible, collection creation is flattened, and post-creation navigation changes

## Impact

- **Affected components:** `ResourceFormPage.vue` (major changes — add media section, collapsible metadata, inline collection creation), `ResourceSelector.vue` (minor — align quick-create with new patterns)
- **No backend/API changes** — same Firestore operations, just invoked earlier in the flow
- **No data model changes** — `Resource` type and `ResourceMedia` type remain unchanged
- **No breaking changes** — existing resources and collections are unaffected
