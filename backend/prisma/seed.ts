import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/utils/security.js";
import {
  DEFAULT_ACADEMIC_CONFIG,
  DEFAULT_SCHEDULING_RULES,
  DEFAULT_TIME_BLOCKS,
  DEFAULT_TIME_SLOT_GROUPS
} from "../src/modules/schedule-config/schedule-config.defaults.js";

const prisma = new PrismaClient();

function parseTimeToMinutes(value: string) {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

async function main() {
  const adminEmail = "admin@proyectonucleo.edu";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
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

  const groupsCount = await prisma.timeSlotGroup.count();
  if (groupsCount === 0) {
    const createdGroups = [];
    for (const group of DEFAULT_TIME_SLOT_GROUPS) {
      const created = await prisma.timeSlotGroup.create({ data: group });
      createdGroups.push(created);
    }

    for (const group of createdGroups) {
      const blocks = DEFAULT_TIME_BLOCKS[group.nombre as keyof typeof DEFAULT_TIME_BLOCKS] ?? [];
      for (const block of blocks) {
        await prisma.timeBlock.create({
          data: {
            grupoId: group.id,
            nombre: block.nombre,
            horaInicio: block.horaInicio,
            horaFin: block.horaFin,
            duracionMinutos: parseTimeToMinutes(block.horaFin) - parseTimeToMinutes(block.horaInicio),
            orden: block.orden,
            activo: block.activo
          }
        });
      }
    }
  }

  const rulesCount = await prisma.schedulingRule.count();
  if (rulesCount === 0) {
    await prisma.schedulingRule.createMany({ data: DEFAULT_SCHEDULING_RULES });
  }

  const academicConfigCount = await prisma.academicConfig.count();
  if (academicConfigCount === 0) {
    await prisma.academicConfig.create({ data: DEFAULT_ACADEMIC_CONFIG });
  }

  const teachersCount = await prisma.teacher.count();
  if (teachersCount === 0) {
    await prisma.teacher.create({
      data: {
        nombre: "Juan",
        apellido: "Perez",
        email: "juan.perez@unbosque.edu.co",
        departamento: "Matematicas",
        titulo: "Dr.",
        maxHorasSemana: 20,
        activo: true,
        availabilities: {
          create: [
            { diaSemana: "lunes", horaInicio: "07:00", horaFin: "18:00", activo: true },
            { diaSemana: "martes", horaInicio: "07:00", horaFin: "18:00", activo: true },
            { diaSemana: "miercoles", horaInicio: "07:00", horaFin: "18:00", activo: true },
            { diaSemana: "jueves", horaInicio: "07:00", horaFin: "14:00", activo: true }
          ]
        },
        assignableCourses: {
          create: [
            { codigoCurso: "MAT-101", nombreCurso: "Calculo I", activo: true },
            { codigoCurso: "MAT-201", nombreCurso: "Calculo II", activo: true },
            { codigoCurso: "MAT-301", nombreCurso: "Calculo III", activo: true }
          ]
        }
      }
    });

    await prisma.teacher.create({
      data: {
        nombre: "Maria",
        apellido: "Gonzalez",
        email: "maria.gonzalez@unbosque.edu.co",
        departamento: "Fisica",
        titulo: "Dra.",
        maxHorasSemana: 18,
        activo: true,
        availabilities: {
          create: [
            { diaSemana: "lunes", horaInicio: "07:00", horaFin: "12:00", activo: true },
            { diaSemana: "martes", horaInicio: "07:00", horaFin: "18:00", activo: true },
            { diaSemana: "jueves", horaInicio: "07:00", horaFin: "18:00", activo: true }
          ]
        },
        assignableCourses: {
          create: [
            { codigoCurso: "FIS-101", nombreCurso: "Fisica I", activo: true },
            { codigoCurso: "FIS-201", nombreCurso: "Fisica II", activo: true }
          ]
        }
      }
    });

    await prisma.teacher.create({
      data: {
        nombre: "Carlos",
        apellido: "Rodriguez",
        email: "carlos.rodriguez@unbosque.edu.co",
        departamento: "Quimica",
        titulo: "Dr.",
        maxHorasSemana: 24,
        activo: true,
        availabilities: {
          create: [
            { diaSemana: "lunes", horaInicio: "08:00", horaFin: "17:00", activo: true },
            { diaSemana: "miercoles", horaInicio: "08:00", horaFin: "17:00", activo: true },
            { diaSemana: "viernes", horaInicio: "08:00", horaFin: "12:00", activo: true }
          ]
        },
        assignableCourses: {
          create: [
            { codigoCurso: "QUI-101", nombreCurso: "Quimica General", activo: true },
            { codigoCurso: "QUI-202", nombreCurso: "Quimica Organica", activo: true }
          ]
        }
      }
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
