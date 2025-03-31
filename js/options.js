// js/options.js

// Selectors for core settings
const apiServiceSelect = document.getElementById('api-service');
const sourceLangSelect = document.getElementById('source-lang');
const targetLangSelect = document.getElementById('target-lang');

// Selectors for API Keys
const googleApiKeyInput = document.getElementById('google-api-key');
const baiduAppIdInput = document.getElementById('baidu-app-id');
const baiduSecretKeyInput = document.getElementById('baidu-secret-key');
const tencentSecretIdInput = document.getElementById('tencent-secret-id');
const tencentSecretKeyInput = document.getElementById('tencent-secret-key');

const saveButton = document.getElementById('save');
const statusDiv = document.getElementById('status');

// --- Save Settings ---
function saveOptions() {
  const settings = {
    // Core settings
    apiService: apiServiceSelect.value,
    sourceLang: sourceLangSelect.value,
    targetLang: targetLangSelect.value,

    // API Keys - store potentially sensitive keys
    googleApiKey: googleApiKeyInput.value.trim(),
    baiduAppId: baiduAppIdInput.value.trim(),
    baiduSecretKey: baiduSecretKeyInput.value.trim(),
    tencentSecretId: tencentSecretIdInput.value.trim(),
    tencentSecretKey: tencentSecretKeyInput.value.trim()
  };

  // Use chrome.storage.sync to save settings.
  // Sync storage is synced across devices (if user is logged into Chrome)
  // and has quota limits. Use chrome.storage.local for larger/local-only data.
  chrome.storage.sync.set(settings, () => {
    // Check for errors during save
    if (chrome.runtime.lastError) {
        console.error("Error saving settings:", chrome.runtime.lastError);
        statusDiv.textContent = `Error saving settings: ${chrome.runtime.lastError.message}`;
        statusDiv.style.color = 'red';
    } else {
        // Update status to let user know options were saved.
        statusDiv.textContent = 'Options saved successfully!';
        statusDiv.style.color = 'green';
        console.log("Options saved:", settings);
        setTimeout(() => {
          statusDiv.textContent = '';
        }, 2000);
    }
  });
}

// --- Load Settings ---
function restoreOptions() {
  // Define default values for all settings, including keys
  const defaultSettings = {
    apiService: 'google',
    sourceLang: 'auto',
    targetLang: 'en',
    googleApiKey: '',
    baiduAppId: '',
    baiduSecretKey: '',
    tencentSecretId: '',
    tencentSecretKey: ''
  };

  chrome.storage.sync.get(defaultSettings, (items) => {
     if (chrome.runtime.lastError) {
        console.error("Error loading settings:", chrome.runtime.lastError);
        statusDiv.textContent = `Error loading settings: ${chrome.runtime.lastError.message}`;
        statusDiv.style.color = 'red';
        // Apply default values to UI anyway
        items = defaultSettings;
     }

    // Apply loaded settings (or defaults if not found) to the UI elements
    apiServiceSelect.value = items.apiService;
    sourceLangSelect.value = items.sourceLang;
    targetLangSelect.value = items.targetLang;
    googleApiKeyInput.value = items.googleApiKey;
    baiduAppIdInput.value = items.baiduAppId;
    baiduSecretKeyInput.value = items.baiduSecretKey;
    tencentSecretIdInput.value = items.tencentSecretId;
    tencentSecretKeyInput.value = items.tencentSecretKey;

    console.log("Options restored:", items);
  });
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', restoreOptions);
saveButton.addEventListener('click', saveOptions);