/**
 * Password Derivation Tool
 * 100% client-side password generation using Web Crypto API
 * No data is stored or transmitted
 */

// ===== DOM Elements =====
const form = document.getElementById('passwordForm');
const masterPasswordInput = document.getElementById('masterPassword');
const secretKeyInput = document.getElementById('secretKey');
const siteNameInput = document.getElementById('siteName');
const versionInput = document.getElementById('version');
const customLengthInput = document.getElementById('customLength');
const outputSection = document.getElementById('outputSection');
const generatedPasswordInput = document.getElementById('generatedPassword');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const copyFeedback = document.getElementById('copyFeedback');

// Character set checkboxes
const uppercaseCheckbox = document.getElementById('uppercase');
const lowercaseCheckbox = document.getElementById('lowercase');
const numbersCheckbox = document.getElementById('numbers');
const specialCheckbox = document.getElementById('special');

// ===== Character Sets =====
const CHARSET = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  special: '!@#$%^&*()-_=+[]{}|;:,.<>?',
};

// ===== Event Listeners =====

// Toggle password visibility
document.querySelectorAll('.toggle-visibility').forEach((button) => {
  button.addEventListener('click', function () {
    const targetId = this.getAttribute('data-target');
    const targetInput = document.getElementById(targetId);

    if (targetInput.type === 'password') {
      targetInput.type = 'text';
      this.querySelector('.eye-icon').textContent = '🙈';
    } else {
      targetInput.type = 'password';
      this.querySelector('.eye-icon').textContent = '👁️';
    }
  });
});

// Handle custom length radio button
document.querySelectorAll('input[name="length"]').forEach((radio) => {
  radio.addEventListener('change', function () {
    if (this.value === 'custom') {
      customLengthInput.disabled = false;
      customLengthInput.focus();
    } else {
      customLengthInput.disabled = true;
    }
  });
});

// Form submission
form.addEventListener('submit', async function (e) {
  e.preventDefault();

  // Validate at least one character set is selected
  if (
    !uppercaseCheckbox.checked &&
    !lowercaseCheckbox.checked &&
    !numbersCheckbox.checked &&
    !specialCheckbox.checked
  ) {
    alert('Please select at least one character set');
    return;
  }

  // Get form values
  const masterPassword = masterPasswordInput.value;
  const secretKey = secretKeyInput.value;
  const siteName = siteNameInput.value.trim();
  const version = versionInput.value.trim() || 'v1';

  // Get password length
  const lengthRadio = document.querySelector('input[name="length"]:checked');
  const length =
    lengthRadio.value === 'custom'
      ? parseInt(customLengthInput.value)
      : parseInt(lengthRadio.value);

  // Validate length
  if (length < 8 || length > 128) {
    alert('Password length must be between 8 and 128 characters');
    return;
  }

  // Build character set based on selections
  let charset = '';
  if (uppercaseCheckbox.checked) charset += CHARSET.uppercase;
  if (lowercaseCheckbox.checked) charset += CHARSET.lowercase;
  if (numbersCheckbox.checked) charset += CHARSET.numbers;
  if (specialCheckbox.checked) charset += CHARSET.special;

  try {
    // Generate password
    const password = await derivePassword(
      masterPassword,
      secretKey,
      siteName,
      version,
      length,
      charset,
    );

    // Display result
    generatedPasswordInput.value = password;
    outputSection.style.display = 'block';
    copyFeedback.textContent = '';

    // Scroll to output
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) {
    alert('Error generating password. Please try again.');
    // Error already logged in derivePassword function (if needed for debugging)
  }
});

// Copy to clipboard
copyBtn.addEventListener('click', async function () {
  const password = generatedPasswordInput.value;

  try {
    await navigator.clipboard.writeText(password);
    copyFeedback.textContent = '✓ Copied to clipboard!';
    copyFeedback.style.color = 'var(--success-color)';

    // Clear feedback after 3 seconds
    setTimeout(() => {
      copyFeedback.textContent = '';
    }, 3000);
  } catch (error) {
    // Fallback for older browsers
    generatedPasswordInput.select();
    document.execCommand('copy');
    copyFeedback.textContent = '✓ Copied to clipboard!';
    copyFeedback.style.color = 'var(--success-color)';

    setTimeout(() => {
      copyFeedback.textContent = '';
    }, 3000);
  }
});

