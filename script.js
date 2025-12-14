// --- State Management ---
const state = {
  text: "https://example.com",
  colorDark: "#000000",
  colorLight: "#ffffff",
  size: 300,
  correction: "M",
  logo: null,
  history: JSON.parse(localStorage.getItem("qrHistory")) || [],
};

// --- DOM Elements ---
const dom = {
  textInput: document.getElementById("qr-text"),
  colorDark: document.getElementById("color-dark"),
  colorLight: document.getElementById("color-light"),
  sizeSelect: document.getElementById("qr-size"),
  correctSelect: document.getElementById("qr-correct"),
  logoInput: document.getElementById("logo-input"),
  container: document.getElementById("qr-code-container"),
  btnDownload: document.getElementById("btn-download"),
  btnCopy: document.getElementById("btn-copy"),
  themeToggle: document.getElementById("theme-toggle"),
  historyList: document.getElementById("history-list"),
  clearHistoryBtn: document.getElementById("clear-history"),
};

let qrInstance = null;

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  renderHistory();
  generateQR();
  setupEventListeners();
});

// --- Core Logic ---

function setupEventListeners() {
  // Debounce text input for performance
  dom.textInput.addEventListener(
    "input",
    debounce((e) => {
      state.text = e.target.value || " ";
      generateQR();
    }, 300)
  );

  // Instant update for colors/settings
  const updateSettings = () => {
    state.colorDark = dom.colorDark.value;
    state.colorLight = dom.colorLight.value;
    state.size = parseInt(dom.sizeSelect.value);
    state.correction = dom.correctSelect.value;
    generateQR();
  };

  dom.colorDark.addEventListener("input", updateSettings);
  dom.colorLight.addEventListener("input", updateSettings);
  dom.sizeSelect.addEventListener("change", updateSettings);
  dom.correctSelect.addEventListener("change", updateSettings);

  // Logo Upload Logic
  dom.logoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        state.logo = evt.target.result;
        generateQR();
      };
      reader.readAsDataURL(file);
    } else {
      state.logo = null;
      generateQR();
    }
  });

  // Buttons
  dom.btnDownload.addEventListener("click", downloadQR);
  dom.btnCopy.addEventListener("click", copyQR);
  dom.themeToggle.addEventListener("click", toggleTheme);
  dom.clearHistoryBtn.addEventListener("click", clearHistory);
}

// Generate QR using EasyQRCodeJS
function generateQR() {
  // Clear previous
  dom.container.innerHTML = "";

  const options = {
    text: state.text,
    width: state.size,
    height: state.size,
    colorDark: state.colorDark,
    colorLight: state.colorLight,
    correctLevel: QRCode.CorrectLevel[state.correction],
    logo: state.logo,
    logoWidth: state.size / 4, // Adaptive logo size
    logoHeight: state.size / 4,
    logoBackgroundTransparent: true,
    quietZone: 10,
    quietZoneColor: state.colorLight,
  };

  // Create Instance
  qrInstance = new QRCode(dom.container, options);

  // Save to history (debounced in real app, simplified here)
  addToHistory(state.text);
}

// --- Helper Features ---

function downloadQR() {
  const canvas = dom.container.querySelector("canvas");
  if (canvas) {
    const link = document.createElement("a");
    link.download = `qr-code-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    showToast("QR Code Downloaded! 🚀");
  }
}

async function copyQR() {
  const canvas = dom.container.querySelector("canvas");
  if (canvas) {
    canvas.toBlob(async (blob) => {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        showToast("Copied to Clipboard! 📋");
      } catch (err) {
        showToast("Copy failed ❌");
      }
    });
  }
}

// --- History Management ---

function addToHistory(text) {
  if (!text || text.trim() === "") return;

  // Prevent duplicates at the top
  if (state.history.length > 0 && state.history[0] === text) return;

  state.history.unshift(text);
  if (state.history.length > 5) state.history.pop(); // Keep last 5

  localStorage.setItem("qrHistory", JSON.stringify(state.history));
  renderHistory();
}

function renderHistory() {
  dom.historyList.innerHTML = "";
  state.history.forEach((item) => {
    const li = document.createElement("li");
    li.className = "history-item";
    li.textContent = item.substring(0, 30) + (item.length > 30 ? "..." : "");
    li.onclick = () => {
      dom.textInput.value = item;
      state.text = item;
      generateQR();
    };
    dom.historyList.appendChild(li);
  });
}

function clearHistory() {
  state.history = [];
  localStorage.removeItem("qrHistory");
  renderHistory();
  showToast("History Cleared 🗑️");
}

// --- Theme & Utils ---

function initTheme() {
  const theme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const newTheme = current === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icon = dom.themeToggle.querySelector("i");
  icon.className = theme === "light" ? "ri-moon-line" : "ri-sun-line";
}

function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
