CSV Load Demo

This is a minimal demo that shows an asynchronous file load (using FileReader) and a separate synchronous step to display the loaded contents.

Files:
- index.html: the HTML UI with file input and two buttons
- js/main.js: JavaScript logic (async load + sync display)

How to use:
1. Open `index.html` in a browser (double-click or serve from a simple HTTP server).
2. Click the file chooser and pick a `.csv` file from your machine.
3. Click "Load selected CSV (async)" — this reads the file asynchronously.
4. After the success message, click "Show loaded CSV (sync)" to display the raw CSV contents.

Notes:
- No CSS included. This is intentionally bare-bones.
- The demo uses the browser File API and doesn't upload files anywhere.

Explanation: microtask vs macrotask in this demo
------------------------------------------------

Short answer: the underlying file-read completion is delivered as a macrotask (a normal event/task). However, because this demo wraps the FileReader callback in a Promise, the Promise resolution causes the async/await continuation to run via the microtask queue.

More detail:
- When you call `reader.readAsText(file)` the browser performs the file I/O asynchronously.
- When the read finishes the browser dispatches a `load` event (the `onload` callback) as an event loop task — commonly referred to as a macrotask.
- In `js/main.js` the `onload` handler calls `resolve(reader.result)` which resolves the Promise returned by `readFileAsText`.
- Resolving a Promise schedules the Promise reactions (the code after `await`) as microtasks. That means the `await readFileAsText(file)` will resume on the microtask queue immediately after the current macrotask yields.

So: the I/O completion itself is a macrotask, and the Promise-based continuation runs as a microtask. For most apps the difference is subtle, but it's useful to know: microtasks run before the next rendering/macro task, so the `await` continuation will run quickly after the `onload` handler resolves the Promise.

CI / GitHub Pages deployment
----------------------------

This repo includes a GitHub Actions workflow at `.github/workflows/gh-pages.yml` that publishes the repository content to GitHub Pages whenever you push to the `main` branch. The workflow uses the `peaceiris/actions-gh-pages` action and the repository's built-in `GITHUB_TOKEN`, so no additional secrets are required for basic use.

How to publish to GitHub Pages from this local repo:

1. Create a new repository on GitHub (for example `username/js-fileload-pattern`).
2. Add the remote and push:

```bash
git remote add origin git@github.com:<your-username>/<your-repo>.git
git push -u origin main
```

3. After the push the GitHub Actions workflow will run and publish the site to GitHub Pages. By default the action will publish the repository root. In GitHub repository Settings → Pages you can confirm the published site URL.

Notes:
- The workflow publishes the repository contents as-is (no build step). If you later add a build step (for example a bundler or static-site generator) update `publish_dir` in the workflow accordingly.
- GitHub Pages publishing will only occur after you push this repo to GitHub; the CI file in the local workspace does not itself publish until it's on GitHub.

Local testing
-------------

If you want to test locally without pushing, run a small HTTP server from the project folder (recommended to avoid certain browser file:// restrictions):

```bash
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Malformed popup-try variant
---------------------------

This repository also includes a deliberately malformed variant of the demo. The UI has a button labeled "Try opening popup after async load (malformed)" which attempts to open a new window after an asynchronous I/O has completed. Modern browsers typically allow popups only when they are opened directly inside a user gesture (for example, during the immediate execution of a click handler). If you try to open a popup from a callback that runs later (for example inside a setTimeout or after an async event/microtask), the browser will usually block it as a popup.

Why this matters:
- Popup blockers detect whether a window.open call is within the same user gesture. If not, they block the new window.
- The malformed demo shows this behavior: after the file is loaded the demo schedules a delayed window.open call; most browsers will block it and the page will display a message saying the popup was blocked.

This is included purely for demonstration and learning; don't use this pattern in production.

