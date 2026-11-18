export enum Plan {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export interface ThemeConfig {
  colorScheme: 'light' | 'dark' | 'system';
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderRadius: number;
  cardSpacing: number;
  layout: 'grid' | 'list' | 'sidebar';
  fontFamily?: string;
  preset?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  customDomain?: string | null;
  plan: Plan;
  logo?: string | null;
  favicon?: string | null;
  themeConfig?: ThemeConfig | null;
  maxBookmarks: number;
  maxMembers: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  plan?: Plan;
}

export interface UpdateTenantDto {
  name?: string;
  logo?: string;
  favicon?: string;
  themeConfig?: ThemeConfig;
}
