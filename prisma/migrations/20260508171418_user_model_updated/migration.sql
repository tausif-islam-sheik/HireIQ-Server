/*
  Warnings:

  - Made the column `jobName` on table `SavedJob` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SavedJob" ALTER COLUMN "jobName" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "availability" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "expectedSalary" TEXT,
ADD COLUMN     "experienceLevel" TEXT,
ADD COLUMN     "github" TEXT,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "linkedin" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "portfolio" TEXT,
ADD COLUMN     "skills" TEXT[];
