# JavaScript File Load Pattern Demo

This repository contains a minimal demo that shows two small, contrasting browser patterns for loading a CSV file from the user's machine and presenting the result:

- Proper page: reads the file asynchronously, stores the contents in memory, and shows the contents synchronously when the user clicks a display button. This avoids popup-blocker issues.
- Malformed page: demonstrates the anti-pattern of calling window.open from an asynchronous continuation (after the file read completes). Browsers often block that as a popup.

## How to try the demo locally

Run a tiny static server from the project folder and open the pages in your browser:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/index.html (proper) and
# open http://localhost:8000/malformed.html (malformed)
```

No CSS or external build steps are required — the demo uses plain HTML and vanilla JavaScript.

## What each page demonstrates

### Proper

The Proper page (`index.html`) demonstrates a safe pattern:

- The user selects a CSV file and clicks "Load selected CSV (async)".
- The file is read asynchronously using the FileReader API and held in memory.
- The user then clicks "Show loaded CSV (sync)" to synchronously render the contents in-page.

This flow never calls `window.open` from an async continuation, so popup blockers are not involved.

### Malformed

The Malformed page (`malformed.html`) demonstrates the anti-pattern:

- The user selects a CSV file and clicks "Load selected CSV (async, will try popup)".
- After the asynchronous read completes the page attempts to call `window.open` from the async continuation.
- In most browsers that call is treated as not user-initiated and will be blocked by the popup blocker.

The Malformed page intentionally shows that timing matters: calling `window.open` must happen synchronously as part of a user gesture if you want browsers to allow it.

## Files and their purpose

- `index.html` — The Proper demo page. Minimal UI for selecting and loading a CSV and then showing it synchronously.
- `malformed.html` — The Malformed demo page. Minimal UI that attempts to open a popup after async I/O to illustrate popup-blocker behavior.
- `js/main.js` — JavaScript for the Proper page. Handles file selection, asynchronous read, stores the result in memory, and exposes a synchronous display action.
- `js/malformed.js` — JavaScript for the Malformed page. Handles file selection, asynchronous read, and intentionally attempts `window.open` from the async continuation; it exposes flags (`window.__popupAttempted`, `window.__popupOpened`) for automated tests.
- `sample.csv` — A tiny sample CSV used by the automated tests.
- `tests/run-tests.js` — A small Playwright-based CLI test harness that exercises both pages and asserts the expected outcomes (notes below about popup blockers in headless browsers).
- `package.json` — Includes a `test` script to run the CLI tests.
- `.github/workflows/gh-pages.yml` — (present in the repo) previously used for demonstration-only GitHub Pages publishing — removed from instructions below.
- `README.md` — This file.

## Tests (CLI)

There is a small, optional CLI test harness based on Playwright. It performs these checks:

- Proper page: the test uploads `sample.csv`, clicks the load button, and asserts that the page sets `window.__properLoaded === true` (indicating the user can complete the data load).
- Malformed page: the test uploads `sample.csv`, clicks the load button, and asserts that the page attempted a popup (`window.__popupAttempted === true`) and that the popup was not opened (`window.__popupOpened === false`), which we treat as a PASS for the malformed demo (it shows the browser correctly blocked the popup).

To run the tests locally:

1. Install dev dependencies:

```bash
npm install
npx playwright install --with-deps
```

2. Run the test script:

```bash
npm test
```

Notes about CI and headless environments

Popup-blocker behavior varies across browsers and environments. Headless browsers or CI runners may not emulate popup blockers the same way as a full desktop browser. The test harness attempts to detect the popup attempt and whether it was opened using in-page flags, but results in CI may differ from a desktop test.

## Guidance on production use

Both pages are educational. The Proper pattern shown in `index.html` is a safe, production-appropriate approach for reading local files and displaying them in-page: perform asynchronous I/O, store results, and use synchronous user-initiated actions to present data.

The Malformed pattern (calling `window.open` from an async continuation) is fragile and should be avoided in production. If you must open a new window as part of a user flow, open a placeholder window synchronously inside the user gesture and then populate it after the async work completes.

## GitHub Pages demo

If you pushed this repository to GitHub under the `pubino/js-fileload-pattern` repository and enabled GitHub Pages, the demo site may be available at:

https://pubino.github.io/js-fileload-pattern/

If you want me to add instructions for automated GitHub Actions testing or to publish the site under a specific Pages configuration, tell me which option you prefer and I will update the repo accordingly.

