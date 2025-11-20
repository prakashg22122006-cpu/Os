# Prioritized Action Plan

## 🔴 Quick Wins (High Impact / Low Effort)
- [ ] **Create `manifest.json`**: Define app name, icons, and `start_url` to enable basic PWA installation triggers.
- [ ] **Add `alt` attributes**: Review `ResourceThumbnail` and `FileViewerModal` to ensure dynamic images have descriptive alt text (currently using generic names).
- [ ] **Fix Meta Tags**: Add `theme-color` meta tag to `index.html` to match the app's dark theme (`#040811`).
- [ ] **Error Handling**: Add a `try-catch` block in `AppContext.tsx` `loadAndMergeAppSettings` (already present, but ensure it covers all `JSON.parse` instances).

## 🟡 Medium Term (Security & Resilience)
- [ ] **Sanitize Inputs**: Install `dompurify`. Update `RichTextEditor.tsx`, `FlashcardManager.tsx`, and `NotesManager.tsx` to sanitize HTML before saving or rendering.
- [ ] **Service Worker**: Create `service-worker.js` to cache the external CDN scripts (`react`, `tailwindcss`, `recharts`) and fonts. This is critical for "Offline" claims.
- [ ] **Widget Error Boundaries**: Wrap `DashboardView` widgets in a React Error Boundary to prevent full app crashes from a single widget error.
- [ ] **Backup Validation**: Enhance `BackupRestoreManager.tsx` to validate the schema of imported JSON files before attempting to merge/restore.

## 🟢 Long Term (Architecture & Scale)
- [ ] **Remove CDNs**: Convert project to a build-step based architecture (Vite/Webpack). Install `react`, `recharts`, `tailwindcss` as `devDependencies`.
- [ ] **Virtualization**: Implement list virtualization (e.g., `react-window`) for `NotesManager` and `FileManager` if item counts exceed 1000+.
- [ ] **Search Index**: Replace linear search in `GlobalSearch.tsx` with a lightweight search index (e.g., `minisearch` or `fuse.js`) for better performance with large datasets.
- [ ] **Audio Optimization**: Move `GlobalAudioPlayer` logic to a Web Worker if visualization creates main-thread jank during heavy UI operations.