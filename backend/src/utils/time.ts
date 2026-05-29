// Helpers de tiempo compartidos por scheduling, conflict-detection, reports y teachers.
// Centralizar evita drift entre módulos (ej. distintos formatos de hora aceptados).

export const DAY_ORDER = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"] as const;
export const WORK_DAYS = DAY_ORDER.slice(0, 5);

export type DayName = (typeof DAY_ORDER)[number];

/** "HH:MM" -> minutos desde 00:00. Acepta "9:5" tolerantemente. */
export function parseTimeToMinutes(value: string): number {
  const [h = 0, m = 0] = value.split(":").map(Number);
  return h * 60 + m;
}

/** True si [blockStart, blockEnd] queda contenido dentro de alguna disponibilidad activa del día. */
export function isBlockCoveredByAvailability(
  availabilities: Array<{ activo: boolean; diaSemana: string; horaInicio: string; horaFin: string }>,
  diaSemana: string,
  blockStart: string,
  blockEnd: string
): boolean {
  const bStart = parseTimeToMinutes(blockStart);
  const bEnd = parseTimeToMinutes(blockEnd);
  return availabilities.some(
    (av) =>
      av.activo &&
      av.diaSemana === diaSemana &&
      parseTimeToMinutes(av.horaInicio) <= bStart &&
      parseTimeToMinutes(av.horaFin) >= bEnd
  );
}

/** Etiqueta humana corta para una reunión. */
export function formatMeetingLabel(diaSemana: string, horaInicio: string, horaFin: string): string {
  return `${diaSemana} ${horaInicio}-${horaFin}`;
}
