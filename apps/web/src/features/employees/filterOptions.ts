/**
 * Filter dropdown options. These mirror the seed's fixed dimension sets — a
 * deliberate **stopgap** so the directory's selects work without scanning 10k
 * rows in the browser.
 *
 * Follow-up (backend): expose a `GET /employees/filters` distinct-values endpoint
 * and source these from it, so the options can't drift from the data (and so
 * `jobTitle` — too large/coupled to hardcode well — can be filtered too).
 */
export const COUNTRY_OPTIONS = [
  "United States",
  "United Kingdom",
  "Germany",
  "France",
  "Netherlands",
  "Canada",
  "Australia",
  "India",
  "Singapore",
  "Japan",
  "Brazil",
  "Poland",
] as const;

export const DEPARTMENT_OPTIONS = [
  "Engineering",
  "Product",
  "Sales",
  "Marketing",
  "Finance",
  "People & HR",
  "Operations",
  "Customer Support",
  "Legal",
  "Data & Analytics",
] as const;

export const LEVEL_OPTIONS = [
  "Junior",
  "Mid",
  "Senior",
  "Lead",
  "Staff",
  "Manager",
  "Principal",
  "Director",
] as const;
