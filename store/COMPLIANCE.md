# HexaSpell — compliance checklist

Checked against the FreeGameStore rules and `fgs check`. A box is ticked only when the item is true for the code on `main`.

- [x] **Word-list licence.** The SCOWL / ESDB licence ships with the lists at `web/public/wordlists/LICENSE`, served as `/wordlists/LICENSE`. `web/src/words/wordlist.test.ts` checks that the licence is present with the lists. Credit is in `store/LISTING.md`.
- [x] **Free and MIT.** `LICENSE` is MIT. No payments, purchases or helper gates.
- [x] **No tracking, cookies or external scripts.** `fgs check` passes: analytics only through the platform loader, and no cookies. Player data stays in `localStorage`.
- [x] **Viewport.** The layout fits a 390 × 844 phone in light and dark with no scrolling (checked with headless Chrome, see `store/screenshots/`).
- [x] **Offline.** The word lists are precached by the service worker (`web/vite.config.ts` globPatterns include `txt`).
- [x] **Store listing.** Title, description, category and screenshots are in `store/LISTING.md`.
- [ ] **Release build published.** Pending `fgs publish`.
- [ ] **Game listed.** Pending `fgs publish`.
- [ ] **Live on freegamestore.online.** Pending the live check after publish.
