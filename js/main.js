// Bare-bones demo: load a CSV file asynchronously, then synchronously show its contents

const fileInput = document.getElementById('fileInput');
const loadBtn = document.getElementById('loadBtn');
const showBtn = document.getElementById('showBtn');
const output = document.getElementById('output');

// In-memory storage for loaded file text
let loadedText = null;

// Enable load button when a file is selected
fileInput.addEventListener('change', () => {
  loadBtn.disabled = !fileInput.files.length;
});

// Asynchronous load using FileReader (reads file from user's machine)
loadBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) return;

  loadBtn.disabled = true;
  showBtn.disabled = true;
  output.textContent = 'Loading...';

  try {
    loadedText = await readFileAsText(file);
    output.textContent = 'File loaded successfully. Click "Show loaded CSV (sync)" to display contents.';
    showBtn.disabled = false;
  } catch (err) {
    output.textContent = 'Error loading file: ' + err;
  } finally {
    loadBtn.disabled = false;
  }
});

// Synchronous display of the already-loaded text
showBtn.addEventListener('click', () => {
  if (loadedText === null) {
    output.textContent = 'No file loaded yet.';
    return;
  }

  // For this demo, just display the raw CSV text synchronously
  output.textContent = loadedText;
});

// Helper: returns a Promise that resolves with file text via FileReader
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
