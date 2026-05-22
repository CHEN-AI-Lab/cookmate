import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const userId = "cmpdnhk6k0000wbaortgwovct";

const recipes = await p.recipe.findMany({ where: { userId }, select: { id: true, title: true, starred: true } });
console.log("Recipes:", recipes.length);
for (const r of recipes) {
  console.log(`  id=${r.id} (${typeof r.id}) "${r.title}" starred=${r.starred}`);
}

await p.$disconnect();