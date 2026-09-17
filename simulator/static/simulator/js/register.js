(function () {
    var root = document.documentElement;
    var toggle = document.getElementById("themeToggle");

    if (toggle) {
        var stored = localStorage.getItem("tradesims-theme");
        var prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
        var theme = stored || (prefersLight ? "light" : "dark");

        applyTheme(theme);

        toggle.addEventListener("click", function () {
            theme = theme === "dark" ? "light" : "dark";
            applyTheme(theme);
            localStorage.setItem("tradesims-theme", theme);
        });

        function applyTheme(t) {
            root.setAttribute("data-theme", t);
            toggle.setAttribute("aria-pressed", t === "light");
            toggle.setAttribute("aria-label", t === "light" ? "Switch to dark theme" : "Switch to light theme");
        }
    }
})();

(function () {
    function wireToggle(inputId, buttonId) {
        var input = document.getElementById(inputId);
        var btn = document.getElementById(buttonId);

        if (!input || !btn) return;

        btn.addEventListener("click", function () {
            var isHidden = input.type === "password";
            input.type = isHidden ? "text" : "password";
            btn.textContent = isHidden ? "Hide" : "Show";
            btn.setAttribute("aria-pressed", isHidden);
            btn.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
        });
    }

    wireToggle("password", "passwordToggle");
    wireToggle("confirmPassword", "confirmPasswordToggle");
})();

(function () {
    var form = document.getElementById("registerForm");
    var firstName = document.getElementById("firstName");
    var lastName = document.getElementById("lastName");
    var username = document.getElementById("username");
    var email = document.getElementById("email");
    var password = document.getElementById("password");
    var confirmPassword = document.getElementById("confirmPassword");

    var errors = {
        firstName: document.getElementById("firstNameError"),
        lastName: document.getElementById("lastNameError"),
        username: document.getElementById("usernameError"),
        email: document.getElementById("emailError"),
        confirmPassword: document.getElementById("confirmPasswordError")
    };

    var usernamePattern = /^[\w.@+-]+$/;

    var passwordRules = {
        length: function (v) { return v.length >= 8; },
        upper: function (v) { return /[A-Z]/.test(v); },
        number: function (v) { return /[0-9]/.test(v); },
        special: function (v) { return /[^A-Za-z0-9]/.test(v); }
    };

    password.addEventListener("input", updateRequirements);
    form.addEventListener("submit", function (e) {
        if (!validate()) e.preventDefault();
    });

    updateRequirements();

    function updateRequirements() {
        var value = password.value;

        Object.keys(passwordRules).forEach(function (rule) {
            var li = document.querySelector('[data-rule="' + rule + '"]');
            li.classList.toggle("met", passwordRules[rule](value));
        });
    }

    function validate() {
        var ok = true;

        ok = requireField(firstName, errors.firstName, "Enter your first name.") && ok;
        ok = requireField(lastName, errors.lastName, "Enter your last name.") && ok;

        if (!username.value.trim()) {
            errors.username.textContent = "Choose a username.";
            ok = false;
        } else if (username.value.length > 150 || !usernamePattern.test(username.value)) {
            errors.username.textContent = "Use only letters, digits, and @/./+/-/_ (max 150 characters).";
            ok = false;
        } else {
            errors.username.textContent = "";
        }

        if (!email.value.trim() || !email.validity.valid) {
            errors.email.textContent = "Enter a valid email address.";
            ok = false;
        } else {
            errors.email.textContent = "";
        }

        if (!passwordMeetsAllRules(password.value)) ok = false;

        if (!confirmPassword.value || confirmPassword.value !== password.value) {
            errors.confirmPassword.textContent = "Passwords do not match.";
            ok = false;
        } else {
            errors.confirmPassword.textContent = "";
        }

        return ok;
    }

    function passwordMeetsAllRules(value) {
        return Object.keys(passwordRules).every(function (rule) {
            return passwordRules[rule](value);
        });
    }

    function requireField(input, errorEl, message) {
        if (!input.value.trim()) {
            errorEl.textContent = message;
            return false;
        }

        errorEl.textContent = "";
        return true;
    }
})();