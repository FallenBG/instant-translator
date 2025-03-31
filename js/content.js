// js/content.js

let iframe = null;
let lastActiveElement = null;
const IFRAME_ID = 'instant-translator-iframe';
const IFRAME_URL = chrome.runtime.getURL('html/popup.html');

// --- Create or Toggle Iframe ---
function togglePopup() {
  if (iframe) {
    cleanupPopup(); // Use a cleanup function
    return;
  }

  const activeElement = document.activeElement;
  const isEditable = activeElement &&
                     (activeElement.tagName === 'INPUT' ||
                      activeElement.tagName === 'TEXTAREA' ||
                      activeElement.isContentEditable);

  if (!isEditable) {
    console.log("No active input field found.");
    return;
  }

  lastActiveElement = activeElement; // Store focused element
  const rect = activeElement.getBoundingClientRect();

  iframe = document.createElement('iframe');
  iframe.id = IFRAME_ID;
  iframe.src = IFRAME_URL;
  
  iframe.setAttribute('allow', 'clipboard-write');

  // Positioning Logic (same as before)
  let top = window.scrollY + rect.bottom + 5;
  let left = window.scrollX + rect.left;
  const popupWidth = 300; // Adjusted width estimate
  const popupHeight = 195; // Adjusted height estimate

  if (left + popupWidth > window.innerWidth) {
    left = window.innerWidth - popupWidth - 10;
  }
  if (top + popupHeight > window.innerHeight + window.scrollY) {
    top = window.scrollY + rect.top - popupHeight - 5;
     if (top < window.scrollY) { top = window.scrollY + 5; }
  }
   if (left < window.scrollX) { left = window.scrollX + 5; }

  iframe.style.top = `${top}px`;
  iframe.style.left = `${left}px`;
  iframe.style.width = `${popupWidth}px`; // Match CSS/Estimate
  iframe.style.height = `${popupHeight}px`; // Match CSS/Estimate

  document.body.appendChild(iframe);
  console.log("Translator popup created.");

  // Add listeners to close the popup
  document.addEventListener('click', handleClickOutside, true);
  document.addEventListener('keydown', handleEscKey, true);
  // Add listener for messages FROM the iframe
  window.addEventListener('message', handleIframeMessage);
}

// --- Function to Remove Popup and Listeners ---
function cleanupPopup() {
    if (iframe) {
        iframe.remove();
        iframe = null;
        console.log("Translator popup removed.");
        document.removeEventListener('click', handleClickOutside, true);
        document.removeEventListener('keydown', handleEscKey, true);
        window.removeEventListener('message', handleIframeMessage); // Remove message listener
        lastActiveElement = null; // Clear reference
    }
}

// --- Close Popup Listeners ---
function handleClickOutside(event) {
    if (iframe && !iframe.contains(event.target)) {
        // Don't close if clicking back into the original input field
        if (event.target !== lastActiveElement) {
            cleanupPopup();
        }
    }
}

function handleEscKey(event) {
    if (iframe && event.key === 'Escape') {
        cleanupPopup();
    }
}

// --- Handle Messages FROM the Iframe (for Insert) ---
function handleIframeMessage(event) {
    // 1. Security: Check origin - should match our extension's origin
    // Note: chrome.runtime.getURL gives base URL like 'chrome-extension://<id>/'
    const expectedOrigin = new URL(chrome.runtime.getURL('')).origin;
    if (event.origin !== expectedOrigin) {
        console.warn('Ignoring message from unexpected origin:', event.origin);
        return;
    }

    // 2. Security: Check source - should be the contentWindow of our iframe
    if (!iframe || event.source !== iframe.contentWindow) {
         console.warn('Ignoring message not from the translator iframe window.');
        return;
    }

    // 3. Check message structure and type
    if (event.data && event.data.type === 'instantTranslatorInsertText') {
        const textToInsert = event.data.text;
        console.log('Received text to insert:', textToInsert);

        if (lastActiveElement && document.body.contains(lastActiveElement)) { // Ensure element still exists
             try {
                // Simple insertion (replace content)
                if (lastActiveElement.tagName === 'INPUT' || lastActiveElement.tagName === 'TEXTAREA') {
                    lastActiveElement.value = textToInsert;
                    // Trigger input event for frameworks/listeners
                    lastActiveElement.dispatchEvent(new Event('input', { bubbles: true }));
                } else if (lastActiveElement.isContentEditable) {
                    // Replace content - might lose formatting.
                    // For finer control, use Selection API or execCommand (more complex)
                    lastActiveElement.textContent = textToInsert;
                     // Trigger input event for frameworks/listeners
                    lastActiveElement.dispatchEvent(new Event('input', { bubbles: true }));
                }

                // Optional: Refocus the element after insertion
                lastActiveElement.focus();

                // Close the popup after successful insertion
                cleanupPopup();

             } catch (error) {
                 console.error("Error inserting text:", error);
                 // Optionally, notify the user or iframe that insertion failed
             }

        } else {
            console.warn("Original input element no longer found or valid.");
        }
    }
     // Can handle other message types here if needed
}

// --- Message Listener (from background.js for Toggle) ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "togglePopup") {
    togglePopup();
    sendResponse({ status: iframe ? "Popup shown" : "Popup hidden" });
    return true; // Indicate async response if needed, though not strictly necessary here
  }
});

console.log("Instant Translator content script loaded.");