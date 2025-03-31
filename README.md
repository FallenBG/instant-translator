# 🚀 Instant Translator Chrome Extension

Instant Translator is a lightweight Chrome extension that helps users translate text on the fly using a designated hotkey (Default suggested key: `Ctrl+Shift+S`). A small, non-intrusive popup window appears near the active input field, allowing seamless translation without leaving the current tab or breaking your workflow.

## !!! You MUST obtain API credentials for the translation service you wish to use and enter them into the extension's Options page. !!!

## ✨ Key Features

*   **🔑 Quick Activation with Hotkey:** Press `Ctrl+Shift+S` (or your custom key via `chrome://extensions/shortcuts`) to open the translation popup instantly.
*   **📍 Smart Popup Positioning:** Automatically opens near the currently focused input field (text box, textarea, contenteditable element).
*   **🌐 Customizable Languages:** Set your preferred default From and To languages for instant translations via the Options page.
*   **🖱️ Quick Actions:** Copy the translation to the clipboard or insert it directly into the original input field using dedicated buttons or keyboard shortcuts.
*   **🔧 Multiple API Support:** Choose between Google Cloud Translate or Baidu Translate. (Tencent Translate option exists but is **not recommended** for client-side use due to security/complexity).
*   **🎯 Minimal and Fast:** Optimized for performance, the translation popup is lightweight and distraction-free.
*   **⚙️ Configurable:** Set API keys and language preferences in the extension options.

## 🧠 How It Works

