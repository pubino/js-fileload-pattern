// main.js — Proper demo logic
//
// This file shows the correct pattern: all UI that interacts with the user
// (including showing a placeholder or opening a new window) must be triggered
// synchronously during the user gesture if you want browsers to treat it as
// user-initiated. The simplest, lowest-risk approach used in this demo is to
// perform the file read asynchronously, store the result in memory, and then
// let the user trigger a synchronous display (here via the "Show loaded CSV"
// button). That guarantees no popup-blocker interactions are needed.

(function () {
  // Minimal helper functions
  const $ = id => document.getElementById(id);
  const setOutput = msg => { const o = $('output'); if (o) o.textContent = msg; };

  // Simple FileReader wrapped in a Promise — the read itself is asynchronous
  // and the completion callback will be delivered as a macrotask/event by the
  // browser. Wrapping in a Promise means the `await` continuation runs as a
  // microtask, but that still happens outside the original click stack.
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('File read error'));
      reader.readAsText(file);
    });
  }

  // Proper page: keep the UX simple. The user clicks "Load selected CSV (async)",
  // the file is read asynchronously and stored in-memory. The user then clicks
  // "Show loaded CSV (sync)" which synchronously updates the DOM with the
  // preloaded text. Since `window.open` is not called from an async continuation
  // in this flow, no popup-blocker issues occur.
  function initProperPage() {
    const fileInput = $('fileInput');
    const loadBtn = $('loadBtn');
    const showBtn = $('showBtn');

    if (!fileInput) return;

    let loadedText = null;

    fileInput.addEventListener('change', () => {
      const has = fileInput.files && fileInput.files.length > 0;
      if (loadBtn) loadBtn.disabled = !has;
      if (showBtn) showBtn.disabled = true;
      setOutput('');
      loadedText = null;
    });

    if (loadBtn) {
      loadBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) return;
        loadBtn.disabled = true;
        setOutput('Loading...');
        try {
          loadedText = await readFileAsText(file);
          // At this point the read completion happened asynchronously. We
          // intentionally don't call `window.open` here — instead we enable a
          // synchronous, user-triggered action to display the text.
          setOutput('File loaded into memory. Click "Show loaded CSV (sync)" to display.');
          if (showBtn) showBtn.disabled = false;
        } catch (err) {
          setOutput('Error loading file: ' + err);
        } finally {
          loadBtn.disabled = false;
        }
      });
    }

    if (showBtn) {
      showBtn.addEventListener('click', () => {
        if (!loadedText) { setOutput('No file loaded yet.'); return; }
        // Synchronous DOM update — safe and won't be blocked by the browser.
        setOutput(loadedText);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initProperPage);

})();