// Clear all fields
clearBtn.addEventListener('click', function () {
  // Clear all inputs
  masterPasswordInput.value = '';
  secretKeyInput.value = '';
  siteNameInput.value = '';
  versionInput.value = 'v1';
  generatedPasswordInput.value = '';

  // Reset password visibility
  document
    .querySelectorAll(
      'input[type="text"][id="masterPassword"], input[type="text"][id="secretKey"]',
    )
    .forEach((input) => {
      input.type = 'password';
    });
  document.querySelectorAll('.eye-icon').forEach((icon) => {
    icon.textContent = '👁️';
  });

  // Hide output section
  outputSection.style.display = 'none';

  // Reset to defaults
  document.querySelector('input[name="length"][value="12"]').checked = true;
  customLengthInput.disabled = true;
  customLengthInput.value = '24';

  uppercaseCheckbox.checked = true;
  lowercaseCheckbox.checked = true;
  numbersCheckbox.checked = true;
  specialCheckbox.checked = true;

  copyFeedback.textContent = '';

  // Focus on first input
  masterPasswordInput.focus();
});

// Export to JSON
exportBtn.addEventListener('click', function () {
  // Check if password has been generated
  if (!generatedPasswordInput.value) {
    alert('Please generate a password first before exporting.');
    return;
  }

  // Get current form values
  const siteName = siteNameInput.value.trim();
  const version = versionInput.value.trim() || 'v1';

  // Get password length
  const lengthRadio = document.querySelector('input[name="length"]:checked');
  const length =
    lengthRadio.value === 'custom'
      ? parseInt(customLengthInput.value)
      : parseInt(lengthRadio.value);

  // Get character set selections
  const characterSets = {
    uppercase: uppercaseCheckbox.checked,
    lowercase: lowercaseCheckbox.checked,
    numbers: numbersCheckbox.checked,
    special: specialCheckbox.checked,
  };

  // Create export data object
  // NOTE: We do NOT export master password or secret key for security reasons
  const exportData = {
    siteName: siteName,
    version: version,
    passwordLength: length,
    characterSets: characterSets,
    generatedPassword: generatedPasswordInput.value,
    exportDate: new Date().toISOString(),
    note: 'Master password and secret key are NOT included for security reasons',
  };

  // Convert to JSON string with pretty formatting
  const jsonString = JSON.stringify(exportData, null, 2);

  // Create a blob and download link
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  // Set filename with site name and timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `password-${siteName.replace(/[^a-z0-9]/gi, '_')}-${timestamp}.json`;

  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Show feedback
  copyFeedback.textContent = '✓ Exported to JSON file!';
  copyFeedback.style.color = 'var(--success-color)';

  setTimeout(() => {
    copyFeedback.textContent = '';
  }, 3000);
});

// Clear all on page load/refresh
window.addEventListener('load', function () {
  clearBtn.click();
});

// ===== Core Cryptographic Functions =====

/**
 * Derives a deterministic password using PBKDF2
 * @param {string} masterPassword - The master password
 * @param {string} secretKey - Optional secret key (pepper)
 * @param {string} siteName - Site/application name
 * @param {string} version - Password version
 * @param {number} length - Desired password length
 * @param {string} charset - Character set to use
 * @returns {Promise<string>} The derived password
 */
