import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, phone: true, name: true, passwordHash: true },
    orderBy: { createdAt: "desc" },
  })
  for (const u of users) {
    console.log(`${u.email || u.phone || u.id.slice(0,8)} | hash=${u.passwordHash ? u.passwordHash.slice(0,40)+"..." : "NULL"}`)
  }
  await prisma.$disconnect()
}

main().catch(console.error)