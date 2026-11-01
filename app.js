const marketData = {
  "EUR/USD": { price: 1.0842, change: "+0.0028 (0.26%)", icon: "€", iconClass: "blue", name: "Euro / US Dollar", tradingView: "OANDA:EURUSD", range: 0.00072 },
  "GBP/USD": { price: 1.2718, change: "+0.0018 (0.14%)", icon: "£", iconClass: "purple", name: "British Pound / US Dollar", tradingView: "OANDA:GBPUSD", range: 0.00085 },
  "XAU/USD": { price: 2341.6, change: "−8.90 (−0.38%)", icon: "Au", iconClass: "gold", name: "Gold / US Dollar", tradingView: "OANDA:XAUUSD", range: 5.4 },
  "BTC/USD": { price: 67420, change: "+1,843.00 (2.81%)", icon: "₿", iconClass: "orange", name: "Bitcoin / US Dollar", tradingView: "BITSTAMP:BTCUSD", range: 165 }
};

const canvas = document.getElementById("price-chart");
const context = canvas.getContext("2d");
const tooltip = document.getElementById("chart-tooltip");
const chartPanel = document.querySelector(".chart-panel");
const chartPeriods = document.querySelectorAll(".timeframes button");
let activeSymbol = "EUR/USD";
let activePeriod = "4H";
let chartValues = [];
let toastTimeout;

function createSeries(symbol, period) {
  const points = period === "1H" ? 48 : period === "1D" ? 84 : period === "1W" ? 96 : 72;
  let value = 0.48;
  const series = [];
  let seed = symbol.split("").reduce((total, character) => total + character.charCodeAt(0), period.length * 71);
  for (let index = 0; index < points; index += 1) {
    seed = (seed * 9301 + 49297) % 233280;
    const noise = (seed / 233280 - 0.48) * 0.18;
    const trend = index / points * 0.2;
    value = Math.max(0.13, Math.min(0.88, value + noise + (index > points * 0.54 ? 0.002 : -0.0007)));
    series.push(Math.min(0.91, Math.max(0.09, value + trend - 0.1)));
  }
  chartValues = series;
  return series;
}

