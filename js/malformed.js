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

          // Clear any previous message and announce the specific malformed flow.
          setOutput('File read complete. Now attempting popup from async callback...');
          console.info('Malformed demo: file read complete — attempting window.open from async continuation');

          // Attempt popup (this is the action most browsers will block)
          const popup = window.open('', '_blank', 'noopener');
          if (!popup) {
            // Make it explicit in the UI that the popup attempt occurred but was blocked.
            setOutput('Popup attempt was blocked by the browser (expected for this malformed example).');
            console.warn('Malformed demo: window.open returned null (popup blocked)');
          } else {
            popup.document.title = 'CSV (malformed)';
            popup.document.body.textContent = text;
            setOutput('Loaded and opened popup (browser allowed it).');
            console.info('Malformed demo: popup opened and content written');
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
