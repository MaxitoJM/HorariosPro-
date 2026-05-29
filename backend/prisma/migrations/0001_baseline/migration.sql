-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'profesor', 'estudiante');

-- CreateEnum
CREATE TYPE "SchedulingRuleType" AS ENUM ('boolean', 'number', 'string', 'json');

-- CreateEnum
CREATE TYPE "WeekDay" AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo');

-- CreateEnum
CREATE TYPE "ClassroomType" AS ENUM ('aula', 'laboratorio', 'auditorio', 'sala_computo', 'otro');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "Role" NOT NULL DEFAULT 'estudiante',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_slot_groups" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_slot_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_blocks" (
    "id" TEXT NOT NULL,
    "grupo_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "duracion_minutos" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduling_rules" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo" "SchedulingRuleType" NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduling_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_config" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL DEFAULT 'Configuracion general',
    "sesiones_por_semana_default" INTEGER NOT NULL DEFAULT 3,
    "duracion_sesion_default" INTEGER NOT NULL DEFAULT 90,
    "dias_habiles" JSONB NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "titulo" TEXT,
    "max_horas_semana" INTEGER NOT NULL DEFAULT 20,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_availabilities" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "dia_semana" "WeekDay" NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_assignable_courses" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "codigo_curso" TEXT,
    "nombre_curso" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_assignable_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "creditos" INTEGER NOT NULL,
    "sesiones_por_semana" INTEGER NOT NULL,
    "duracion_minutos" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_sections" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "codigo_seccion" TEXT NOT NULL,
    "teacher_id" TEXT,
    "classroom_id" TEXT,
    "capacidad" INTEGER NOT NULL,
    "inscritos" INTEGER NOT NULL DEFAULT 0,
    "horario_resumen" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classrooms" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "edificio" TEXT NOT NULL,
    "piso" TEXT,
    "tipo" "ClassroomType" NOT NULL,
    "capacidad" INTEGER NOT NULL,
    "equipamiento" JSONB NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_availabilities" (
    "id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "dia_semana" "WeekDay" NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classroom_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_schedule_meetings" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "dia_semana" "WeekDay" NOT NULL,
    "time_block_id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_schedule_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "time_slot_groups_nombre_key" ON "time_slot_groups"("nombre");

-- CreateIndex
CREATE INDEX "time_blocks_grupo_id_idx" ON "time_blocks"("grupo_id");

-- CreateIndex
CREATE UNIQUE INDEX "time_blocks_grupo_id_orden_key" ON "time_blocks"("grupo_id", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "scheduling_rules_clave_key" ON "scheduling_rules"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_email_key" ON "teachers"("email");

-- CreateIndex
CREATE INDEX "teacher_availabilities_teacher_id_dia_semana_idx" ON "teacher_availabilities"("teacher_id", "dia_semana");

-- CreateIndex
CREATE INDEX "teacher_assignable_courses_teacher_id_idx" ON "teacher_assignable_courses"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_codigo_key" ON "courses"("codigo");

-- CreateIndex
CREATE INDEX "course_sections_course_id_idx" ON "course_sections"("course_id");

-- CreateIndex
CREATE INDEX "course_sections_teacher_id_idx" ON "course_sections"("teacher_id");

-- CreateIndex
CREATE INDEX "course_sections_classroom_id_idx" ON "course_sections"("classroom_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_sections_course_id_codigo_seccion_key" ON "course_sections"("course_id", "codigo_seccion");

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_codigo_key" ON "classrooms"("codigo");

-- CreateIndex
CREATE INDEX "classroom_availabilities_classroom_id_dia_semana_idx" ON "classroom_availabilities"("classroom_id", "dia_semana");

-- CreateIndex
CREATE INDEX "section_schedule_meetings_section_id_idx" ON "section_schedule_meetings"("section_id");

-- CreateIndex
CREATE INDEX "section_schedule_meetings_time_block_id_idx" ON "section_schedule_meetings"("time_block_id");

-- CreateIndex
CREATE INDEX "section_schedule_meetings_classroom_id_idx" ON "section_schedule_meetings"("classroom_id");

-- CreateIndex
CREATE UNIQUE INDEX "section_schedule_meetings_section_id_dia_semana_time_block__key" ON "section_schedule_meetings"("section_id", "dia_semana", "time_block_id");

-- CreateIndex
CREATE UNIQUE INDEX "section_schedule_meetings_classroom_id_dia_semana_time_bloc_key" ON "section_schedule_meetings"("classroom_id", "dia_semana", "time_block_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "time_slot_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_availabilities" ADD CONSTRAINT "teacher_availabilities_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignable_courses" ADD CONSTRAINT "teacher_assignable_courses_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_availabilities" ADD CONSTRAINT "classroom_availabilities_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_schedule_meetings" ADD CONSTRAINT "section_schedule_meetings_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "course_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_schedule_meetings" ADD CONSTRAINT "section_schedule_meetings_time_block_id_fkey" FOREIGN KEY ("time_block_id") REFERENCES "time_blocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_schedule_meetings" ADD CONSTRAINT "section_schedule_meetings_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

