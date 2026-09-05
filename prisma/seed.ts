import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@pulse.app";
const DEMO_PASSWORD = "PulseDemo123!";

async function main() {
  console.log("Seeding Pulse demo data…");

  // Wipe existing data (idempotent local resets).
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.activity.deleteMany(),
    prisma.savedArticle.deleteMany(),
    prisma.learningSession.deleteMany(),
    prisma.learningResource.deleteMany(),
    prisma.goalMilestone.deleteMany(),
    prisma.goal.deleteMany(),
    prisma.skillProgress.deleteMany(),
    prisma.skill.deleteMany(),
    prisma.userPreference.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.session.deleteMany(),
    prisma.article.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      passwordHash,
      name: "Pujita Nitti",
      profile: {
        create: {
          bio: "Software developer building things that make growth measurable.",
          jobTitle: "Software Developer",
          company: "Conversify Technologies",
          location: "Mumbai, India",
        },
      },
      preferences: {
        create: {
          theme: "SYSTEM",
          interests: JSON.stringify(["AI", "SOFTWARE_ENGINEERING", "STARTUPS", "DESIGN"]),
        },
      },
    },
  });

  // ── Skills ────────────────────────────────────────────────────────
  const skillDefs = [
    { name: "React", category: "Frontend", currentLevel: 82 },
    { name: "Node.js", category: "Backend", currentLevel: 74 },
    { name: "PostgreSQL", category: "Database", currentLevel: 67 },
    { name: "System Design", category: "Architecture", currentLevel: 51 },
    { name: "TypeScript", category: "Frontend", currentLevel: 78 },
  ];

  for (const s of skillDefs) {
    const history = Array.from({ length: 6 }).map((_, i) => {
      const level = Math.max(10, s.currentLevel - (5 - i) * 7);
      const recordedAt = new Date();
      recordedAt.setDate(recordedAt.getDate() - (5 - i) * 14);
      return { level, recordedAt };
    });

    await prisma.skill.create({
      data: {
        userId: user.id,
        name: s.name,
        category: s.category,
        currentLevel: s.currentLevel,
        targetLevel: 100,
        history: { create: history },
      },
    });
  }

  // ── Goals ─────────────────────────────────────────────────────────
  const goalDefs = [
    {
      title: "Ship Sentinel v1.0",
      description: "Finish the rate-limiting gateway with full test coverage and a live dashboard.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      progress: 70,
      daysFromNow: 14,
      milestones: ["Core rate limiter", "Abuse detection rules", "NOC dashboard", "Test suite"],
    },
    {
      title: "Land a Software Developer role",
      description: "Land an SDE-I / full-stack role at a strong product company.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      progress: 55,
      daysFromNow: 45,
      milestones: ["Resume finalized", "Portfolio published", "10 applications sent", "First onsite"],
    },
    {
      title: "Complete System Design fundamentals",
      description: "Work through core distributed-systems concepts with applied notes.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      progress: 40,
      daysFromNow: 60,
      milestones: ["Read DDIA chapters 1–5", "Design 3 mock systems", "Mock interview"],
    },
    {
      title: "Publish a technical blog series",
      description: "Write about lessons learned building Lexicon, Circuit, and Sentinel.",
      status: "NOT_STARTED",
      priority: "LOW",
      progress: 0,
      daysFromNow: 90,
      milestones: ["Outline 5 posts", "Publish post 1"],
    },
  ];

  for (const g of goalDefs) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + g.daysFromNow);

    await prisma.goal.create({
      data: {
        userId: user.id,
        title: g.title,
        description: g.description,
        status: g.status,
        priority: g.priority,
        progress: g.progress,
        deadline,
        milestones: {
          create: g.milestones.map((title, i) => ({
            title,
            order: i,
            completed: i < Math.round((g.progress / 100) * g.milestones.length),
            completedAt: i < Math.round((g.progress / 100) * g.milestones.length) ? new Date() : null,
          })),
        },
      },
    });
  }

  // ── Learning resources ───────────────────────────────────────────
  const resourceDefs = [
    { title: "Designing Data-Intensive Applications", type: "BOOK", status: "LEARNING", progress: 45, rating: 5 },
    { title: "Advanced PostgreSQL Performance", type: "COURSE", status: "LEARNING", progress: 30, rating: 4 },
    { title: "Prisma Docs — Data Modeling", type: "DOCUMENTATION", status: "COMPLETED", progress: 100, rating: 5 },
    { title: "Patterns of Distributed Systems", type: "ARTICLE", status: "WANT_TO_LEARN", progress: 0, rating: null },
    { title: "React Server Components Deep Dive", type: "VIDEO", status: "COMPLETED", progress: 100, rating: 4 },
  ];

  const resources = [];
  for (const r of resourceDefs) {
    const resource = await prisma.learningResource.create({
      data: {
        userId: user.id,
        title: r.title,
        type: r.type,
        status: r.status,
        progress: r.progress,
        rating: r.rating,
        category: "Engineering",
      },
    });
    resources.push(resource);
  }

  for (let i = 0; i < 20; i++) {
    const occurredAt = new Date();
    occurredAt.setDate(occurredAt.getDate() - i * 1.5);
    const resource = resources[i % resources.length];
    await prisma.learningSession.create({
      data: {
        userId: user.id,
        resourceId: resource?.id,
        durationMinutes: 20 + ((i * 7) % 60),
        occurredAt,
      },
    });
  }

  // ── Articles + tags ───────────────────────────────────────────────
  const tagNames = ["AI", "Careers", "Databases", "Frontend", "Startups", "Security", "Design", "Product", "Business", "Cloud"];
  const tags = await Promise.all(
    tagNames.map((name) => prisma.tag.create({ data: { name } }))
  );
  const tagByName = Object.fromEntries(tags.map((t) => [t.name, t]));

  const articleDefs = [
    {
      title: "Why Postgres Keeps Winning the Database Debate",
      subtitle: "Extensions, reliability, and a decade of steady iteration.",
      source: "The Pulse Journal",
      author: "Editorial Team",
      category: "SOFTWARE_ENGINEERING",
      tags: ["Databases"],
      readingTimeMinutes: 6,
      content:
        "Postgres full-text search, native JSON, and a famously conservative release process have made it the default choice for teams that would rather not bet on a database vendor's roadmap. This piece traces how a decade of steady, unglamorous engineering beat flashier alternatives on the metric that actually matters: not losing your data.",
    },
    {
      title: "The Quiet Rise of Small, Focused AI Models",
      subtitle: "Efficiency is becoming the new scale.",
      source: "The Pulse Journal",
      author: "Editorial Team",
      category: "AI",
      tags: ["AI"],
      readingTimeMinutes: 8,
      content:
        "While headline model sizes keep climbing, a quieter trend is reshaping production AI: smaller, task-specific models that run cheaper and faster with only a modest accuracy tradeoff. For most applied use cases, that tradeoff is already worth making.",
    },
    {
      title: "What Hiring Managers Actually Look For in a Portfolio",
      subtitle: "It's rarely the tech stack.",
      source: "The Pulse Journal",
      author: "Editorial Team",
      category: "PRODUCT",
      tags: ["Careers"],
      readingTimeMinutes: 5,
      content:
        "Ask ten hiring managers what makes a portfolio project stand out and you'll hear the same thing nine times: evidence of real decisions under real constraints, not a checklist of frameworks. A project with one hard tradeoff explained clearly beats three projects with none.",
    },
    {
      title: "Rate Limiting at Scale: Lessons from Production Gateways",
      subtitle: "Token buckets, sliding windows, and abuse detection in practice.",
      source: "The Pulse Journal",
      author: "Editorial Team",
      category: "SOFTWARE_ENGINEERING",
      tags: ["Security", "Databases"],
      readingTimeMinutes: 9,
      content:
        "Every rate limiter looks simple in a diagram and gets complicated the moment real traffic hits it: clock skew across nodes, bursty legitimate users who look like abuse, and abuse that's deliberately shaped to look legitimate. This piece walks through the algorithm tradeoffs that matter once you're past the toy implementation.",
    },
    {
      title: "Seed Stage in 2026: What Investors Fund Now",
      subtitle: "Fewer decks, more working prototypes.",
      source: "The Pulse Journal",
      author: "Editorial Team",
      category: "STARTUPS",
      tags: ["Startups", "Business"],
      readingTimeMinutes: 7,
      content:
        "Seed investors say the biggest shift in 2026 isn't valuation — it's what founders are expected to show up with. A working prototype used by real people now counts for more than a polished narrative, which changes how early-stage engineering time gets spent.",
    },
    {
      title: "Designing Interfaces That Feel Calm",
      subtitle: "Restraint as a design principle.",
      source: "The Pulse Journal",
      author: "Editorial Team",
      category: "DESIGN",
      tags: ["Design", "Frontend"],
      readingTimeMinutes: 4,
      content:
        "Calm interfaces aren't the absence of design — they're the result of dozens of small decisions to leave things out. This piece looks at how restraint, more than any single visual trick, is what separates interfaces that feel effortless from ones that just look minimal.",
    },
    {
      title: "The Real Cost of Skipping Code Review",
      subtitle: "It shows up later, and it shows up bigger.",
      source: "The Pulse Journal",
      author: "Editorial Team",
      category: "SOFTWARE_ENGINEERING",
      tags: ["Careers"],
      readingTimeMinutes: 6,
      content:
        "Teams that skip code review to move faster usually do move faster — for about a quarter. This piece tracks what actually accumulates when review gets treated as optional: not bugs so much as knowledge silos that make every future change slower.",
    },
    {
      title: "How Prompt Injection Actually Works",
      subtitle: "A plain-English look at the most common LLM attack.",
      source: "The Pulse Journal",
      author: "Editorial Team",
      category: "CYBERSECURITY",
      tags: ["Security", "AI"],
      readingTimeMinutes: 7,
      content:
        "Prompt injection gets discussed in the abstract more often than it gets explained concretely. This piece breaks down, at a conceptual level, why instructions embedded in untrusted content can override a model's original task — and why the fix is architectural, not a better system prompt.",
    },
    {
      title: "The Architecture Behind Modern Rate-Limiting Gateways",
      subtitle: "What changes between a demo and a production system.",
      source: "The Pulse Journal",
      author: "Editorial Team",
      category: "SOFTWARE_ENGINEERING",
      tags: ["Databases", "Cloud"],
      readingTimeMinutes: 8,
      content:
        "A rate limiter that works in a demo and one that survives production traffic are barely the same system. This piece covers the distributed-state problem every gateway eventually has to solve: keeping counters consistent across nodes without turning every request into a database round trip.",
    },
    {
      title: "What Product Managers Wish Engineers Understood",
      subtitle: "Three recurring points of friction, from the PM side.",
      source: "The Pulse Journal",
      author: "Editorial Team",
      category: "PRODUCT",
      tags: ["Product", "Careers"],
      readingTimeMinutes: 5,
      content:
        "Engineering and product friction usually isn't about disagreement on the goal — it's about different defaults for how much uncertainty is acceptable before starting. This piece collects the three most common versions of that mismatch and how strong teams navigate them.",
    },
    {
      title: "Why Most A/B Tests Are Underpowered",
      subtitle: "The math nobody checks before shipping the experiment.",
      source: "The Pulse Journal",
      author: "Editorial Team",
      category: "BUSINESS",
      tags: ["Product", "Business"],
      readingTimeMinutes: 6,
      content:
        "Most A/B tests that report 'no significant difference' were never powered to detect the effect size that would have mattered commercially. This piece walks through the sample-size math teams skip, and what to do when you genuinely can't wait for enough traffic.",
    },
    {
      title: "The Case for Boring Technology",
      subtitle: "Innovation tokens and where to spend them.",
      source: "The Pulse Journal",
      author: "Editorial Team",
      category: "TECHNOLOGY",
      tags: ["Databases", "Cloud"],
      readingTimeMinutes: 7,
      content:
        "Every team has a limited budget of 'innovation tokens' — the number of unproven technology bets it can afford to make on one project. This piece makes the case for spending most of that budget on the actual product, and almost none of it on infrastructure choices.",
    },
  ];

  const ALL_ARTICLE_CATEGORIES = [
    "TECHNOLOGY",
    "AI",
    "STARTUPS",
    "SOFTWARE_ENGINEERING",
    "PRODUCT",
    "BUSINESS",
    "DESIGN",
    "CYBERSECURITY",
  ];
  const usedCategories = new Set(articleDefs.map((a) => a.category));
  const remainingCategories = ALL_ARTICLE_CATEGORIES.filter((c) => !usedCategories.has(c));
  for (const category of remainingCategories) {
    articleDefs.push({
      title: `${category.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}: What's Changing This Quarter`,
      subtitle: "A roundup of the developments worth tracking.",
      source: "The Pulse Journal",
      author: "Editorial Team",
      category,
      tags: [],
      readingTimeMinutes: 5,
      content:
        "A grounded look at what's actually shifted this quarter versus what's just gotten louder — separating durable trends from news-cycle noise.",
    });
  }

  const articles = [];
  for (const [i, a] of articleDefs.entries()) {
    const publishedAt = new Date();
    publishedAt.setDate(publishedAt.getDate() - i);
    const article = await prisma.article.create({
      data: {
        slug: a.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        title: a.title,
        subtitle: a.subtitle,
        source: a.source,
        author: a.author,
        category: a.category,
        url: "https://example.com/articles/" + i,
        content: a.content,
        readingTimeMinutes: a.readingTimeMinutes,
        publishedAt,
        tags: { connect: a.tags.map((t) => ({ id: tagByName[t]!.id })) },
      },
    });
    articles.push(article);
  }

  for (const article of articles.slice(0, 4)) {
    await prisma.savedArticle.create({
      data: {
        userId: user.id,
        articleId: article.id,
        isFavorite: Math.random() > 0.5,
        isRead: Math.random() > 0.3,
      },
    });
  }

  // ── Activity feed ────────────────────────────────────────────────
  const activityDefs = [
    { type: "GOAL_CREATED", title: "Created goal \"Ship Sentinel v1.0\"" },
    { type: "SKILL_UPDATED", title: "Updated React to 82%" },
    { type: "ARTICLE_SAVED", title: "Saved \"Rate Limiting at Scale\"" },
    { type: "MILESTONE_COMPLETED", title: "Completed milestone \"Core rate limiter\"" },
    { type: "RESOURCE_COMPLETED", title: "Finished \"Prisma Docs — Data Modeling\"" },
    { type: "LEARNING_SESSION_LOGGED", title: "Logged a 45-minute learning session" },
  ];

  for (const [i, a] of activityDefs.entries()) {
    const occurredAt = new Date();
    occurredAt.setDate(occurredAt.getDate() - i);
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: a.type,
        title: a.title,
        occurredAt,
      },
    });
  }

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "STREAK",
      title: "24-day learning streak",
      body: "You've logged learning activity for 24 days in a row. Keep it going.",
    },
  });

  console.log("Seed complete.");
  console.log(`Demo login → ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
