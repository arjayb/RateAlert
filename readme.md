# RateAlert — Real-Time Currency Tracker with Notifications

A trading-terminal-styled currency tracker: pick a pair, watch a live
sparkline build tick by tick, and arm a threshold so you're notified the
moment a rate crosses the level you care about.

**Live demo:** _add your GitHub Pages link here_

## Why this project

Most currency converters are one-shot lookups. This one treats a currency
pair the way a trading terminal treats a ticker — polling on an interval,
charting the trend, and firing an alert on a threshold — which is a more
realistic shape for anyone timing a transfer or watching a volatile pair.

## Features

- Live polling (every 15 seconds) of any supported currency pair while the
  tab is open
- Rolling sparkline chart of the last 40 ticks, rendered in plain SVG
- Threshold alerts ("notify me when USD/PHP goes above 58.50") with an
  in-page log and an optional browser `Notification`
- Terminal-style UI: monospace type, amber ticker display, up/down deltas
- No backend, no login, no API key required

## Tech stack

- Vanilla JavaScript (ES2020+)
- [open.er-api.com](https://www.exchangerate-api.com/) — free, keyless
  exchange-rate API
- Native SVG for the sparkline
- Browser [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) (optional, permission-gated)

## Running locally

```bash
git clone https://github.com/arjayb/RateAlert.git
cd RateAlert
npx serve .
```

## Known limitations

- This is a static, client-only demo: polling and alerts only run while
  the browser tab is open. A production version would need a small
  backend or scheduled worker to push alerts when the tab is closed.
- The free rate API updates roughly hourly upstream, so ticks may repeat
  the same value between upstream refreshes even though the app polls
  every 15 seconds.

## Possible next steps

- Server-side polling + email/SMS/push alerts that work tab-closed
- Multiple simultaneous watched pairs
- Configurable poll interval and history window

## License

MIT
