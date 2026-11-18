import { PrismaClient, Role, Plan, BookmarkStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.bookmark.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // ═══════════════════════════════════════════════
  // Tenant 1: Acme Dev Team
  // ═══════════════════════════════════════════════
  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'Acme Dev Team',
      slug: 'acme-dev',
      plan: Plan.PRO,
      maxBookmarks: 5000,
      maxMembers: 50,
      themeConfig: {
        colorScheme: 'system',
        accentColor: 'hsl(222, 80%, 56%)',
        backgroundColor: 'hsl(220, 16%, 98%)',
        textColor: 'hsl(220, 20%, 14%)',
        borderColor: 'hsl(220, 12%, 90%)',
        borderRadius: 10,
        cardSpacing: 16,
        layout: 'grid',
        preset: 'default',
      },
    },
  });
  console.log(`  ✅ Tenant: ${tenant1.name} (${tenant1.slug})`);

  const password = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      email: 'leon@bookmarks.dev',
      name: 'Leon Chen',
      password,
      role: Role.ADMIN,
    },
  });

  const user1b = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      email: 'alice@bookmarks.dev',
      name: 'Alice Wang',
      password,
      role: Role.EDITOR,
    },
  });
  console.log(`  ✅ Users: ${user1.name}, ${user1b.name}`);

  // Categories for Tenant 1
  const catDev = await prisma.category.create({
    data: { tenantId: tenant1.id, name: 'Development', icon: 'code', sortOrder: 0 },
  });
  const catFrontend = await prisma.category.create({
    data: { tenantId: tenant1.id, name: 'Frontend', icon: 'layout', parentId: catDev.id, sortOrder: 0 },
  });
  const catBackend = await prisma.category.create({
    data: { tenantId: tenant1.id, name: 'Backend', icon: 'server', parentId: catDev.id, sortOrder: 1 },
  });
  const catDevOps = await prisma.category.create({
    data: { tenantId: tenant1.id, name: 'DevOps', icon: 'cloud', parentId: catDev.id, sortOrder: 2 },
  });
  const catDesign = await prisma.category.create({
    data: { tenantId: tenant1.id, name: 'Design', icon: 'palette', sortOrder: 1 },
  });
  const catUIKits = await prisma.category.create({
    data: { tenantId: tenant1.id, name: 'UI Kits', icon: 'component', parentId: catDesign.id, sortOrder: 0 },
  });
  const catInspiration = await prisma.category.create({
    data: { tenantId: tenant1.id, name: 'Inspiration', icon: 'sparkles', parentId: catDesign.id, sortOrder: 1 },
  });
  const catProductivity = await prisma.category.create({
    data: { tenantId: tenant1.id, name: 'Productivity', icon: 'zap', sortOrder: 2 },
  });
  const catAI = await prisma.category.create({
    data: { tenantId: tenant1.id, name: 'AI & Machine Learning', icon: 'brain', sortOrder: 3 },
  });
  const catResources = await prisma.category.create({
    data: { tenantId: tenant1.id, name: 'Resources', icon: 'book-open', sortOrder: 4 },
  });
  const catDocs = await prisma.category.create({
    data: { tenantId: tenant1.id, name: 'Documentation', icon: 'file-text', parentId: catResources.id, sortOrder: 0 },
  });
  console.log(`  ✅ Categories: 11 created`);

  // Bookmarks for Tenant 1
  const bookmarks1 = [
    { title: 'GitHub', url: 'https://github.com', description: 'The world\'s leading software development platform. Build, ship, and maintain your software with collaboration tools, code review, and project management.', categoryId: catDev.id, tags: ['git', 'collaboration', 'open-source'], isPinned: true, sortOrder: 0 },
    { title: 'npm - Node Package Manager', url: 'https://www.npmjs.com', description: 'The official package registry for JavaScript. Find, install, and publish npm packages.', categoryId: catFrontend.id, tags: ['javascript', 'packages', 'node'], isPinned: false, sortOrder: 1 },
    { title: 'Figma', url: 'https://www.figma.com', description: 'The collaborative interface design tool. Create, prototype, and hand off designs with real-time collaboration.', categoryId: catDesign.id, tags: ['design', 'ui', 'prototype', 'collaboration'], isPinned: true, sortOrder: 0 },
    { title: 'ChatGPT', url: 'https://chat.openai.com', description: 'An AI language model by OpenAI. Get answers, brainstorm ideas, write code, and explore creative solutions.', categoryId: catAI.id, tags: ['ai', 'chat', 'openai', 'productivity'], isPinned: true, sortOrder: 0 },
    { title: 'Vercel', url: 'https://vercel.com', description: 'The platform for frontend developers. Deploy web projects with zero configuration, automatic SSL, and global CDN.', categoryId: catDevOps.id, tags: ['hosting', 'deployment', 'nextjs', 'serverless'], isPinned: false, sortOrder: 2 },
    { title: 'Tailwind CSS', url: 'https://tailwindcss.com', description: 'A utility-first CSS framework packed with classes that can be composed to build any design directly in your markup.', categoryId: catFrontend.id, tags: ['css', 'framework', 'utility-first', 'design'], isPinned: false, sortOrder: 3 },
    { title: 'Notion', url: 'https://www.notion.so', description: 'All-in-one workspace for notes, tasks, wikis, and databases. Organize everything your team needs in one beautiful tool.', categoryId: catProductivity.id, tags: ['notes', 'wiki', 'project-management', 'docs'], isPinned: false, sortOrder: 0 },
    { title: 'Dribbble', url: 'https://dribbble.com', description: 'Discover the world\'s top designers and creatives. Browse design inspiration and connect with the creative community.', categoryId: catInspiration.id, tags: ['design', 'inspiration', 'portfolio', 'creative'], isPinned: false, sortOrder: 0 },
    { title: 'MDN Web Docs', url: 'https://developer.mozilla.org', description: 'The definitive resource for web developers. Comprehensive documentation for HTML, CSS, JavaScript, and Web APIs.', categoryId: catDocs.id, tags: ['docs', 'reference', 'web', 'mozilla'], isPinned: false, sortOrder: 0 },
    { title: 'Linear', url: 'https://linear.app', description: 'Streamline software projects, sprints, tasks, and bug tracking. Designed for high-performance teams.', categoryId: catProductivity.id, tags: ['project-management', 'issue-tracker', 'agile'], isPinned: false, sortOrder: 1 },
    { title: 'Hugging Face', url: 'https://huggingface.co', description: 'The AI community building the future. Discover, train, and deploy state-of-the-art machine learning models.', categoryId: catAI.id, tags: ['ai', 'ml', 'models', 'transformers'], isPinned: false, sortOrder: 1 },
    { title: 'Next.js', url: 'https://nextjs.org', description: 'The React framework for production. Hybrid static & server rendering, TypeScript support, smart bundling, route pre-fetching.', categoryId: catFrontend.id, tags: ['react', 'framework', 'ssr', 'fullstack'], isPinned: false, sortOrder: 4 },
    { title: 'Docker', url: 'https://www.docker.com', description: 'Accelerated container application development. Build, share, and run containers with Docker Desktop and Docker Hub.', categoryId: catDevOps.id, tags: ['containers', 'devops', 'virtualization'], isPinned: false, sortOrder: 3 },
    { title: 'Prisma', url: 'https://www.prisma.io', description: 'Next-generation Node.js and TypeScript ORM. Auto-generated and type-safe database client for PostgreSQL, MySQL, SQLite.', categoryId: catBackend.id, tags: ['orm', 'database', 'typescript', 'node'], isPinned: false, sortOrder: 0 },
    { title: 'Stripe', url: 'https://stripe.com', description: 'Financial infrastructure for the internet. Accept payments, send payouts, and manage your business online.', categoryId: catBackend.id, tags: ['payments', 'fintech', 'api'], isPinned: false, sortOrder: 1 },
  ];

  for (const bm of bookmarks1) {
    let faviconUrl: string | undefined;
    try {
      const url = new URL(bm.url);
      faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
    } catch {}

    await prisma.bookmark.create({
      data: {
        tenantId: tenant1.id,
        createdById: user1.id,
        title: bm.title,
        url: bm.url,
        description: bm.description,
        categoryId: bm.categoryId,
        tags: bm.tags,
        isPinned: bm.isPinned,
        sortOrder: bm.sortOrder,
        faviconUrl,
        status: BookmarkStatus.ACTIVE,
      },
    });
  }
  console.log(`  ✅ Bookmarks: ${bookmarks1.length} created for ${tenant1.name}`);

  // ═══════════════════════════════════════════════
  // Tenant 2: Creative Studio
  // ═══════════════════════════════════════════════
  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Creative Studio',
      slug: 'creative-studio',
      plan: Plan.FREE,
      themeConfig: {
        colorScheme: 'light',
        accentColor: 'hsl(340, 60%, 65%)',
        backgroundColor: 'hsl(340, 30%, 97%)',
        textColor: 'hsl(220, 20%, 14%)',
        borderColor: 'hsl(340, 20%, 90%)',
        borderRadius: 14,
        cardSpacing: 20,
        layout: 'grid',
        preset: 'sakura',
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      tenantId: tenant2.id,
      email: 'designer@creative.dev',
      name: 'Mia Park',
      password,
      role: Role.ADMIN,
    },
  });

  const catDesign2 = await prisma.category.create({
    data: { tenantId: tenant2.id, name: 'Design Tools', icon: 'pen-tool', sortOrder: 0 },
  });
  const catTypography = await prisma.category.create({
    data: { tenantId: tenant2.id, name: 'Typography', icon: 'type', sortOrder: 1 },
  });
  const catColors = await prisma.category.create({
    data: { tenantId: tenant2.id, name: 'Colors & Palettes', icon: 'droplet', sortOrder: 2 },
  });
  const catStock = await prisma.category.create({
    data: { tenantId: tenant2.id, name: 'Stock Resources', icon: 'image', sortOrder: 3 },
  });

  const bookmarks2 = [
    { title: 'Figma', url: 'https://www.figma.com', description: 'The collaborative interface design tool.', categoryId: catDesign2.id, tags: ['design', 'ui'], isPinned: true },
    { title: 'Adobe Creative Cloud', url: 'https://www.adobe.com/creativecloud.html', description: 'Photography, video, design, UI/UX, and more.', categoryId: catDesign2.id, tags: ['adobe', 'creative'], isPinned: false },
    { title: 'Google Fonts', url: 'https://fonts.google.com', description: 'Free, open-source font families for web and desktop.', categoryId: catTypography.id, tags: ['fonts', 'typography', 'google'], isPinned: true },
    { title: 'Coolors', url: 'https://coolors.co', description: 'The super fast color palette generator.', categoryId: catColors.id, tags: ['colors', 'palette', 'generator'], isPinned: false },
    { title: 'Unsplash', url: 'https://unsplash.com', description: 'Beautiful free images & pictures contributed by creators.', categoryId: catStock.id, tags: ['photos', 'stock', 'free'], isPinned: false },
    { title: 'Pexels', url: 'https://www.pexels.com', description: 'Free stock photos, royalty free images & videos shared by creators.', categoryId: catStock.id, tags: ['photos', 'videos', 'stock'], isPinned: false },
  ];

  for (const bm of bookmarks2) {
    let faviconUrl: string | undefined;
    try {
      const url = new URL(bm.url);
      faviconUrl = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
    } catch {}

    await prisma.bookmark.create({
      data: {
        tenantId: tenant2.id,
        createdById: user2.id,
        title: bm.title,
        url: bm.url,
        description: bm.description,
        categoryId: bm.categoryId,
        tags: bm.tags,
        isPinned: bm.isPinned,
        faviconUrl,
        status: BookmarkStatus.ACTIVE,
      },
    });
  }
  console.log(`  ✅ Tenant: ${tenant2.name} with ${bookmarks2.length} bookmarks`);

  console.log('\n✨ Seed completed!');
  console.log('\nDemo accounts:');
  console.log('  📧 leon@bookmarks.dev / password123  (Acme Dev Team - Admin)');
  console.log('  📧 alice@bookmarks.dev / password123  (Acme Dev Team - Editor)');
  console.log('  📧 designer@creative.dev / password123  (Creative Studio - Admin)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
