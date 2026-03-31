const SHOWCASE_CITY_KEY = "camShowcaseCity";

const SHOWCASE_CITIES = [
  { id: "all", label: "All Showcase Cities", scopeId: "", scopeType: "", tag: "" },
  { id: "portland-me", label: "Portland, ME", scopeId: "Portland", scopeType: "city", tag: "portland" },
  { id: "augusta-me", label: "Augusta, ME", scopeId: "Augusta", scopeType: "city", tag: "augusta" },
  { id: "bangor-me", label: "Bangor, ME", scopeId: "Bangor", scopeType: "city", tag: "bangor" },
  { id: "bethel-me", label: "Bethel, ME", scopeId: "Bethel", scopeType: "town", tag: "bethel" },
  { id: "kingfield-me", label: "Kingfield, ME", scopeId: "Kingfield", scopeType: "town", tag: "kingfield" },
  {
    id: "carrabassett-valley-me",
    label: "Carrabassett Valley, ME",
    scopeId: "Carrabassett Valley",
    scopeType: "town",
    tag: "carrabassett"
  },
  { id: "york-me", label: "York, ME", scopeId: "York", scopeType: "town", tag: "york" },
  { id: "scarborough-me", label: "Scarborough, ME", scopeId: "Scarborough", scopeType: "town", tag: "scarborough" }
];

export function getShowcaseCities() {
  return SHOWCASE_CITIES;
}

export function getSelectedShowcaseCity() {
  const stored = localStorage.getItem(SHOWCASE_CITY_KEY) || "all";
  return SHOWCASE_CITIES.find((city) => city.id === stored) || SHOWCASE_CITIES[0];
}

export function setSelectedShowcaseCity(cityId) {
  const selected = SHOWCASE_CITIES.find((city) => city.id === cityId) || SHOWCASE_CITIES[0];
  localStorage.setItem(SHOWCASE_CITY_KEY, selected.id);
  window.dispatchEvent(new CustomEvent("chamberai:city-changed", { detail: { city: selected } }));
  return selected;
}

export function buildShowcaseCityOptions(selectedId = getSelectedShowcaseCity().id) {
  return SHOWCASE_CITIES.map(
    (city) => `<option value="${city.id}"${city.id === selectedId ? " selected" : ""}>${city.label}</option>`
  ).join("");
}

function normalizeValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function findShowcaseCity(predicate) {
  return SHOWCASE_CITIES.find((city) => city.id !== "all" && predicate(city)) || null;
}

export function inferShowcaseCityFromBusiness(business = {}) {
  const geoScopeId = normalizeValue(business.geo_scope_id);
  const businessCity = normalizeValue(business.city);

  return findShowcaseCity((city) => {
    const scopeId = normalizeValue(city.scopeId);
    return scopeId === geoScopeId || scopeId === businessCity;
  });
}

export function inferShowcaseCityFromMeeting(meeting = {}) {
  const location = normalizeValue(meeting.location);
  const tags = Array.isArray(meeting.tags)
    ? meeting.tags.map((tag) => normalizeValue(tag))
    : [];

  return findShowcaseCity((city) => {
    const scopeId = normalizeValue(city.scopeId);
    const tag = normalizeValue(city.tag);
    return location.includes(scopeId) || tags.includes(tag);
  });
}

export function filterMeetingsByShowcaseCity(meetings = [], city = getSelectedShowcaseCity()) {
  if (!city || city.id === "all") {
    return meetings;
  }

  return meetings.filter((meeting) => {
    const tags = Array.isArray(meeting.tags)
      ? meeting.tags.map((tag) => String(tag).toLowerCase())
      : [];
    const location = String(meeting.location ?? "").toLowerCase();
    const scopeId = String(city.scopeId ?? "").toLowerCase();
    return tags.includes(city.tag) || location.includes(scopeId);
  });
}

export function filterBusinessesByShowcaseCity(businesses = [], city = getSelectedShowcaseCity()) {
  if (!city || city.id === "all") {
    return businesses;
  }

  const scopeId = String(city.scopeId ?? "").toLowerCase();
  return businesses.filter((business) => {
    const geoScope = String(business.geo_scope_id ?? "").toLowerCase();
    const businessCity = String(business.city ?? "").toLowerCase();
    return geoScope === scopeId || businessCity === scopeId;
  });
}
