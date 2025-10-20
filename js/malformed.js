// malformed.js — Malformed demo logic
//
// This file intentionally demonstrates the anti-pattern: it waits for an
// asynchronous file read to complete and then calls `window.open` from the
// async continuation. Most browsers consider such calls to be non-user-initiated
// and will block them as popups. The purpose is to show that the timing and
// placement of `window.open` relative to the user gesture matters.

(function () {
  const $ = id => document.getElementById(id);
  const setOutput = msg => { const o = $('output'); if (o) o.textContent = msg; };

  // Same FileReader helper as the proper demo — the difference is what we do
  // after the read completes.
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('File read error'));
      reader.readAsText(file);
    });
  }

  function initMalformedPage() {
    const fileInput = $('fileInput');
    const loadBtn = $('loadBtn');

    if (!fileInput) return;

    fileInput.addEventListener('change', () => {
      const has = fileInput.files && fileInput.files.length > 0;
      if (loadBtn) loadBtn.disabled = !has;
      setOutput('');
    });

    if (loadBtn) {
      loadBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) return;
        loadBtn.disabled = true;
        setOutput('Loading (malformed will try popup from async callback)...');
        try {
          const text = await readFileAsText(file);

          // IMPORTANT: the following call to window.open runs in the async
          // continuation after a Promise resolves / FileReader `load` event.
          // That means it's executed outside the original click handler's
          // synchronous call stack. Browsers track whether an action is the
          // direct result of a user gesture; if it's not, they may block
          // window.open as a popup. That's exactly what this demo is
          // demonstrating.

          // Make the attempt explicit (and visible) so the UI shows that we
          // tried to open a popup even when the browser blocks it. Also log
          // to the console for developer inspection.
          setOutput('Attempting popup from async callback...');
          console.debug('Malformed demo: calling window.open from async continuation');
          const popup = window.open('', '_blank', 'noopener');
          if (!popup) {
            setOutput('Popup was blocked (expected).');
          } else {
            popup.document.title = 'CSV (malformed)';
            popup.document.body.textContent = text;
            setOutput('Loaded and opened popup (browser allowed it).');
          }
        } catch (err) {
          setOutput('Error: ' + err);
        } finally {
          loadBtn.disabled = false;
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initMalformedPage);

})();
