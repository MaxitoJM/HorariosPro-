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
import { scheduleConfigRouter } from "./modules/schedule-config/schedule-config.routes.js";
import { ScheduleConfigService } from "./modules/schedule-config/schedule-config.service.js";
import { SchedulingService } from "./modules/scheduling/scheduling.service.js";
import { schedulingRouter } from "./modules/scheduling/scheduling.routes.js";
import { TeachersService } from "./modules/teachers/teachers.service.js";
import { teachersRouter } from "./modules/teachers/teachers.routes.js";

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
    | "createSection"
    | "updateSection"
    | "deleteSection"
  >;
  classroomsService?: Pick<
    ClassroomsService,
    | "listClassrooms"
    | "getClassroomById"
    | "createClassroom"
    | "updateClassroom"
    | "deleteClassroom"
    | "updateClassroomAvailability"
  >;
  schedulingService?: Pick<
    SchedulingService,
    "getManualContext" | "saveManualAssignment" | "getOverview" | "detectConflicts"
  >;
  dashboardService?: Pick<DashboardService, "getSummary">;
};

export function createApp(deps: AppDeps = {}) {
  const app = express();
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

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

  app.use(helmet());
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

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
