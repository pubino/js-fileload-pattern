// JS for the malformed demo page only

(function () {
  const $ = id => document.getElementById(id);
  const setOutput = msg => { const o = $('output'); if (o) o.textContent = msg; };

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

          // MALFORMED: open popup now from the async continuation — browsers will
          // typically block this because it's no longer part of the original
          // user gesture.
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