function drawChart() {
  if (!canvas || !context) return;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const width = rect.width;
  const height = rect.height;
  const padTop = 7;
  const padBottom = 8;
  const usableHeight = height - padTop - padBottom;
  const data = marketData[activeSymbol];
  const up = !data.change.startsWith("−");
  const lineColor = up ? "#4dd5a4" : "#f07482";
  const points = chartValues.length ? chartValues : createSeries(activeSymbol, activePeriod);

  context.clearRect(0, 0, width, height);
  context.strokeStyle = "rgba(109,132,161,.12)";
  context.lineWidth = 1;
  for (let row = 0; row <= 4; row += 1) {
    const y = padTop + usableHeight * row / 4;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  for (let column = 0; column <= 6; column += 1) {
    const x = width * column / 6;
    context.beginPath();
    context.moveTo(x, padTop);
    context.lineTo(x, height - padBottom);
    context.stroke();
  }

  const coordinates = points.map((value, index) => ({
    x: index * width / (points.length - 1),
    y: padTop + (1 - value) * usableHeight
  }));
  context.beginPath();
  coordinates.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  const fill = context.createLinearGradient(0, padTop, 0, height);
  fill.addColorStop(0, up ? "rgba(77,213,164,.18)" : "rgba(240,116,130,.18)");
  fill.addColorStop(1, "rgba(77,213,164,0)");
  context.fillStyle = fill;
  context.fill();

  context.beginPath();
  coordinates.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
  context.strokeStyle = lineColor;
  context.lineWidth = 1.8;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.stroke();

  const last = coordinates[coordinates.length - 1];
  context.beginPath();
  context.arc(last.x, last.y, 3, 0, Math.PI * 2);
  context.fillStyle = lineColor;
  context.fill();
  context.beginPath();
  context.arc(last.x, last.y, 6, 0, Math.PI * 2);
  context.strokeStyle = up ? "rgba(77,213,164,.25)" : "rgba(240,116,130,.25)";
  context.lineWidth = 1;
  context.stroke();
}

function showMarket(symbol) {
  if (!marketData[symbol]) return;
  activeSymbol = symbol;
  const data = marketData[symbol];
  document.getElementById("chart-symbol").textContent = symbol;
  document.getElementById("chart-price").textContent = formatPrice(data.price, symbol);
  document.querySelector(".quote-change").textContent = data.change;
  document.querySelector(".quote-change").classList.toggle("negative-text", data.change.startsWith("−"));
  document.querySelector(".quote-change").classList.toggle("positive-text", !data.change.startsWith("−"));
  document.getElementById("chart-icon").textContent = data.icon;
  document.getElementById("chart-icon").className = `currency-icon large-icon ${data.iconClass}`;
  document.querySelector(".instrument-description").textContent = data.name;
  document.getElementById("tradingview-link").href = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(data.tradingView)}`;
  document.querySelectorAll(".watch-item").forEach((item) => item.classList.toggle("selected", item.dataset.symbol === symbol));
  chartValues = createSeries(symbol, activePeriod);
  drawChart();
}

function formatPrice(price, symbol) {
  if (symbol === "XAU/USD") return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (symbol === "BTC/USD") return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return price.toFixed(4);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("show"), 2800);
}

const modalContent = {
  premium: {
    kicker: "CRESTVIEW PRO",
    title: "Get more from your market view",
    copy: "Unlock advanced analysis, premium signals, and more tools for your trading workflow.",
    primary: "Explore plans",
    symbol: "✦"
  },
  account: {
    kicker: "DEMO ACCOUNT",
    title: "Your practice workspace",
    copy: "You’re exploring Crestview in demo mode. Balances, signals, prices, and bots shown here are simulated.",
    primary: "Got it",
    symbol: "JD"
  },
  notifications: {
    kicker: "NOTIFICATIONS",
    title: "You’re all caught up",
    copy: "We’ll show market alerts, signal updates, and bot activity here.",
    primary: "Sounds good",
    symbol: "♧"
  },
  analysis: {
    kicker: "EUR/USD · MARKET PULSE",
    title: "Buyers are in control",
    copy: "This demo sentiment snapshot combines illustrative momentum, trend, and volatility signals. It is not a forecast or investment advice.",
    primary: "View chart",
    symbol: "↗"
  },
  bots: {
    kicker: "BOT MARKETPLACE",
    title: "Find a bot for your strategy",
    copy: "Browse demo strategies for forex, metals, and crypto. Bots in this preview do not connect to a broker or place real trades.",
    primary: "Browse demo bots",
    symbol: "⌘"
  }
};

function openModal(type) {
  const content = modalContent[type] || modalContent.premium;
  document.getElementById("modal-kicker").textContent = content.kicker;
  document.getElementById("modal-title").textContent = content.title;
  document.getElementById("modal-copy").textContent = content.copy;
  document.getElementById("modal-primary").innerHTML = `${content.primary} <span>→</span>`;
  document.getElementById("modal-symbol").textContent = content.symbol;
  const backdrop = document.getElementById("modal-backdrop");
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  document.getElementById("modal-close").focus();
}

function closeModal() {
  const backdrop = document.getElementById("modal-backdrop");
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
}

function calculatePosition() {
  const balance = Number(document.getElementById("calc-balance").value);
  const riskPercent = Number(document.getElementById("calc-risk").value);
  const stopPips = Number(document.getElementById("calc-stop").value);
  const pipValue = Number(document.getElementById("calc-pair").value);
  const valid = Number.isFinite(balance) && balance > 0 && Number.isFinite(riskPercent) && riskPercent > 0 &&
    Number.isFinite(stopPips) && stopPips > 0 && Number.isFinite(pipValue) && pipValue > 0;
  const lotResult = document.getElementById("lot-result");
  const riskResult = document.getElementById("risk-result");
  if (!valid) {
    lotResult.innerHTML = "— <small>lots</small>";
    riskResult.textContent = "—";
    return;
  }
  const maxRisk = balance * riskPercent / 100;
  const lots = maxRisk / (stopPips * pipValue);
  lotResult.innerHTML = `${lots.toFixed(2)} <small>lots</small>`;
  riskResult.textContent = `$${maxRisk.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

document.querySelectorAll(".watch-item").forEach((button) => {
  button.addEventListener("click", () => showMarket(button.dataset.symbol));
});

document.querySelectorAll("[data-market]").forEach((row) => {
  row.addEventListener("click", (event) => {
    if (event.target.closest("button") || event.target.closest("td")) showMarket(row.dataset.market);
  });
});

chartPeriods.forEach((button) => {
  button.addEventListener("click", () => {
    activePeriod = button.dataset.period;
    chartPeriods.forEach((periodButton) => periodButton.classList.toggle("selected", periodButton === button));
    chartValues = createSeries(activeSymbol, activePeriod);
    drawChart();
  });
});

document.querySelectorAll("[data-modal]").forEach((button) => {
  button.addEventListener("click", () => openModal(button.dataset.modal));
});

document.getElementById("modal-close").addEventListener("click", closeModal);
document.getElementById("modal-secondary").addEventListener("click", closeModal);
document.getElementById("modal-backdrop").addEventListener("click", (event) => {
  if (event.target.id === "modal-backdrop") closeModal();
});
document.getElementById("modal-primary").addEventListener("click", () => {
  const title = document.getElementById("modal-title").textContent;
  closeModal();
  showToast(title.includes("practice") || title.includes("caught") ? "You’re all set — this is a demo workspace." : "Marketplace preview coming soon.");
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
    closeNavigationMenu();
    document.body.classList.remove("chart-expanded");
  }
});

document.querySelectorAll(".bot-toggle").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const enabled = toggle.classList.toggle("on");
    toggle.setAttribute("aria-pressed", String(enabled));
    const bot = toggle.closest(".bot-card");
    const status = bot.querySelector(".bot-status");
    status.classList.toggle("running", enabled);
    status.classList.toggle("paused", !enabled);
    status.innerHTML = `<i></i> ${enabled ? "RUNNING" : "PAUSED"}`;
    toggle.setAttribute("aria-label", `${enabled ? "Pause" : "Start"} ${bot.querySelector("h3").textContent} bot`);
    showToast(`${bot.querySelector("h3").textContent} ${enabled ? "started" : "paused"} in demo mode.`);
  });
});

