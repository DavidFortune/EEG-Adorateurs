## 1. Setup

- [x] 1.1 Create `src/components/program/` directory

## 2. Extract Modals

- [x] 2.1 Extract `PresentationModal.vue` — template (slides, navigation controls), script (buildPresentationSlides, slide navigation, touch/swipe handlers, currentSlideIndex, presentationSlides state), and all presentation CSS
- [x] 2.2 Extract `YouTubePlaylistModal.vue` — template (player, queue, navigation), script (buildYouTubePlaylist, video navigation, touch handlers, youtubeVideos/currentVideoIndex state), and all YouTube CSS
- [x] 2.3 Extract `MediaDisplayModal.vue` — template (lyrics, YouTube embed, Spotify embed, audio, PDF display), script (showMediaContent, closeMediaModal, media state), and related CSS
- [x] 2.4 Extract `MusicPropertiesModal.vue` — template (key/beat/tempo/style form), script (openMusicPropsModal, saveMusicProps, musicPropsForm, music option refs), and related CSS
- [x] 2.5 Extract `DraftViewersModal.vue` — template (searchable member list), script (draft viewer management, search filter), and related CSS

## 3. Extract Control Sections

- [x] 3.1 Extract `ProgramSummary.vue` — stats display (item count, duration), conductor card with avatar, edit button (props: program, totalDuration, isEditing, failedAvatars; emits: editProgram)
- [x] 3.2 Extract `EditModeControls.vue` — enter-edit button + timer/finish controls (props: isEditing, isPublished, isTimerWarning, formattedLockTime; emits: enter, exit, extend)
- [x] 3.3 Extract `EditLockIndicator.vue` — "X is editing" banner with force-control button (props: lockHolder, isAdmin; emits: forceEnter)
- [x] 3.4 Extract `DraftModeControls.vue` — draft notice + publish/access buttons (props: isAdmin, isDraft; emits: openViewers, publish)

## 4. Extract Composable

- [x] 4.1 Create `useEditLock.ts` — extract lock state management, countdown timer, enter/exit/extend/force lifecycle, timer warning logic from ServiceProgramPage into a composable returning `{ isEditing, isLockedByOther, lockHolder, formattedLockTime, isTimerWarning, enterEditMode, exitEditMode, forceEnterEditMode, extendEditMode }`

## 5. Cleanup & Verify

- [x] 5.1 Remove all extracted template sections, functions, state, and CSS from ServiceProgramPage.vue
- [x] 5.2 Wire all extracted components in parent with correct props/emits
- [x] 5.3 Build compiles with no errors (`npx vue-tsc --noEmit`)
- [x] 5.4 Verify ServiceProgramPage.vue is under 3500 lines (3462 lines — 43% reduction from 6022)
