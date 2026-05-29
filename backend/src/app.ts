import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middlewares/error-handler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { ClassroomsService } from "./modules/classrooms/classrooms.service.js";
import { classroomsRouter } from "./modules/classrooms/classrooms.routes.js";
import { CoursesService } from "./modules/courses/courses.service.js";
import { coursesRouter } from "./modules/courses/courses.routes.js";
import { DashboardService } from "./modules/dashboard/dashboard.service.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { ReportsService } from "./modules/reports/reports.service.js";
import { scheduleConfigRouter } from "./modules/schedule-config/schedule-config.routes.js";
import { ScheduleConfigService } from "./modules/schedule-config/schedule-config.service.js";
import { SchedulingService } from "./modules/scheduling/scheduling.service.js";
import { schedulingRouter } from "./modules/scheduling/scheduling.routes.js";
import { TeachersService } from "./modules/teachers/teachers.service.js";
import { teachersRouter } from "./modules/teachers/teachers.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { UsersService } from "./modules/users/users.service.js";
import { academicPeriodsRouter } from "./modules/academic-periods/academic-periods.routes.js";
import { AcademicPeriodsService } from "./modules/academic-periods/academic-periods.service.js";
import { programsRouter } from "./modules/programs/programs.routes.js";
import { ProgramsService } from "./modules/programs/programs.service.js";
import { studentsRouter } from "./modules/students/students.routes.js";
import { StudentsService } from "./modules/students/students.service.js";
import { enrollmentsRouter } from "./modules/enrollments/enrollments.routes.js";
import { EnrollmentsService } from "./modules/enrollments/enrollments.service.js";

type AppDeps = {
  authService?: Pick<
    AuthService,
    "register" | "login" | "refresh" | "logout" | "logoutAll" | "forgotPassword" | "resetPassword" | "me"
  >;
  scheduleConfigService?: Pick<
    ScheduleConfigService,
    | "listTimeSlotGroups"
    | "createTimeSlotGroup"
    | "updateTimeSlotGroup"
    | "deleteTimeSlotGroup"
    | "listTimeBlocks"
    | "createTimeBlock"
    | "updateTimeBlock"
    | "deleteTimeBlock"
    | "listRules"
    | "updateRules"
    | "getAcademicConfig"
    | "updateAcademicConfig"
  >;
  teachersService?: Pick<
    TeachersService,
    | "listTeachers"
    | "getTeacherById"
    | "createTeacher"
    | "updateTeacher"
    | "deleteTeacher"
    | "restoreTeacher"
    | "updateTeacherAvailability"
    | "updateTeacherAssignableCourses"
  >;
  coursesService?: Pick<
    CoursesService,
    | "listCourses"
    | "getCourseById"
    | "createCourse"
    | "updateCourse"
    | "deleteCourse"
    | "restoreCourse"
    | "createSection"
    | "updateSection"
    | "deleteSection"
    | "restoreSection"
  >;
  classroomsService?: Pick<
    ClassroomsService,
    | "listClassrooms"
    | "getClassroomById"
    | "createClassroom"
    | "updateClassroom"
    | "deleteClassroom"
    | "restoreClassroom"
    | "updateClassroomAvailability"
  >;
  schedulingService?: Pick<
    SchedulingService,
    "getManualContext" | "saveManualAssignment" | "getOverview" | "detectConflicts" | "autoGenerate" | "reassignSection"
  >;
  dashboardService?: Pick<DashboardService, "getSummary">;
  reportsService?: Pick<ReportsService, "getScheduleReport" | "exportScheduleCsv">;
  usersService?: Pick<
    UsersService,
    "listUsers" | "updateUser" | "deleteUser" | "restoreUser" | "blockUser" | "unblockUser"
  >;
  academicPeriodsService?: Pick<
    AcademicPeriodsService,
    "listPeriods" | "getPeriodById" | "createPeriod" | "updatePeriod" | "deletePeriod" | "restorePeriod" | "setCurrentPeriod"
  >;
  programsService?: Pick<
    ProgramsService,
    "listPrograms" | "getProgramById" | "createProgram" | "updateProgram" | "deleteProgram" | "restoreProgram"
  >;
  studentsService?: Pick<
    StudentsService,
    "listStudents" | "getStudentById" | "createStudent" | "updateStudent" | "deleteStudent" | "restoreStudent"
  >;
  enrollmentsService?: Pick<
    EnrollmentsService,
    "listEnrollments" | "getEnrollmentById" | "enroll" | "withdraw" | "setStatus"
  >;
};

export function createApp(deps: AppDeps = {}) {
  const app = express();
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

  // En producción Render/Railway/Fly enrutan vía proxy; sin esto req.ip
  // reporta la IP del proxy y rate-limit/audit-log se vuelven inútiles.
  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Origen no permitido por CORS"));
      },
      credentials: true
    })
  );

  // Helmet endurecido pero sin romper el frontend actual:
  // - CSP deshabilitada explícitamente: el frontend vanilla usa Tailwind por CDN y
  //   carga assets desde otro origen. TODO[Fase 8]: activar CSP estricta cuando
  //   migremos a un bundler o servamos el frontend desde el mismo origen.
  // - CORP permisivo: necesario para que el frontend en Vercel consuma recursos.
  // - Referrer mínimo: no filtramos la URL de origen al backend.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      referrerPolicy: { policy: "no-referrer" }
    })
  );
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.use("/api/v1/auth", authRouter(deps.authService));
  app.use("/api/v1/health", healthRouter());
  app.use("/api/v1/schedule-config", scheduleConfigRouter(deps.scheduleConfigService));
  app.use("/api/v1/teachers", teachersRouter(deps.teachersService));
  app.use("/api/v1/courses", coursesRouter(deps.coursesService));
  app.use("/api/v1/classrooms", classroomsRouter(deps.classroomsService));
  app.use("/api/v1/scheduling", schedulingRouter(deps.schedulingService));
  app.use("/api/v1/dashboard", dashboardRouter(deps.dashboardService));
  app.use("/api/v1/reports", reportsRouter(deps.reportsService));
  app.use("/api/v1/users", usersRouter(deps.usersService));
  app.use("/api/v1/academic-periods", academicPeriodsRouter(deps.academicPeriodsService));
  app.use("/api/v1/programs", programsRouter(deps.programsService));
  app.use("/api/v1/students", studentsRouter(deps.studentsService));
  app.use("/api/v1/enrollments", enrollmentsRouter(deps.enrollmentsService));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
