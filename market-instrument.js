const instruments = {
  "EUR/USD": { price: 1.0842, change: "+0.26%", name: "Euro / US Dollar", asset: "Forex", range: "1.0808 — 1.0871", amplitude: 0.00055, direction: 1, tv: "OANDA:EURUSD" },
  "GBP/USD": { price: 1.2718, change: "+0.14%", name: "British Pound / US Dollar", asset: "Forex", range: "1.2674 — 1.2762", amplitude: 0.00069, direction: 1, tv: "OANDA:GBPUSD" },
  "XAU/USD": { price: 2341.6, change: "−0.38%", name: "Gold / US Dollar", asset: "Metals", range: "2,328.20 — 2,359.80", amplitude: 4.2, direction: -1, tv: "OANDA:XAUUSD" },
  "BTC/USD": { price: 67420, change: "+2.81%", name: "Bitcoin / US Dollar", asset: "Crypto", range: "65,180 — 68,140", amplitude: 125, direction: 1, tv: "BITSTAMP:BTCUSD" }
};

const symbol = document.body.dataset.instrument;
const instrument = instruments[symbol];
const canvas = document.getElementById("instrument-chart");
const context = canvas.getContext("2d");
let period = "4H";

function priceText(value) {
  if (symbol === "XAU/USD") return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (symbol === "BTC/USD") return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return value.toFixed(4);
}

function renderInstrument() {
  document.querySelectorAll(".instrument-price").forEach((node) => { node.textContent = priceText(instrument.price); });
  document.querySelectorAll(".instrument-change").forEach((node) => {
    node.textContent = instrument.change;
    node.classList.toggle("negative-text", instrument.direction < 0);
    node.classList.toggle("positive-text", instrument.direction > 0);
  });
  document.querySelectorAll(".instrument-symbol").forEach((node) => { node.textContent = symbol; });
  document.querySelectorAll(".instrument-class").forEach((node) => { node.textContent = instrument.asset; });
  document.querySelectorAll(".instrument-range").forEach((node) => { node.textContent = instrument.range; });
  document.querySelectorAll(".instrument-description-title").forEach((node) => { node.textContent = instrument.name; });
  document.querySelectorAll(".instrument-description-copy").forEach((node) => {
    node.textContent = `The ${instrument.name} market pairs ${instrument.name.split(" / ")[0]} with ${instrument.name.split(" / ")[1]}. Explore its price action in a simulated ${period} demo view. Prices and chart values are illustrative examples, not current quotes or trading advice.`;
  });
  const tradingView = document.querySelector(".page-heading .outline-button");
  if (tradingView) tradingView.href = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(instrument.tv)}`;
  drawInstrumentChart();
}

function drawInstrumentChart() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const width = rect.width;
  const height = rect.height;
  context.clearRect(0, 0, width, height);
  context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--chart-grid").trim() || "rgba(120,140,165,.16)";
  context.lineWidth = 1;
  for (let row = 0; row <= 4; row += 1) {
    const y = 8 + (height - 16) * row / 4;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  const count = period === "1H" ? 48 : period === "1D" ? 84 : period === "1W" ? 96 : 72;
  const points = [];
  let seed = symbol.split("").reduce((total, character) => total + character.charCodeAt(0), period.length * 113);
  let value = 0.5;
  for (let index = 0; index < count; index += 1) {
    seed = (seed * 9301 + 49297) % 233280;
    value = Math.max(.12, Math.min(.88, value + (seed / 233280 - .49) * .17 + instrument.direction * .001));
    points.push({ x: index * width / (count - 1), y: 8 + (1 - value) * (height - 16) });
  }
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  const color = instrument.direction > 0 ? "#39d6a0" : "#ff7180";
  const fill = context.createLinearGradient(0, 0, 0, height);
  fill.addColorStop(0, instrument.direction > 0 ? "rgba(57,214,160,.2)" : "rgba(255,113,128,.2)");
  fill.addColorStop(1, "rgba(57,214,160,0)");
  context.fillStyle = fill;
  context.fill();
  context.beginPath();
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.stroke();
}

document.querySelectorAll("[data-instrument-period]").forEach((button) => {
  button.addEventListener("click", () => {
    period = button.dataset.instrumentPeriod;
    document.querySelectorAll("[data-instrument-period]").forEach((item) => item.classList.toggle("selected", item === button));
    renderInstrument();
  });
});
window.addEventListener("resize", drawInstrumentChart);
document.getElementById("menu-toggle").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("mobile-nav-backdrop").classList.toggle("open");
});
document.getElementById("mobile-nav-backdrop").addEventListener("click", () => {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("mobile-nav-backdrop").classList.remove("open");
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("mobile-nav-backdrop").classList.remove("open");
  }
});
document.querySelectorAll(".side-nav .nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("mobile-nav-backdrop").classList.remove("open");
  });
});
renderInstrument();
