/*
  Warnings:

  - You are about to drop the column `search` on the `recipe` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "recipe" DROP COLUMN "search",
ADD COLUMN     "ingredientNames" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill from body: trimmed, non-empty, distinct names in first-appearance order (matches ingredientNamesOf).
UPDATE "recipe" r SET "ingredientNames" = COALESCE((
  SELECT array_agg(s.name ORDER BY s.first_ord)
  FROM (
    SELECT btrim(e.name) AS name, min(e.ord) AS first_ord
    FROM jsonb_array_elements_text(jsonb_path_query_array(r."body", '$.ingredientGroups[*].ingredients[*].name')) WITH ORDINALITY AS e(name, ord)
    WHERE btrim(e.name) <> ''
    GROUP BY btrim(e.name)
  ) s
), ARRAY[]::TEXT[]);
