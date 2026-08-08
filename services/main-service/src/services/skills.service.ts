import { prisma } from "../config/database";

export interface TaxonomySkillDTO {
  skill_id: string;
  name: string;
  aliases: string[];
  category_id: string;
  category_name: string;
  parent_category_name: string | null;
}

/**
 * Both the Claude prompt and the Python worker need the full, current
 * skill taxonomy on every extraction request (they're both stateless and
 * have no DB access) — this is the single place that builds it, so the
 * two extraction paths never drift out of sync with each other.
 */
export async function getTaxonomyForExtraction(): Promise<TaxonomySkillDTO[]> {
  const skills = await prisma.skill.findMany({
    include: { category: { include: { parent: true } } },
  });

  return skills.map((skill) => ({
    skill_id: skill.id,
    name: skill.name,
    aliases: skill.aliases,
    category_id: skill.categoryId,
    category_name: skill.category.name,
    parent_category_name: skill.category.parent?.name ?? null,
  }));
}

export async function getFullTaxonomyTree() {
  return prisma.skillCategory.findMany({
    where: { parentId: null },
    orderBy: { order: "asc" },
    include: {
      children: {
        orderBy: { order: "asc" },
        include: { skills: { orderBy: { name: "asc" } } },
      },
    },
  });
}
