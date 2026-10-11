// Compares every recipe's JSON body with its legacy child rows.
// Run before dropping the child tables: `bun prisma/scripts/verify-recipe-body.ts`
import { prisma } from "../../app/lib/prisma";
import { Body } from "../../app/schema/recipe-body";

const recipes = await prisma.recipe.findMany({
	select: {
		id: true,
		name: true,
		body: true,
		ingredientGroups: {
			orderBy: [{ index: "asc" }, { id: "asc" }],
			include: { ingredients: { orderBy: [{ index: "asc" }, { id: "asc" }] } },
		},
		steps: {
			orderBy: [{ index: "asc" }, { id: "asc" }],
			include: { instructions: { orderBy: [{ index: "asc" }, { id: "asc" }] } },
		},
	},
});

const mismatches: string[] = [];

for (const recipe of recipes) {
	const parsed = Body.safeParse(recipe.body);
	if (!parsed.success) {
		mismatches.push(`recipe ${recipe.id} (${recipe.name}): body fails schema: ${parsed.error.message}`);
		continue;
	}

	const expected = {
		ingredientGroups: recipe.ingredientGroups.map((g) => ({
			name: g.name,
			ingredients: g.ingredients.map((i) => ({
				amount: i.amount,
				units: i.units,
				name: i.name,
				preparation: i.preparation,
			})),
		})),
		steps: recipe.steps.map((s) => ({
			name: s.name,
			intro: s.intro,
			instructions: s.instructions.map((n) => ({ text: n.text })),
		})),
	};

	const actual = {
		ingredientGroups: parsed.data.ingredientGroups.map(({ id, ...g }) => ({
			...g,
			ingredients: g.ingredients.map(({ id, ...i }) => i),
		})),
		steps: parsed.data.steps.map(({ id, ...s }) => ({
			...s,
			instructions: s.instructions.map(({ id, ...n }) => n),
		})),
	};

	if (JSON.stringify(expected) !== JSON.stringify(actual)) {
		mismatches.push(
			`recipe ${recipe.id} (${recipe.name}):\n  expected ${JSON.stringify(expected)}\n  actual   ${JSON.stringify(actual)}`,
		);
	}
}

console.log(`Checked ${recipes.length} recipes, ${mismatches.length} mismatches.`);
for (const m of mismatches) console.log(m);
await prisma.$disconnect();
process.exit(mismatches.length ? 1 : 0);
