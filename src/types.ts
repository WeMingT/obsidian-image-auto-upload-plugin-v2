import type { TFile } from "obsidian";

export interface Image {
  path: string;
  name: string;
  source: string;
  file?: TFile | null;
}

export interface LinkReplacementRule {
  id: string;
  pattern: string; // Regex pattern or exact string
  replacement: string;
  flags?: string; // Regex flags like 'g', 'i'
  enabled: boolean;
}

export interface LinkReplacementProfile {
  id: string;
  name: string;
  rules: LinkReplacementRule[];
  enabled: boolean;
}
