'use client';

import * as React from 'react';

export type Locale = 'zh-CN' | 'en';
type Messages = Record<string, string>;

const messages: Record<Locale, Messages> = {
  'zh-CN': {
    language: '语言', chinese: '简体中文', english: 'English',
    dashboard: '仪表盘', bookmarks: '书签', categories: '分类', members: '成员', import: '导入', ai: 'AI 助手', settings: '设置', admin: '超级管理员', collapse: '收起',
    searchBookmarks: '搜索书签（按 Enter）…', workspaceSettings: '工作区设置', billingPlan: '账单与方案', signOut: '退出登录',
    welcomeBack: '欢迎回来', signInContinue: '登录以继续使用', email: '邮箱', password: '密码', signIn: '登录', noAccount: '还没有账号？', signUpFree: '免费注册',
    createAccount: '创建账号', setupWorkspace: '只需几步即可创建团队工作区', fullName: '姓名', teamWorkspace: '团队工作区', teamName: '团队名称', workspaceSlug: '工作区标识', createAccountButton: '创建账号', alreadyAccount: '已有账号？',
    getStarted: '开始使用', publicBeta: '公开测试版，所有团队均可免费使用', heroTitle: '团队书签中心', heroDescription: '整理、共享和快速访问团队常用链接，创建拥有自定义主题的导航门户。', getStartedFree: '免费开始', viewDemoPortal: '查看演示门户',
    smartBookmarks: '智能书签', smartBookmarksDesc: '通过智能分类、自动获取元数据和强大搜索，整理团队重要链接。', teamCollaboration: '团队协作', teamCollaborationDesc: '多工作区协作，让团队整理并共享自己的书签集合。', customPortals: '自定义导航门户', customPortalsDesc: '创建具有自定义主题、颜色和布局的品牌导航页。',
    bookmarksTitle: '书签', manageBookmarks: '管理和整理团队书签。', category: '分类', allCategories: '所有分类', sort: '排序', default: '默认', titleAZ: '标题 A-Z', newest: '最新', oldest: '最早', grid: '网格', list: '列表',
    categoriesTitle: '分类', categoriesDesc: '使用分类和子分类整理书签。', categoryTree: '分类树', addSubcategory: '添加子分类', rename: '重命名', delete: '删除', selectCategory: '选择分类', clickCategory: '点击分类查看书签',
    dashboardTitle: '仪表盘', dashboardDescription: '查看工作区的书签、分类和团队活动。', totalBookmarks: '书签总数', allTime: '全部', organized: '已整理', teamMembers: '团队成员', active: '活跃', recentClicks: '最近链接点击', tracked: '已跟踪', recentBookmarks: '最近书签', quickActions: '快捷操作', manageCategories: '管理分类', themeSettings: '主题与设置', viewPortal: '查看门户',
    importTitle: '导入书签', settingsTitle: '设置', settingsDesc: '管理工作区配置和外观。', general: '常规', theme: '主题', domain: '域名', workspaceDetails: '工作区信息', basicWorkspaceInfo: '工作区的基本信息。', workspaceName: '工作区名称', logoUrl: 'Logo 地址', workspaceSlugLabel: '工作区标识', themeConfig: '主题配置', customizePortal: '自定义导航门户的外观。', accentColor: '强调色', layout: '布局', preview: '预览', customDomain: '自定义域名', saved: '设置已成功保存。',
    pricingTitle: '价格方案', transparentPricing: '简单透明的价格方案', free: '免费版', pro: '专业版', enterprise: '企业版',
    portalLoading: '正在加载门户…', portalNotFound: '未找到门户', otherLinks: '其他链接', searchLinks: '搜索链接…', noResults: '没有找到结果',
    signInLabel: '登录', signUpLabel: '注册', collapseNav: '收起侧栏', addBookmark: '添加书签', aiOrganize: 'AI 整理', addCategory: '添加分类', viewAll: '查看全部', choosePlan: '选择适合的方案', forYourTeam: '为你的团队打造', faq: '常见问题',
  },
  en: {
    language: 'Language', chinese: '简体中文', english: 'English', dashboard: 'Dashboard', bookmarks: 'Bookmarks', categories: 'Categories', members: 'Members', import: 'Import', ai: 'AI Assistant', settings: 'Settings', admin: 'Super Admin', collapse: 'Collapse',
    searchBookmarks: 'Search bookmarks (press Enter)...', workspaceSettings: 'Workspace Settings', billingPlan: 'Billing & Plan', signOut: 'Sign out',
    welcomeBack: 'Welcome back', signInContinue: 'Sign in to your account to continue', email: 'Email', password: 'Password', signIn: 'Sign In', noAccount: "Don't have an account?", signUpFree: 'Sign up free',
    createAccount: 'Create your account', setupWorkspace: 'Set up your team workspace in just a few steps', fullName: 'Full Name', teamWorkspace: 'Team Workspace', teamName: 'Team Name', workspaceSlug: 'Workspace Slug', createAccountButton: 'Create Account', alreadyAccount: 'Already have an account?',
    getStarted: 'Get Started', publicBeta: 'Now in public beta — free for all teams', heroTitle: "Your team's bookmark hub", heroDescription: "Organize, share, and navigate your team's essential links. Create stunning navigation portals with custom themes.", getStartedFree: 'Get Started Free', viewDemoPortal: 'View Demo Portal',
    smartBookmarks: 'Smart Bookmarks', smartBookmarksDesc: "Organize your team's essential links with intelligent categorization, auto-fetching metadata, and powerful search.", teamCollaboration: 'Team Collaboration', teamCollaborationDesc: 'Multi-tenant workspaces let every team curate and share their own bookmark collection.', customPortals: 'Custom Navigation Portals', customPortalsDesc: "Create beautiful, branded navigation pages with custom themes, colors, and layouts that reflect your team's identity.",
    bookmarksTitle: 'Bookmarks', manageBookmarks: "Manage and organize your team's bookmarks.", category: 'Category', allCategories: 'All Categories', sort: 'Sort', default: 'Default', titleAZ: 'Title A-Z', newest: 'Newest', oldest: 'Oldest', grid: 'Grid', list: 'List',
    categoriesTitle: 'Categories', categoriesDesc: 'Organize your bookmarks with categories and subcategories.', categoryTree: 'Category Tree', addSubcategory: 'Add subcategory', rename: 'Rename', delete: 'Delete', selectCategory: 'Select a category', clickCategory: 'Click on a category to view its bookmarks',
    dashboardTitle: 'Dashboard', dashboardDescription: "Here's what's happening in your workspace today.", totalBookmarks: 'Total Bookmarks', allTime: 'All time', organized: 'Organized', teamMembers: 'Team Members', active: 'Active', recentClicks: 'Recent Link Clicks', tracked: 'Tracked', recentBookmarks: 'Recent Bookmarks', quickActions: 'Quick Actions', manageCategories: 'Manage Categories', themeSettings: 'Theme & Settings', viewPortal: 'View Portal',
    importTitle: 'Import Bookmarks', settingsTitle: 'Settings', settingsDesc: 'Manage your workspace configuration and appearance.', general: 'General', theme: 'Theme', domain: 'Domain', workspaceDetails: 'Workspace Details', basicWorkspaceInfo: 'Basic information about your workspace.', workspaceName: 'Workspace Name', logoUrl: 'Logo URL', workspaceSlugLabel: 'Workspace Slug', themeConfig: 'Theme Configuration', customizePortal: 'Customize the look and feel of your navigation portal.', accentColor: 'Accent Color', layout: 'Layout', preview: 'Preview', customDomain: 'Custom Domain', saved: 'Settings saved successfully.',
    pricingTitle: 'Pricing', transparentPricing: 'Simple, transparent pricing', free: 'Free', pro: 'Pro', enterprise: 'Enterprise',
    portalLoading: 'Loading portal...', portalNotFound: 'Portal Not Found', otherLinks: 'Other Links', searchLinks: 'Search links...', noResults: 'No results found', signInLabel: 'Sign In', signUpLabel: 'Sign up', collapseNav: 'Collapse sidebar', addBookmark: 'Add Bookmark', aiOrganize: 'AI Organize', addCategory: 'Add Category', viewAll: 'View all', choosePlan: 'Choose the perfect plan', forYourTeam: 'for your team', faq: 'Frequently Asked Questions',
  },
};

interface LocaleContextValue { locale: Locale; setLocale: (locale: Locale) => void; t: (key: string) => string }
const LocaleContext = React.createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>('zh-CN');

  React.useEffect(() => {
    const stored = localStorage.getItem('locale');
    const next: Locale = stored === 'en' || stored === 'zh-CN' ? stored : 'zh-CN';
    setLocaleState(next);
    document.documentElement.lang = next;
  }, []);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem('locale', next);
    document.documentElement.lang = next;
  }, []);

  const value = React.useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    t: (key) => messages[locale][key] ?? messages.en[key] ?? key,
  }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = React.useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider');
  return context;
}