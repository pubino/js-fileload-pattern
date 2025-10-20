// Shared JS for both the proper and malformed demo pages

(function () {
  // Minimal helper functions
  const $ = id => document.getElementById(id);
  const setOutput = msg => { const o = $('output'); if (o) o.textContent = msg; };

  // Simple FileReader wrapped in a Promise
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('File read error'));
      reader.readAsText(file);
    });
  }

  // Proper page: open popup synchronously then fill it after async I/O
  function initProperPage() {
    const fileInput = $('fileInput');
    const loadBtn = $('loadBtn');
    const showBtn = $('showBtn');
    const openPopupCorrectBtn = $('openPopupCorrectBtn');

    if (!fileInput) return;

    let loadedText = null;

    fileInput.addEventListener('change', () => {
      const has = fileInput.files && fileInput.files.length > 0;
      if (loadBtn) loadBtn.disabled = !has;
      if (openPopupCorrectBtn) openPopupCorrectBtn.disabled = !has;
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
          setOutput('File loaded into memory. Click "Show loaded CSV (sync)" to display.');
          if (showBtn) showBtn.disabled = false;
          if (openPopupCorrectBtn) openPopupCorrectBtn.disabled = false;
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
        setOutput(loadedText);
      });
    }

    if (openPopupCorrectBtn) {
      // Correct pattern: open a placeholder popup immediately in the click handler
      // so the browser considers it user-initiated.
      openPopupCorrectBtn.addEventListener('click', async () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) { setOutput('No file selected'); return; }

        const popup = window.open('', '_blank', 'noopener');
        if (!popup) { setOutput('Popup blocked even when opened synchronously.'); return; }
        popup.document.title = 'Loading CSV...';
        popup.document.body.textContent = 'Loading...';

        try {
          const text = await readFileAsText(file);
          popup.document.body.textContent = text;
          setOutput('Loaded and written to popup.');
        } catch (err) {
          popup.document.body.textContent = 'Error: ' + err;
          setOutput('Error reading file: ' + err);
        }
      });
    }
  }

  // Malformed page: attempt to open popup from async callback (likely blocked)
  function initMalformedPage() {
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
        setOutput('Loading (malformed will try popup from async callback)...');
        try {
          const text = await readFileAsText(file);
          loadedText = text;

          // MALFORMED: open popup now from the async continuation — browsers will
          // typically block this because it's no longer part of the original
          // user gesture.
          const popup = window.open('', '_blank', 'noopener');
          if (!popup) {
            setOutput('Popup was blocked (expected). Loaded in memory.');
          } else {
            popup.document.title = 'CSV (malformed)';
            popup.document.body.textContent = loadedText;
            setOutput('Loaded and opened popup (browser allowed it).');
          }
          if (showBtn) showBtn.disabled = false;
        } catch (err) {
          setOutput('Error: ' + err);
        } finally {
          loadBtn.disabled = false;
        }
      });
    }

    if (showBtn) {
      showBtn.addEventListener('click', () => {
        if (!loadedText) { setOutput('No data loaded'); return; }
        setOutput(loadedText);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initProperPage();
    initMalformedPage();
  });

})();
