import type { EmployeeQuery } from "@acme/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repositories/employee.repository.js", () => ({
  findEmployees: vi.fn(),
  countEmployees: vi.fn(),
}));

import { countEmployees, findEmployees } from "../repositories/employee.repository.js";
import { listEmployees } from "./employee.service.js";

const findMock = vi.mocked(findEmployees);
const countMock = vi.mocked(countEmployees);

function query(overrides: Partial<EmployeeQuery> = {}): EmployeeQuery {
  return { page: 1, pageSize: 20, sort: "name", order: "asc", ...overrides };
}

describe("listEmployees", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findMock.mockResolvedValue([]);
  });

  it("computes totalPages and returns the standard envelope", async () => {
    countMock.mockResolvedValue(45);

    const result = await listEmployees(query({ page: 1, pageSize: 20 }));

    expect(result.pagination).toEqual({ page: 1, pageSize: 20, total: 45, totalPages: 3 });
    expect(findMock).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 20 }));
  });

  it("clamps a page past the end to the last page", async () => {
    countMock.mockResolvedValue(45); // 3 pages of 20

    const result = await listEmployees(query({ page: 99, pageSize: 20 }));

    expect(result.pagination.page).toBe(3);
    expect(findMock).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }));
  });

  it("reports page 1 and zero totalPages when nothing matches", async () => {
    countMock.mockResolvedValue(0);

    const result = await listEmployees(query({ page: 5 }));

    expect(result.pagination).toEqual({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
    expect(result.data).toEqual([]);
    expect(findMock).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
  });
});
