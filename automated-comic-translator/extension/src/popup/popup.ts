/**
 * Popup logic — reads/writes the extension settings in chrome.storage.local.
 */

interface StoredSettings {
  enabled: boolean;
  targetLang: string;
  sourceLang: string;
}

const DEFAULTS: StoredSettings = {
  enabled: true,
  targetLang: "id",
  sourceLang: "auto",
};

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
};

function loadSettings(): void {
  chrome.storage.local.get(
    ["enabled", "targetLang", "sourceLang"],
    (cfg: Partial<StoredSettings>) => {
      ($("enabled") as HTMLInputElement).checked = cfg.enabled !== false;
      ($("targetLang") as HTMLSelectElement).value = cfg.targetLang || DEFAULTS.targetLang;
      ($("sourceLang") as HTMLSelectElement).value = cfg.sourceLang || DEFAULTS.sourceLang;
    },
  );
}

function saveSettings(): void {
  const next: StoredSettings = {
    enabled: ($("enabled") as HTMLInputElement).checked,
    targetLang: ($("targetLang") as HTMLSelectElement).value,
    sourceLang: ($("sourceLang") as HTMLSelectElement).value,
  };
  chrome.storage.local.set(next, () => {
    const status = $("statusMsg");
    status.textContent = "Settings saved ✓";
    status.classList.remove("act-error");
    setTimeout(() => (status.textContent = ""), 1800);
  });
}

function resetSettings(): void {
  chrome.storage.local.set(DEFAULTS, () => {
    loadSettings();
    const status = $("statusMsg");
    status.textContent = "Settings reset ✓";
    status.classList.remove("act-error");
    setTimeout(() => (status.textContent = ""), 1800);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  $("saveBtn").addEventListener("click", saveSettings);
  $("resetBtn").addEventListener("click", resetSettings);
});
