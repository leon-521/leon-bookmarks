export const PLAN_LIMITS = {
  FREE: { maxBookmarks: 500, maxMembers: 5, maxCategories: 20 },
  PRO: { maxBookmarks: 5000, maxMembers: 50, maxCategories: 200 },
  ENTERPRISE: { maxBookmarks: -1, maxMembers: -1, maxCategories: -1 }, // unlimited
} as const;

export const SUPPORTED_IMPORT_FORMATS = ['html', 'json', 'csv'] as const;

export const DEFAULT_THEME: import('./types').ThemeConfig = {
  colorScheme: 'system',
  accentColor: 'hsl(222, 80%, 56%)',
  backgroundColor: 'hsl(220, 16%, 98%)',
  textColor: 'hsl(220, 20%, 14%)',
  borderColor: 'hsl(220, 12%, 90%)',
  borderRadius: 10,
  cardSpacing: 16,
  layout: 'grid',
  preset: 'default',
};

// Move constants import to avoid circular dependency
export const THEME_PRESETS = {
  default: { accentColor: 'hsl(222, 80%, 56%)', backgroundColor: 'hsl(220, 16%, 98%)' },
  forest:  { accentColor: 'hsl(152, 56%, 42%)', backgroundColor: 'hsl(80, 20%, 97%)' },
  ocean:   { accentColor: 'hsl(200, 80%, 50%)', backgroundColor: 'hsl(210, 40%, 10%)' },
  sunset:  { accentColor: 'hsl(16, 80%, 56%)',  backgroundColor: 'hsl(30, 20%, 96%)' },
  minimal: { accentColor: 'hsl(0, 0%, 20%)',    backgroundColor: 'hsl(0, 0%, 100%)' },
  sakura:  { accentColor: 'hsl(340, 60%, 65%)', backgroundColor: 'hsl(340, 30%, 97%)' },
} as const;
