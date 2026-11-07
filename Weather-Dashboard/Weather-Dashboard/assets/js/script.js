import {
  WeatherError, fetchWeather, getApiKey, saveApiKey, clearSavedApiKey, getIconClass, getTheme,
  convertTemp, formatWind, formatTime, formatDate, formatWeekday
} from "./weather.js";

const STORAGE = { unit: "weatherDashboard.unit", query: "weatherDashboard.lastQuery" };
const $ = (id) => document.getElementById(id);

const ui = {
  menuToggle: $("menu-toggle"), tools: $("topbar-tools"),
  searchForm: $("search-form"), cityInput: $("city-input"),
  locateBtn: $("locate-btn"), unitButtons: document.querySelectorAll("[data-unit]"),
  setup: $("setup"), keyForm: $("key-form"), keyInput: $("key-input"),
  welcome: $("welcome"), loader: $("loader"),
  error: $("error"), errorTitle: $("error-title"), errorMessage: $("error-message"),
  weather: $("weather"), forecastList: $("forecast-list")
};

const state = {
  unit: localStorage.getItem(STORAGE.unit) === "imperial" ? "imperial" : "metric",
  data: null,
  pendingQuery: null
};

/* ---------- View helpers ---------- */

const PANELS = ["setup", "welcome", "loader", "error", "weather"];

function showOnly(name) {
  PANELS.forEach((panel) => { ui[panel].hidden = panel !== name; });
}

function showError(title, message) {
  ui.errorTitle.textContent = title;
  ui.errorMessage.textContent = message;
  showOnly("error");
}

const escapeHtml = (text) => text.replace(/[&<>"']/g, (char) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/* ---------- Rendering ---------- */

function render() {
  const { current, forecast } = state.data;
  const { unit } = state;
  const unitSymbol = unit === "metric" ? "°C" : "°F";

  document.body.dataset.theme = getTheme(current.conditionId, current.isNight);
  document.title = `${current.city} weather · Weather Dashboard`;

  $("city-name").textContent = `${current.city}, ${current.country}`;
  $("current-date").textContent = formatDate(current.updatedAt, current.timezone);
  $("current-icon").className = `fa-solid ${getIconClass(current.conditionId, current.isNight)}`;
  $("current-temp").textContent = convertTemp(current.temp, unit);
  $("temp-unit").textContent = unitSymbol;
  $("current-description").textContent = capitalize(current.description);

  $("feels-like").textContent = `${convertTemp(current.feelsLike, unit)}${unitSymbol}`;
  $("humidity").textContent = `${current.humidity}%`;
  $("wind").textContent = formatWind(current.windSpeed, unit);
  $("pressure").textContent = `${current.pressure} hPa`;
  $("sunrise").textContent = formatTime(current.sunrise, current.timezone);
  $("sunset").textContent = formatTime(current.sunset, current.timezone);

  ui.forecastList.innerHTML = forecast.map((day, index) => `
    <article class="card forecast-day">
      <h3>${index === 0 ? "Today" : formatWeekday(day.date)}</h3>
      <i class="fa-solid ${getIconClass(day.conditionId)}" aria-hidden="true"></i>
      <p class="forecast-desc">${escapeHtml(capitalize(day.description))}</p>
      <p class="forecast-temps"><strong>${convertTemp(day.max, unit)}°</strong> <span>${convertTemp(day.min, unit)}°</span></p>
      <p class="forecast-rain"><i class="fa-solid fa-droplet" aria-hidden="true"></i> ${day.rainChance}%</p>
    </article>`).join("");

  showOnly("weather");
}

function updateUnitButtons() {
  ui.unitButtons.forEach((button) => {
    const isActive = button.dataset.unit === state.unit;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

/* ---------- Loading weather ---------- */

async function loadWeather(query) {
  state.pendingQuery = query;
  showOnly("loader");
  try {
    state.data = await fetchWeather(query);
    localStorage.setItem(STORAGE.query, JSON.stringify(query));
    render();
  } catch (error) {
    handleError(error);
  }
}

function handleError(error) {
  if (!(error instanceof WeatherError)) {
    console.error(error);
    return showError("Something went wrong", "An unexpected error occurred. Please try again.");
  }
  const titles = {
    NOT_FOUND: "City not found", INVALID_KEY: "API key problem", NETWORK: "You appear to be offline",
    RATE_LIMIT: "Slow down a little", SERVER: "Weather service unavailable"
  };
  if (error.code === "NO_KEY") return showOnly("setup");
  if (error.code === "INVALID_KEY") clearSavedApiKey();
  showError(titles[error.code] || "Something went wrong", error.message);
}

function locateUser() {
  if (!navigator.geolocation) {
    return showError("Location not supported", "Your browser can't share its location. Search for a city instead.");
  }
  showOnly("loader");
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => loadWeather({ lat: coords.latitude, lon: coords.longitude }),
    (error) => {
      const message = error.code === error.PERMISSION_DENIED
        ? "Location access was blocked. Allow it in your browser settings, or search for a city."
        : "We couldn't determine your location. Search for a city instead.";
      showError("Location unavailable", message);
    },
    { timeout: 10000 }
  );
}

/* ---------- Events ---------- */

ui.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = ui.cityInput.value.trim();
  if (!city) return;
  ui.tools.classList.remove("open");
  ui.menuToggle.setAttribute("aria-expanded", "false");
  loadWeather({ city });
});

ui.locateBtn.addEventListener("click", locateUser);

ui.unitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.unit = button.dataset.unit;
    localStorage.setItem(STORAGE.unit, state.unit);
    updateUnitButtons();
    if (state.data) render();
  });
});

ui.keyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveApiKey(ui.keyInput.value);
  ui.keyInput.value = "";
  if (state.pendingQuery) loadWeather(state.pendingQuery);
  else showOnly("welcome");
});

ui.menuToggle.addEventListener("click", () => {
  const isOpen = ui.tools.classList.toggle("open");
  ui.menuToggle.setAttribute("aria-expanded", String(isOpen));
});

/* ---------- Init ---------- */

function init() {
  updateUnitButtons();
  if (!getApiKey()) return showOnly("setup");
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE.query));
    if (saved) return loadWeather(saved);
  } catch {
    localStorage.removeItem(STORAGE.query);
  }
  showOnly("welcome");
}

init();
