export function formatPhone(phone: string) {
  return phone.replace(/[^0-9+]/g, "").trim();
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: process.env.APP_TIMEZONE ?? "America/Caracas",
  }).format(new Date(value));
}
