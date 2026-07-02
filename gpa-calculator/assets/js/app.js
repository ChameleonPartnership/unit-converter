(function () {
  "use strict";

  const STORAGE_KEYS = {
    history: "gpaCalculatorHistory",
    saved: "gpaCalculatorSavedState"
  };

  // Customization point: edit or add grade scales here for specific universities.
  const gradeScales = {
    standard4: {
      label: "Standard 4.0 scale",
      max: 4,
      grades: {
        "A+": 4.0, A: 4.0, "A-": 3.7,
        "B+": 3.3, B: 3.0, "B-": 2.7,
        "C+": 2.3, C: 2.0, "C-": 1.7,
        "D+": 1.3, D: 1.0, "D-": 0.7,
        F: 0
      }
    },
    plus43: {
      label: "4.3 scale",
      max: 4.3,
      grades: {
        "A+": 4.3, A: 4.0, "A-": 3.7,
        "B+": 3.3, B: 3.0, "B-": 2.7,
        "C+": 2.3, C: 2.0, "C-": 1.7,
        "D+": 1.3, D: 1.0, "D-": 0.7,
        F: 0
      }
    },
    five: {
      label: "5.0 honors/AP scale",
      max: 5,
      grades: {
        "A+": 5.0, A: 5.0, "A-": 4.7,
        "B+": 4.3, B: 4.0, "B-": 3.7,
        "C+": 3.3, C: 3.0, "C-": 2.7,
        "D+": 2.3, D: 2.0, "D-": 1.7,
        F: 0
      }
    },
    seven: {
      label: "7.0 university scale",
      max: 7,
      grades: {
        "A+": 7.0, A: 6.5, "A-": 6.0,
        "B+": 5.5, B: 5.0, "B-": 4.5,
        "C+": 4.0, C: 3.5, "C-": 3.0,
        "D+": 2.5, D: 2.0, "D-": 1.0,
        F: 0
      }
    }
  };

  const gradeOptions = Object.keys(gradeScales.standard4.grades);

  const elements = {
    form: document.getElementById("gpaForm"),
    tabs: Array.from(document.querySelectorAll(".tab-button")),
    panels: Array.from(document.querySelectorAll(".mode-panel")),
    calculator: document.getElementById("calculatorPanel"),
    rows: document.getElementById("courseRows"),
    addRow: document.getElementById("addRow"),
    scale: document.getElementById("scaleSelect"),
    conversionScale: document.getElementById("conversionScale"),
    conversionGrade: document.getElementById("conversionGrade"),
    conversionOutput: document.getElementById("conversionOutput"),
    currentGpa: document.getElementById("currentGpa"),
    currentCredits: document.getElementById("currentCredits"),
    futureCredits: document.getElementById("futureCredits"),
    targetGpa: document.getElementById("targetGpa"),
    result: document.getElementById("resultText"),
    detail: document.getElementById("resultDetail"),
    status: document.getElementById("statusMessage"),
    copy: document.getElementById("copyButton"),
    share: document.getElementById("shareButton"),
    history: document.getElementById("historyList"),
    clearHistory: document.getElementById("clearHistory")
  };

  let activeMode = "simple";
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

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function formatNumber(value, digits) {
    if (!Number.isFinite(value)) return "0";
    return value.toFixed(digits).replace(/\.?0+$/, "");
  }

  function selectedScale() {
    return gradeScales[elements.scale.value] || gradeScales.standard4;
  }

  function gradeValue(letter, scale) {
    return scale.grades[letter] ?? 0;
  }

  function createGradeSelect(value) {
    const select = document.createElement("select");
    select.className = "grade-input";
    select.setAttribute("aria-label", "Letter grade");
    gradeOptions.forEach((grade) => {
      const option = document.createElement("option");
      option.value = grade;
      option.textContent = grade;
      select.append(option);
    });
    select.value = value || "A";
    return select;
  }

  function createRow(data) {
    const row = document.createElement("div");
    row.className = "course-row";

    const courseField = document.createElement("div");
    courseField.className = "field";
    const courseLabel = document.createElement("label");
    courseLabel.textContent = "Course";
    const course = document.createElement("input");
    course.className = "course-name";
    course.type = "text";
    course.placeholder = "Course";
    course.setAttribute("aria-label", "Course name");
    course.value = data?.name || "";
    courseField.append(courseLabel, course);

    const gradeField = document.createElement("div");
    gradeField.className = "field";
    const gradeLabel = document.createElement("label");
    gradeLabel.textContent = "Grade";
    gradeField.append(gradeLabel, createGradeSelect(data?.grade));

    const creditField = document.createElement("div");
    creditField.className = "field credit-field";
    const creditLabel = document.createElement("label");
    creditLabel.textContent = "Credits";
    const credits = document.createElement("input");
    credits.className = "credit-input";
    credits.type = "number";
    credits.inputMode = "decimal";
    credits.min = "0";
    credits.step = "0.5";
    credits.value = data?.credits || "3";
    credits.setAttribute("aria-label", "Credit hours");
    creditField.append(creditLabel, credits);

    const remove = document.createElement("button");
    remove.className = "remove-row";
    remove.type = "button";
    remove.textContent = "X";
    remove.setAttribute("aria-label", "Remove grade row");
    remove.addEventListener("click", () => {
      if (elements.rows.children.length > 1) {
        row.remove();
        calculate();
        saveState();
      } else {
        setStatus("Keep at least one grade row.");
      }
    });

    row.append(courseField, gradeField, creditField, remove);
    row.addEventListener("input", onInputChange);
    row.addEventListener("change", onInputChange);
    return row;
  }

  function onInputChange() {
    calculate();
    saveState();
    scheduleHistory();
  }

  function addRow(data) {
    elements.rows.append(createRow(data));
    calculate();
    saveState();
  }

  function getRows() {
    return Array.from(elements.rows.querySelectorAll(".course-row")).map((row) => ({
      name: row.querySelector(".course-name").value.trim(),
      grade: row.querySelector(".grade-input").value,
      credits: Number.parseFloat(row.querySelector(".credit-input").value) || 0
    }));
  }

  function calculateSimple(rows, scale) {
    if (rows.length === 0) return null;
    const points = rows.reduce((sum, row) => sum + gradeValue(row.grade, scale), 0);
    return {
      gpa: points / rows.length,
      detail: `${rows.length} grade${rows.length === 1 ? "" : "s"} averaged on ${scale.label}.`
    };
  }

  function calculateWeighted(rows, scale) {
    const totals = rows.reduce((acc, row) => {
      acc.points += gradeValue(row.grade, scale) * row.credits;
      acc.credits += row.credits;
      return acc;
    }, { points: 0, credits: 0 });

    if (totals.credits <= 0) return null;
    return {
      gpa: totals.points / totals.credits,
      detail: `${formatNumber(totals.points, 2)} grade points across ${formatNumber(totals.credits, 2)} credits.`
    };
  }

  function calculateTarget(scale) {
    const currentGpa = Number.parseFloat(elements.currentGpa.value);
    const currentCredits = Number.parseFloat(elements.currentCredits.value);
    const futureCredits = Number.parseFloat(elements.futureCredits.value);
    const targetGpa = Number.parseFloat(elements.targetGpa.value);

    if (![currentGpa, currentCredits, futureCredits, targetGpa].every(Number.isFinite) || futureCredits <= 0) {
      return null;
    }

    const required = ((targetGpa * (currentCredits + futureCredits)) - (currentGpa * currentCredits)) / futureCredits;
    const detail = required > scale.max
      ? `This target needs ${formatNumber(required, 2)} on a ${formatNumber(scale.max, 1)} scale, which is above the selected scale.`
      : `You need about ${formatNumber(required, 2)} GPA points over ${formatNumber(futureCredits, 2)} future credits.`;

    return { gpa: required, detail };
  }

  function calculateConversion() {
    const scale = gradeScales[elements.conversionScale.value] || selectedScale();
    const value = gradeValue(elements.conversionGrade.value, scale);
    elements.conversionOutput.textContent = `${elements.conversionGrade.value} = ${formatNumber(value, 2)} / ${formatNumber(scale.max, 1)}`;
  }

  function calculate() {
    const scale = selectedScale();
    const rows = getRows();
    let result = null;

    if (activeMode === "simple") result = calculateSimple(rows, scale);
    if (activeMode === "weighted" || activeMode === "cumulative") result = calculateWeighted(rows, scale);
    if (activeMode === "target") result = calculateTarget(scale);

    calculateConversion();

    if (!result) {
      elements.result.textContent = "Enter grades to calculate.";
      elements.detail.textContent = "Results update instantly as values change.";
      lastResult = "";
      return;
    }

    const capped = Math.max(result.gpa, 0);
    const label = activeMode === "target" ? "Required GPA" : "GPA";
    lastResult = `${label}: ${formatNumber(capped, 2)} / ${formatNumber(scale.max, 1)}. ${result.detail}`;
    elements.result.textContent = `${label}: ${formatNumber(capped, 2)}`;
    elements.detail.textContent = result.detail;
  }

  function setMode(mode) {
    activeMode = mode;
    elements.calculator.dataset.mode = mode;
    elements.tabs.forEach((tab) => {
      const selected = tab.dataset.mode === mode;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    elements.panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== mode;
    });
    calculate();
    saveState();
  }

  function saveState() {
    writeJson(STORAGE_KEYS.saved, {
      mode: activeMode,
      scale: elements.scale.value,
      rows: getRows(),
      target: {
        currentGpa: elements.currentGpa.value,
        currentCredits: elements.currentCredits.value,
        futureCredits: elements.futureCredits.value,
        targetGpa: elements.targetGpa.value
      }
    });
  }

  function restoreState() {
    const state = readJson(STORAGE_KEYS.saved, null);
    if (state?.scale && gradeScales[state.scale]) elements.scale.value = state.scale;
    elements.rows.replaceChildren();
    const rows = Array.isArray(state?.rows) && state.rows.length ? state.rows : [
      { name: "English", grade: "A", credits: "3" },
      { name: "Math", grade: "B+", credits: "4" },
      { name: "Science", grade: "A-", credits: "3" }
    ];
    rows.slice(0, 30).forEach(addRow);

    if (state?.target) {
      elements.currentGpa.value = state.target.currentGpa || "3.2";
      elements.currentCredits.value = state.target.currentCredits || "45";
      elements.futureCredits.value = state.target.futureCredits || "15";
      elements.targetGpa.value = state.target.targetGpa || "3.5";
    }
    setMode(state?.mode || "simple");
  }

  function saveHistory() {
    writeJson(STORAGE_KEYS.history, history);
  }

  function renderHistory() {
    if (history.length === 0) {
      const item = document.createElement("li");
      item.textContent = "No recent GPA calculations yet.";
      elements.history.replaceChildren(item);
      return;
    }

    elements.history.replaceChildren(...history.map((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      return item;
    }));
  }

  function addHistory() {
    if (!lastResult || lastResult === history[0]) return;
    history = [lastResult, ...history.filter((item) => item !== lastResult)].slice(0, 5);
    saveHistory();
    renderHistory();
  }

  function scheduleHistory() {
    window.clearTimeout(historyTimer);
    historyTimer = window.setTimeout(addHistory, 700);
  }

  function setStatus(message) {
    elements.status.textContent = message;
    window.clearTimeout(setStatus.timer);
    setStatus.timer = window.setTimeout(() => {
      elements.status.textContent = "";
    }, 2400);
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
      title: "GPA Calculator",
      text: lastResult || "GPA Calculator",
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

  function handleTabKeydown(event, index) {
    const lastIndex = elements.tabs.length - 1;
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = index === lastIndex ? 0 : index + 1;
    if (event.key === "ArrowLeft") nextIndex = index === 0 ? lastIndex : index - 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = lastIndex;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setMode(event.currentTarget.dataset.mode);
      return;
    }
    if (nextIndex !== index) {
      event.preventDefault();
      elements.tabs[nextIndex].focus();
      setMode(elements.tabs[nextIndex].dataset.mode);
    }
  }

  function initSelects() {
    const scaleOptions = Object.entries(gradeScales).map(([key, scale]) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = scale.label;
      return option;
    });
    elements.scale.replaceChildren(...scaleOptions.map((option) => option.cloneNode(true)));
    elements.conversionScale.replaceChildren(...scaleOptions.map((option) => option.cloneNode(true)));
    elements.conversionScale.value = "standard4";
    elements.conversionGrade.replaceChildren(...gradeOptions.map((grade) => {
      const option = document.createElement("option");
      option.value = grade;
      option.textContent = grade;
      return option;
    }));
  }

  function bindEvents() {
    elements.form.addEventListener("submit", (event) => {
      event.preventDefault();
      calculate();
      addHistory();
    });
    elements.tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => setMode(tab.dataset.mode));
      tab.addEventListener("keydown", (event) => handleTabKeydown(event, index));
    });
    elements.addRow.addEventListener("click", () => addRow({ grade: "A", credits: "3" }));
    elements.scale.addEventListener("change", onInputChange);
    elements.conversionScale.addEventListener("change", calculateConversion);
    elements.conversionGrade.addEventListener("change", calculateConversion);
    [elements.currentGpa, elements.currentCredits, elements.futureCredits, elements.targetGpa].forEach((input) => {
      input.addEventListener("input", onInputChange);
    });
    elements.copy.addEventListener("click", copyResult);
    elements.share.addEventListener("click", shareResult);
    elements.clearHistory.addEventListener("click", () => {
      history = [];
      saveHistory();
      renderHistory();
      setStatus("History cleared.");
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        elements.status.textContent = "";
        document.activeElement?.blur();
      }
    });
  }

  initSelects();
  bindEvents();
  restoreState();
  renderHistory();
})();
