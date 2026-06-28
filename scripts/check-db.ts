import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const userCount = await prisma.user.count()
  const groceryCount = await prisma.groceryItem.count()
  const mealPlanCount = await prisma.mealPlan.count()
  const pantryCount = await prisma.pantryItem.count()
  const recipeCount = await prisma.recipe.count()

  console.log("=== DB Stats ===")
  console.log(`Users: ${userCount}`)
  console.log(`GroceryItems: ${groceryCount}`)
  console.log(`MealPlans: ${mealPlanCount}`)
  console.log(`PantryItems: ${pantryCount}`)
  console.log(`Recipes: ${recipeCount}`)

  // Check all users
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 10 })
  for (const u of users) {
    const gi = await prisma.groceryItem.count({ where: { userId: u.id } })
    const mp = await prisma.mealPlan.count({ where: { userId: u.id } })
    const pi = await prisma.pantryItem.count({ where: { userId: u.id } })
    console.log(`\nUser: ${u.email || u.phone || u.id.slice(0,8)} | GroceryItems: ${gi} | MealPlans: ${mp} | Pantry: ${pi}`)
    if (gi > 0) {
      const items = await prisma.groceryItem.findMany({ where: { userId: u.id } })
      items.forEach(i => console.log(`  GroceryItem: "${i.name}" checked=${i.checked}`))
    }
  }

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
