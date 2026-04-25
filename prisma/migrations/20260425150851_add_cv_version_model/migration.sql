-- CreateTable
CREATE TABLE "cv_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cvId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "filename" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cv_versions_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cv_documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
