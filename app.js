// Currency conversion settings
const CURRENCIES = {
  USD: { symbol: "$", rate: 1 },
  EUR: { symbol: "€", rate: 0.92 },
  GBP: { symbol: "£", rate: 0.79 },
  BAM: { symbol: "KM", rate: 1.8 },
  CAD: { symbol: "C$", rate: 1.36 },
  AUD: { symbol: "A$", rate: 1.53 },
  CHF: { symbol: "Fr", rate: 0.9 },
  PLN: { symbol: "zł", rate: 3.92 },
  INR: { symbol: "₹", rate: 83.5 },
};

let selectedCurrency = "USD";

// Main form elements
const btnHourly = document.getElementById("btn-hourly");
const btnFixed = document.getElementById("btn-fixed");
const hourlyFields = document.getElementById("hourly-fields");
const fixedFields = document.getElementById("fixed-fields");

let mode = "hourly";

// Mode switch handlers
btnHourly.addEventListener("click", () => {
  mode = "hourly";
  btnHourly.classList.add("active");
  btnFixed.classList.remove("active");
  hourlyFields.classList.remove("hidden");
  fixedFields.classList.add("hidden");
});

btnFixed.addEventListener("click", () => {
  mode = "fixed";
  btnFixed.classList.add("active");
  btnHourly.classList.remove("active");
  fixedFields.classList.remove("hidden");
  hourlyFields.classList.add("hidden");
});

// Currency selector handlers
document.querySelectorAll(".cur-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedCurrency = btn.dataset.currency;
    document
      .querySelectorAll(".cur-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    calc();
  });
});

//final price count-up animation
let animationFrame;
let currentDisplayed = 0;

function animateNet(targetUSD) {
  const { symbol, rate } = CURRENCIES[selectedCurrency];
  const target = targetUSD * rate;
  const duration = 400;
  const start = currentDisplayed;
  const startTime = performance.now();

  cancelAnimationFrame(animationFrame);

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * eased;

    document.getElementById("stat-net").textContent =
      symbol +
      current.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    if (progress < 1) {
      animationFrame = requestAnimationFrame(step);
    } else {
      currentDisplayed = target;
    }
  }

  animationFrame = requestAnimationFrame(step);
}

// Recalculate when numeric inputs change
const inputs = document.querySelectorAll('input[type="number"]');
inputs.forEach((input) => input.addEventListener("input", calc));

// Format a USD amount in the selected currency
function fmt(usd) {
  const { symbol, rate } = CURRENCIES[selectedCurrency];
  const val = usd * rate;
  return (
    symbol +
    val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// max values
function clamp(id, min, max) {
  const input = document.getElementById(id);
  let val = parseFloat(input.value);
  if (val > max) input.value = max;
  if (val < min) input.value = min;
}

// Calculate totals and update the page
function calc() {
  clamp("hourly-rate", 1, 9999);
  clamp("hours", 1, 999999);
  clamp("fixed-price", 1, 99999999);
  clamp("fee", 0, 100);
  clamp("connects", 0, 99999);

  let gross = 0;

  // Choose gross total based on the selected pricing mode
  if (mode === "hourly") {
    const rate = parseFloat(document.getElementById("hourly-rate").value) || 0;
    const hours = parseFloat(document.getElementById("hours").value) || 0;
    gross = rate * hours;
  } else {
    gross = parseFloat(document.getElementById("fixed-price").value) || 0;
  }

  // Read fee and connects inputs
  const feePct = Math.min(
    15,
    Math.max(0, parseFloat(document.getElementById("fee").value) || 0),
  );
  const connects = Math.max(
    0,
    parseInt(document.getElementById("connects").value) || 0,
  );

  // Calculate deductions and final values
  const feeCost = (gross * feePct) / 100;
  const connectsCost = connects * 0.15;
  const net = gross - feeCost - connectsCost;
  const effectiveRate =
    gross > 0 ? ((feeCost + connectsCost) / gross) * 100 : 0;

  // Update summary stats
  const keepRate = gross > 0 ? (net / gross) * 100 : 0;

  animateNet(net);

  document.getElementById("stat-gross").textContent = fmt(gross);
  document.getElementById("stat-rate").textContent = keepRate.toFixed(1) + "%";
  document.getElementById("progress-bar").style.width =
    keepRate.toFixed(1) + "%";

  document.getElementById("bd-gross").textContent = fmt(gross);
  document.getElementById("bd-fee").textContent = "−" + fmt(feeCost);
  document.getElementById("bd-fee-label").textContent =
    "Service fee (" + feePct + "%)";

  document.getElementById("bd-connects").textContent = "−" + fmt(connectsCost);
  document.getElementById("bd-connects-label").textContent =
    "Connects (" + connects + ")";
    
  document.getElementById("bd-net").textContent = fmt(net);

  document.getElementById("stat-deducted").textContent =
    effectiveRate.toFixed(1) + "%";
}

// Initial render
calc();
