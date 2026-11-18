export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  themeConfig: ThemeConfig;
}

export interface ThemeConfig {
  accentColor: string;
  layout: 'grid' | 'list';
  borderRadius: number;
  cardSpacing: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  parentId: string | null;
  bookmarkCount: number;
  children?: Category[];
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description: string;
  favicon: string;
  categoryId: string;
  categoryName: string;
  tags: string[];
  isPinned: boolean;
  status: 'active' | 'broken';
  createdAt: string;
  updatedAt: string;
}

export const mockUser: User = {
  id: '1',
  name: 'Leon Chen',
  email: 'leon@bookmarks.dev',
  role: 'owner',
};

export const mockTenant: Tenant = {
  id: '1',
  name: 'Acme Dev Team',
  slug: 'acme-dev',
  themeConfig: {
    accentColor: '#3b82f6',
    layout: 'grid',
    borderRadius: 12,
    cardSpacing: 16,
  },
};

export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Development',
    icon: 'code',
    parentId: null,
    bookmarkCount: 12,
    children: [
      { id: '1a', name: 'Frontend', icon: 'layout', parentId: '1', bookmarkCount: 5 },
      { id: '1b', name: 'Backend', icon: 'server', parentId: '1', bookmarkCount: 4 },
      { id: '1c', name: 'DevOps', icon: 'cloud', parentId: '1', bookmarkCount: 3 },
    ],
  },
  {
    id: '2',
    name: 'Design',
    icon: 'palette',
    parentId: null,
    bookmarkCount: 6,
    children: [
      { id: '2a', name: 'UI Kits', icon: 'component', parentId: '2', bookmarkCount: 3 },
      { id: '2b', name: 'Inspiration', icon: 'sparkles', parentId: '2', bookmarkCount: 3 },
    ],
  },
  {
    id: '3',
    name: 'Productivity',
    icon: 'zap',
    parentId: null,
    bookmarkCount: 5,
  },
  {
    id: '4',
    name: 'AI & Machine Learning',
    icon: 'brain',
    parentId: null,
    bookmarkCount: 4,
  },
  {
    id: '5',
    name: 'Resources',
    icon: 'book-open',
    parentId: null,
    bookmarkCount: 3,
    children: [
      { id: '5a', name: 'Documentation', icon: 'file-text', parentId: '5', bookmarkCount: 2 },
      { id: '5b', name: 'Tutorials', icon: 'video', parentId: '5', bookmarkCount: 1 },
    ],
  },
];

