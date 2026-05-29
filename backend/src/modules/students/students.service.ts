import type { Prisma, PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import { audit } from "../../utils/audit.js";
import { HttpError } from "../../utils/http-error.js";

// Columnas esperadas en la plantilla de importacion (orden fijo).
const IMPORT_COLUMNS = ["codigo", "nombre", "apellido", "email", "programaCodigo"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ImportRowError = { fila: number; errores: string[] };
type ImportPreviewRow = {
  fila: number;
  codigo: string;
  nombre: string;
  apellido: string;
  email: string;
  programaCodigo: string;
  valido: boolean;
  errores: string[];
};

type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
  userId?: string | null;
};

type StudentStatus = "activo" | "egresado" | "retirado" | "suspendido";

type StudentInput = {
  codigo: string;
  nombre: string;
  apellido: string;
  email: string;
  userId?: string;
  programId?: string;
  estado?: StudentStatus;
};

type ListFilters = {
  search?: string;
  programId?: string;
  estado?: StudentStatus;
  deleted?: boolean;
  page?: number;
  pageSize?: number;
};

export class StudentsService {
  constructor(private readonly prisma: PrismaClient) {}

  async listStudents(filters: ListFilters = {}) {
    const search = filters.search?.trim();
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 50;

    const where: Prisma.StudentWhereInput = {
      ...(filters.deleted ? { deletedAt: { not: null } } : {}),
      ...(filters.programId ? { programId: filters.programId } : {}),
      ...(filters.estado ? { estado: filters.estado } : {}),
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: "insensitive" } },
              { apellido: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { codigo: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: { program: true },
        orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      this.prisma.student.count({ where })
    ]);

    return {
      items: items.map((s) => this.toSummary(s)),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    };
  }

  async getStudentById(id: string) {
    const item = await this.prisma.student.findFirst({
      where: { id },
      include: { program: true }
    });
    if (!item) {
      throw new HttpError(404, "Estudiante no encontrado", "STUDENT_NOT_FOUND");
    }
    return this.toSummary(item);
  }

  async createStudent(input: StudentInput, meta: RequestMeta) {
    await this.ensureUniqueCode(input.codigo);
    await this.ensureUniqueEmail(input.email);
    await this.validateRefs(input);

    const item = await this.prisma.student.create({
      data: {
        codigo: input.codigo,
        nombre: input.nombre,
        apellido: input.apellido,
        email: input.email,
        userId: input.userId ?? null,
        programId: input.programId ?? null,
        estado: input.estado ?? "activo"
      },
      include: { program: true }
    });

    await audit(this.prisma, meta, {
      action: "students.create",
      entityType: "student",
      entityId: item.id,
      after: { id: item.id, codigo: item.codigo, email: item.email }
    });
    return this.toSummary(item);
  }

  async updateStudent(id: string, input: StudentInput, meta: RequestMeta) {
    const existing = await this.requireStudent(id);
    await this.ensureUniqueCode(input.codigo, id);
    await this.ensureUniqueEmail(input.email, id);
    await this.validateRefs(input, id);

    const item = await this.prisma.student.update({
      where: { id },
      data: {
        codigo: input.codigo,
        nombre: input.nombre,
        apellido: input.apellido,
        email: input.email,
        userId: input.userId ?? null,
        programId: input.programId ?? null,
        estado: input.estado ?? existing.estado
      },
      include: { program: true }
    });

    await audit(this.prisma, meta, { action: "students.update", entityType: "student", entityId: id });
    return this.toSummary(item);
  }

  async deleteStudent(id: string, meta: RequestMeta) {
    const existing = await this.requireStudent(id);
    if (existing.deletedAt) {
      throw new HttpError(409, "El estudiante ya fue eliminado", "STUDENT_ALREADY_DELETED");
    }
    const activeEnrollments = await this.prisma.enrollment.count({
      where: { studentId: id, estado: "inscrito" }
    });
    if (activeEnrollments > 0) {
      throw new HttpError(
        409,
        `El estudiante tiene ${activeEnrollments} inscripcion(es) activa(s). Retire las inscripciones antes de eliminar.`,
        "STUDENT_HAS_ENROLLMENTS"
      );
    }

    const now = new Date();
    await this.prisma.student.update({
      where: { id },
      data: { deletedAt: now, deletedBy: meta.userId ?? null }
    });

    await audit(this.prisma, meta, {
      action: "students.softDelete",
      entityType: "student",
      entityId: id,
      before: { id, codigo: existing.codigo, email: existing.email },
      after: { id, deletedAt: now.toISOString(), deletedBy: meta.userId ?? null }
    });
  }

  async restoreStudent(id: string, meta: RequestMeta) {
    const existing = await this.prisma.student.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpError(404, "Estudiante no encontrado", "STUDENT_NOT_FOUND");
    }
    if (!existing.deletedAt) {
      throw new HttpError(409, "El estudiante no esta eliminado", "STUDENT_NOT_DELETED");
    }
    const codeConflict = await this.prisma.student.findUnique({ where: { codigo: existing.codigo } });
    if (codeConflict && codeConflict.id !== id) {
      throw new HttpError(409, "Otro estudiante activo ya usa este codigo.", "CODIGO_CONFLICT_ON_RESTORE");
    }
    const emailConflict = await this.prisma.student.findUnique({ where: { email: existing.email } });
    if (emailConflict && emailConflict.id !== id) {
      throw new HttpError(409, "Otro estudiante activo ya usa este email.", "EMAIL_CONFLICT_ON_RESTORE");
    }

    await this.prisma.student.update({ where: { id }, data: { deletedAt: null, deletedBy: null } });
    await audit(this.prisma, meta, { action: "students.restore", entityType: "student", entityId: id });
    return this.getStudentById(id);
  }

  // ── Importacion masiva por Excel (Fase 3) ────────────────────────────────

  // Genera la plantilla .xlsx con encabezados, una fila de ejemplo y la hoja de instrucciones.
  async generateImportTemplate(): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = "Horarios Pro";
    const ws = wb.addWorksheet("Estudiantes");
    ws.columns = [
      { header: "codigo", key: "codigo", width: 18 },
      { header: "nombre", key: "nombre", width: 20 },
      { header: "apellido", key: "apellido", width: 20 },
      { header: "email", key: "email", width: 30 },
      { header: "programaCodigo", key: "programaCodigo", width: 18 }
    ];
    ws.getRow(1).font = { bold: true };
    ws.addRow({ codigo: "E2026001", nombre: "Ana", apellido: "Lopez", email: "ana.lopez@uni.edu", programaCodigo: "ING-SIS" });

    const help = wb.addWorksheet("Instrucciones");
    help.addRow(["Complete una fila por estudiante en la hoja 'Estudiantes'."]);
    help.addRow(["codigo: matricula unica (obligatorio)"]);
    help.addRow(["nombre, apellido: obligatorios (min 2 caracteres)"]);
    help.addRow(["email: unico y con formato valido (obligatorio)"]);
    help.addRow(["programaCodigo: opcional; debe existir un programa con ese codigo"]);

    const out = await wb.xlsx.writeBuffer();
    return Buffer.from(out);
  }

  // Lee y valida el archivo. No escribe nada. Reutilizado por preview y commit.
  private async parseAndValidate(buffer: Buffer): Promise<{
    rows: ImportPreviewRow[];
    validCount: number;
    invalidCount: number;
  }> {
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(buffer as any);
    } catch {
      throw new HttpError(400, "El archivo no es un Excel (.xlsx) valido", "INVALID_EXCEL");
    }
    const ws = wb.getWorksheet("Estudiantes") ?? wb.worksheets[0];
    if (!ws) {
      throw new HttpError(400, "El archivo no contiene hojas", "EMPTY_WORKBOOK");
    }

    // Mapear encabezados de la primera fila.
    const headerRow = ws.getRow(1);
    const headerMap: Record<string, number> = {};
    headerRow.eachCell((cell, col) => {
      headerMap[String(cell.value ?? "").trim()] = col;
    });
    const missing = IMPORT_COLUMNS.filter((c) => c !== "programaCodigo" && !(c in headerMap));
    if (missing.length > 0) {
      throw new HttpError(400, `Faltan columnas obligatorias: ${missing.join(", ")}`, "MISSING_COLUMNS");
    }

    const cell = (row: ExcelJS.Row, key: string) => {
      const col = headerMap[key];
      if (!col) return "";
      const v = row.getCell(col).value;
      if (v && typeof v === "object" && "text" in (v as any)) return String((v as any).text).trim();
      return String(v ?? "").trim();
    };

    // Cargar programas existentes (por codigo) para validar referencias.
    const programs = await this.prisma.program.findMany({ select: { id: true, codigo: true } });
    const programByCode = new Map(programs.map((p) => [p.codigo, p.id]));

    // Cargar codigos/emails ya existentes (incluye soft-deleted: constraint global).
    const existing = await this.prisma.student.findMany({ select: { codigo: true, email: true } });
    const existingCodes = new Set(existing.map((s) => s.codigo));
    const existingEmails = new Set(existing.map((s) => s.email.toLowerCase()));

    const seenCodes = new Set<string>();
    const seenEmails = new Set<string>();
    const rows: ImportPreviewRow[] = [];

    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // encabezado
      const codigo = cell(row, "codigo");
      const nombre = cell(row, "nombre");
      const apellido = cell(row, "apellido");
      const email = cell(row, "email").toLowerCase();
      const programaCodigo = cell(row, "programaCodigo");
      // Saltar filas totalmente vacias.
      if (!codigo && !nombre && !apellido && !email) return;

      const errores: string[] = [];
      if (!codigo) errores.push("codigo requerido");
      else if (existingCodes.has(codigo)) errores.push("codigo ya existe");
      else if (seenCodes.has(codigo)) errores.push("codigo duplicado en el archivo");
      if (nombre.length < 2) errores.push("nombre invalido");
      if (apellido.length < 2) errores.push("apellido invalido");
      if (!EMAIL_RE.test(email)) errores.push("email invalido");
      else if (existingEmails.has(email)) errores.push("email ya existe");
      else if (seenEmails.has(email)) errores.push("email duplicado en el archivo");
      if (programaCodigo && !programByCode.has(programaCodigo)) errores.push("programaCodigo no existe");

      if (codigo) seenCodes.add(codigo);
      if (email) seenEmails.add(email);

      rows.push({ fila: rowNumber, codigo, nombre, apellido, email, programaCodigo, valido: errores.length === 0, errores });
    });

    const validCount = rows.filter((r) => r.valido).length;
    return { rows, validCount, invalidCount: rows.length - validCount };
  }

  async previewImport(buffer: Buffer) {
    const { rows, validCount, invalidCount } = await this.parseAndValidate(buffer);
    return {
      total: rows.length,
      validos: validCount,
      invalidos: invalidCount,
      filas: rows
    };
  }

  // Inserta solo las filas validas, en una transaccion (todo o nada).
  async commitImport(buffer: Buffer, meta: RequestMeta) {
    const { rows, validCount, invalidCount } = await this.parseAndValidate(buffer);
    const validas = rows.filter((r) => r.valido);
    if (validas.length === 0) {
      throw new HttpError(400, "No hay filas validas para importar", "NO_VALID_ROWS");
    }

    const programs = await this.prisma.program.findMany({ select: { id: true, codigo: true } });
    const programByCode = new Map(programs.map((p) => [p.codigo, p.id]));

    const created = await this.prisma.$transaction(async (tx) => {
      const ids: string[] = [];
      for (const r of validas) {
        const s = await tx.student.create({
          data: {
            codigo: r.codigo,
            nombre: r.nombre,
            apellido: r.apellido,
            email: r.email,
            programId: r.programaCodigo ? programByCode.get(r.programaCodigo) ?? null : null,
            estado: "activo"
          }
        });
        ids.push(s.id);
      }
      return ids;
    });

    await audit(this.prisma, meta, {
      action: "students.import",
      entityType: "student",
      extra: { creados: created.length, omitidos: invalidCount }
    });

    const omitidos: ImportRowError[] = rows
      .filter((r) => !r.valido)
      .map((r) => ({ fila: r.fila, errores: r.errores }));

    return { creados: created.length, omitidos: invalidCount, totalProcesadas: rows.length, detalleOmitidos: omitidos };
  }

  private async requireStudent(id: string) {
    const item = await this.prisma.student.findFirst({ where: { id } });
    if (!item) {
      throw new HttpError(404, "Estudiante no encontrado", "STUDENT_NOT_FOUND");
    }
    return item;
  }

  private async ensureUniqueCode(codigo: string, excludeId?: string) {
    const existing = await this.prisma.student.findUnique({ where: { codigo } });
    if (existing && existing.id !== excludeId) {
      throw new HttpError(409, "Ya existe un estudiante con ese codigo", "STUDENT_CODE_TAKEN");
    }
  }

  private async ensureUniqueEmail(email: string, excludeId?: string) {
    const existing = await this.prisma.student.findUnique({ where: { email } });
    if (existing && existing.id !== excludeId) {
      throw new HttpError(409, "Ya existe un estudiante con ese email", "STUDENT_EMAIL_TAKEN");
    }
  }

  private async validateRefs(input: StudentInput, excludeId?: string) {
    if (input.programId) {
      const program = await this.prisma.program.findFirst({ where: { id: input.programId } });
      if (!program) {
        throw new HttpError(400, "El programa seleccionado no existe o esta inactivo", "INVALID_PROGRAM");
      }
    }
    if (input.userId) {
      const user = await this.prisma.user.findFirst({ where: { id: input.userId } });
      if (!user) {
        throw new HttpError(400, "El usuario vinculado no existe", "INVALID_USER");
      }
      // user_id es @unique en Student: validar que no este tomado por otro
      const linked = await this.prisma.student.findUnique({ where: { userId: input.userId } });
      if (linked && linked.id !== excludeId) {
        throw new HttpError(409, "Ese usuario ya esta vinculado a otro estudiante", "USER_ALREADY_LINKED");
      }
    }
  }

  private toSummary(s: {
    id: string;
    codigo: string;
    nombre: string;
    apellido: string;
    email: string;
    userId: string | null;
    programId: string | null;
    estado: StudentStatus;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    program?: { id: string; codigo: string; nombre: string } | null;
  }) {
    return {
      id: s.id,
      codigo: s.codigo,
      nombre: s.nombre,
      apellido: s.apellido,
      email: s.email,
      userId: s.userId,
      programId: s.programId,
      program: s.program ? { id: s.program.id, codigo: s.program.codigo, nombre: s.program.nombre } : null,
      estado: s.estado,
      deletedAt: s.deletedAt,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    };
  }
}
