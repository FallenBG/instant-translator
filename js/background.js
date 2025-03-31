// js/background.js

// --- Import necessary scripts FIRST ---
try {
    importScripts('../utils/md5.min.js'); // Use relative path from background.js
  } catch (e) {
    console.error("Error importing md5 script:", e);
    // Optionally handle the error, maybe disable Baidu functionality
  }
  
// --- Default Settings Structure ---
// Defines the keys we expect in storage. Actual defaults are set on install or loaded in options.
const storageKeys = {
    apiService: 'google', // Default choice
    sourceLang: 'auto',
    targetLang: 'en',
    googleApiKey: '',
    baiduAppId: '',
    baiduSecretKey: '',
    tencentSecretId: '',
    tencentSecretKey: ''
  };
  
  // --- Initialization ---
  chrome.runtime.onInstalled.addListener((details) => {
    console.log("Instant Translator installed or updated.", details.reason);
    // Set default settings ONLY if they don't exist yet, preserving user settings on update.
    chrome.storage.sync.get(Object.keys(storageKeys), (existingSettings) => {
      let needsUpdate = false;
      const finalSettings = { ...storageKeys }; // Start with hardcoded defaults
  
      // Check if each key exists in storage, if so, use it.
      for (const key of Object.keys(storageKeys)) {
        if (existingSettings.hasOwnProperty(key) && existingSettings[key] !== undefined) {
          finalSettings[key] = existingSettings[key];
        } else {
          // A key was missing, mark that we might need to save defaults
          needsUpdate = true;
          console.log(`Setting default for missing key: ${key}`);
        }
      }
  
      // Only save if we added missing default keys
      if (details.reason === 'install' || needsUpdate) {
         chrome.storage.sync.set(finalSettings, () => {
           if (chrome.runtime.lastError) {
              console.error("Error setting initial settings:", chrome.runtime.lastError);
           } else {
              console.log("Initial/Default settings ensured:", finalSettings);
           }
         });
      } else {
          console.log("Existing settings found, no defaults applied.");
      }
    });
  });
  
  // --- Hotkey Listener ---
  chrome.commands.onCommand.addListener((command) => {
    console.log(`Command received: ${command}`);
    if (command === "toggle-translator") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "togglePopup" }, (response) => {
            if (chrome.runtime.lastError) {
              console.warn("Could not send message to content script:", chrome.runtime.lastError.message);
            } else {
              console.log("Popup toggle message sent. Response:", response);
            }
          });
        } else {
          console.error("Could not find active tab.");
        }
      });
    }
  });
  
  // --- Message Listener (from popup.js) ---
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "translate") {
      console.log("Translation requested:", request.text);
      handleTranslationRequest(request.text)
        .then(result => {
          console.log("Translation result:", result);
          sendResponse({ success: true, translation: result });
        })
        .catch(error => {
          console.error("Translation failed:", error);
          // Send specific error message back to popup
          sendResponse({ success: false, error: error.message || "An unknown translation error occurred." });
        });
      return true; // Indicates asynchronous response is expected
    }
  });
  
  // --- Translation Logic Router ---
  async function handleTranslationRequest(text) {
    if (!text || text.trim() === '') {
      return ""; // Don't translate empty strings
    }
  
    // Fetch the current settings from storage, using the keys structure
    const settings = await chrome.storage.sync.get(storageKeys);
    console.log("Using settings for translation:", settings.apiService, settings.sourceLang, '->', settings.targetLang);
  
    switch (settings.apiService) {
      case 'google':
        return await translateWithGoogle(text, settings.sourceLang, settings.targetLang, settings.googleApiKey);
      case 'baidu':
        // Ensure the MD5 library is loaded and available
        if (typeof md5 !== 'function') {
            throw new Error("MD5 library not loaded. Cannot generate Baidu signature.");
        }
        return await translateWithBaidu(text, settings.sourceLang, settings.targetLang, settings.baiduAppId, settings.baiduSecretKey);
      case 'tencent':
        return await translateWithTencent(text, settings.sourceLang, settings.targetLang, settings.tencentSecretId, settings.tencentSecretKey);
      default:
        console.error("Unsupported API service selected:", settings.apiService);
        throw new Error(`Unsupported API service: ${settings.apiService}. Check extension options.`);
    }
  }
  
  // --- Google Translate API Implementation ---
  async function translateWithGoogle(text, sourceLang, targetLang, apiKey) {
    console.log("Using Google Translate");
    if (!apiKey) {
      throw new Error("Google API Key is missing. Please set it in the extension options.");
    }
  
    const apiUrl = `https://translation.googleapis.com/language/translate/v2`;
  
    // Build query parameters
    const params = new URLSearchParams({
      key: apiKey,
      q: text,
      target: targetLang,
    });
  
    // Add source language only if it's not 'auto'
    if (sourceLang && sourceLang !== 'auto') {
      params.append('source', sourceLang);
    }
  
    try {
      const response = await fetch(apiUrl, {
        method: 'POST', // POST is generally recommended by Google
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded', // Necessary for POST with URLSearchParams
        },
        body: params.toString() // Send params in the body
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        // Attempt to parse Google's specific error format
        const errorMessage = data?.error?.message || `HTTP error! status: ${response.status}`;
        console.error("Google API Error Response:", data);
        throw new Error(`Google API Error: ${errorMessage}`);
      }
  
      // Extract translation
      if (data.data && data.data.translations && data.data.translations.length > 0) {
        return data.data.translations[0].translatedText;
      } else {
        console.error("Unexpected Google API response format:", data);
        throw new Error("Google API Error: Could not parse translation from response.");
      }
  
    } catch (error) {
      console.error("Google API call failed:", error);
      // Rethrow or customize the error message for the user
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          throw new Error("Network error: Failed to reach Google Translate API. Check connection and permissions.");
      }
      throw error; // Re-throw other errors (like the ones created above)
    }
  }
  
  
  // --- Baidu Translate API Implementation ---
  async function translateWithBaidu(text, sourceLang, targetLang, appId, secretKey) {
      console.log("Using Baidu Translate");
      if (!appId || !secretKey) {
          throw new Error("Baidu App ID or Secret Key is missing. Please set them in the extension options.");
      }
       if (typeof md5 !== 'function') {
          throw new Error("MD5 library error. Cannot generate Baidu signature."); // Should have been caught earlier, but double-check
       }
  
      const salt = Date.now().toString(); // Simple salt based on timestamp
      const signStr = appId + text + salt + secretKey;
      const sign = md5(signStr); // Use the loaded md5 function
  
      const apiUrl = `https://fanyi-api.baidu.com/api/trans/vip/translate`;
  
      const params = new URLSearchParams({
          q: text,
          from: sourceLang, // Baidu uses 'auto'
          to: targetLang,
          appid: appId,
          salt: salt,
          sign: sign
      });
  
      try {
          const response = await fetch(`${apiUrl}?${params.toString()}`, {
               method: 'GET' // Baidu uses GET for this endpoint
          });
  
          const data = await response.json();
  
          if (data.error_code) {
              console.error("Baidu API Error Response:", data);
              // Provide more specific error codes if desired, see Baidu docs
              throw new Error(`Baidu API Error (${data.error_code}): ${data.error_msg || 'Unknown error'}`);
          }
  
          if (data.trans_result && data.trans_result.length > 0) {
              return data.trans_result[0].dst; // 'dst' is the translated text field
          } else {
              console.error("Unexpected Baidu API response format:", data);
              throw new Error("Baidu API Error: Could not parse translation from response.");
          }
  
      } catch (error) {
          console.error("Baidu API call failed:", error);
           if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
              throw new Error("Network error: Failed to reach Baidu Translate API. Check connection and permissions.");
           }
          throw error; // Re-throw
      }
  }
  
  
  // --- Tencent Translate API Implementation (Placeholder/Warning) ---
  async function translateWithTencent(text, sourceLang, targetLang, secretId, secretKey) {
    console.warn("Tencent Translate API selected.");
    if (!secretId || !secretKey) {
      throw new Error("Tencent Secret ID or Secret Key is missing. Please set them in the extension options.");
    }
  
    // --- !!! SECURITY WARNING & COMPLEXITY !!! ---
    const warningMessage = "Tencent API Error: Direct client-side implementation is insecure and complex due to signature requirements. Using this service from the extension is not recommended or fully supported. Consider using Google/Baidu or a server-side proxy.";
    console.error(warningMessage);
    // Instead of attempting the complex signing, return an error immediately.
    throw new Error(warningMessage);
  
    // --- Kept for reference, but DO NOT USE in production client-side code ---
    /*
    // This is a VAST oversimplification. Real implementation requires:
    // 1. Importing HMAC-SHA256 library (crypto.subtle maybe, but complex in service workers)
    // 2. Constructing CanonicalRequest string (HTTP Method, URI, Query Params, Headers, Hashed Payload)
    // 3. Constructing StringToSign (Algorithm, Timestamp, CredentialScope, HashedCanonicalRequest)
    // 4. Deriving SigningKey (HMAC(HMAC(HMAC(HMAC(SecretKey, Date), Region), Service), "tc3_request"))
    // 5. Calculating Signature (HMAC(SigningKey, StringToSign))
    // 6. Building Authorization header
  
    console.log("Attempting Tencent Translate (EXPERIMENTAL - LIKELY TO FAIL)");
    const apiUrl = 'https://tmt.tencentcloudapi.com'; // Base endpoint
    const service = "tmt";
    const region = "ap-guangzhou"; // Example region, might need configuration
    const action = "TextTranslate";
    const version = "2018-03-21";
    const timestamp = Math.floor(Date.now() / 1000);
  
    const payload = JSON.stringify({
        SourceText: text,
        Source: sourceLang === 'auto' ? 'auto' : sourceLang, // Tencent uses 'auto'
        Target: targetLang,
        ProjectId: 0 // Default project ID
    });
  
    // ... Extremely complex signing logic would go here ...
    const signature = "INVALID_PLACEHOLDER_SIGNATURE"; // This will fail
  
    const headers = {
        'Authorization': `TC3-HMAC-SHA256 Credential=${secretId}/${timestamp}/${region}/${service}/tc3_request, SignedHeaders=content-type;host, Signature=${signature}`,
        'Content-Type': 'application/json; charset=utf-8',
        'Host': 'tmt.tencentcloudapi.com',
        'X-TC-Action': action,
        'X-TC-Timestamp': timestamp.toString(),
        'X-TC-Version': version,
        'X-TC-Region': region,
        // 'X-TC-Token': '', // Optional: For temporary credentials
        // 'X-TC-Language': 'en-US' // Optional: Response language
    };
  
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: payload
        });
        const data = await response.json();
  
        if (data.Response && data.Response.Error) {
            console.error("Tencent API Error Response:", data.Response.Error);
            throw new Error(`Tencent API Error (${data.Response.Error.Code}): ${data.Response.Error.Message}`);
        }
  
        if (data.Response && data.Response.TargetText) {
            return data.Response.TargetText;
        } else {
            console.error("Unexpected Tencent API response format:", data);
            throw new Error("Tencent API Error: Could not parse translation from response.");
        }
    } catch (error) {
        console.error("Tencent API call failed:", error);
         if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
              throw new Error("Network error: Failed to reach Tencent Translate API. Check connection and permissions.");
           }
        throw error; // Re-throw
    }
    */
  }
  
  // Optional: Open options page when extension icon is clicked
  chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
  });