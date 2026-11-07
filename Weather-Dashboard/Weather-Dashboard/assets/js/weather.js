import { CONFIG } from "./config.js";

const KEY_STORAGE = "weatherDashboard.apiKey";
const FORECAST_DAYS = 5;

export class WeatherError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/* ---------- API key ---------- */

export const getApiKey = () => CONFIG.API_KEY.trim() || localStorage.getItem(KEY_STORAGE) || "";
export const saveApiKey = (key) => localStorage.setItem(KEY_STORAGE, key.trim());
export const clearSavedApiKey = () => localStorage.removeItem(KEY_STORAGE);

/* ---------- Requests ---------- */

async function request(endpoint, params) {
  const apiKey = getApiKey();
  if (!apiKey) throw new WeatherError("NO_KEY", "An API key is required.");

  const url = new URL(`${CONFIG.BASE_URL}/${endpoint}`);
  url.search = new URLSearchParams({ ...params, units: "metric", appid: apiKey });

  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new WeatherError("NETWORK", "Check your internet connection and try again.");
  }
  if (response.ok) return response.json();

  const errors = {
    401: ["INVALID_KEY", "The API key was rejected. Check it, or wait up to two hours if it is brand new."],
    404: ["NOT_FOUND", "We couldn't find that city. Check the spelling or add a country code, like “Paris, FR”."],
    429: ["RATE_LIMIT", "Too many requests. Wait a minute and try again."]
  };
  const [code, message] = errors[response.status] ||
    ["SERVER", "The weather service is unavailable right now. Try again soon."];
  throw new WeatherError(code, message);
}

/** @param {{city: string} | {lat: number, lon: number}} query */
export async function fetchWeather(query) {
  const params = "city" in query ? { q: query.city } : { lat: query.lat, lon: query.lon };
  const [current, forecast] = await Promise.all([
    request("weather", params),
    request("forecast", params)
  ]);
  return {
    current: normalizeCurrent(current),
    forecast: normalizeForecast(forecast.list, current.timezone)
  };
}

/* ---------- Normalizing API responses ---------- */

function normalizeCurrent(data) {
  const [condition] = data.weather;
  return {
    city: data.name,
    country: data.sys.country,
    timezone: data.timezone,
    updatedAt: data.dt,
    temp: data.main.temp,
    feelsLike: data.main.feels_like,
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    windSpeed: data.wind.speed,
    description: condition.description,
    conditionId: condition.id,
    isNight: condition.icon.endsWith("n"),
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset
  };
}

/** Groups 3-hourly entries into local calendar days. */
function normalizeForecast(entries, timezone) {
  const days = new Map();
  for (const entry of entries) {
    const local = new Date((entry.dt + timezone) * 1000);
    const key = local.toISOString().slice(0, 10);
    if (!days.has(key)) days.set(key, []);
    days.get(key).push({ entry, hourDistance: Math.abs(local.getUTCHours() - 12) });
  }

  return [...days.entries()].slice(0, FORECAST_DAYS).map(([key, items]) => {
    const midday = items.reduce((best, item) => (item.hourDistance < best.hourDistance ? item : best)).entry;
    const [condition] = midday.weather;
    return {
      date: key,
      min: Math.min(...items.map(({ entry }) => entry.main.temp_min)),
      max: Math.max(...items.map(({ entry }) => entry.main.temp_max)),
      rainChance: Math.round(Math.max(...items.map(({ entry }) => entry.pop ?? 0)) * 100),
      description: condition.description,
      conditionId: condition.id
    };
  });
}

/* ---------- Conditions: icons and themes ---------- */

export function getIconClass(id, isNight = false) {
  if (id >= 200 && id < 300) return "fa-cloud-bolt";
  if (id >= 300 && id < 500) return "fa-cloud-rain";
  if (id === 511) return "fa-snowflake";
  if (id >= 500 && id < 505) return isNight ? "fa-cloud-moon-rain" : "fa-cloud-sun-rain";
  if (id >= 505 && id < 600) return "fa-cloud-showers-heavy";
  if (id >= 600 && id < 700) return "fa-snowflake";
  if (id >= 700 && id < 800) return "fa-smog";
  if (id === 800) return isNight ? "fa-moon" : "fa-sun";
  if (id === 801) return isNight ? "fa-cloud-moon" : "fa-cloud-sun";
  return "fa-cloud";
}

export function getTheme(id, isNight) {
  if (id >= 200 && id < 300) return "storm";
  if (id >= 300 && id < 600) return "rain";
  if (id >= 600 && id < 700) return "snow";
  if (id >= 700 && id < 800) return "mist";
  if (id === 800) return isNight ? "clear-night" : "clear-day";
  return isNight ? "clouds-night" : "clouds-day";
}

/* ---------- Unit conversion and formatting ---------- */

export const convertTemp = (celsius, unit) =>
  Math.round(unit === "imperial" ? (celsius * 9) / 5 + 32 : celsius);

export const formatWind = (metersPerSecond, unit) =>
  unit === "imperial"
    ? `${Math.round(metersPerSecond * 2.23694)} mph`
    : `${Math.round(metersPerSecond * 3.6)} km/h`;

/** Formats a UNIX timestamp in the searched city's local time. */
export const formatTime = (timestamp, timezone) =>
  new Date((timestamp + timezone) * 1000).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", timeZone: "UTC"
  });

export const formatDate = (timestamp, timezone) =>
  new Date((timestamp + timezone) * 1000).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", timeZone: "UTC"
  });

export const formatWeekday = (dateKey) =>
  new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
