-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('activo', 'egresado', 'retirado', 'suspendido');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('inscrito', 'retirado', 'aprobado', 'reprobado');

-- AlterTable
ALTER TABLE "course_sections" ADD COLUMN     "periodo_id" TEXT;

-- CreateTable
CREATE TABLE "academic_periods" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "es_actual" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "user_id" TEXT,
    "program_id" TEXT,
    "estado" "StudentStatus" NOT NULL DEFAULT 'activo',
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "periodo_id" TEXT NOT NULL,
    "estado" "EnrollmentStatus" NOT NULL DEFAULT 'inscrito',
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academic_periods_codigo_key" ON "academic_periods"("codigo");

-- CreateIndex
CREATE INDEX "academic_periods_deleted_at_idx" ON "academic_periods"("deleted_at");

-- CreateIndex
CREATE INDEX "academic_periods_es_actual_idx" ON "academic_periods"("es_actual");

-- CreateIndex
CREATE UNIQUE INDEX "programs_codigo_key" ON "programs"("codigo");

-- CreateIndex
CREATE INDEX "programs_deleted_at_idx" ON "programs"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "students_codigo_key" ON "students"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE INDEX "students_deleted_at_idx" ON "students"("deleted_at");

-- CreateIndex
CREATE INDEX "students_program_id_idx" ON "students"("program_id");

-- CreateIndex
CREATE INDEX "enrollments_section_id_idx" ON "enrollments"("section_id");

-- CreateIndex
CREATE INDEX "enrollments_student_id_idx" ON "enrollments"("student_id");

-- CreateIndex
CREATE INDEX "enrollments_periodo_id_idx" ON "enrollments"("periodo_id");

-- CreateIndex
CREATE INDEX "enrollments_deleted_at_idx" ON "enrollments"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_student_id_section_id_periodo_id_key" ON "enrollments"("student_id", "section_id", "periodo_id");

-- CreateIndex
CREATE INDEX "course_sections_periodo_id_idx" ON "course_sections"("periodo_id");

-- AddForeignKey
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_periodo_id_fkey" FOREIGN KEY ("periodo_id") REFERENCES "academic_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "course_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_periodo_id_fkey" FOREIGN KEY ("periodo_id") REFERENCES "academic_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

