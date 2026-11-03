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
