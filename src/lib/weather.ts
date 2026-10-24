import "server-only";
import { degToCompass, ktsToBeaufort, beaufortLabel, wmoLabel } from "./utils";

/**
 * Live weather for the centre from Open-Meteo (https://open-meteo.com).
 * Free for non-commercial use, no API key required — perfect for a
 * self-hosted deployment. Location is configured via env vars:
 *
 *   CENTRE_LAT  (default 50.7679  — Cowes, Isle of Wight)
 *   CENTRE_LON  (default -1.2977)
 *   CENTRE_TZ   (default Europe/London)
 */

export type HourPoint = {
  time: string;
  wind: number;
  gust: number;
  dir: number;
  prob: number;
};

export type WeatherReport = {
  tempC: number;
  feelsC: number;
  windKt: number;
  gustKt: number;
  windDir: number;
  compass: string;
  beaufort: number;
  beaufortName: string;
  wmoCode: number;
  condition: string;
  waveM: number | null;
  wavePeriodS: number | null;
  swellM: number | null;
  uvIndex: number | null;
  sunrise: string | null;
  sunset: string | null;
  hours: HourPoint[];
  fetchedAt: string;
};

const LAT = process.env.CENTRE_LAT ?? "50.7679";
const LON = process.env.CENTRE_LON ?? "-1.2977";
const TZ = process.env.CENTRE_TZ ?? "Europe/London";

async function fetchJson(url: string, revalidate = 900) {
  const res = await fetch(url, {
    next: { revalidate },
    headers: { "User-Agent": "harbour-os-selfhosted" },
  });
  if (!res.ok) throw new Error(`weather fetch failed: ${res.status}`);
  return res.json();
}

export async function getWeather(): Promise<WeatherReport | null> {
  try {
    const hourly =
      "wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation_probability,apparent_temperature";
    const forecastUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
      `&hourly=${hourly}&daily=sunrise,sunset,uv_index_max` +
      `&wind_speed_unit=kn&timezone=${encodeURIComponent(TZ)}&forecast_days=2`;
    const marineUrl =
      `https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}` +
      `&current=wave_height,wave_period,swell_wave_height&timezone=${encodeURIComponent(TZ)}`;

    const [fc, marine] = await Promise.all([
      fetchJson(forecastUrl),
      fetchJson(marineUrl).catch(() => null),
    ]);

    const cur = fc.current;
    const times: string[] = fc.hourly?.time ?? [];
    const nowIso = (cur?.time as string) ?? new Date().toISOString();
    let startIdx = times.findIndex((t) => t >= nowIso.slice(0, 13));
    if (startIdx < 0) startIdx = 0;

    const hours: HourPoint[] = [];
    for (let i = startIdx; i < Math.min(startIdx + 16, times.length); i++) {
      hours.push({
        time: times[i],
        wind: fc.hourly.wind_speed_10m?.[i] ?? 0,
        gust: fc.hourly.wind_gusts_10m?.[i] ?? 0,
        dir: fc.hourly.wind_direction_10m?.[i] ?? 0,
        prob: fc.hourly.precipitation_probability?.[i] ?? 0,
      });
    }

    const wind = cur?.wind_speed_10m ?? 0;
    const bf = ktsToBeaufort(wind);

    return {
      tempC: cur?.temperature_2m ?? 0,
      feelsC: cur?.apparent_temperature ?? 0,
      windKt: wind,
      gustKt: cur?.wind_gusts_10m ?? 0,
      windDir: cur?.wind_direction_10m ?? 0,
      compass: degToCompass(cur?.wind_direction_10m ?? 0),
      beaufort: bf,
      beaufortName: beaufortLabel(bf),
      wmoCode: cur?.weather_code ?? 0,
      condition: wmoLabel(cur?.weather_code ?? 0),
      waveM: marine?.current?.wave_height ?? null,
      wavePeriodS: marine?.current?.wave_period ?? null,
      swellM: marine?.current?.swell_wave_height ?? null,
      uvIndex: fc.daily?.uv_index_max?.[0] ?? null,
      sunrise: fc.daily?.sunrise?.[0] ?? null,
      sunset: fc.daily?.sunset?.[0] ?? null,
      hours,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[weather] unavailable:", err);
    return null;
  }
}
