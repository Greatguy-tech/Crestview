const toast = document.getElementById("toast");
let toastTimer;

function showPageToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.getElementById("sidebar");
const menuBackdrop = document.getElementById("mobile-nav-backdrop");
function closeMobileMenu() {
  if (sidebar) sidebar.classList.remove("open");
  if (menuBackdrop) menuBackdrop.classList.remove("open");
}
if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const open = !sidebar.classList.contains("open");
    sidebar.classList.toggle("open", open);
    if (menuBackdrop) menuBackdrop.classList.toggle("open", open);
  });
}
if (menuBackdrop) menuBackdrop.addEventListener("click", closeMobileMenu);

document.querySelectorAll(".side-nav .nav-link").forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
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
    showPageToast(`${bot.querySelector("h3").textContent} ${enabled ? "started" : "paused"} in demo mode.`);
    const activeCount = document.querySelectorAll(".bot-toggle.on").length;
    const activeBots = document.getElementById("active-bots");
    if (activeBots) activeBots.textContent = String(activeCount).padStart(2, "0");
  });
});

document.querySelectorAll("[data-demo-toast]").forEach((button) => {
  button.addEventListener("click", () => showPageToast(button.dataset.demoToast));
});

document.querySelectorAll("[data-marketplace-action]").forEach((button) => {
  button.addEventListener("click", () => showPageToast("Strategy preview only — no broker connection or trades."));
});

const marketSearch = document.getElementById("market-search");
let selectedMarketFilter = "All";
function filterMarkets() {
  const query = marketSearch ? marketSearch.value.trim().toLowerCase() : "";
  let visibleCount = 0;
  document.querySelectorAll("[data-market-row]").forEach((row) => {
    const matchesAsset = selectedMarketFilter === "All" || row.dataset.asset === selectedMarketFilter;
    const matchesQuery = !query || row.dataset.name.includes(query) || row.textContent.toLowerCase().includes(query);
    const visible = matchesAsset && matchesQuery;
    row.hidden = !visible;
    if (visible) visibleCount += 1;
  });
  const empty = document.getElementById("markets-empty");
  if (empty) empty.hidden = visibleCount > 0;
}

document.querySelectorAll("[data-market-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedMarketFilter = button.dataset.marketFilter;
    document.querySelectorAll("[data-market-filter]").forEach((item) => item.classList.toggle("selected", item === button));
    filterMarkets();
  });
});
if (marketSearch) marketSearch.addEventListener("input", filterMarkets);

let selectedSignalFilter = "All";
function filterSignals() {
  let visibleCount = 0;
  document.querySelectorAll("[data-signal-type]").forEach((card) => {
    const typeMatches = !["Buy", "Sell"].includes(selectedSignalFilter) || card.dataset.signalType === selectedSignalFilter;
    const assetMatches = !["Forex", "Crypto"].includes(selectedSignalFilter) ||
      card.dataset.signalAsset.split(" ").includes(selectedSignalFilter);
    const visible = typeMatches && assetMatches;
    card.hidden = !visible;
    if (visible) visibleCount += 1;
  });
  const count = document.getElementById("signal-count");
  if (count) count.textContent = String(visibleCount);
  const empty = document.getElementById("signals-empty");
  if (empty) empty.hidden = visibleCount > 0;
}

document.querySelectorAll("[data-signal-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedSignalFilter = button.dataset.signalFilter;
    document.querySelectorAll("[data-signal-filter]").forEach((item) => item.classList.toggle("selected", item === button));
    filterSignals();
  });
});

