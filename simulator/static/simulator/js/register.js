/* ============================================================
   TradeSims — register.js
   Handles: client-side validation, password strength,
   rule checklist, show/hide password, submit state,
   and ripple (re-uses the ts-ripple pattern from script.js).
   ============================================================ */

'use strict';

/* ========================
   ELEMENT REFERENCES
   ======================== */

const form       = document.getElementById('registerForm');
const submitBtn  = document.getElementById('submitBtn');

// Fields
const fieldFirst = document.getElementById('id_first_name');
const fieldLast  = document.getElementById('id_last_name');
const fieldUser  = document.getElementById('id_username');
const fieldEmail = document.getElementById('id_email');
const fieldPw1   = document.getElementById('id_password1');
const fieldPw2   = document.getElementById('id_password2');
const fieldTerms = document.getElementById('id_terms');

// Password strength
const strengthFill  = document.getElementById('strengthFill');
const strengthLabel = document.getElementById('rg-strength-label');

// Rules
const rules = {
  length:  document.getElementById('rule-length'),
  upper:   document.getElementById('rule-upper'),
  number:  document.getElementById('rule-number'),
  special: document.getElementById('rule-special'),
};


/* ========================
   INLINE VALIDATION HELPERS
   ======================== */

/**
 * Mark a field as valid — adds class, shows check icon.
 * @param {HTMLInputElement} input
 */
