# ACME Salary Management System — Product Requirements

**Author:** Product Management
**Status:** Draft v1
**Last updated:** 2026-06-12

---

## 1. Overview

ACME's HR team manages compensation for **10,000 employees across multiple countries**, and today all of this lives in spreadsheets. Excel works until it doesn't: files get duplicated, formulas break silently, there is no single source of truth, and answering a simple question like *"what do we spend on salaries in Germany?"* turns into an afternoon of manual work.

This product replaces those spreadsheets with a **web-based salary management system** that gives the HR Manager one reliable place to view, maintain, and reason about how the organization pays its people.

## 2. Goal

Enable the HR Manager to **manage employee salary data and confidently answer questions about organizational pay** — accurately, quickly, and without spreadsheets.

A successful product lets the HR Manager:
- Find any employee and their compensation in seconds.
- Keep salary data correct and up to date.
- Answer common compensation questions (by country, department, role, etc.) without manual calculation.

## 3. Target User

**Primary persona — HR Manager.** Owns and maintains compensation data for the whole organization. Comfortable with data and reporting, not a software engineer. Needs to both *maintain* records and *get answers* from them. We assume a single, trusted internal user class; this is not a public or employee-facing tool.

## 4. Success Metrics

- **Time-to-answer:** common pay questions answered in seconds, not hours.
- **Data trust:** one authoritative record per employee — no conflicting copies.
- **Scale:** the system stays responsive and usable at 10,000 employees.
- **Adoption:** the HR Manager stops reaching for Excel for day-to-day work.

## 5. Scope & Features (In Scope)

### 5.1 Employee & Salary Directory
- View all employees in a paginated, performant list (designed for 10,000 records).
- **Search** by name / email and **filter** by department, country, job title/level.
- **Sort** by salary, name, or other key fields.
- View a single employee's detail, including their current compensation.

### 5.2 Salary Management (Maintain the Data)
- Add a new employee with their compensation details.
- Edit an existing employee's salary and key attributes.
- Remove an employee record.
- Capture salary in the employee's **local currency** alongside their country, reflecting ACME's multi-country reality.

### 5.3 Compensation Insights (Answer the Questions)
A dashboard / analytics view that answers *"how does the org pay people?"*, including:
- **Total payroll spend** across the organization.
- **Headcount** overall and by segment.
- **Average and median salary**, broken down by **department, country, and job title/level**.
- **Pay distribution** (e.g. ranges / bands) to spot spread and outliers.
- Comparisons across segments (e.g. average pay by country side by side).

> Median matters as much as average here — averages hide outliers, and pay-equity questions usually need the middle of the distribution, not just the mean.

### 5.4 Bulk Excel Import / Export
- **Import** employees and salary data from an Excel/CSV file, so the HR Manager can move existing spreadsheet data into the system and make large updates without editing records one by one.
- **Export** the current employee/salary data (and filtered views) back to Excel/CSV for offline analysis, sharing, or backup.
- Clear validation feedback on import (e.g. bad rows reported) so partial or malformed files don't silently corrupt the data.

### 5.5 Access (Authentication)
- The HR Manager **signs in** before accessing any data; the system is not open to anyone with the URL.
- A single trusted user class — **no roles, permissions, or access tiers** in this version. Authentication is purely a gate to protect sensitive compensation data, not a multi-role access-control system.

### 5.6 Usability
- Clean, responsive web UI suitable for daily HR use.
- Clear empty, loading, and error states so the user always trusts what they see.

## 6. Out of Scope (Deliberately Excluded)

These are intentionally excluded to keep the product focused on the core problem — **managing and understanding salary data** — rather than becoming a full HRIS or payroll engine.

| Excluded | Why it's out of scope |
|---|---|
| **Payroll processing & payments** (bank transfers, payslips) | This is a *management & insight* tool, not a system of payment. Real payroll involves banking, compliance, and money movement — a separate, high-risk domain. |
| **Tax, benefits, bonuses, equity, deductions** | Each is a deep domain of its own. We model base salary first; richer comp can layer on later. |
| **Roles, permissions & access tiers** | Sign-in is in scope, but we assume a single trusted HR Manager user class. Multi-role access control (admin vs. viewer, regional scoping, etc.) is valuable but orthogonal to proving the core workflow. |
| **Approval / change-request workflows** | A single owner edits data directly. Maker-checker flows add value only once multiple roles exist. |
| **Live currency conversion / FX normalization** | Salaries are shown in local currency. A single "company currency" rollup needs trustworthy FX rates and a date policy — a deliberate later decision, not a v1 guess. |
| **Performance reviews, time tracking, leave, attendance** | Adjacent HR concerns, but not part of "how the org pays people." |
| **Employee self-service portal** | The persona is the HR Manager. Employee-facing views are a different product surface. |
| **Audit history of every change** | Useful for compliance, but not required to demonstrate the core value. Noted as a strong fast-follow. |

## 7. Key Assumptions

- One trusted user class (the HR Manager) behind sign-in; access is gated but not role-differentiated.
- Base salary in local currency is the primary compensation figure for v1.
- The dataset (~10,000 employees) is representative of real scale and must be handled gracefully, not as a toy dataset.
- Data is seeded to simulate an existing organization; Excel import is available for migrating or bulk-updating real data.

## 8. Future Considerations (Post-v1)

Natural next steps once the core is proven: company-currency normalization with FX, salary change history & audit trail, role-based access for multiple HR users, richer compensation components (bonus/equity), and saved/exportable reports.
