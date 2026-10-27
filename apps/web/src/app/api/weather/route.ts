import { NextResponse } from "next/server";

// Singapore weather from Open-Meteo (free, no key). Cached for 30 minutes on the server.
export const revalidate = 1800;

const WMO: Record<number, string> = {
  0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Cloudy", 45: "Fog", 48: "Fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain", 80: "Showers", 81: "Showers", 82: "Heavy showers", 95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm",
};

export async function GET() {
  try {
    const r = await fetch("https://api.open-meteo.com/v1/forecast?latitude=1.29&longitude=103.85&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FSingapore&forecast_days=1", { next: { revalidate: 1800 } });
    const j = await r.json();
    return NextResponse.json({
      now: j?.current?.temperature_2m ?? null, sky: WMO[j?.current?.weather_code] ?? "–",
      hi: j?.daily?.temperature_2m_max?.[0] ?? null, lo: j?.daily?.temperature_2m_min?.[0] ?? null,
      rain: j?.daily?.precipitation_probability_max?.[0] ?? null, at: j?.current?.time ?? null, source: "Open-Meteo",
    });
  } catch {
    return NextResponse.json({ now: null, reason: "Weather not reachable" });
  }
}
