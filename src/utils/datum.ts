export function lokaleDatum(datum: Date): string {
  const jaar = datum.getFullYear();
  const maand = String(datum.getMonth() + 1).padStart(2, '0');
  const dag = String(datum.getDate()).padStart(2, '0');
  return `${jaar}-${maand}-${dag}`;
}

export function vandaag(): string {
  return lokaleDatum(new Date());
}

export function dagenGeleden(aantal: number): string {
  const datum = new Date();
  datum.setDate(datum.getDate() - aantal);
  return lokaleDatum(datum);
}

const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

function leesDatum(datum: string): Date {
  const [jaar, maand, dag] = datum.split('-').map(Number);
  return new Date(jaar, (maand || 1) - 1, dag || 1);
}

export function formatDatumKort(datum: string): string {
  const d = leesDatum(datum);
  return `${d.getDate()} ${MAANDEN[d.getMonth()]}`;
}

export function formatDatumLang(datum: string): string {
  const d = leesDatum(datum);
  if (datum === vandaag()) return 'Vandaag';
  if (datum === dagenGeleden(1)) return 'Gisteren';
  const dag = DAGEN[d.getDay()];
  return `${dag.charAt(0).toUpperCase()}${dag.slice(1)} ${d.getDate()} ${MAANDEN[d.getMonth()]}`;
}