["calc-balance", "calc-risk", "calc-stop", "calc-pair"].forEach((id) => {
  document.getElementById(id).addEventListener("input", calculatePosition);
  document.getElementById(id).addEventListener("change", calculatePosition);
});

document.getElementById("refresh-button").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const overlay = document.getElementById("refresh-overlay");
  const progress = document.getElementById("refresh-progress");
  const percentage = document.getElementById("refresh-percent");
  const refreshDuration = 1500;
  const startedAt = performance.now();
  button.disabled = true;
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden", "false");
  progress.style.width = "0%";
  percentage.textContent = "0%";
  function updateProgress(now) {
    const percent = Math.min(100, Math.floor(((now - startedAt) / refreshDuration) * 100));
    progress.style.width = `${percent}%`;
    percentage.textContent = `${percent}%`;
    if (percent < 100) {
      window.requestAnimationFrame(updateProgress);
      return;
    }
    chartValues = createSeries(activeSymbol, activePeriod);
    drawChart();
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    showToast("Demo market view refreshed.");
    button.disabled = false;
  }
  window.requestAnimationFrame(updateProgress);
});

document.getElementById("expand-chart").addEventListener("click", () => {
  document.body.classList.toggle("chart-expanded");
  window.setTimeout(drawChart, 50);
});

const mobileNavBackdrop = document.getElementById("mobile-nav-backdrop");
function closeNavigationMenu() {
  document.getElementById("sidebar").classList.remove("open");
  mobileNavBackdrop.classList.remove("open");
}
document.getElementById("menu-toggle").addEventListener("click", () => {
  const sidebar = document.getElementById("sidebar");
  const open = !sidebar.classList.contains("open");
  sidebar.classList.toggle("open", open);
  mobileNavBackdrop.classList.toggle("open", open);
});
mobileNavBackdrop.addEventListener("click", closeNavigationMenu);
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    closeNavigationMenu();
  });
});

document.querySelectorAll(".watch-add").forEach((button) => {
  button.addEventListener("click", () => showToast("Your watchlist is full in this demo."));
});
document.querySelector(".calendar-date").addEventListener("click", () => showToast("Showing the demo event schedule for November 1."));

canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const ratio = (event.clientX - rect.left) / rect.width;
  const index = Math.min(chartValues.length - 1, Math.max(0, Math.round(ratio * (chartValues.length - 1))));
  const value = marketData[activeSymbol].price + (chartValues[index] - chartValues[chartValues.length - 1]) * marketData[activeSymbol].range;
  tooltip.textContent = formatPrice(value, activeSymbol);
  tooltip.style.display = "block";
  tooltip.style.left = `${Math.min(rect.width - 65, Math.max(4, event.clientX - rect.left + 8))}px`;
  tooltip.style.top = `${Math.max(3, event.clientY - rect.top - 24)}px`;
});
canvas.addEventListener("pointerleave", () => { tooltip.style.display = "none"; });
window.addEventListener("resize", drawChart);

const chartResizeObserver = new ResizeObserver(drawChart);
chartResizeObserver.observe(chartPanel);
chartValues = createSeries(activeSymbol, activePeriod);
calculatePosition();
drawChart();
