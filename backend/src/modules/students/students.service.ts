import { HttpError } from "../../utils/http-error.js";
import { hashPassword, validatePasswordStrength } from "../../utils/security.js";

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
  userId?: string | null;
};

type CreateStudentInput = {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  activo?: boolean;
  verificado?: boolean;
};

type ListStudentFilters = {
  search?: string;
  includeInactive?: boolean;
};

export class StudentsService {
  constructor(private readonly prisma: any) {}

  async listStudents(filters: ListStudentFilters = {}) {
    const search = filters.search?.trim();
    const students = await this.prisma.user.findMany({
      where: {
        rol: "estudiante",
        ...(filters.includeInactive ? {} : { activo: true }),
        ...(search
          ? {
              OR: [
                { nombre: { contains: search, mode: "insensitive" } },
                { apellido: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } }
              ]
            }
          : {})
      },
      include: this.studentInclude(),
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }]
    });

    return students.map((student: any) => this.toStudentSummary(student));
  }

  async getStudentById(id: string) {
    const student = await this.prisma.user.findFirst({
      where: { id, rol: "estudiante" },
      include: this.studentInclude()
    });

    if (!student) {
      throw new HttpError(404, "Estudiante no encontrado", "STUDENT_NOT_FOUND");
    }

    return this.toStudentSummary(student);
  }

  async createStudent(input: CreateStudentInput, meta: RequestMeta) {
    if (!validatePasswordStrength(input.password)) {
      throw new HttpError(400, "La contrasena no cumple las reglas de seguridad", "WEAK_PASSWORD");
    }

    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new HttpError(409, "El email ya esta registrado", "EMAIL_TAKEN");
    }

    const student = await this.prisma.user.create({
      data: {
        nombre: input.nombre,
        apellido: input.apellido,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        rol: "estudiante",
        activo: input.activo ?? true,
        verificado: input.verificado ?? false
      },
      include: this.studentInclude()
    });

    await this.createAuditLog(meta.userId ?? null, "students.create", meta, { studentId: student.id });
    return this.toStudentSummary(student);
  }

  private studentInclude() {
    return {
      enrollments: {
        where: { status: "activa" },
        include: {
          section: {
            include: {
              course: true,
              scheduleMeetings: {
                include: {
                  timeBlock: true,
                  classroom: true
                }
              }
            }
          }
        }
      }
    };
  }

  private toStudentSummary(student: any) {
    const activeEnrollments = student.enrollments ?? [];
    return {
      id: student.id,
      nombre: student.nombre,
      apellido: student.apellido,
      email: student.email,
      rol: student.rol,
      activo: student.activo,
      verificado: student.verificado,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
      totalInscripciones: activeEnrollments.length,
      inscripciones: activeEnrollments.map((enrollment: any) => ({
        id: enrollment.id,
        sectionId: enrollment.sectionId,
        courseCodigo: enrollment.section.course.codigo,
        courseNombre: enrollment.section.course.nombre,
        sectionCodigo: enrollment.section.codigoSeccion,
        horarioResumen: enrollment.section.horarioResumen,
        createdAt: enrollment.createdAt
      }))
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
