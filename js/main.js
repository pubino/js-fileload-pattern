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
        setOutput(loadedText);
      });
    }
  }

  // Malformed page: attempt to open popup from async callback (likely blocked)
  function initMalformedPage() {
    const fileInput = $('fileInput');
    const loadBtn = $('loadBtn');

    if (!fileInput) return;

    let loadedText = null;

    fileInput.addEventListener('change', () => {
      const has = fileInput.files && fileInput.files.length > 0;
      if (loadBtn) loadBtn.disabled = !has;
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
            setOutput('Popup was blocked (expected).');
          } else {
            popup.document.title = 'CSV (malformed)';
            popup.document.body.textContent = loadedText;
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

  document.addEventListener('DOMContentLoaded', () => {
    const demo = document.body && document.body.getAttribute('data-demo');
    if (demo === 'proper') initProperPage();
    else if (demo === 'malformed') initMalformedPage();
    else {
      // Fallback: try to initialize both if not explicitly set
      initProperPage();
      initMalformedPage();
    }
  });

})();
