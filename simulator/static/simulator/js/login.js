(function () {
    var root = document.documentElement;
    var toggle = document.getElementById("themeToggle");

    if (toggle) {
        var stored = localStorage.getItem("tradesims-theme");
        var prefersLight = window.matchMedia(
            "(prefers-color-scheme: light)"
        ).matches;

        var theme = stored || (prefersLight ? "light" : "dark");

        applyTheme(theme);

        toggle.addEventListener("click", function () {
            theme = theme === "dark" ? "light" : "dark";
            applyTheme(theme);
            localStorage.setItem("tradesims-theme", theme);
        });

        function applyTheme(t) {
            root.setAttribute("data-theme", t);

            toggle.setAttribute(
                "aria-pressed",
                t === "light"
            );

            toggle.setAttribute(
                "aria-label",
                t === "light"
                    ? "Switch to dark theme"
                    : "Switch to light theme"
            );
        }
    }
})();


(function () {
    var passwordInput = document.getElementById("password");
    var passwordToggle = document.getElementById("passwordToggle");

    if (!passwordInput || !passwordToggle) {
        return;
    }

    passwordToggle.addEventListener("click", function () {
        var isHidden = passwordInput.type === "password";

        passwordInput.type = isHidden ? "text" : "password";

        passwordToggle.textContent = isHidden ? "Hide" : "Show";

        passwordToggle.setAttribute(
            "aria-pressed",
            isHidden
        );

        passwordToggle.setAttribute(
            "aria-label",
            isHidden ? "Hide password" : "Show password"
        );
    });
})();