function setValid(input) {
  input.classList.remove('rg-input--error');
  input.classList.add('rg-input--valid');
  // Show error paragraph as empty / hidden
  const errEl = document.getElementById(
    input.getAttribute('aria-describedby')?.split(' ')
      .find(id => id.startsWith('err-'))
  );
  if (errEl) {
    errEl.textContent = '';
    errEl.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Mark a field as invalid.
 * @param {HTMLInputElement} input
 * @param {string} message
 */
function setError(input, message) {
  input.classList.remove('rg-input--valid');
  input.classList.add('rg-input--error');
  const errId = input.getAttribute('aria-describedby')
    ?.split(' ')
    .find(id => id.startsWith('err-'));
  if (errId) {
    const errEl = document.getElementById(errId);
    if (errEl) {
      errEl.textContent = message;
      errEl.removeAttribute('aria-hidden');
    }
  }
}

/**
 * Clear field state (no success/error styling).
 */
function clearState(input) {
  input.classList.remove('rg-input--valid', 'rg-input--error');
}


/* ========================
   VALIDATION RULES PER FIELD
   ======================== */

function validateFirst() {
  const v = fieldFirst.value.trim();
  if (!v) { setError(fieldFirst, 'First name is required.'); return false; }
  if (v.length < 2) { setError(fieldFirst, 'Must be at least 2 characters.'); return false; }
  setValid(fieldFirst);
  return true;
}

function validateLast() {
  const v = fieldLast.value.trim();
  if (!v) { setError(fieldLast, 'Last name is required.'); return false; }
  if (v.length < 2) { setError(fieldLast, 'Must be at least 2 characters.'); return false; }
  setValid(fieldLast);
  return true;
}

function validateUsername() {
  const v = fieldUser.value.trim();
  if (!v) { setError(fieldUser, 'Username is required.'); return false; }
  if (v.length < 3) { setError(fieldUser, 'Must be at least 3 characters.'); return false; }
  if (v.length > 150) { setError(fieldUser, 'Max 150 characters.'); return false; }
  if (!/^[\w.@+-]+$/.test(v)) {
    setError(fieldUser, 'Only letters, digits, and @/./+/-/_ are allowed.');
    return false;
  }
  setValid(fieldUser);
  return true;
}

function validateEmail() {
  const v = fieldEmail.value.trim();
  if (!v) { setError(fieldEmail, 'Email address is required.'); return false; }
  // RFC-ish quick check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
    setError(fieldEmail, 'Please enter a valid email address.');
    return false;
  }
  setValid(fieldEmail);
  return true;
}

function validatePassword1() {
  const v = fieldPw1.value;
  if (!v) { setError(fieldPw1, 'Password is required.'); return false; }
  if (getPasswordScore(v).score < 2) {
    setError(fieldPw1, 'Password is too weak. See the requirements below.');
    return false;
  }
  setValid(fieldPw1);
  return true;
}

function validatePassword2() {
  const v1 = fieldPw1.value;
  const v2 = fieldPw2.value;
  if (!v2) { setError(fieldPw2, 'Please confirm your password.'); return false; }
  if (v1 !== v2) { setError(fieldPw2, 'Passwords do not match.'); return false; }
  setValid(fieldPw2);
  return true;
}

function validateTerms() {
  const errEl = document.getElementById('err-terms');
  if (!fieldTerms.checked) {
    if (errEl) {
      errEl.textContent = 'You must accept the Terms of Use to continue.';
      errEl.removeAttribute('aria-hidden');
    }
    return false;
  }
  if (errEl) {
    errEl.textContent = '';
    errEl.setAttribute('aria-hidden', 'true');
  }
  return true;
}


/* ========================
   BLUR VALIDATION (field-by-field)
   ======================== */

fieldFirst.addEventListener('blur', validateFirst);
fieldLast.addEventListener('blur',  validateLast);
fieldUser.addEventListener('blur',  validateUsername);
fieldEmail.addEventListener('blur', validateEmail);
fieldPw1.addEventListener('blur',   validatePassword1);
fieldPw2.addEventListener('blur',   validatePassword2);

// Re-validate confirm on first password change
fieldPw1.addEventListener('input', () => {
  if (fieldPw2.value) validatePassword2();
});

// Clear error on focus
[fieldFirst, fieldLast, fieldUser, fieldEmail, fieldPw1, fieldPw2].forEach(f => {
  f.addEventListener('focus', () => {
    if (f.classList.contains('rg-input--error')) clearState(f);
  });
});


/* ========================
   PASSWORD STRENGTH METER
   ======================== */

/**
 * Score a password 0–4.
 * Returns { score, checks }.
 */
function getPasswordScore(pw) {
  const checks = {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    number:  /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { score, checks };
}

const strengthConfig = [
  { label: '',       color: 'transparent', width: '0%'   },
  { label: 'Weak',   color: '#ef4444',     width: '25%'  },
  { label: 'Fair',   color: '#f59e0b',     width: '50%'  },
  { label: 'Good',   color: '#3b82f6',     width: '75%'  },
  { label: 'Strong', color: '#10b981',     width: '100%' },
];

fieldPw1.addEventListener('input', () => {
  const pw = fieldPw1.value;

  if (!pw) {
    strengthFill.style.width = '0%';
    strengthLabel.textContent = '';
    updateRules({});
    return;
  }

  const { score, checks } = getPasswordScore(pw);
  const cfg = strengthConfig[score];

  strengthFill.style.width      = cfg.width;
  strengthFill.style.background = cfg.color;
  strengthLabel.textContent     = cfg.label;
  strengthLabel.style.color     = cfg.color;

  updateRules(checks);
});

/**
 * Toggle met/unmet classes on the rule list items.
 */
function updateRules(checks) {
  Object.entries(rules).forEach(([key, el]) => {
    if (!el) return;
    el.classList.toggle('met', !!checks[key]);
  });
}


/* ========================
   PASSWORD SHOW / HIDE TOGGLE
   ======================== */

document.querySelectorAll('.rg-pw-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const input    = document.getElementById(targetId);
    if (!input) return;

    const isHidden = input.type === 'password';
    input.type     = isHidden ? 'text' : 'password';

    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = isHidden ? 'bi bi-eye-slash' : 'bi bi-eye';
    }
    btn.setAttribute('aria-pressed', String(isHidden));
    btn.setAttribute('aria-label',   isHidden ? 'Hide password' : 'Show password');
  });
});


/* ========================
   FORM SUBMIT
   ======================== */

if (form) {
  form.addEventListener('submit', (e) => {
    // Run all validators
    const valid =
      validateFirst()    &
      validateLast()     &
      validateUsername() &
      validateEmail()    &
      validatePassword1()&
      validatePassword2()&
      validateTerms();

    if (!valid) {
      e.preventDefault();
      // Scroll to first error
      const firstErr = form.querySelector('.rg-input--error, input:invalid');
      if (firstErr) {
        firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErr.focus();
      }
      return;
    }

    // Show loading state on button
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    // (Django will redirect on success so no need to reset)
  });
}


/* ========================
   RIPPLE (mirrors script.js)
   ======================== */

document.querySelectorAll('.ts-ripple').forEach(btn => {
  // Guard: don't double-bind if script.js already did it globally
  if (btn.dataset.rippleBound) return;
  btn.dataset.rippleBound = 'true';

  btn.addEventListener('click', function (e) {
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x    = e.clientX - rect.left - size / 2;
    const y    = e.clientY - rect.top  - size / 2;

    const wave = document.createElement('span');
    wave.className = 'ts-ripple-wave';
    wave.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
    btn.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());
  });
});
