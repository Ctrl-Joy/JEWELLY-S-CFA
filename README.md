# JEWEL — Personal Study Space

A lightweight, static website for a personal study space.

## Open locally
1. Extract this ZIP.
2. Open `index.html` in a modern browser.
3. Select **Enter my space** to open the personal dashboard.
4. Select a subject to open its original HTML file from the `subjects/` directory.

For best compatibility with browser storage and local navigation, you can also serve this directory with a local static server (for example, Python's `http.server`).

## What is included
- `index.html` — minimal JEWEL landing page.
- `dashboard.html` — subjects, last-opened subject, manual completion tracking, and a daily study-goal preference.
- `styles.css` and `app.js` — JEWEL-only styles and behavior.
- `subjects/` — byte-for-byte copies of the ten provided HTML files.
- `integrity/sha256.json` — source and packaged-file hashes.
- `reports/validation-report.md` — automated checks and limitations.

## Persistence and limitations
Study completion, theme, goal, and last-opened subject are stored locally in the browser. This is not account-based syncing. Completion marks are manual; JEWEL does not claim to measure reading time or progress inside the study pages. Opening a subject updates the last-opened subject when navigation is performed through JEWEL.

The existing subject HTML files are not edited. Their filenames and contents are preserved. JEWEL does not inject code into them.

## Fonts
The interface uses DM Sans and Playfair Display from Google Fonts when online, with local system fallbacks if unavailable.
