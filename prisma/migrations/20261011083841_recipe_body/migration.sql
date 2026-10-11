-- AlterTable
ALTER TABLE "recipe" ADD COLUMN     "body" JSONB NOT NULL DEFAULT '{"ingredientGroups": [], "steps": []}',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- Backfill body from the child tables. Order by index, then id, so ties stay deterministic.
UPDATE "recipe" r SET "body" = jsonb_build_object(
  'ingredientGroups', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', gen_random_uuid()::text,
      'name', g."name",
      'ingredients', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', gen_random_uuid()::text,
          'amount', i."amount",
          'units', i."units",
          'name', i."name",
          'preparation', i."preparation"
        ) ORDER BY i."index", i."id")
        FROM "ingredient" i WHERE i."groupId" = g."id"
      ), '[]'::jsonb)
    ) ORDER BY g."index", g."id")
    FROM "ingredient_group" g WHERE g."recipeId" = r."id"
  ), '[]'::jsonb),
  'steps', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', gen_random_uuid()::text,
      'name', s."name",
      'intro', s."intro",
      'instructions', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', gen_random_uuid()::text,
          'text', n."text"
        ) ORDER BY n."index", n."id")
        FROM "instruction" n WHERE n."stepId" = s."id"
      ), '[]'::jsonb)
    ) ORDER BY s."index", s."id")
    FROM "step" s WHERE s."recipeId" = r."id"
  ), '[]'::jsonb)
);
