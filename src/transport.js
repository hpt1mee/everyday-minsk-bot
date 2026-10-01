const STOP_URL = "https://kogda.by/stops/minsk/%D0%9B%D0%B5%D0%B9%D1%82%D0%B5%D0%BD%D0%B0%D0%BD%D1%82%D0%B0%20%D0%9A%D0%B8%D0%B6%D0%B5%D0%B2%D0%B0%D1%82%D0%BE%D0%B2%D0%B0";
const TARGET_ROUTES = new Set(["73", "59", "172"]);

function text(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export function parseNearestArrivals(html) {
  const rows = [];
  const rowPattern = /<div\b(?=[^>]*\bdata-route="(73|59|172)")(?=[^>]*\bdata-interval="(\d+)")[^>]*>([\s\S]*?)<\/div>/g;
  for (const match of html.matchAll(rowPattern)) {
    const [, route, interval, content] = match;
    const direction = text(content.match(/<span class="direction">([\s\S]*?)<\/span>/)?.[1] ?? "");
    rows.push({ route, minutes: Number(interval), direction });
  }

  return rows
    .filter((row) => TARGET_ROUTES.has(row.route))
    .sort((a, b) => a.minutes - b.minutes)
    .reduce((result, row) => {
      if ((result[row.route] ?? []).length < 2) (result[row.route] ??= []).push(row);
      return result;
    }, {});
}

function formatArrivals(arrivals) {
  const lines = [];
  for (const route of ["73", "59", "172"]) {
    const rows = arrivals[route] ?? [];
    if (!rows.length) {
      lines.push(`${route} — нет ближайшего рейса в табло.`);
      continue;
    }
    lines.push(`${route} — ${rows.map((row) => `через ${row.minutes} мин${row.direction ? ` (${row.direction})` : ""}`).join("; ")}`);
  }
  return lines.join("\n");
}

export async function getTransport() {
  try {
    const response = await fetch(STOP_URL, {
      headers: { "User-Agent": "MorningMinskTelegramBot/1.0" },
      signal: AbortSignal.timeout(12_000)
    });
    if (!response.ok) throw new Error(String(response.status));
    const arrivals = parseNearestArrivals(await response.text());
    if (!Object.keys(arrivals).length) throw new Error("arrival board not found");
    return `Остановка «Лейтенанта Кижеватова» — ближайшие прибытия:\n${formatArrivals(arrivals)}`;
  } catch {
    return "Не удалось получить онлайн-табло транспорта. Откройте остановку «Лейтенанта Кижеватова» в Яндекс Картах.";
  }
}
