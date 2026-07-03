import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, phone: true, name: true },
    orderBy: { createdAt: "desc" },
  })
  for (const u of users) {
    const accounts = await prisma.account.findMany({ where: { userId: u.id }, select: { provider: true } })
    const providers = accounts.map(a => a.provider).join(", ")
    console.log(`${u.email || u.phone || u.id.slice(0,8)} | name="${u.name}" | providers=[${providers}]`)
  }
  await prisma.$disconnect()
}
main().catch(console.error)