(function () {
  const allowedThemes = ["dark", "light"];
  const allowedDensities = ["comfortable", "compact"];
  const allowedAccents = ["mint", "blue", "violet", "amber"];

  function readPreference(key, allowed, fallback) {
    const value = localStorage.getItem(`crestview-${key}`);
    return allowed.includes(value) ? value : fallback;
  }

  function applyPreferences() {
    const root = document.documentElement;
    root.dataset.theme = readPreference("theme", allowedThemes, "dark");
    root.dataset.density = readPreference("density", allowedDensities, "comfortable");
    root.dataset.accent = readPreference("accent", allowedAccents, "mint");
    const fontScale = Number(localStorage.getItem("crestview-font-scale") || "100");
    root.style.setProperty("--font-scale", `${fontScale / 100}`);
    root.classList.toggle("user-reduced-motion", localStorage.getItem("crestview-reduced-motion") === "true");
  }

  applyPreferences();

  document.addEventListener("DOMContentLoaded", () => {
    const navigation = document.querySelector(".side-nav");
    if (navigation) {
      const currentPage = location.pathname.split(/[\\/]/).pop() || "index.html";
      const pageLinks = [
        { href: "positions.html", icon: "◉", label: "Live positions" },
        { href: "community.html", icon: "◎", label: "Community" }
      ];
      const settingsLink = navigation.querySelector('a[href="settings.html"]');
      pageLinks.forEach(({ href, icon, label }) => {
        let link = navigation.querySelector(`a[href="${href}"]`);
        if (!link) {
          link = document.createElement("a");
          link.className = "nav-link";
          link.href = href;
          link.innerHTML = `<span class="nav-icon">${icon}</span>${label}`;
        }
        link.classList.toggle("active", currentPage === href);
        navigation.insertBefore(link, settingsLink || null);
      });
    }

    const themeControl = document.getElementById("setting-theme");
    const densityControl = document.getElementById("setting-density");
    const accentControl = document.getElementById("setting-accent");
    const fontControl = document.getElementById("setting-font-size");
    const motionControl = document.getElementById("setting-motion");
    const root = document.documentElement;

    if (themeControl) {
      themeControl.value = root.dataset.theme;
      themeControl.addEventListener("change", () => {
        localStorage.setItem("crestview-theme", themeControl.value);
        applyPreferences();
      });
    }

    if (densityControl) {
      densityControl.value = root.dataset.density;
      densityControl.addEventListener("change", () => {
        localStorage.setItem("crestview-density", densityControl.value);
        applyPreferences();
      });
    }

    if (accentControl) {
      accentControl.value = root.dataset.accent;
      accentControl.addEventListener("change", () => {
        localStorage.setItem("crestview-accent", accentControl.value);
        applyPreferences();
      });
    }

    if (fontControl) {
      const savedScale = localStorage.getItem("crestview-font-scale") || "100";
      fontControl.value = savedScale;
      fontControl.nextElementSibling.value = `${savedScale}%`;
      fontControl.addEventListener("input", () => {
        const scale = Number(fontControl.value);
        root.style.setProperty("--font-scale", `${scale / 100}`);
        localStorage.setItem("crestview-font-scale", String(scale));
      });
    }

    if (motionControl) {
      motionControl.checked = localStorage.getItem("crestview-reduced-motion") === "true";
      motionControl.addEventListener("change", () => {
        localStorage.setItem("crestview-reduced-motion", String(motionControl.checked));
        root.classList.toggle("user-reduced-motion", motionControl.checked);
      });
    }

    const resetButton = document.getElementById("settings-reset");
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        ["theme", "density", "accent", "font-scale", "reduced-motion"].forEach((key) => localStorage.removeItem(`crestview-${key}`));
        applyPreferences();
        window.location.reload();
      });
    }
  });
})();
