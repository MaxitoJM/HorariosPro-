import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/utils/security.js";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@proyectonucleo.edu";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    return;
  }

  const passwordHash = await hashPassword("Admin12345*");

  await prisma.user.create({
    data: {
      nombre: "Admin",
      apellido: "Nucleo",
      email: adminEmail,
      passwordHash,
      rol: Role.admin,
      activo: true,
      verificado: true
    }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
