import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 10 })
  for (const u of users) {
    console.log(`\n=== User ${u.email || u.phone || u.id.slice(0,8)} ===`)
    console.log(`ID: ${u.id}`)
    console.log(`Created: ${u.createdAt}`)
    console.log(`Onboarding: ${u.onboardingCompleted}`)
    
    const groceryItems = await prisma.groceryItem.findMany({ where: { userId: u.id } })
    console.log(`GroceryItems (${groceryItems.length}):`)
    groceryItems.forEach(i => console.log(`  [${i.id.slice(0,8)}] "${i.name}" checked=${i.checked} created=${i.createdAt}`))

    const mealPlans = await prisma.mealPlan.findMany({ 
      where: { userId: u.id },
      include: { slots: { include: { recipe: { select: { id: true, title: true, ingredients: true } } } } },
    })
    console.log(`MealPlans (${mealPlans.length}):`)
    for (const mp of mealPlans) {
      console.log(`  Week: ${mp.weekStart}, Slots: ${mp.slots.length}`)
      for (const s of mp.slots) {
        console.log(`    Day ${s.dayOfWeek} ${s.mealType}: recipe=${s.recipe?.title || 'NONE'} (ingredients: ${s.recipe?.ingredients?.substring(0,80) || 'NONE'})`)
      }
    }

    const pantryItems = await prisma.pantryItem.findMany({ where: { userId: u.id } })
    console.log(`PantryItems (${pantryItems.length}):`)
    pantryItems.forEach(i => console.log(`  "${i.name}" cat=${i.category}`))
  }

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
