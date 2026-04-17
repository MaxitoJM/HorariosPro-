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

  const classroomsCount = await prisma.classroom.count();
  if (classroomsCount === 0) {
    await prisma.classroom.create({
      data: {
        codigo: "A-301",
        edificio: "Edificio A",
        piso: "3",
        tipo: "aula",
        capacidad: 35,
        equipamiento: ["Proyector", "Pizarra", "Aire acondicionado"],
        activo: true,
        availabilities: {
          create: [
            { diaSemana: "lunes", horaInicio: "07:00", horaFin: "18:00", activo: true },
            { diaSemana: "martes", horaInicio: "07:00", horaFin: "18:00", activo: true },
            { diaSemana: "miercoles", horaInicio: "07:00", horaFin: "18:00", activo: true },
            { diaSemana: "jueves", horaInicio: "07:00", horaFin: "18:00", activo: true },
            { diaSemana: "viernes", horaInicio: "07:00", horaFin: "18:00", activo: true }
          ]
        }
      }
    });

    await prisma.classroom.create({
      data: {
        codigo: "B-LAB-01",
        edificio: "Edificio B",
        piso: "1",
        tipo: "laboratorio",
        capacidad: 24,
        equipamiento: ["Mesas de laboratorio", "Extractor", "Microscopios"],
        activo: true,
        availabilities: {
          create: [
            { diaSemana: "lunes", horaInicio: "08:00", horaFin: "17:00", activo: true },
            { diaSemana: "martes", horaInicio: "08:00", horaFin: "17:00", activo: true },
            { diaSemana: "jueves", horaInicio: "08:00", horaFin: "17:00", activo: true }
          ]
        }
      }
    });

    await prisma.classroom.create({
      data: {
        codigo: "C-AUD-01",
        edificio: "Edificio C",
        piso: "1",
        tipo: "auditorio",
        capacidad: 120,
        equipamiento: ["Video beam", "Sistema de sonido", "Microfonos"],
        activo: true,
        availabilities: {
          create: [
            { diaSemana: "lunes", horaInicio: "07:00", horaFin: "20:00", activo: true },
            { diaSemana: "miercoles", horaInicio: "07:00", horaFin: "20:00", activo: true },
            { diaSemana: "viernes", horaInicio: "07:00", horaFin: "20:00", activo: true }
          ]
        }
      }
    });
  }

  const coursesCount = await prisma.course.count();
  if (coursesCount === 0) {
    const [juan, maria, carlos] = await Promise.all([
      prisma.teacher.findUnique({ where: { email: "juan.perez@unbosque.edu.co" } }),
      prisma.teacher.findUnique({ where: { email: "maria.gonzalez@unbosque.edu.co" } }),
      prisma.teacher.findUnique({ where: { email: "carlos.rodriguez@unbosque.edu.co" } })
    ]);

    const [aula301, laboratorio, auditorio] = await Promise.all([
      prisma.classroom.findUnique({ where: { codigo: "A-301" } }),
      prisma.classroom.findUnique({ where: { codigo: "B-LAB-01" } }),
      prisma.classroom.findUnique({ where: { codigo: "C-AUD-01" } })
    ]);

    await prisma.course.create({
      data: {
        codigo: "MAT-101",
        nombre: "Calculo I",
        departamento: "Matematicas",
        creditos: 4,
        sesionesPorSemana: 3,
        duracionMinutos: 90,
        activo: true,
        sections: {
          create: [
            {
              codigoSeccion: "A",
              teacherId: juan?.id,
              classroomId: aula301?.id,
              capacidad: 30,
              inscritos: 28,
              horarioResumen: "Lun-Mie-Vie 08:00-09:30",
              activo: true
            },
            {
              codigoSeccion: "B",
              teacherId: juan?.id,
              classroomId: auditorio?.id,
              capacidad: 40,
              inscritos: 24,
              horarioResumen: "Mar-Jue 10:00-11:30",
              activo: true
            }
          ]
        }
      }
    });

    await prisma.course.create({
      data: {
        codigo: "FIS-101",
        nombre: "Fisica I",
        departamento: "Fisica",
        creditos: 4,
        sesionesPorSemana: 2,
        duracionMinutos: 120,
        activo: true,
        sections: {
          create: [
            {
              codigoSeccion: "A",
              teacherId: maria?.id,
              classroomId: aula301?.id,
              capacidad: 30,
              inscritos: 19,
              horarioResumen: "Mar-Jue 07:00-09:00",
              activo: true
            }
          ]
        }
      }
    });

    await prisma.course.create({
      data: {
        codigo: "QUI-101",
        nombre: "Quimica General",
        departamento: "Quimica",
        creditos: 3,
        sesionesPorSemana: 2,
        duracionMinutos: 120,
        activo: true,
        sections: {
          create: [
            {
              codigoSeccion: "LAB",
              teacherId: carlos?.id,
              classroomId: laboratorio?.id,
              capacidad: 20,
              inscritos: 16,
              horarioResumen: "Lun-Mie 10:00-12:00",
              activo: true
            }
          ]
        }
      }
    });
  }

  const meetingsCount = await prisma.sectionScheduleMeeting.count();
  if (meetingsCount === 0) {
    const [calculoA, fisicaA, quimicaLab] = await Promise.all([
      prisma.courseSection.findFirst({ where: { codigoSeccion: "A", course: { codigo: "MAT-101" } } }),
      prisma.courseSection.findFirst({ where: { codigoSeccion: "A", course: { codigo: "FIS-101" } } }),
      prisma.courseSection.findFirst({ where: { codigoSeccion: "LAB", course: { codigo: "QUI-101" } } })
    ]);

    const [morning1, morning2, morning3] = await Promise.all([
      prisma.timeBlock.findFirst({ where: { nombre: "Bloque 1" } }),
      prisma.timeBlock.findFirst({ where: { nombre: "Bloque 2" } }),
      prisma.timeBlock.findFirst({ where: { nombre: "Bloque 3" } })
    ]);

    const [aula301, laboratorio] = await Promise.all([
      prisma.classroom.findUnique({ where: { codigo: "A-301" } }),
      prisma.classroom.findUnique({ where: { codigo: "B-LAB-01" } })
    ]);

    if (calculoA && morning1 && aula301) {
      await prisma.sectionScheduleMeeting.createMany({
        data: [
          { sectionId: calculoA.id, diaSemana: "lunes", timeBlockId: morning1.id, classroomId: aula301.id },
          { sectionId: calculoA.id, diaSemana: "miercoles", timeBlockId: morning1.id, classroomId: aula301.id },
          { sectionId: calculoA.id, diaSemana: "viernes", timeBlockId: morning1.id, classroomId: aula301.id }
        ]
      });

      await prisma.courseSection.update({
        where: { id: calculoA.id },
        data: {
          horarioResumen: "lun 07:00-08:30 | mie 07:00-08:30 | vie 07:00-08:30"
        }
      });
    }

    if (fisicaA && morning2 && aula301) {
      await prisma.sectionScheduleMeeting.createMany({
        data: [
          { sectionId: fisicaA.id, diaSemana: "martes", timeBlockId: morning2.id, classroomId: aula301.id },
          { sectionId: fisicaA.id, diaSemana: "jueves", timeBlockId: morning2.id, classroomId: aula301.id }
        ]
      });

      await prisma.courseSection.update({
        where: { id: fisicaA.id },
        data: {
          horarioResumen: "mar 08:45-10:15 | jue 08:45-10:15"
        }
      });
    }

    if (quimicaLab && morning3 && laboratorio) {
      await prisma.sectionScheduleMeeting.createMany({
        data: [
          { sectionId: quimicaLab.id, diaSemana: "lunes", timeBlockId: morning3.id, classroomId: laboratorio.id },
          { sectionId: quimicaLab.id, diaSemana: "miercoles", timeBlockId: morning3.id, classroomId: laboratorio.id }
        ]
      });

      await prisma.courseSection.update({
        where: { id: quimicaLab.id },
        data: {
          horarioResumen: "lun 10:30-12:00 | mie 10:30-12:00"
        }
      });
    }
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
