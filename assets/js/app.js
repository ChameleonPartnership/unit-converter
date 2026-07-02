(function () {
  "use strict";

  const STORAGE_KEYS = {
    history: "unitConverterHistory"
  };

  const categories = {
    temperature: {
      label: "Temperature",
      units: {
        c: { label: "Celsius (C)" },
        f: { label: "Fahrenheit (F)" },
        k: { label: "Kelvin (K)" }
      },
      toBase(value, unit) {
        if (unit === "f") return (value - 32) * 5 / 9;
        if (unit === "k") return value - 273.15;
        return value;
      },
      fromBase(value, unit) {
        if (unit === "f") return value * 9 / 5 + 32;
        if (unit === "k") return value + 273.15;
        return value;
      }
    },
    length: {
      label: "Length",
      units: {
        mm: { label: "Millimeter (mm)", factor: 0.001 },
        cm: { label: "Centimeter (cm)", factor: 0.01 },
        m: { label: "Meter (m)", factor: 1 },
        km: { label: "Kilometer (km)", factor: 1000 },
        inch: { label: "Inch (in)", factor: 0.0254 },
        foot: { label: "Foot (ft)", factor: 0.3048 },
        yard: { label: "Yard (yd)", factor: 0.9144 },
        mile: { label: "Mile (mi)", factor: 1609.344 }
      }
    },
    weight: {
      label: "Weight",
      units: {
        mg: { label: "Milligram (mg)", factor: 0.000001 },
        g: { label: "Gram (g)", factor: 0.001 },
        kg: { label: "Kilogram (kg)", factor: 1 },
        oz: { label: "Ounce (oz)", factor: 0.028349523125 },
        lb: { label: "Pound (lb)", factor: 0.45359237 },
        ton: { label: "US Ton (ton)", factor: 907.18474 }
      }
    },
    volume: {
      label: "Volume",
      units: {
        ml: { label: "Milliliter (mL)", factor: 0.001 },
        l: { label: "Liter (L)", factor: 1 },
        floz: { label: "Fluid ounce (fl oz)", factor: 0.0295735295625 },
        cup: { label: "Cup (US)", factor: 0.2365882365 },
        pint: { label: "Pint (US)", factor: 0.473176473 },
        gallon: { label: "Gallon (US)", factor: 3.785411784 }
      }
    },
    pressure: {
      label: "Pressure",
      units: {
        pa: { label: "Pascal (Pa)", factor: 1 },
        kpa: { label: "Kilopascal (kPa)", factor: 1000 },
        bar: { label: "Bar (bar)", factor: 100000 },
        psi: { label: "Pound/sq inch (psi)", factor: 6894.757293168 },
        atm: { label: "Atmosphere (atm)", factor: 101325 }
      }
    },
    speed: {
      label: "Speed",
      units: {
        ms: { label: "Meter/second (m/s)", factor: 1 },
        kmh: { label: "Kilometer/hour (km/h)", factor: 0.27777777777778 },
        mph: { label: "Mile/hour (mph)", factor: 0.44704 },
        knots: { label: "Knot (kn)", factor: 0.51444444444444 }
      }
    },
    area: {
      label: "Area",
      units: {
        mm2: { label: "Square millimeter (mm²)", factor: 0.000001 },
        cm2: { label: "Square centimeter (cm²)", factor: 0.0001 },
        m2: { label: "Square meter (m²)", factor: 1 },
        km2: { label: "Square kilometer (km²)", factor: 1000000 },
        sqin: { label: "Square inch (in²)", factor: 0.00064516 },
        sqft: { label: "Square foot (ft²)", factor: 0.09290304 },
        acre: { label: "Acre", factor: 4046.8564224 }
      }
    }
  };

  const defaultUnits = {
    temperature: ["c", "f"],
    length: ["m", "cm"],
    weight: ["kg", "lb"],
    volume: ["l", "gallon"],
    pressure: ["kpa", "psi"],
    speed: ["kmh", "mph"],
    area: ["m2", "sqft"]
  };

  const elements = {
    form: document.getElementById("converterForm"),
    category: document.getElementById("category"),
    fromValue: document.getElementById("fromValue"),
    toValue: document.getElementById("toValue"),
    fromUnit: document.getElementById("fromUnit"),
    toUnit: document.getElementById("toUnit"),
    resultText: document.getElementById("resultText"),
    status: document.getElementById("statusMessage"),
    copyButton: document.getElementById("copyButton"),
    shareButton: document.getElementById("shareButton"),
    swapButton: document.getElementById("swapUnits"),
    historyList: document.getElementById("historyList"),
    clearHistory: document.getElementById("clearHistory")
  };

  let activeInput = "from";
  let lastResult = "";
  let history = readJson(STORAGE_KEYS.history, []);
  let historyTimer = 0;

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "";
    return new Intl.NumberFormat("en", {
      maximumFractionDigits: 10,
      minimumFractionDigits: 0
    }).format(Number.parseFloat(value.toPrecision(12)));
  }

  function getUnitLabel(categoryKey, unitKey) {
    return categories[categoryKey].units[unitKey].label;
  }

  function convert(value, categoryKey, fromUnit, toUnit) {
    const category = categories[categoryKey];
    if (category.toBase && category.fromBase) {
      return category.fromBase(category.toBase(value, fromUnit), toUnit);
    }
    return value * category.units[fromUnit].factor / category.units[toUnit].factor;
  }

  function populateCategories() {
    elements.category.innerHTML = Object.entries(categories)
      .map(([key, category]) => `<option value="${key}">${category.label}</option>`)
      .join("");
  }

  function populateUnits() {
    const categoryKey = elements.category.value;
    const options = Object.entries(categories[categoryKey].units)
      .map(([key, unit]) => `<option value="${key}">${unit.label}</option>`)
      .join("");

    elements.fromUnit.innerHTML = options;
    elements.toUnit.innerHTML = options;
    elements.fromUnit.value = defaultUnits[categoryKey][0];
    elements.toUnit.value = defaultUnits[categoryKey][1];
    calculate();
  }

  function calculate() {
    const categoryKey = elements.category.value;
    const fromUnit = elements.fromUnit.value;
    const toUnit = elements.toUnit.value;
    const source = activeInput === "to" ? elements.toValue : elements.fromValue;
    const target = activeInput === "to" ? elements.fromValue : elements.toValue;
    const sourceUnit = activeInput === "to" ? toUnit : fromUnit;
    const targetUnit = activeInput === "to" ? fromUnit : toUnit;
    const rawValue = Number.parseFloat(source.value);

    if (!Number.isFinite(rawValue)) {
      target.value = "";
      elements.resultText.textContent = "Enter a number to convert.";
      return;
    }

    const result = convert(rawValue, categoryKey, sourceUnit, targetUnit);
    target.value = Number.parseFloat(result.toPrecision(12));

    const sourceLabel = getUnitLabel(categoryKey, sourceUnit);
    const targetLabel = getUnitLabel(categoryKey, targetUnit);
    lastResult = `${formatNumber(rawValue)} ${sourceLabel} = ${formatNumber(result)} ${targetLabel}`;
    elements.resultText.textContent = lastResult;
  }

  function saveHistory() {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  }

  function renderHistory() {
    if (history.length === 0) {
      elements.historyList.replaceChildren(createHistoryItem("No recent conversions yet."));
      return;
    }

    elements.historyList.replaceChildren(...history.map(createHistoryItem));
  }

  function createHistoryItem(text) {
    const item = document.createElement("li");
    item.textContent = text;
    return item;
  }

  function addHistory() {
    if (!lastResult || lastResult === history[0]) return;
    history = [lastResult, ...history.filter((item) => item !== lastResult)].slice(0, 5);
    saveHistory();
    renderHistory();
  }

  function scheduleHistory() {
    window.clearTimeout(historyTimer);
    historyTimer = window.setTimeout(addHistory, 650);
  }

  async function copyResult() {
    if (!lastResult) return;
    try {
      await navigator.clipboard.writeText(lastResult);
      addHistory();
      setStatus("Result copied.");
    } catch (_error) {
      setStatus("Copy failed. Select the result text and copy manually.");
    }
  }

  async function shareResult() {
    const shareData = {
      title: "Unit Converter",
      text: lastResult || "Unit Converter",
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setStatus("Share dialog opened.");
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setStatus("Share link copied.");
      }
      addHistory();
    } catch (_error) {
      setStatus("Share canceled.");
    }
  }

  function setStatus(message) {
    elements.status.textContent = message;
    window.clearTimeout(setStatus.timeout);
    setStatus.timeout = window.setTimeout(() => {
      elements.status.textContent = "";
    }, 2400);
  }

  function bindEvents() {
    elements.category.addEventListener("change", () => {
      populateUnits();
      scheduleHistory();
    });

    elements.fromUnit.addEventListener("change", () => {
      calculate();
      scheduleHistory();
    });

    elements.toUnit.addEventListener("change", () => {
      calculate();
      scheduleHistory();
    });

    elements.fromValue.addEventListener("input", () => {
      activeInput = "from";
      calculate();
      scheduleHistory();
    });

    elements.toValue.addEventListener("input", () => {
      activeInput = "to";
      calculate();
      scheduleHistory();
    });

    elements.form.addEventListener("submit", (event) => {
      event.preventDefault();
      calculate();
      addHistory();
      setStatus("Conversion saved to history.");
    });

    elements.form.addEventListener("keydown", (event) => {
      const tagName = event.target.tagName.toLowerCase();
      if (tagName === "select" || tagName === "button") return;

      if (event.key === "Enter") {
        event.preventDefault();
        calculate();
        addHistory();
      }
    });

    elements.copyButton.addEventListener("click", copyResult);
    elements.shareButton.addEventListener("click", shareResult);

    elements.swapButton.addEventListener("click", () => {
      const previousFrom = elements.fromUnit.value;
      elements.fromUnit.value = elements.toUnit.value;
      elements.toUnit.value = previousFrom;
      activeInput = "from";
      calculate();
      addHistory();
    });

    elements.clearHistory.addEventListener("click", () => {
      history = [];
      saveHistory();
      renderHistory();
      setStatus("History cleared.");
    });
  }

  populateCategories();
  populateUnits();
  renderHistory();
  bindEvents();
})();
