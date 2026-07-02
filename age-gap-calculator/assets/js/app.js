(function () {
  "use strict";

  var STORAGE_KEYS = {
    theme: "ageGapTheme",
    history: "ageGapHistory"
  };

  // Customization point: compatibility thresholds and labels.
  var RATING_LABELS = [
    { min: 86, label: "Excellent fit" },
    { min: 70, label: "Strong fit" },
    { min: 54, label: "Balanced" },
    { min: 38, label: "Needs communication" },
    { min: 0, label: "Different seasons" }
  ];

  // Customization point: embedded facts and shareable advice database.
  var FACTS = [
    "The healthiest age-gap conversations usually focus less on the number and more on expectations.",
    "A smaller gap can still feel big if two people are in very different life stages.",
    "Age-gap couples often do best when they talk early about money, family, career pace, and long-term plans.",
    "Shared values can make a bigger difference than shared birth years.",
    "The half-age rule is a cultural shortcut, not a compatibility test.",
    "A gap that looks large at 20 often feels less dramatic later in adulthood.",
    "Good relationships need consent, respect, humor, and practical alignment at any age.",
    "Friends and family may notice an age gap first; the couple usually has to live the day-to-day compatibility."
  ];

  var ZODIAC = [
    ["Capricorn", 1, 19],
    ["Aquarius", 2, 18],
    ["Pisces", 3, 20],
    ["Aries", 4, 19],
    ["Taurus", 5, 20],
    ["Gemini", 6, 20],
    ["Cancer", 7, 22],
    ["Leo", 8, 22],
    ["Virgo", 9, 22],
    ["Libra", 10, 22],
    ["Scorpio", 11, 21],
    ["Sagittarius", 12, 21],
    ["Capricorn", 12, 31]
  ];

  var els = {};
  var lastResult = null;

  document.addEventListener("DOMContentLoaded", function () {
    cacheElements();
    setupTheme();
    setupCalculator();
    setupKeyboardShortcuts();
    renderHistory();
  });

  function cacheElements() {
    [
      "themeToggle",
      "personA",
      "personB",
      "clearButton",
      "emptyState",
      "resultGrid",
      "exactDifference",
      "differenceDetail",
      "gapPercent",
      "decadeCount",
      "decadeDetail",
      "lifeStages",
      "lifeStageGap",
      "compatibilityPanel",
      "compatibilityScore",
      "ratingLabel",
      "gauge",
      "gaugeFill",
      "compatibilitySummary",
      "insightGrid",
      "halfAgeRule",
      "zodiacResult",
      "funFact",
      "newFactButton",
      "sharePanel",
      "shareText",
      "shareButton",
      "copyButton",
      "copyStatus",
      "historyList",
      "historyEmpty",
      "clearHistoryButton"
    ].forEach(function (id) {
      els[id] = document.getElementById(id);
    });
  }

  function setupTheme() {
    if (!els.themeToggle) {
      return;
    }
    updateThemeLabel();
    els.themeToggle.addEventListener("click", function () {
      var next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem(STORAGE_KEYS.theme, next);
      updateThemeLabel();
    });
  }

  function updateThemeLabel() {
    if (!els.themeToggle) {
      return;
    }
    var isDark = document.documentElement.dataset.theme === "dark";
    els.themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  }

  function setupCalculator() {
    if (!els.personA || !els.personB) {
      return;
    }

    var today = new Date();
    var max = formatDateInput(today);
    els.personA.max = max;
    els.personB.max = max;

    ["input", "change"].forEach(function (eventName) {
      els.personA.addEventListener(eventName, calculateAndRender);
      els.personB.addEventListener(eventName, calculateAndRender);
    });

    els.clearButton.addEventListener("click", clearInputs);
    els.newFactButton.addEventListener("click", function () {
      if (lastResult) {
        setFact(lastResult.gapYears);
      }
    });
    els.copyButton.addEventListener("click", copyShareText);
    els.shareButton.addEventListener("click", shareResult);
    els.clearHistoryButton.addEventListener("click", clearHistory);
  }

  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && els.copyStatus) {
        els.copyStatus.textContent = "";
      }
      if (event.key === "Enter" && document.activeElement === els.personB) {
        calculateAndRender();
      }
    });
  }

  function clearInputs() {
    els.personA.value = "";
    els.personB.value = "";
    lastResult = null;
    toggleResults(false);
    els.copyStatus.textContent = "";
    els.personA.focus();
  }

  function calculateAndRender() {
    if (!els.personA.value || !els.personB.value) {
      toggleResults(false);
      return;
    }

    var dateA = parseDateInput(els.personA.value);
    var dateB = parseDateInput(els.personB.value);
    var today = startOfDay(new Date());

    if (!dateA || !dateB || dateA > today || dateB > today) {
      toggleResults(false);
      return;
    }

    var result = buildResult(dateA, dateB, today);
    lastResult = result;
    renderResult(result);
    saveHistory(result);
    renderHistory();
  }

  function buildResult(dateA, dateB, today) {
    var olderDate = dateA <= dateB ? dateA : dateB;
    var youngerDate = dateA <= dateB ? dateB : dateA;
    var olderLabel = dateA <= dateB ? "Person A" : "Person B";
    var youngerLabel = dateA <= dateB ? "Person B" : "Person A";
    var diff = calendarDiff(olderDate, youngerDate);
    var totalDays = Math.round((youngerDate - olderDate) / 86400000);
    var olderAge = getAge(olderDate, today);
    var youngerAge = getAge(youngerDate, today);
    var exactOlderAge = daysBetween(olderDate, today) / 365.2425;
    var exactYoungerAge = daysBetween(youngerDate, today) / 365.2425;
    var exactGapYears = Math.abs(exactOlderAge - exactYoungerAge);
    var percent = exactOlderAge > 0 ? (exactGapYears / exactOlderAge) * 100 : 0;
    var generations = [getGeneration(olderDate.getFullYear()), getGeneration(youngerDate.getFullYear())];
    var generationGap = Math.abs(generationIndex(generations[0]) - generationIndex(generations[1]));
    var decades = exactGapYears / 10;
    var halfRule = halfAgeRule(olderAge, youngerAge, olderLabel, youngerLabel);
    var zodiacA = getZodiac(dateA);
    var zodiacB = getZodiac(dateB);
    var score = compatibilityScore(percent, generationGap, olderAge, youngerAge);
    var rating = getRating(score);

    return {
      dateA: formatDateInput(dateA),
      dateB: formatDateInput(dateB),
      olderLabel: olderLabel,
      youngerLabel: youngerLabel,
      diff: diff,
      totalDays: totalDays,
      olderAge: olderAge,
      youngerAge: youngerAge,
      gapYears: exactGapYears,
      percent: percent,
      generations: generations,
      generationGap: generationGap,
      decades: decades,
      halfRule: halfRule,
      zodiacA: zodiacA,
      zodiacB: zodiacB,
      score: score,
      rating: rating
    };
  }

  function renderResult(result) {
    toggleResults(true);

    els.exactDifference.textContent = [
      plural(result.diff.years, "year"),
      plural(result.diff.months, "month"),
      plural(result.diff.days, "day")
    ].join(", ");
    els.differenceDetail.textContent = result.totalDays.toLocaleString() + " total days apart";
    els.gapPercent.textContent = result.percent.toFixed(1) + "%";
    els.decadeCount.textContent = result.decades.toFixed(2);
    els.decadeDetail.textContent = result.decades >= 1 ? "At least one decade apart" : "Less than one decade apart";
    els.lifeStages.textContent = result.generations.join(" and ");
    els.lifeStageGap.textContent =
      result.generationGap === 0 ? "Same broad generation" : plural(result.generationGap, "generation") + " apart";

    els.compatibilityScore.textContent = result.score + "%";
    els.ratingLabel.textContent = result.rating;
    els.gaugeFill.style.width = result.score + "%";
    els.gauge.setAttribute("aria-valuenow", String(result.score));
    els.compatibilitySummary.textContent = buildCompatibilitySummary(result);

    els.halfAgeRule.textContent = result.halfRule;
    els.zodiacResult.textContent =
      "Person A is " + result.zodiacA + ", Person B is " + result.zodiacB + ". Treat this as a playful conversation starter.";
    setFact(result.gapYears);
    els.shareText.value = buildShareText(result);
    els.copyStatus.textContent = "";
  }

  function toggleResults(show) {
    [
      els.resultGrid,
      els.compatibilityPanel,
      els.insightGrid,
      els.sharePanel
    ].forEach(function (node) {
      if (node) {
        node.classList.toggle("is-hidden", !show);
      }
    });
    if (els.emptyState) {
      els.emptyState.classList.toggle("is-hidden", show);
    }
  }

  function calendarDiff(start, end) {
    var years = end.getFullYear() - start.getFullYear();
    var months = end.getMonth() - start.getMonth();
    var days = end.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return { years: years, months: months, days: days };
  }

  function getAge(birthDate, today) {
    var age = today.getFullYear() - birthDate.getFullYear();
    var beforeBirthday =
      today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
    return beforeBirthday ? age - 1 : age;
  }

  function halfAgeRule(olderAge, youngerAge, olderLabel, youngerLabel) {
    var minimum = Math.floor(olderAge / 2 + 7);
    if (olderAge < 18 || youngerAge < 18) {
      return "This calculator is intended for adult relationship context. For minors, follow applicable laws and safety guidance.";
    }
    if (youngerAge >= minimum) {
      return youngerLabel + " is within the informal range for " + olderLabel + " by this rule. Minimum: " + minimum + ".";
    }
    return youngerLabel + " is below the informal range for " + olderLabel + " by this rule. Minimum: " + minimum + ".";
  }

  function compatibilityScore(percent, generationGap, olderAge, youngerAge) {
    var score = 100;
    score -= Math.min(45, percent * 1.4);
    score -= Math.min(24, generationGap * 10);
    if (olderAge < 25 || youngerAge < 25) {
      score -= Math.min(18, percent * 0.8);
    }
    if (olderAge >= 18 && youngerAge >= Math.floor(olderAge / 2 + 7)) {
      score += 8;
    }
    return Math.max(5, Math.min(99, Math.round(score)));
  }

  function getRating(score) {
    for (var i = 0; i < RATING_LABELS.length; i += 1) {
      if (score >= RATING_LABELS[i].min) {
        return RATING_LABELS[i].label;
      }
    }
    return "Mixed";
  }

  function buildCompatibilitySummary(result) {
    return (
      "The gap is " +
      result.percent.toFixed(1) +
      "% of the older person's age, with " +
      result.generations[0] +
      " and " +
      result.generations[1] +
      " life-stage context."
    );
  }

  function setFact(gapYears) {
    var index = Math.floor((gapYears * 10 + Date.now() / 1000) % FACTS.length);
    els.funFact.textContent = FACTS[index];
  }

  function buildShareText(result) {
    return (
      "Our age gap is " +
      plural(result.diff.years, "year") +
      ", " +
      plural(result.diff.months, "month") +
      ", and " +
      plural(result.diff.days, "day") +
      " (" +
      result.percent.toFixed(1) +
      "% of the older person's age). Compatibility: " +
      result.score +
      "% - " +
      result.rating +
      "."
    );
  }

  function shareResult() {
    if (!lastResult) {
      return;
    }
    var text = buildShareText(lastResult);
    if (navigator.share) {
      navigator.share({
        title: "Age Gap Calculator result",
        text: text,
        url: location.href
      }).catch(function () {});
      return;
    }
    copyText(text);
  }

  function copyShareText() {
    if (!els.shareText.value) {
      return;
    }
    copyText(els.shareText.value);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        els.copyStatus.textContent = "Copied to clipboard.";
      });
      return;
    }
    els.shareText.select();
    document.execCommand("copy");
    els.copyStatus.textContent = "Copied to clipboard.";
  }

  function saveHistory(result) {
    var item = {
      dateA: result.dateA,
      dateB: result.dateB,
      summary: buildShareText(result),
      score: result.score,
      createdAt: Date.now()
    };
    var history = getHistory().filter(function (entry) {
      return entry.dateA !== item.dateA || entry.dateB !== item.dateB;
    });
    history.unshift(item);
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history.slice(0, 5)));
  }

  function renderHistory() {
    if (!els.historyList) {
      return;
    }
    var history = getHistory();
    els.historyList.innerHTML = "";
    els.historyEmpty.classList.toggle("is-hidden", history.length > 0);
    history.forEach(function (entry) {
      var li = document.createElement("li");
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = entry.summary;
      button.addEventListener("click", function () {
        els.personA.value = entry.dateA;
        els.personB.value = entry.dateB;
        calculateAndRender();
      });
      li.appendChild(button);
      els.historyList.appendChild(li);
    });
  }

  function clearHistory() {
    localStorage.removeItem(STORAGE_KEYS.history);
    renderHistory();
  }

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.history)) || [];
    } catch (error) {
      return [];
    }
  }

  function getGeneration(year) {
    if (year >= 1997 && year <= 2012) {
      return "Gen Z";
    }
    if (year >= 1981 && year <= 1996) {
      return "Millennial";
    }
    if (year >= 1965 && year <= 1980) {
      return "Gen X";
    }
    if (year >= 1946 && year <= 1964) {
      return "Boomer";
    }
    if (year >= 1928 && year <= 1945) {
      return "Silent";
    }
    if (year > 2012) {
      return "Gen Alpha";
    }
    return "Earlier generation";
  }

  function generationIndex(name) {
    return ["Gen Alpha", "Gen Z", "Millennial", "Gen X", "Boomer", "Silent", "Earlier generation"].indexOf(name);
  }

  function getZodiac(date) {
    var month = date.getMonth() + 1;
    var day = date.getDate();
    for (var i = 0; i < ZODIAC.length; i += 1) {
      if (month < ZODIAC[i][1] || (month === ZODIAC[i][1] && day <= ZODIAC[i][2])) {
        return ZODIAC[i][0];
      }
    }
    return "Capricorn";
  }

  function parseDateInput(value) {
    var parts = value.split("-").map(Number);
    if (parts.length !== 3) {
      return null;
    }
    return startOfDay(new Date(parts[0], parts[1] - 1, parts[2]));
  }

  function formatDateInput(date) {
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function daysBetween(start, end) {
    return Math.max(0, (startOfDay(end) - startOfDay(start)) / 86400000);
  }

  function plural(value, unit) {
    return value + " " + unit + (value === 1 ? "" : "s");
  }
})();
