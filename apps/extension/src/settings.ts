import type { FilterStrength } from "@politics-filter/classifier";

export interface Settings {
  enabled: boolean;
  strength: FilterStrength;
  debug: boolean;
}

export const defaultSettings: Settings = {
  enabled: true,
  strength: "medium",
  debug: false
};

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(defaultSettings);
  return { ...defaultSettings, ...stored } as Settings;
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  await chrome.storage.local.set(settings);
}
