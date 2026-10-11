/*
  Warnings:

  - You are about to drop the `ingredient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ingredient_group` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `instruction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `step` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ingredient" DROP CONSTRAINT "ingredient_groupId_fkey";

-- DropForeignKey
ALTER TABLE "ingredient_group" DROP CONSTRAINT "ingredient_group_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "instruction" DROP CONSTRAINT "instruction_stepId_fkey";

-- DropForeignKey
ALTER TABLE "step" DROP CONSTRAINT "step_recipeId_fkey";

-- DropTable
DROP TABLE "ingredient";

-- DropTable
DROP TABLE "ingredient_group";

-- DropTable
DROP TABLE "instruction";

-- DropTable
DROP TABLE "step";
