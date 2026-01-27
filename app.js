const API_BASE_URL = "http://localhost:8000";

// DOM Elements
const elements = {
  form: document.getElementById("upload-form"),
  fileInput: document.getElementById("file-input"),
  uploadArea: document.getElementById("upload-area"),
  uploadText: document.getElementById("upload-text"),
  submitButton: document.getElementById("submit-btn"),
  statusEl: document.getElementById("status"),
  originalImage: document.getElementById("original-image"),
  processedImage: document.getElementById("processed-image"),
  previewPlaceholder: document.getElementById("preview-placeholder"),
  downloadBtn: document.getElementById("download-btn"),
  sliderContainer: document.getElementById("slider-container"),
  comparisonSlider: document.getElementById("comparison-slider"),
};

// State Management
const state = {
  file: null,
  originalUrl: null,
  processedUrl: null,
  isProcessing: false,
};

// UI Helpers
const setStatus = (message, type = "info") => {
  elements.statusEl.textContent = message;
  elements.statusEl.className = `status ${type}`;
  elements.statusEl.classList.remove("hidden");
};

const updateUI = () => {
  const hasFile = Boolean(state.file);
  const hasProcessed = Boolean(state.processedUrl);

  // Update Upload Area
  if (hasFile) {
    elements.uploadText.textContent = state.file.name;
    elements.uploadArea.classList.add("has-file");
  } else {
    elements.uploadText.textContent = "Choose an Image";
    elements.uploadArea.classList.remove("has-file");
  }

  // Update Images
  if (state.originalUrl) {
    elements.originalImage.src = state.originalUrl;
    elements.previewPlaceholder.style.display = "none";

    // Logic for processed image visibility
    if (hasProcessed) {
      elements.processedImage.src = state.processedUrl;
      elements.processedImage.style.display = "block";
      elements.downloadBtn.classList.remove("hidden");
      elements.downloadBtn.classList.add("is-active");
      elements.sliderContainer.classList.remove("hidden");

      // Slider at 50%
      elements.comparisonSlider.value = 50;
      elements.originalImage.style.clipPath = "inset(0 50% 0 0)";
    } else {
      // Just uploaded, show original fully
      elements.processedImage.removeAttribute("src");
      elements.processedImage.style.display = "none"; // Hide potentially broken image
      elements.downloadBtn.classList.add("hidden");
      elements.downloadBtn.classList.remove("is-active");
      elements.sliderContainer.classList.add("hidden");
      elements.originalImage.style.clipPath = "inset(0 0 0 0)";
    }
  } else {
    elements.originalImage.removeAttribute("src");
    elements.previewPlaceholder.style.display = "flex";
    elements.processedImage.style.display = "none";
    elements.downloadBtn.classList.add("hidden");
    elements.downloadBtn.classList.remove("is-active");
    elements.sliderContainer.classList.add("hidden");
  }

  // Update Button State
  elements.submitButton.disabled = state.isProcessing || !hasFile;
  elements.downloadBtn.disabled = !hasProcessed;
};

const cleanup = () => {
  if (state.originalUrl) URL.revokeObjectURL(state.originalUrl);
  if (state.processedUrl) URL.revokeObjectURL(state.processedUrl);
  state.originalUrl = null;
  state.processedUrl = null;
};

// Event Listeners
elements.comparisonSlider.addEventListener("input", (e) => {
  const value = e.target.value;
  const clipValue = 100 - value;
  elements.originalImage.style.clipPath = `inset(0 ${clipValue}% 0 0)`;
});

elements.fileInput.addEventListener("change", () => {
  const file = elements.fileInput.files[0];

  // Clean up previous URLs
  cleanup();

  state.file = file || null;
  state.isProcessing = false;
  state.processedUrl = null;

  if (file) {
    state.originalUrl = URL.createObjectURL(file);
    setStatus("Ready to remove background", "info");
  } else {
    setStatus("Ready to process your image", "info");
  }

  updateUI();
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!state.file) {
    setStatus("Please select an image first", "error");
    return;
  }

  state.isProcessing = true;
  updateUI();
  setStatus("Processing your image...", "busy");

  const formData = new FormData();
  formData.append("file", state.file);

  try {
    const response = await fetch(`${API_BASE_URL}/remove-bg`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = "Request failed";
      try {
        const data = await response.json();
        if (data.detail) errorMessage = data.detail;
      } catch (e) {
        errorMessage = await response.text();
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();

    // Revoke old processed URL if any
    if (state.processedUrl) URL.revokeObjectURL(state.processedUrl);

    state.processedUrl = URL.createObjectURL(blob);
    setStatus("Background removed successfully!", "success");

    updateUI(); // This triggers the 50% slider set

    // Setup download button
    elements.downloadBtn.onclick = () => {
      const a = document.createElement("a");
      a.href = state.processedUrl;
      a.download = "no-bg.png"; // Default name
      a.click();
    };
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Something went wrong", "error");
  } finally {
    state.isProcessing = false;
    updateUI();
  }
});

// Initial Setup
updateUI();
