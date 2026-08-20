export interface ChangelogFeature {
  title: string;
  description: string;
}

export interface ChangelogData {
  version: string;
  date: string;
  tagline: string;
  features: ChangelogFeature[];
  uiImprovements: ChangelogFeature[];
  bugFixes: string[];
  otherUpdates: ChangelogFeature[];
}
