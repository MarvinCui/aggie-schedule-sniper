(() => {
  const { api } = window.ASS;
  const core = window.ASS_SCHEDULER_CORE;
  const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();
  function createTravelPanel(sections) {
    if (!document.getElementById("ass-travel-styles")) {
      const style = document.createElement("style");
      style.id = "ass-travel-styles";
      style.textContent = `
        .ass-planner__travel { padding: 12px; margin: 10px 0; background: #fff7ed; color: #1f2937; border: 1px solid #fed7aa; border-radius: 8px; font: 13px/1.5 system-ui, sans-serif; overflow-wrap: anywhere; }
        .ass-planner__travel[hidden] { display: none !important; }
        .ass-planner__travel p { margin: 6px 0; }
        .ass-planner__travel > div { padding: 8px 0; border-top: 1px solid #fed7aa; }
      `;
      (document.head || document.documentElement).append(style);
    }
    const panel = document.createElement("div");
    panel.className = "ass-planner__travel";
    const transfers = core.shortTransfers(sections);
    if (!transfers.length) { panel.hidden = true; return panel; }
    panel.append(Object.assign(document.createElement("strong"), { textContent: "Travel between classes (30 min or less)" }));
    panel.append(Object.assign(document.createElement("p"), {
      textContent: "Estimated times include time to change classrooms and park your bike. Actual routes and pace may vary.",
    }));
    const days = { M: "Monday", T: "Tuesday", W: "Wednesday", R: "Thursday", F: "Friday", S: "Saturday", U: "Sunday" };
    for (const transfer of transfers) {
      const { from, to, gap, day } = transfer;
      const row = document.createElement("div");
      const origin = normalizeText(from.location);
      const destination = normalizeText(to.location);
      row.append(Object.assign(document.createElement("p"), {
        textContent: `${days[day]} · ${from.section.courseKey} → ${to.section.courseKey} · ${gap} min between classes · ${origin || "TBA"} → ${destination || "TBA"}`,
      }));
      const estimate = window.ASS_TRAVEL_ESTIMATES.estimate(from, to);
      if (!estimate) {
        row.append("Estimate unavailable: a building is unknown, ambiguous, or online.");
      } else {
        for (const [mode, label] of [["walking", "Walking"], ["cycling", "Cycling"]]) {
          const minutes = estimate[mode];
          const spare = gap - minutes;
          const status = spare < 0 ? `${-spare} min short` : spare < 3 ? "Tight transfer" : `${spare} min spare`;
          const text = Object.assign(document.createElement("p"), {
            textContent: `${label}: ~${minutes} min · ${status}${estimate.sameBuilding ? " (same building; room change)" : ""}`,
          });
          text.style.color = spare < 0 ? "#9f1239" : spare < 3 ? "#92400e" : "#166534";
          row.append(text);
        }
      }
      panel.append(row);
    }
    return panel;
  }

  let lastSignature = "";
  let panel = null;
  function minutes(clock) {
    const match = String(clock || "").match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (!match) return null;
    return (Number(match[1]) % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0)) * 60 + Number(match[2]);
  }
  function syncScheduleTravelReminders() {
    const list = document.getElementById("SavedSchedulesListDisplayContainer");
    if (!list) { panel?.remove(); panel = null; lastSignature = ""; return; }
    const schedule = api.parseScheduleFromDom({ includeUnregistered: true });
    const sections = schedule.courses.map((course) => ({
      courseKey: course.codeSection,
      meetings: course.meetings.map((meeting) => ({
        days: String(meeting.days || "").toUpperCase().split(""),
        startMinutes: minutes(meeting.start), endMinutes: minutes(meeting.end),
        location: meeting.location,
      })),
    }));
    const signature = JSON.stringify(sections);
    if (signature === lastSignature && panel?.isConnected && panel.nextElementSibling === list) return;
    lastSignature = signature;
    panel?.remove();
    panel = createTravelPanel(sections);
    panel.id = "ass-schedule-travel-reminders";
    panel.setAttribute("aria-label", "Travel between classes");
    // Sibling of the list, outside the course accordions and list/calendar view toggles.
    list.before(panel);
  }
  Object.assign(api, { createTravelPanel, syncScheduleTravelReminders });
})();
