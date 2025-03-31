// js/popup.js

const inputArea = document.getElementById('translator-input');
const outputArea = document.getElementById('translator-output');
const copyButton = document.getElementById('copy-button');
const insertButton = document.getElementById('insert-button');

// --- Helper Function ---
function isValidTranslation(text) {
    return text && !text.startsWith('Error:') && text !== 'Translating...' && text !== '';
}

// --- Update Button States ---
function updateButtonStates() {
    const text = outputArea.textContent;
    const enabled = isValidTranslation(text);
    copyButton.disabled = !enabled;
    insertButton.disabled = !enabled;
}

// --- NEW: Function to handle the insertion logic ---
function triggerInsertAction() {
    const textToInsert = outputArea.textContent;
    if (isValidTranslation(textToInsert)) {
        console.log('Triggering insertion:', textToInsert);
        // Send message to the parent window (content script)
        window.parent.postMessage({
            type: 'instantTranslatorInsertText', // Unique message type
            text: textToInsert
        }, '*'); // Send to any origin (content script will verify)

        // Optional feedback (can be different for button vs Enter)
        // For consistency, maybe just let the content script handle closing
    } else {
        console.warn("Attempted insert, but text was not valid.");
    }
}

// --- Translation Logic (Debounced) ---
const debouncedTranslate = debounce(() => {
  // ... (translation logic remains the same) ...
  // Call chrome.runtime.sendMessage...
  // In the response handler: update outputArea.textContent and call updateButtonStates();
    const textToTranslate = inputArea.value;
    updateButtonStates(); // Disable buttons while waiting/if empty

    if (textToTranslate.trim() === '') {
        outputArea.textContent = ''; // Clear output if input is empty
        updateButtonStates();
        return;
    }

    outputArea.textContent = 'Translating...'; // Provide feedback
    updateButtonStates(); // Disable buttons while translating

    chrome.runtime.sendMessage({ action: "translate", text: textToTranslate }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError);
            outputArea.textContent = `Error: ${chrome.runtime.lastError.message}`;
        } else if (response) {
            if (response.success) {
                outputArea.textContent = response.translation;
            } else {
                outputArea.textContent = `Error: ${response.error || 'Unknown translation error'}`;
                console.error("Translation error from background:", response.error);
            }
        } else {
             outputArea.textContent = 'Error: No response from background script.';
             console.error("No response received from background script.");
        }
        updateButtonStates(); // Enable/disable based on final result
    });
}, 500);


// --- Event Listeners ---
inputArea.addEventListener('input', debouncedTranslate);

// Automatically focus the input area when the popup loads
inputArea.focus();
updateButtonStates(); // Initial state check

// --- Copy Button Listener (Focus logic might still be helpful) ---
copyButton.addEventListener('click', () => {
    console.log("Copy button clicked.");
    const textToCopy = outputArea.textContent;
    const isValid = isValidTranslation(textToCopy);
    if (isValid) {
        try { inputArea.focus(); } catch (e) { console.error("Focus error", e); } // Keep focus attempt
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                console.log("SUCCESS: navigator.clipboard.writeText resolved.");
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Copied!';
                copyButton.disabled = true;
                setTimeout(() => {
                    copyButton.textContent = originalText;
                    updateButtonStates();
                 }, 1200);
            })
            .catch(err => {
                console.error('FAILED: navigator.clipboard.writeText rejected.', err);
                outputArea.textContent = `Error: Copy failed (${err.name}: ${err.message})`;
                updateButtonStates();
            });
    } else {
        console.warn("Copy button clicked, but text was not valid.");
    }
});

// --- Insert Button Listener ---
// Modify Insert button to use the new function
insertButton.addEventListener('click', () => {
    console.log("Insert button clicked.");
    triggerInsertAction(); // Call the shared insertion function

    // Keep button feedback specific to the button click
    insertButton.textContent = 'Sent!';
    insertButton.disabled = true;
     setTimeout(() => {
         insertButton.textContent = 'Insert';
         updateButtonStates();
     }, 1000);
});

// --- NEW: Keydown Listener for Enter Key in Input Area ---
inputArea.addEventListener('keydown', (event) => {
    // Check if Enter key was pressed AND Shift key was NOT pressed
    if (event.key === 'Enter' && !event.shiftKey) {
        console.log("Enter key detected in input area.");
        // Prevent the default action (inserting a newline in the textarea)
        event.preventDefault();
        // Trigger the same insertion logic as the button
        triggerInsertAction();
    }
});

console.log("Translator popup script loaded.");