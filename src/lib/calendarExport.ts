export interface CalendarExportEvent {
  uid: string;
  title: string;
  date: string; // YYYY-MM-DD or descriptive
  description?: string;
  location?: string;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function parseIsoDateDigits(dateStr: string): string | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return `${match[1]}${match[2]}${match[3]}`;
}

function nextDayDigits(yyyymmdd: string): string {
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6)) - 1;
  const d = Number(yyyymmdd.slice(6, 8));
  const dt = new Date(Date.UTC(y, m, d + 1));
  const yy = String(dt.getUTCFullYear());
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

export function downloadIcsCalendar(events: CalendarExportEvent[], fileName = 'PUST-Academic-Calendar.ics'): boolean {
  const validEvents = events
    .map((ev) => ({ ...ev, yyyymmdd: parseIsoDateDigits(ev.date) }))
    .filter((ev): ev is CalendarExportEvent & { yyyymmdd: string } => ev.yyyymmdd !== null);

  if (validEvents.length === 0) return false;

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pabna University of Science and Technology//Academic Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:PUST Academic Calendar',
  ];

  for (const ev of validEvents) {
    const dtStart = ev.yyyymmdd;
    const dtEnd = nextDayDigits(dtStart);
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${escapeIcsText(ev.uid)}@pust.ac.bd`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    lines.push(`SUMMARY:${escapeIcsText(ev.title)}`);
    if (ev.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`);
    }
    lines.push(`LOCATION:${escapeIcsText(ev.location || 'Pabna University of Science and Technology, Rajapur, Pabna-6600')}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
