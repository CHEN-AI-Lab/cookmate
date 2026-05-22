const { PrismaClient } = require("@prisma/client");

async function main() {
  const p = new PrismaClient();
  const userId = "cmpdnhk6k0000wbaortgwovct";
  
  const recipes = await p.recipe.findMany({ where: { userId }, select: { id: true, title: true, starred: true } });
  console.log("Recipes:", recipes.length);
  for (const r of recipes) {
    console.log(`  id=${r.id} (${typeof r.id}) "${r.title}" starred=${r.starred}`);
    
    const found = await p.recipe.findFirst({ where: { id: r.id, userId } });
    console.log(`  findFirst with number: ${found ? "found" : "NOT FOUND"}`);
    
    const foundStr = await p.recipe.findFirst({ where: { id: String(r.id), userId } });
    console.log(`  findFirst with string: ${foundStr ? "found" : "NOT FOUND"}`);
  }
  
  await p.$disconnect();
}
main();