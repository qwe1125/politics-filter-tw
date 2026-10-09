import type { FilterStrength } from "@politics-filter/classifier";
import { loadSettings, saveSettings } from "../settings.js";

const enabled = document.querySelector<HTMLInputElement>("#enabled")!;
const strength = document.querySelector<HTMLSelectElement>("#strength")!;
const debug = document.querySelector<HTMLInputElement>("#debug")!;

void loadSettings().then((settings) => {
  enabled.checked = settings.enabled;
  strength.value = settings.strength;
  debug.checked = settings.debug;
});

enabled.addEventListener("change", () => void saveSettings({ enabled: enabled.checked }));
strength.addEventListener("change", () => void saveSettings({ strength: strength.value as FilterStrength }));
debug.addEventListener("change", () => void saveSettings({ debug: debug.checked }));
