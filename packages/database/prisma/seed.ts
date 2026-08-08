/**
 * Scanza seed script.
 * Run with: npm run db:seed  (from repo root)
 *
 * This is intentionally the FIRST piece of the "issues → solutions" seeding
 * mechanism the platform needs: it seeds the skill taxonomy (the backbone
 * everything else — extraction, scoring, suggestions — depends on), a
 * super admin so the admin panel is usable on day one, and a demo client +
 * API key so SaaS integration can be tested immediately without going
 * through onboarding by hand.
 *
 * Safe to re-run: uses upserts everywhere.
 */
import { PrismaClient, AccountRole, AccountStatus, PlanTier } from "@prisma/client";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------
// Skill taxonomy: category -> subcategory -> skills[]
// This structure is what powers "Websites -> Frontend / Backend" style
// grouping in the UI. Extend this freely — it's the single source of truth.
// ---------------------------------------------------------------------
const TAXONOMY: Record<
  string,
  { icon: string; subcategories: Record<string, { icon: string; skills: string[] }> }
> = {
  "Software Development": {
    icon: "Code2",
    subcategories: {
      "Frontend Development": {
        icon: "LayoutTemplate",
        skills: [
          "React", "Next.js", "Vue.js", "Angular", "Svelte", "TypeScript",
          "JavaScript", "HTML5", "CSS3", "Tailwind CSS", "Redux", "SASS/SCSS",
        ],
      },
      "Backend Development": {
        icon: "Server",
        skills: [
          "Node.js", "Express.js", "Django", "Flask", "FastAPI", "Spring Boot",
          "Ruby on Rails", "Laravel", "GraphQL", "REST API Design", "Microservices",
        ],
      },
      "Mobile Development": {
        icon: "Smartphone",
        skills: ["React Native", "Flutter", "Swift", "Kotlin", "Android SDK", "iOS Development"],
      },
      "Systems & Languages": {
        icon: "Terminal",
        skills: ["Python", "Java", "C++", "C#", "Go", "Rust", "PHP", "C"],
      },
    },
  },
  "Data & AI": {
    icon: "BrainCircuit",
    subcategories: {
      "Data Science": {
        icon: "LineChart",
        skills: ["Pandas", "NumPy", "Scikit-learn", "Statistical Analysis", "R", "Data Visualization"],
      },
      "Machine Learning / AI": {
        icon: "Cpu",
        skills: ["TensorFlow", "PyTorch", "Natural Language Processing", "Computer Vision", "LLMs", "MLOps"],
      },
      "Data Engineering": {
        icon: "Database",
        skills: ["SQL", "PostgreSQL", "MongoDB", "Apache Spark", "Airflow", "ETL Pipelines", "Data Warehousing"],
      },
    },
  },
  "Cloud & DevOps": {
    icon: "Cloud",
    subcategories: {
      "Cloud Platforms": {
        icon: "CloudCog",
        skills: ["AWS", "Google Cloud Platform", "Microsoft Azure", "Vercel", "Cloudflare"],
      },
      "DevOps & Infrastructure": {
        icon: "GitBranch",
        skills: ["Docker", "Kubernetes", "CI/CD", "Terraform", "Jenkins", "GitHub Actions", "Linux Administration"],
      },
    },
  },
  "Design": {
    icon: "Palette",
    subcategories: {
      "UI/UX Design": {
        icon: "PenTool",
        skills: ["Figma", "Adobe XD", "Wireframing", "User Research", "Prototyping", "Design Systems"],
      },
      "Graphic & Visual": {
        icon: "Image",
        skills: ["Photoshop", "Illustrator", "Adobe After Effects", "Branding"],
      },
    },
  },
  "Business & Management": {
    icon: "Briefcase",
    subcategories: {
      "Project Management": {
        icon: "ClipboardList",
        skills: ["Agile", "Scrum", "Jira", "Kanban", "Risk Management", "Stakeholder Management"],
      },
      "Marketing & Growth": {
        icon: "Megaphone",
        skills: ["SEO", "Content Marketing", "Google Analytics", "Social Media Marketing", "Email Marketing"],
      },
      "Sales & Finance": {
        icon: "TrendingUp",
        skills: ["Salesforce", "Financial Modeling", "Negotiation", "Excel", "Forecasting"],
      },
    },
  },
  "Soft Skills": {
    icon: "Users",
    subcategories: {
      "Communication & Leadership": {
        icon: "MessagesSquare",
        skills: ["Leadership", "Public Speaking", "Team Collaboration", "Mentoring", "Conflict Resolution"],
      },
      "Problem Solving": {
        icon: "Puzzle",
        skills: ["Critical Thinking", "Analytical Thinking", "Time Management", "Adaptability"],
      },
    },
  },
};

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function seedTaxonomy() {
  console.log("🌱 Seeding skill taxonomy...");
  let categoryOrder = 0;

  for (const [parentName, parentData] of Object.entries(TAXONOMY)) {
    const parent = await prisma.skillCategory.upsert({
      where: { slug: slugify(parentName) },
      update: {},
      create: {
        name: parentName,
        slug: slugify(parentName),
        icon: parentData.icon,
        order: categoryOrder++,
      },
    });

    let subOrder = 0;
    for (const [subName, subData] of Object.entries(parentData.subcategories)) {
      const sub = await prisma.skillCategory.upsert({
        where: { slug: slugify(`${parentName}-${subName}`) },
        update: {},
        create: {
          name: subName,
          slug: slugify(`${parentName}-${subName}`),
          icon: subData.icon,
          order: subOrder++,
          parentId: parent.id,
        },
      });

      for (const skillName of subData.skills) {
        await prisma.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName, categoryId: sub.id },
        });
      }
    }
  }
  console.log("✅ Skill taxonomy seeded.");
}

async function seedPlatformSettings() {
  console.log("🌱 Seeding platform settings...");
  await prisma.platformSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  console.log("✅ Platform settings ready.");
}

async function seedSuperAdmin() {
  console.log("🌱 Seeding super admin account...");
  const email = process.env.SEED_ADMIN_EMAIL || "admin@scanza.dev";
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe!123";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.account.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      fullName: "Scanza Super Admin",
      role: AccountRole.SUPER_ADMIN,
      status: AccountStatus.ACTIVE,
      isEmailVerified: true,
    },
  });
  console.log(`✅ Super admin ready → ${email} / ${password} (CHANGE THIS PASSWORD)`);
}

async function seedDemoClient() {
  console.log("🌱 Seeding demo SaaS client + API key...");
  const client = await prisma.client.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      companyName: "Demo Hiring Co.",
      websiteUrl: "https://example.com",
      planTier: PlanTier.STARTER,
      monthlyQuota: 500,
      allowedOrigins: ["http://localhost:3000"],
    },
  });

  const rawKey = `scz_test_${crypto.randomBytes(24).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  await prisma.apiKey.upsert({
    where: { keyHash },
    update: {},
    create: {
      clientId: client.id,
      label: "Demo Sandbox Key",
      keyPrefix: rawKey.slice(0, 14),
      keyHash,
      isActive: true,
    },
  });

  console.log("✅ Demo client ready.");
  console.log(`   ⚠️  DEMO API KEY (save this, shown only once): ${rawKey}`);
}

async function main() {
  await seedPlatformSettings();
  await seedTaxonomy();
  await seedSuperAdmin();
  await seedDemoClient();
  console.log("\n🎉 Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
