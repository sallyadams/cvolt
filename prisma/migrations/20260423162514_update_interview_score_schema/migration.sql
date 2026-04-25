/*
  Warnings:

  - You are about to drop the column `actionItems` on the `interview_scores` table. All the data in the column will be lost.
  - You are about to drop the column `predictedInterviewRate` on the `interview_scores` table. All the data in the column will be lost.
  - You are about to drop the column `readinessScore` on the `interview_scores` table. All the data in the column will be lost.
  - Added the required column `communication` to the `interview_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `culturalFit` to the `interview_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `experience` to the `interview_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `overallScore` to the `interview_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recommendations` to the `interview_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `softSkills` to the `interview_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `strengths` to the `interview_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `technicalSkills` to the `interview_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weaknesses` to the `interview_scores` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_interview_scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cvId" TEXT,
    "jobId" TEXT,
    "overallScore" INTEGER NOT NULL,
    "technicalSkills" INTEGER NOT NULL,
    "softSkills" INTEGER NOT NULL,
    "experience" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "culturalFit" INTEGER NOT NULL,
    "strengths" TEXT NOT NULL,
    "weaknesses" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "interview_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "interview_scores_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cv_documents" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "interview_scores_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "job_descriptions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_interview_scores" ("createdAt", "cvId", "id", "jobId", "userId") SELECT "createdAt", "cvId", "id", "jobId", "userId" FROM "interview_scores";
DROP TABLE "interview_scores";
ALTER TABLE "new_interview_scores" RENAME TO "interview_scores";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