export const mockBookmarks: Bookmark[] = [
  {
    id: '1',
    title: 'GitHub',
    url: 'https://github.com',
    description: 'The world\'s leading software development platform. Build, ship, and maintain your software with collaboration tools, code review, and project management.',
    favicon: 'https://github.githubassets.com/favicons/favicon.svg',
    categoryId: '1',
    categoryName: 'Development',
    tags: ['git', 'collaboration', 'open-source'],
    isPinned: true,
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'npm - Node Package Manager',
    url: 'https://www.npmjs.com',
    description: 'The official package registry for JavaScript. Find, install, and publish npm packages with the world\'s largest software registry.',
    favicon: 'https://static-production.npmjs.com/b0f1a8318363185cc2ea6a40ac23eeb2.png',
    categoryId: '1a',
    categoryName: 'Frontend',
    tags: ['javascript', 'packages', 'node'],
    isPinned: false,
    status: 'active',
    createdAt: '2024-01-16T14:30:00Z',
    updatedAt: '2024-01-16T14:30:00Z',
  },
  {
    id: '3',
    title: 'Figma',
    url: 'https://www.figma.com',
    description: 'The collaborative interface design tool. Create, prototype, and hand off designs with real-time collaboration for teams of any size.',
    favicon: 'https://static.figma.com/app/icon/1/favicon.svg',
    categoryId: '2',
    categoryName: 'Design',
    tags: ['design', 'ui', 'prototype', 'collaboration'],
    isPinned: true,
    status: 'active',
    createdAt: '2024-01-17T09:15:00Z',
    updatedAt: '2024-01-17T09:15:00Z',
  },
  {
    id: '4',
    title: 'ChatGPT',
    url: 'https://chat.openai.com',
    description: 'An AI language model by OpenAI. Get answers, brainstorm ideas, write code, and explore creative solutions powered by advanced AI technology.',
    favicon: 'https://chat.openai.com/favicon.ico',
    categoryId: '4',
    categoryName: 'AI & Machine Learning',
    tags: ['ai', 'chat', 'openai', 'productivity'],
    isPinned: true,
    status: 'active',
    createdAt: '2024-01-18T11:45:00Z',
    updatedAt: '2024-01-18T11:45:00Z',
  },
  {
    id: '5',
    title: 'Vercel',
    url: 'https://vercel.com',
    description: 'The platform for frontend developers. Deploy web projects with zero configuration, automatic SSL, and global CDN with edge functions.',
    favicon: 'https://assets.vercel.com/image/upload/front/favicon/vercel/favicon.ico',
    categoryId: '1c',
    categoryName: 'DevOps',
    tags: ['hosting', 'deployment', 'nextjs', 'serverless'],
    isPinned: false,
    status: 'active',
    createdAt: '2024-01-19T16:20:00Z',
    updatedAt: '2024-01-19T16:20:00Z',
  },
  {
    id: '6',
    title: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    description: 'A utility-first CSS framework packed with classes that can be composed to build any design, directly in your markup.',
    favicon: 'https://tailwindcss.com/favicons/favicon.ico',
    categoryId: '1a',
    categoryName: 'Frontend',
    tags: ['css', 'framework', 'utility-first', 'design'],
    isPinned: false,
    status: 'active',
    createdAt: '2024-01-20T08:00:00Z',
    updatedAt: '2024-01-20T08:00:00Z',
  },
  {
    id: '7',
    title: 'Notion',
    url: 'https://www.notion.so',
    description: 'All-in-one workspace for notes, tasks, wikis, and databases. Organize everything your team needs in one beautiful, flexible tool.',
    favicon: 'https://www.notion.so/images/favicon.ico',
    categoryId: '3',
    categoryName: 'Productivity',
    tags: ['notes', 'wiki', 'project-management', 'docs'],
    isPinned: false,
    status: 'active',
    createdAt: '2024-01-21T13:10:00Z',
    updatedAt: '2024-01-21T13:10:00Z',
  },
  {
    id: '8',
    title: 'Dribbble',
    url: 'https://dribbble.com',
    description: 'Discover the world\'s top designers and creatives. Browse design inspiration, find design jobs, and connect with the creative community.',
    favicon: 'https://cdn.dribbble.com/assets/favicon-b38525134603b9513174ec887944bde1a869eb6cd414f4c12a9571da4a983c3f.ico',
    categoryId: '2b',
    categoryName: 'Inspiration',
    tags: ['design', 'inspiration', 'portfolio', 'creative'],
    isPinned: false,
    status: 'active',
    createdAt: '2024-01-22T10:30:00Z',
    updatedAt: '2024-01-22T10:30:00Z',
  },
  {
    id: '9',
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
    description: 'The definitive resource for web developers. Comprehensive documentation for HTML, CSS, JavaScript, and Web APIs by Mozilla.',
    favicon: 'https://developer.mozilla.org/favicon-48x48.cbbd161b.png',
    categoryId: '5a',
    categoryName: 'Documentation',
    tags: ['docs', 'reference', 'web', 'mozilla'],
    isPinned: false,
    status: 'active',
    createdAt: '2024-01-23T15:45:00Z',
    updatedAt: '2024-01-23T15:45:00Z',
  },
  {
    id: '10',
    title: 'Linear',
    url: 'https://linear.app',
    description: 'Streamline software projects, sprints, tasks, and bug tracking. Designed for high-performance teams with beautiful, fast interfaces.',
    favicon: 'https://linear.app/favicon.ico',
    categoryId: '3',
    categoryName: 'Productivity',
    tags: ['project-management', 'issue-tracker', 'agile'],
    isPinned: false,
    status: 'active',
    createdAt: '2024-01-24T09:00:00Z',
    updatedAt: '2024-01-24T09:00:00Z',
  },
  {
    id: '11',
    title: 'Hugging Face',
    url: 'https://huggingface.co',
    description: 'The AI community building the future. Discover, train, and deploy state-of-the-art machine learning models with the open-source platform.',
    favicon: 'https://huggingface.co/favicon.ico',
    categoryId: '4',
    categoryName: 'AI & Machine Learning',
    tags: ['ai', 'ml', 'models', 'transformers'],
    isPinned: false,
    status: 'active',
    createdAt: '2024-01-25T12:00:00Z',
    updatedAt: '2024-01-25T12:00:00Z',
  },
  {
    id: '12',
    title: 'Broken Link Example',
    url: 'https://old-site-gone.example.com',
    description: 'This is an example of a bookmark with a broken URL that is no longer accessible.',
    favicon: '',
    categoryId: '5',
    categoryName: 'Resources',
    tags: ['example'],
    isPinned: false,
    status: 'broken',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-26T18:00:00Z',
  },
];
