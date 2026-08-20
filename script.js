// RateAlert — Real-Time Currency Tracker with Notifications
//
// Polls a free public exchange-rate API every 15 seconds while this tab
// stays open and charts a rolling history. This is a static demo: "alerts"
// fire as an on-page log entry plus a browser Notification (if the user
// grants permission) — there is no server, so nothing fires while the tab
// is closed. A production version would need a backend worker for that.

const POLL_MS = 15000;
const MAX_TICKS = 40;

const baseSelect = document.getElementById('base-currency');
const quoteSelect = document.getElementById('quote-currency');
const watchBtn = document.getElementById('watch-btn');
const thresholdInput = document.getElementById('threshold');
const thresholdDir = document.getElementById('threshold-dir');
const armBtn = document.getElementById('arm-btn');
const status = document.getElementById('status-line');
const tickerPanel = document.getElementById('ticker-panel');
const ratePairLabel = document.getElementById('rate-pair-label');
const rateValue = document.getElementById('rate-value');
const rateDelta = document.getElementById('rate-delta');
const spark = document.getElementById('spark');
const tickCount = document.getElementById('tick-count');
const log = document.getElementById('log');
const clock = document.getElementById('clock');

const SVG_NS = 'http://www.w3.org/2000/svg';

let pollTimer = null;
let history = [];
let armed = null; // { threshold, dir }
let alertFired = false;

setInterval(updateClock, 1000);
updateClock();

watchBtn.addEventListener('click', startWatching);
armBtn.addEventListener('click', armAlert);

function updateClock() {
  clock.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
}

function startWatching() {
  const base = baseSelect.value;
  const quote = quoteSelect.value;
  if (base === quote) {
    setStatus('Choose two different currencies.', 'error');
    return;
  }

  if (pollTimer) clearInterval(pollTimer);
  history = [];
  alertFired = false;
  armed = null;
  armBtn.disabled = false;
  log.innerHTML = '';
  ratePairLabel.textContent = `${base}/${quote}`;

  setStatus(`Watching ${base}/${quote} — polling every 15s.`, 'ok');
  tickerPanel.classList.remove('hidden');

  poll(base, quote);
  pollTimer = setInterval(() => poll(base, quote), POLL_MS);
}

async function poll(base, quote) {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    if (!res.ok) throw new Error('rate service unavailable');
    const data = await res.json();
    const rate = data.rates?.[quote];
    if (!rate) throw new Error('pair unavailable');

    const prev = history.length ? history[history.length - 1] : rate;
    history.push(rate);
    if (history.length > MAX_TICKS) history.shift();

    renderRate(rate, prev, base, quote);
    renderSpark();
    addLog(`${new Date().toLocaleTimeString('en-US', { hour12: false })}  1 ${base} = ${rate.toFixed(4)} ${quote}`);
    checkAlert(rate, base, quote);
  } catch (err) {
    addLog(`poll failed: ${err.message}`, true);
  }
}

function renderRate(rate, prev, base, quote) {
  rateValue.textContent = rate.toFixed(4);
  const pctChange = prev ? ((rate - prev) / prev) * 100 : 0;
  rateDelta.textContent = `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(3)}%`;
  rateDelta.classList.toggle('down', pctChange < 0);
  tickCount.textContent = history.length;
}

function renderSpark() {
  while (spark.firstChild) spark.removeChild(spark.firstChild);
  if (history.length < 2) return;

  const w = 600, h = 120, pad = 8;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;

  const points = history.map((v, i) => {
    const x = pad + (i / (history.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const path = document.createElementNS(SVG_NS, 'polyline');
  path.setAttribute('points', points.join(' '));
  path.setAttribute('class', 'spark-line');
  spark.appendChild(path);
}

function armAlert() {
  const threshold = parseFloat(thresholdInput.value);
  if (!threshold || threshold <= 0) {
    setStatus('Enter a valid threshold rate before arming.', 'error');
    return;
  }
  armed = { threshold, dir: thresholdDir.value };
  alertFired = false;
  setStatus(`Armed: alert when rate goes ${armed.dir} ${threshold}.`, 'ok');

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function checkAlert(rate, base, quote) {
  if (!armed || alertFired) return;
  const hit = armed.dir === 'above' ? rate > armed.threshold : rate < armed.threshold;
  if (!hit) return;

  alertFired = true;
  const msg = `ALERT: ${base}/${quote} went ${armed.dir} ${armed.threshold} — now ${rate.toFixed(4)}`;
  addLog(msg, false, true);
  setStatus(msg, 'ok');

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('RateAlert', { body: msg });
  }
}

function addLog(text, isError, isAlert) {
  const li = document.createElement('li');
  if (isAlert) li.className = 'alert';
  li.textContent = text;
  log.prepend(li);
  while (log.children.length > 30) log.removeChild(log.lastChild);
  if (isError) setStatus(text, 'error');
}

function setStatus(msg, kind) {
  status.textContent = msg;
  status.classList.toggle('error', kind === 'error');
  status.classList.toggle('ok', kind === 'ok');
}