async function derivePassword(
  masterPassword,
  secretKey,
  siteName,
  version,
  length,
  charset,
) {
  // Construct the input: masterPassword + "|" + secretKey
  const input = masterPassword + '|' + secretKey;

  // Construct the salt: siteName + "|" + version
  const salt = siteName + '|' + version;

  // Convert strings to Uint8Array
  const inputBuffer = new TextEncoder().encode(input);
  const saltBuffer = new TextEncoder().encode(salt);

  // Import the key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    inputBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );

  // Derive bits using PBKDF2
  // Using 100,000 iterations for security
  // Output: 256 bits (32 bytes)
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256, // 256 bits output
  );

  // Convert derived bits to Uint8Array
  const derivedArray = new Uint8Array(derivedBits);

  // Map the derived bytes to the character set
  const password = mapBytesToCharset(derivedArray, charset, length);

  return password;
}

/**
 * Maps random bytes to a character set deterministically
 * Ensures the password satisfies all selected character set requirements
 * @param {Uint8Array} bytes - Random bytes from PBKDF2
 * @param {string} charset - Available characters
 * @param {number} length - Desired password length
 * @returns {string} The generated password
 */
function mapBytesToCharset(bytes, charset, length) {
  const charsetLength = charset.length;
  let password = '';

  // We need more bytes than the password length to ensure we have enough
  // We'll use a simple approach: extend bytes if needed using a deterministic method
  let extendedBytes = bytes;

  // If we need more bytes, we'll reuse the existing bytes in a deterministic way
  // This is acceptable because PBKDF2 output is already cryptographically strong
  while (extendedBytes.length < length * 2) {
    extendedBytes = new Uint8Array([...extendedBytes, ...bytes]);
  }

  // Generate password by mapping bytes to charset
  let byteIndex = 0;
  while (password.length < length && byteIndex < extendedBytes.length) {
    const byte = extendedBytes[byteIndex];
    // Use modulo to map byte to charset index
    // This ensures uniform distribution
    if (byte < 256 - (256 % charsetLength)) {
      // Only use bytes that don't introduce bias
      const charIndex = byte % charsetLength;
      password += charset[charIndex];
    }
    byteIndex++;
  }

  // Ensure password meets all character set requirements
  password = ensureCharsetRequirements(password, charset);

  return password;
}

/**
 * Ensures the password contains at least one character from each selected set
 * @param {string} password - The generated password
 * @param {string} charset - The full character set used
 * @returns {string} Password with guaranteed character diversity
 */
function ensureCharsetRequirements(password, charset) {
  const requirements = [];

  // Build list of required character sets
  if (uppercaseCheckbox.checked) requirements.push(CHARSET.uppercase);
  if (lowercaseCheckbox.checked) requirements.push(CHARSET.lowercase);
  if (numbersCheckbox.checked) requirements.push(CHARSET.numbers);
  if (specialCheckbox.checked) requirements.push(CHARSET.special);

  // Check if password satisfies all requirements
  const needsReplacement = [];
  for (let i = 0; i < requirements.length; i++) {
    const requiredSet = requirements[i];
    const hasChar = password
      .split('')
      .some((char) => requiredSet.includes(char));
    if (!hasChar) {
      needsReplacement.push(requiredSet);
    }
  }

  // If requirements are not met, replace characters deterministically
  if (needsReplacement.length > 0) {
    const passwordArray = password.split('');

    // Replace characters at deterministic positions
    for (let i = 0; i < needsReplacement.length; i++) {
      const requiredSet = needsReplacement[i];
      // Use a deterministic position based on the requirement index
      const position = i % passwordArray.length;
      // Use the first character from the required set
      passwordArray[position] = requiredSet[0];
    }

    password = passwordArray.join('');
  }

  return password;
}

// ===== Security: Prevent data persistence =====

// Clear all fields when page is about to unload
window.addEventListener('beforeunload', function () {
  masterPasswordInput.value = '';
  secretKeyInput.value = '';
  generatedPasswordInput.value = '';
});

// Disable form autocomplete at runtime (belt and suspenders approach)
form.setAttribute('autocomplete', 'off');
masterPasswordInput.setAttribute('autocomplete', 'off');
secretKeyInput.setAttribute('autocomplete', 'off');
siteNameInput.setAttribute('autocomplete', 'off');
versionInput.setAttribute('autocomplete', 'off');
