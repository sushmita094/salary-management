/*
  Warnings:

  - Added the required column `level` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "salaryAmount" REAL NOT NULL,
    "salaryCurrency" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Employee" ("country", "department", "email", "id", "jobTitle", "name", "salaryAmount", "salaryCurrency") SELECT "country", "department", "email", "id", "jobTitle", "name", "salaryAmount", "salaryCurrency" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");
CREATE INDEX "Employee_country_idx" ON "Employee"("country");
CREATE INDEX "Employee_department_idx" ON "Employee"("department");
CREATE INDEX "Employee_jobTitle_idx" ON "Employee"("jobTitle");
CREATE INDEX "Employee_level_idx" ON "Employee"("level");
CREATE INDEX "Employee_salaryAmount_idx" ON "Employee"("salaryAmount");
CREATE INDEX "Employee_name_idx" ON "Employee"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
