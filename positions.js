function formatPositionMoney(value) {
  const sign = value < 0 ? "−" : "+";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

function updatePositions() {
  let total = 0;
  document.querySelectorAll("[data-position]").forEach((row) => {
    let pnl = Number(row.dataset.currentPnl || row.dataset.basePnl);
    pnl += (Math.random() - 0.49) * Number(row.dataset.drift);
    row.dataset.currentPnl = String(pnl);
    total += pnl;
    const pnlCell = row.querySelector(".position-pnl");
    pnlCell.textContent = formatPositionMoney(pnl);
    pnlCell.classList.toggle("positive-text", pnl >= 0);
    pnlCell.classList.toggle("negative-text", pnl < 0);

    const markCell = row.querySelector("[data-mark]");
    if (markCell) {
      const baseMark = Number(markCell.dataset.mark);
      const markDrift = (Math.random() - 0.5) * (baseMark > 1000 ? 2 : 0.00006);
      const mark = baseMark + markDrift;
      markCell.textContent = baseMark > 1000
        ? mark.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : mark.toFixed(5);
    }
  });

  document.querySelectorAll(".position-total, .position-summary-pnl").forEach((node) => {
    node.textContent = formatPositionMoney(total);
    node.classList.toggle("positive-text", total >= 0);
    node.classList.toggle("negative-text", total < 0);
  });

  const count = document.querySelectorAll("[data-position]").length;
  document.querySelectorAll("#position-count, #open-position-count").forEach((node) => {
    node.textContent = String(count).padStart(2, "0");
  });

  const empty = document.querySelector(".positions-empty");
  if (empty) empty.hidden = count > 0;
}

document.querySelectorAll(".position-close").forEach((button) => {
  button.addEventListener("click", () => {
    const symbol = button.closest("[data-position]").querySelector(".position-instrument strong").textContent;
    button.closest("[data-position]").remove();
    updatePositions();
    const toast = document.getElementById("toast");
    if (toast) {
      toast.textContent = `${symbol} demo position closed. No order was placed.`;
      toast.classList.add("show");
      window.setTimeout(() => toast.classList.remove("show"), 2600);
    }
  });
});

const positionRefresh = document.getElementById("position-refresh");
if (positionRefresh) {
  positionRefresh.addEventListener("click", () => {
    updatePositions();
    positionRefresh.textContent = "✓ Updated";
    window.setTimeout(() => { positionRefresh.textContent = "↻ Refresh view"; }, 900);
  });
}

updatePositions();
window.setInterval(updatePositions, 1800);