1.  Focus an input field (like a text box or textarea) on any webpage.
2.  Press the designated hotkey (default suggestion: **`Ctrl+Shift+S`** - configurable in Chrome).
3.  A small popup window will appear near the input field.
4.  Type or paste the text you want to translate into the top box of the popup.
5.  The translated result appears in the bottom box after a short delay.
6.  **Perform an action:**
    *   Click the **Copy** button to copy the translation to your clipboard.
    *   Click the **Insert** button to place the translation directly into the input field you originally focused. The popup will close automatically.
    *   Press **Enter** (while the cursor is still in the popup's *top input box*) to insert the translation into the original field. The popup will close automatically.
7.  Click outside the popup or press the `Esc` key to close it without inserting.

## ⚙️ Settings

You can configure the following by right-clicking the extension icon and selecting "Options":

*   **Translation API Service:** Choose between Google Cloud Translate or Baidu Translate. (Tencent is experimental and discouraged).
*   **API Keys/Credentials:** Enter the necessary API keys/secrets for your chosen service (see **API Credentials Setup** below).
*   **Default Source Language:** Language you usually write in (e.g., `auto`, `en`, `zh`).
*   **Default Target Language:** Language you want translations in (e.g., `en`, `zh`, `fr`).
*   **Hotkey:** The activation hotkey can be changed from the default suggestion (**`Ctrl+Shift+S`**) in Chrome's main extension shortcuts page: `chrome://extensions/shortcuts`. *(Note: F2 might conflict with OS or browser functions).*

## 🔧 Requirements

*   Google Chrome browser
*   Internet connection
*   API Credentials for at least one supported translation service (Google or Baidu recommended).

## 🔒 Permissions Explained

*   **activeTab:** Needed to detect the currently focused input field on the active page when the hotkey is pressed.
*   **storage:** To securely save your API keys, language preferences, and chosen service settings.
*   **scripting:** Required by Manifest V3 to inject the popup (`content.js`, `content.css`) into webpages.
*   **commands:** To define and listen for the keyboard shortcut (hotkey).
*   **host_permissions:** Required for the background script to make `fetch` requests to the external translation API endpoints (Baidu, Google, Tencent) and for `scripting` to inject into `<all_urls>`.

## 🔑 API Credentials Setup

You **MUST** obtain API credentials for the translation service you wish to use and enter them into the extension's Options page.

**🚨 IMPORTANT SECURITY WARNING:**
*   **NEVER share your API keys or secrets.** Do not commit them to public code repositories (like GitHub). Keep them confidential.
*   Be aware of the **pricing and quotas** associated with each service. While they often have free tiers, heavy usage may incur costs. Monitor your usage via their respective cloud consoles.
---

### 1. Google Cloud Translation API

1.  **Go to Google Cloud Console:** [https://console.cloud.google.com/](https://console.cloud.google.com/)
2.  **Create a Project:** If you don't have one, create a new project.
3.  **Enable Billing:** Cloud Translation API requires billing to be enabled on your project (even if you stay within the free tier).
4.  **Enable API:** Navigate to "APIs & Services" > "Library". Search for "Cloud Translation API" and click "Enable".
5.  **Create API Key:** Go to "APIs & Services" > "Credentials". Click "+ CREATE CREDENTIALS" and select "API key".
6.  **Restrict Key (Recommended):** Click on the newly created key. Under "API restrictions", select "Restrict key" and choose "Cloud Translation API". Under "Application restrictions", consider restricting it to specific IP addresses if possible, although this is harder for a browser extension. Click "Save".
7.  **Copy Key:** Copy the generated API key.
8.  **Paste in Extension Options:** Open the Instant Translator options, select "Google Cloud Translate" as the service, and paste the key into the "API Key" field for Google.

---

### 2. Baidu Translate API (General Purpose)

*Note: Baidu offers different API tiers. These instructions are for the General Purpose (Standard or Advanced editions), which requires authentication.*

1.  **Go to Baidu AI Cloud:** [https://console.bce.baidu.com/](https://console.bce.baidu.com/) (or [https://fanyi-api.baidu.com/](https://fanyi-api.baidu.com/) for direct API info). You'll need a Baidu account.
2.  **Find Translate Service:** Navigate the console to find the Machine Translation services (机器翻译). Look for the "General Translation API" (通用翻译API).
3.  **Activate Service:** Activate the service. You might need to complete identity verification.
4.  **Get Credentials:** Once activated, find the management section for the translation service. You should find your **App ID (应用ID)** and **Secret Key (密钥)**.
5.  **Copy Credentials:** Copy both the App ID and the Secret Key.
6.  **Paste in Extension Options:** Open the Instant Translator options, select "Baidu Translate" as the service, paste the App ID into the "App ID" field and the Secret Key into the "Secret Key" field for Baidu.

---

### 3. Tencent Translate API (TMT) - EXPERIMENTAL / NOT RECOMMENDED

*   **Strong Warning:** Due to the complexity and security risks of implementing Tencent's signing mechanism (Signature V3) directly in client-side JavaScript (which would expose your Secret Key), **using the Tencent API directly from this extension is highly discouraged and likely unreliable.** A server-side proxy that handles the signing is the correct approach for Tencent TMT.
*   If you still wish to proceed (at your own risk):
    1.  **Go to Tencent Cloud Console:** [https://console.cloud.tencent.com/](https://console.cloud.tencent.com/)
    2.  **Find API Keys:** Navigate to "Access Management" > "API Key Management".
    3.  **Create/View Keys:** Create or view your API keys. You need the **SecretId** and **SecretKey**.
    4.  **Copy Credentials:** Copy both the SecretId and SecretKey.
    5.  **Paste in Extension Options:** Open the Instant Translator options, select "Tencent Translate", paste the credentials into the appropriate fields. **Expect potential errors or failures.**

## 📥 Installation (From Source Code)

1.  Download all the code files provided (or clone the repository if available). Ensure you have the `utils/md5.min.js` file.
2.  Place them in a single folder named `instant-translator` maintaining the correct sub-directory structure (`css`, `js`, `html`, `icons`, `utils`).
3.  Open Chrome and navigate to `chrome://extensions/`.
4.  Enable **Developer Mode** using the toggle switch (usually in the top-right corner).
5.  Click the **Load unpacked** button.
6.  Select the `instant-translator` folder you created.
7.  The extension icon should appear in your toolbar. Right-click it and select "Options" to configure API keys and preferences.
8.  Configure your desired hotkey (if different from the suggested `Ctrl+Shift+S`) at `chrome://extensions/shortcuts`.
9.  You're ready to go!