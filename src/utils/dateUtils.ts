/**
 * Utility functies voor datum filtering en formatting
 */

/**
 * Formatteert een datum naar SQL formaat (YYYY-MM-DD HH:MM:SS)
 * @param date - De datum om te formatteren
 * @returns Geformatteerde datum string
 */
export function formatDateSQL(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Berekent de start van vandaag (00:00:00)
 * @returns Date object voor start van vandaag
 */
export function getTodayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
}

/**
 * Berekent de start van morgen (00:00:00)
 * @returns Date object voor start van morgen
 */
export function getTomorrowStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
}

/**
 * Genereert een PocketBase filter voor events van vandaag
 * @returns Filter string voor events van vandaag
 */
export function getTodayEventsFilter(): string {
  const todayStart = getTodayStart();
  const tomorrowStart = getTomorrowStart();

  return `startdate >= "${formatDateSQL(todayStart)}" && startdate < "${formatDateSQL(tomorrowStart)}"`;
}

/**
 * Genereert een PocketBase filter voor events vanaf vandaag
 * @returns Filter string voor events vanaf vandaag
 */
export function getFromTodayEventsFilter(): string {
  const todayStart = getTodayStart();

  return `startdate >= "${formatDateSQL(todayStart)}"`;
}

/**
 * Genereert een PocketBase filter voor events tot en met vandaag
 * @returns Filter string voor events tot en met vandaag
 */
export function getUntilTodayEventsFilter(): string {
  const tomorrowStart = getTomorrowStart();

  return `startdate < "${formatDateSQL(tomorrowStart)}"`;
}

/**
 * Genereert een PocketBase filter voor events van een specifieke datum
 * @param date - De datum waarop te filteren
 * @returns Filter string voor events van de opgegeven datum
 */
export function getDateEventsFilter(date: Date): string {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const nextDayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0);

  return `startdate >= "${formatDateSQL(dayStart)}" && startdate < "${formatDateSQL(nextDayStart)}"`;
}

/**
 * Genereert een PocketBase filter voor events van een datum range
 * @param startDate - Start datum (inclusief)
 * @param endDate - Eind datum (exclusief)
 * @returns Filter string voor events in de opgegeven range
 */
export function getDateRangeEventsFilter(startDate: Date, endDate: Date): string {
  const start = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
    0,
    0,
    0,
  );
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1, 0, 0, 0);

  return `startdate >= "${formatDateSQL(start)}" && startdate < "${formatDateSQL(end)}"`;
}
