export const DEFAULT_TIME_SLOT_GROUPS = [
  { nombre: "Manana", horaInicio: "07:00", horaFin: "12:00", activo: true },
  { nombre: "Tarde", horaInicio: "14:00", horaFin: "18:00", activo: true },
  { nombre: "Noche", horaInicio: "18:00", horaFin: "22:00", activo: true }
];

export const DEFAULT_TIME_BLOCKS = {
  Manana: [
    { nombre: "Bloque 1", horaInicio: "07:00", horaFin: "08:30", orden: 1, activo: true },
    { nombre: "Bloque 2", horaInicio: "08:45", horaFin: "10:15", orden: 2, activo: true },
    { nombre: "Bloque 3", horaInicio: "10:30", horaFin: "12:00", orden: 3, activo: true }
  ],
  Tarde: [
    { nombre: "Bloque 4", horaInicio: "14:00", horaFin: "15:30", orden: 4, activo: true },
    { nombre: "Bloque 5", horaInicio: "15:45", horaFin: "17:15", orden: 5, activo: true }
  ],
  Noche: [
    { nombre: "Bloque 6", horaInicio: "18:00", horaFin: "19:30", orden: 6, activo: true },
    { nombre: "Bloque 7", horaInicio: "19:45", horaFin: "21:15", orden: 7, activo: true }
  ]
};

export const DEFAULT_SCHEDULING_RULES = [
  {
    clave: "EVITAR_DIAS_CONSECUTIVOS",
    valor: "true",
    tipo: "boolean",
    descripcion: "No asignar sesiones del mismo curso en dias consecutivos",
    activo: true
  },
  {
    clave: "MAX_HORAS_DOCENTE",
    valor: "20",
    tipo: "number",
    descripcion: "Carga maxima semanal por docente",
    activo: true
  },
  {
    clave: "DESCANSO_MINIMO_MINUTOS",
    valor: "15",
    tipo: "number",
    descripcion: "Tiempo minimo de descanso entre clases",
    activo: true
  },
  {
    clave: "PERMITIR_GRUPOS_BAJO_CUPO",
    valor: "false",
    tipo: "boolean",
    descripcion: "Permitir grupos por debajo del cupo recomendado",
    activo: false
  },
  {
    clave: "VALIDAR_CONFLICTOS_AUTOMATICAMENTE",
    valor: "true",
    tipo: "boolean",
    descripcion: "Activar validacion automatica de conflictos",
    activo: true
  }
];

export const DEFAULT_ACADEMIC_CONFIG = {
  nombre: "Configuracion general",
  sesionesPorSemanaDefault: 3,
  duracionSesionDefault: 90,
  diasHabiles: ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"],
  activo: true
};
