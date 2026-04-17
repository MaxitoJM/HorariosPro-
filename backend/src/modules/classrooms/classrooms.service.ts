import { HttpError } from "../../utils/http-error.js";

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
  userId?: string | null;
};

type ClassroomInput = {
  codigo: string;
  edificio: string;
  piso?: string;
  tipo: "aula" | "laboratorio" | "auditorio" | "sala_computo" | "otro";
  capacidad: number;
  equipamiento: string[];
  activo?: boolean;
};

type AvailabilityInput = {
  diaSemana: "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";
  horaInicio: string;
  horaFin: string;
  activo?: boolean;
};

function parseTimeToMinutes(value: string) {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export class ClassroomsService {
  constructor(private readonly prisma: any) {}

  async listClassrooms() {
    const items = await this.prisma.classroom.findMany({
      include: {
        sections: {
          include: {
            course: true
          },
          orderBy: { codigoSeccion: "asc" }
        },
        availabilities: {
          orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }]
        }
      },
      orderBy: [{ edificio: "asc" }, { codigo: "asc" }]
    });

    return items.map((item: any) => this.toClassroomSummary(item));
  }

  async getClassroomById(id: string) {
    const item = await this.prisma.classroom.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            course: true
          },
          orderBy: { codigoSeccion: "asc" }
        },
        availabilities: {
          orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }]
        }
      }
    });

    if (!item) {
      throw new HttpError(404, "Aula no encontrada", "CLASSROOM_NOT_FOUND");
    }

    return this.toClassroomSummary(item);
  }

  async createClassroom(input: ClassroomInput, meta: RequestMeta) {
    await this.ensureUniqueCode(input.codigo);

    const item = await this.prisma.classroom.create({
      data: {
        codigo: input.codigo,
        edificio: input.edificio,
        piso: input.piso || null,
        tipo: input.tipo,
        capacidad: input.capacidad,
        equipamiento: input.equipamiento,
        activo: input.activo ?? true
      },
      include: {
        sections: {
          include: { course: true }
        },
        availabilities: true
      }
    });

    await this.createAuditLog(meta.userId ?? null, "classrooms.create", meta, { classroomId: item.id });
    return this.toClassroomSummary(item);
  }

  async updateClassroom(id: string, input: ClassroomInput, meta: RequestMeta) {
    await this.requireClassroom(id);
    await this.ensureUniqueCode(input.codigo, id);

    const item = await this.prisma.classroom.update({
      where: { id },
      data: {
        codigo: input.codigo,
        edificio: input.edificio,
        piso: input.piso || null,
        tipo: input.tipo,
        capacidad: input.capacidad,
        equipamiento: input.equipamiento,
        activo: input.activo ?? true
      },
      include: {
        sections: {
          include: { course: true }
        },
        availabilities: {
          orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }]
        }
      }
    });

    await this.createAuditLog(meta.userId ?? null, "classrooms.update", meta, { classroomId: id });
    return this.toClassroomSummary(item);
  }

  async deleteClassroom(id: string, meta: RequestMeta) {
    const classroom = await this.requireClassroom(id);

    if (classroom.sections.length > 0) {
      throw new HttpError(
        409,
        "No puedes eliminar un aula que ya esta asociada a secciones. Reasigna o elimina esas secciones primero.",
        "CLASSROOM_HAS_SECTIONS"
      );
    }

    await this.prisma.classroom.delete({ where: { id } });
    await this.createAuditLog(meta.userId ?? null, "classrooms.delete", meta, { classroomId: id });
  }

  async updateClassroomAvailability(id: string, availability: AvailabilityInput[], meta: RequestMeta) {
    await this.requireClassroom(id);
    this.validateAvailability(availability);

    await this.prisma.$transaction(async (tx: any) => {
      await tx.classroomAvailability.deleteMany({ where: { classroomId: id } });

      if (availability.length > 0) {
        await tx.classroomAvailability.createMany({
          data: availability.map((item) => ({
            classroomId: id,
            diaSemana: item.diaSemana,
            horaInicio: item.horaInicio,
            horaFin: item.horaFin,
            activo: item.activo ?? true
          }))
        });
      }
    });

    await this.createAuditLog(meta.userId ?? null, "classrooms.availability.update", meta, { classroomId: id });
    return this.getClassroomById(id);
  }

  private async requireClassroom(id: string) {
    const item = await this.prisma.classroom.findUnique({
      where: { id },
      include: {
        sections: true
      }
    });

    if (!item) {
      throw new HttpError(404, "Aula no encontrada", "CLASSROOM_NOT_FOUND");
    }

    return item;
  }

  private async ensureUniqueCode(codigo: string, excludeId?: string) {
    const existing = await this.prisma.classroom.findFirst({
      where: {
        codigo,
        ...(excludeId ? { id: { not: excludeId } } : {})
      }
    });

    if (existing) {
      throw new HttpError(409, "Ya existe un aula con ese codigo", "CLASSROOM_CODE_TAKEN");
    }
  }

  private validateAvailability(availability: AvailabilityInput[]) {
    for (const item of availability) {
      if (parseTimeToMinutes(item.horaFin) <= parseTimeToMinutes(item.horaInicio)) {
        throw new HttpError(400, "La disponibilidad del aula debe tener una hora fin posterior a la hora inicio", "INVALID_CLASSROOM_AVAILABILITY");
      }
    }

    const grouped = new Map<string, AvailabilityInput[]>();
    for (const item of availability) {
      const items = grouped.get(item.diaSemana) ?? [];
      items.push(item);
      grouped.set(item.diaSemana, items);
    }

    for (const items of grouped.values()) {
      const sorted = [...items].sort((a, b) => parseTimeToMinutes(a.horaInicio) - parseTimeToMinutes(b.horaInicio));
      for (let index = 1; index < sorted.length; index += 1) {
        const previous = sorted[index - 1]!;
        const current = sorted[index]!;
        if (parseTimeToMinutes(current.horaInicio) < parseTimeToMinutes(previous.horaFin)) {
          throw new HttpError(
            400,
            "La disponibilidad del aula no puede tener rangos solapados en el mismo dia",
            "CLASSROOM_AVAILABILITY_OVERLAP"
          );
        }
      }
    }
  }

  private toClassroomSummary(classroom: {
    id: string;
    codigo: string;
    edificio: string;
    piso: string | null;
    tipo: string;
    capacidad: number;
    equipamiento: unknown;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
    sections: Array<{
      id: string;
      codigoSeccion: string;
      capacidad: number;
      inscritos: number;
      course?: { codigo: string; nombre: string } | null;
    }>;
    availabilities: Array<{
      id: string;
      diaSemana: string;
      horaInicio: string;
      horaFin: string;
      activo: boolean;
    }>;
  }) {
    return {
      ...classroom,
      equipamiento: Array.isArray(classroom.equipamiento) ? classroom.equipamiento : [],
      totalSeccionesAsignadas: classroom.sections.length,
      disponibilidadConfigurada: classroom.availabilities.length > 0
    };
  }

  private async createAuditLog(userId: string | null, action: string, meta: RequestMeta, details?: Record<string, unknown>) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
        ...(details ? { details: details as any } : {})
      }
    });
  }
}
