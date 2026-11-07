# Weather Dashboard

A responsive weather dashboard built with vanilla HTML, CSS and JavaScript. Search any city, or use your location, to see current conditions and a 5-day forecast from the OpenWeatherMap API.

## Features

- Search weather by city name
- Current temperature, conditions and "feels like" temperature
- Humidity, wind speed, atmospheric pressure
- Sunrise and sunset in the city's local time
- 5-day forecast with high/low temperatures and chance of rain
- Weather icons and a background that changes with the conditions
- Location detection (asks for permission first)
- Celsius / Fahrenheit toggle (no extra API request)
- Loading indicator and clear error messages for invalid cities, bad keys, and network problems
- Responsive layout for mobile, tablet and desktop

## Technologies used

- HTML5, CSS3 (grid, flexbox, glassmorphism), JavaScript (ES modules)
- [OpenWeatherMap API](https://openweathermap.org/api) (Current Weather and 5-day/3-hour Forecast)
- [Font Awesome](https://fontawesome.com) icons and the Sora typeface (loaded from CDNs)

## Screenshots

Add your screenshots to the `screenshots/` folder and link them here:

```md
![Desktop view](screenshots/desktop.png)
![Mobile view](screenshots/mobile.png)
```

## Installation

```bash
git clone https://github.com/<your-username>/Weather-Dashboard.git
cd Weather-Dashboard
```

## API setup

1. Create a free account at [openweathermap.org](https://openweathermap.org/api) and copy your API key. New keys can take up to two hours to activate.
2. Choose **one** option:
   - **In the app (easiest):** start the project and paste the key when prompted. It is stored only in your browser's `localStorage`.
   - **In the config file:** set `API_KEY` in `assets/js/config.js`, then run
     `git update-index --skip-worktree assets/js/config.js` so your key is never committed.

The committed `config.js` contains an empty key. Never push a real key to a public repository.

## How to run the project

The app uses ES modules and geolocation, so serve it over HTTP instead of opening the file directly:

```bash
# Python
python3 -m http.server 8000

# or Node.js
npx serve .
```

Then open `http://localhost:8000`. The VS Code **Live Server** extension also works.

## Folder structure

```
Weather-Dashboard/
├── index.html
├── README.md
├── LICENSE
├── .gitignore
├── assets/
│   ├── css/style.css      # Layout, themes, glassmorphism, responsive rules
│   ├── js/
│   │   ├── script.js      # UI rendering and events
│   │   ├── weather.js     # API requests, data shaping, unit helpers
│   │   └── config.js      # API configuration (keep the key empty in Git)
│   └── images/
└── screenshots/
```

## Future improvements

- Hourly forecast chart
- Recent and favourite cities
- City autocomplete using the geocoding API
- Air quality index and UV index
- Installable PWA with offline support

## Author

**Your Name**: [GitHub](https://github.com/your-username) · [LinkedIn](https://linkedin.com/in/your-profile)

## License

Released under the [MIT License](LICENSE).
