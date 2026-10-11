/*
  Warnings:

  - You are about to drop the column `slug` on the `recipe` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "recipe_userId_slug_key";

-- AlterTable
ALTER TABLE "recipe" DROP COLUMN "slug";
