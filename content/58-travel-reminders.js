(() => {
  const { api } = window.ASS;
  const core = window.ASS_SCHEDULER_CORE;
  const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const ICONS = {
    walking: '<circle cx="13" cy="4" r="2"/><path d="m7 21 3-6m6 6-2-7-3-3 1-4m-6 6 3-5 3-1 3 5 3 1"/>',
    cycling: '<circle cx="5.5" cy="17" r="4"/><circle cx="18.5" cy="17" r="4"/><path d="m15 6 2 3m-10 8 5-8 4 8M8 9h4m3-6h2l2 14M6 6h3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    room: '<path d="M5 21V3h14v18M3 21h18m-7-9h1"/>',
  };
  function travelIcon(name) {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "1.7");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    icon.innerHTML = ICONS[name];
    return icon;
  }
  function travelText(tag, className, textContent) {
    return Object.assign(document.createElement(tag), { className, textContent });
  }
  function travelClock(value) {
    const hour = Math.floor(value / 60);
    return `${hour % 12 || 12}:${String(value % 60).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
  }
  function createTravelPanel(sections) {
    if (!document.getElementById("ass-travel-styles")) {
      const style = document.createElement("style");
      style.id = "ass-travel-styles";
      style.textContent = `
        .ass-planner__travel { margin: 12px 0; padding: 16px; background: #fff5dc; color: #182d50; border: 1px solid #e8cf93; border-radius: 12px; font: 13px/1.5 system-ui, sans-serif; overflow-wrap: anywhere; }
        .ass-planner__card > .ass-planner__travel, .ass-planner__selected > .ass-planner__travel { margin: 12px 14px; }
        .ass-planner__travel[hidden] { display: none !important; }
        .ass-planner__travel svg { width: 20px; height: 20px; flex-shrink: 0; }
        .ass-planner__travel .ass-travel__heading { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }
        .ass-planner__travel h3 { font: 600 15px/1.4 system-ui, sans-serif; margin: 0; color: #01256e; }
        .ass-planner__travel .ass-travel__scope { color: #51627d; font-size: 11px; background: #e8edf5; padding: 2px 7px; border-radius: 5px; }
        .ass-planner__travel .ass-travel__intro { color: #51627d; margin: 0 0 12px; font-size: 12px; }
        .ass-planner__travel .ass-travel__list { display: grid; gap: 10px; }
        .ass-planner__travel .ass-travel__card { padding: 12px; background: #fff; border: 1px solid #dce2ea; border-radius: 9px; }
        .ass-planner__travel .ass-travel__meta { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px; color: #51627d; font-size: 11px; margin-bottom: 10px; }
        .ass-planner__travel .ass-travel__gap { font-weight: 600; color: #01256e; background: #edf2fb; padding: 3px 8px; border-radius: 20px; }
        .ass-planner__travel .ass-travel__route { display: grid; grid-template-columns: minmax(0, 1fr) 20px minmax(0, 1fr); gap: 10px; align-items: center; margin-bottom: 12px; }
        .ass-planner__travel .ass-travel__stop strong { display: block; font-size: 12px; }
        .ass-planner__travel .ass-travel__stop span { display: block; color: #51627d; font-size: 12px; margin-top: 2px; }
        .ass-planner__travel .ass-travel__route > svg { color: #8b99af; }
        .ass-planner__travel .ass-travel__modes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        .ass-planner__travel .ass-travel__mode { display: grid; grid-template-columns: 20px minmax(0, 1fr) auto; align-items: center; gap: 6px; padding: 9px 10px; background: #f6f8fc; border-radius: 7px; }
        .ass-planner__travel .ass-travel__duration { font-size: 15px; font-weight: 650; white-space: nowrap; }
        .ass-planner__travel .ass-travel__status { grid-column: 2 / -1; font-size: 11px; }
        .ass-planner__travel .ass-travel__status--good { color: #166534; }
        .ass-planner__travel .ass-travel__status--tight { color: #92400e; }
        .ass-planner__travel .ass-travel__status--short { color: #9f1239; }
        .ass-planner__travel .ass-travel__mode--room { grid-column: 1 / -1; }
        .ass-planner__travel .ass-travel__unavailable { color: #51627d; font-size: 12px; margin: 0; }
        @media (max-width: 480px) { .ass-planner__travel { padding: 12px; } .ass-planner__travel .ass-travel__modes { grid-template-columns: 1fr; } }
      `;
      (document.head || document.documentElement).append(style);
    }
    const panel = document.createElement("section");
    panel.className = "ass-planner__travel";
    panel.setAttribute("aria-label", "Travel between classes");
    const transfers = core.shortTransfers(sections);
    if (!transfers.length) { panel.hidden = true; return panel; }
    const heading = document.createElement("div");
    heading.className = "ass-travel__heading";
    heading.append(travelIcon("clock"), travelText("h3", "", "Travel between classes"), travelText("span", "ass-travel__scope", "30 min or less"));
    panel.append(heading, travelText("p", "ass-travel__intro", "A quick look at your next classroom change."));
    const list = document.createElement("div");
    list.className = "ass-travel__list";
    const days = { M: "Monday", T: "Tuesday", W: "Wednesday", R: "Thursday", F: "Friday", S: "Saturday", U: "Sunday" };
    for (const { from, to, gap, day } of transfers) {
      const row = document.createElement("div");
      row.className = "ass-travel__card";
      const meta = document.createElement("div");
      meta.className = "ass-travel__meta";
      meta.append(travelText("span", "", `${days[day]} · ${travelClock(from.endMinutes)} – ${travelClock(to.startMinutes)}`), travelText("span", "ass-travel__gap", `${gap} min gap`));
      const route = document.createElement("div");
      route.className = "ass-travel__route";
      for (const [index, meeting] of [from, to].entries()) {
        if (index) route.append(travelIcon("arrow"));
        const stop = document.createElement("div");
        stop.className = "ass-travel__stop";
        stop.append(travelText("strong", "", meeting.section.courseKey), travelText("span", "", normalizeText(meeting.location) || "TBA"));
        route.append(stop);
      }
      row.append(meta, route);
      const estimate = window.ASS_TRAVEL_ESTIMATES.estimate(from, to);
      if (!estimate) {
        row.append(travelText("p", "ass-travel__unavailable", "Time unavailable · Building could not be identified or class is online."));
      } else {
        const modes = document.createElement("div");
        modes.className = "ass-travel__modes";
        const choices = estimate.sameBuilding ? [["walking", "Room change", "room"]] : [["walking", "Walking", "walking"], ["cycling", "Cycling", "cycling"]];
        for (const [mode, label, icon] of choices) {
          const minutes = estimate[mode];
          const spare = gap - minutes;
          const tone = spare < 0 ? "short" : spare < 3 ? "tight" : "good";
          const status = spare < 0 ? `${-spare} min short` : spare < 3 ? "Tight transfer" : `${spare} min to spare`;
          const tile = document.createElement("div");
          tile.className = `ass-travel__mode${estimate.sameBuilding ? " ass-travel__mode--room" : ""}`;
          tile.append(travelIcon(icon), travelText("span", "", label), travelText("span", "ass-travel__duration", `~${minutes} min`), travelText("span", `ass-travel__status ass-travel__status--${tone}`, `${estimate.sameBuilding ? "Same building · " : ""}${status}`));
          modes.append(tile);
        }
        row.append(modes);
      }
      list.append(row);
    }
    panel.append(list);
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