function calculateRisk() {
  const balance = Number(document.getElementById("risk-balance").value);
  const riskPercent = Number(document.getElementById("risk-percent").value);
  const stop = Number(document.getElementById("risk-stop").value);
  const pipValuePerLot = Number(document.getElementById("risk-pip-value").value);
  const leverage = Number(document.getElementById("risk-leverage").value);
  const pairPrice = Number(document.getElementById("risk-price").value);
  const valid = [balance, riskPercent, stop, pipValuePerLot, leverage, pairPrice].every(Number.isFinite) &&
    balance > 0 && riskPercent > 0 && stop > 0 && pipValuePerLot > 0 && leverage > 0 && pairPrice > 0;
  const outputIds = ["risk-lots", "risk-max", "margin-required", "risk-as-percent", "pip-estimate"];
  if (!valid) {
    document.getElementById(outputIds[0]).innerHTML = "— <small>lots</small>";
    outputIds.slice(1).forEach((id) => { document.getElementById(id).textContent = "—"; });
    return;
  }
  const maxRisk = balance * riskPercent / 100;
  const lots = maxRisk / (stop * pipValuePerLot);
  const margin = (pairPrice * 100000 * lots) / leverage;
  const pipEstimate = lots * pipValuePerLot;
  document.getElementById("risk-lots").innerHTML = `${lots.toFixed(2)} <small>lots</small>`;
  document.getElementById("risk-max").textContent = `$${maxRisk.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById("margin-required").textContent = `$${margin.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.getElementById("risk-as-percent").textContent = `${((maxRisk / balance) * 100).toFixed(2)}%`;
  document.getElementById("pip-estimate").textContent = `$${pipEstimate.toFixed(2)} / pip`;
}

["risk-balance", "risk-percent", "risk-stop", "risk-pip-value", "risk-leverage", "risk-price"].forEach((id) => {
  const input = document.getElementById(id);
  if (input) {
    input.addEventListener("input", calculateRisk);
    input.addEventListener("change", calculateRisk);
  }
});
const riskPair = document.getElementById("risk-pip-value");
if (riskPair) {
  riskPair.addEventListener("change", () => {
    document.getElementById("risk-price").value = riskPair.selectedOptions[0].dataset.price;
    calculateRisk();
  });
}
if (document.getElementById("risk-balance")) calculateRisk();

const currencyFilter = document.getElementById("calendar-currency");
const impactFilter = document.getElementById("calendar-impact");
function filterCalendar() {
  const currency = currencyFilter.value;
  const impact = impactFilter.value;
  let visibleCount = 0;
  document.querySelectorAll(".calendar-event").forEach((event) => {
    const visible = (currency === "All" || event.dataset.currency === currency) &&
      (impact === "All" || event.dataset.impact === impact);
    event.hidden = !visible;
    if (visible) visibleCount += 1;
  });
  document.getElementById("calendar-empty").hidden = visibleCount > 0;
}
if (currencyFilter && impactFilter) {
  currencyFilter.addEventListener("change", filterCalendar);
  impactFilter.addEventListener("change", filterCalendar);
}

document.querySelectorAll(".event-expand").forEach((button) => {
  button.addEventListener("click", () => {
    const event = button.closest(".calendar-event");
    const expanded = event.classList.toggle("expanded");
    button.setAttribute("aria-expanded", String(expanded));
    button.textContent = expanded ? "⌃" : "⌄";
  });
});

const calendarDate = document.getElementById("calendar-date");
function showCalendarDate(dateString) {
  if (!dateString) return;
  const selectedDate = new Date(`${dateString}T12:00:00Z`);
  const isSampleDate = dateString === "2026-11-01";
  document.querySelector(".calendar-day-label strong").textContent = selectedDate.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", timeZone: "UTC"
  });
  document.querySelectorAll(".calendar-event").forEach((event) => { event.hidden = !isSampleDate; });
  const empty = document.getElementById("calendar-empty");
  empty.hidden = isSampleDate;
  empty.textContent = isSampleDate ? "No events match these filters." : "No sample events are available for this date.";
  if (isSampleDate) filterCalendar();
}

if (calendarDate) {
  calendarDate.addEventListener("change", () => showCalendarDate(calendarDate.value));
  ["calendar-prev", "calendar-next"].forEach((id) => {
    document.getElementById(id).addEventListener("click", () => {
      const selectedDate = new Date(`${calendarDate.value}T12:00:00Z`);
      selectedDate.setUTCDate(selectedDate.getUTCDate() + (id === "calendar-next" ? 1 : -1));
      calendarDate.value = selectedDate.toISOString().slice(0, 10);
      showCalendarDate(calendarDate.value);
    });
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileMenu();
});
