import { prisma } from "@lib/prisma";
import { Model, Recipe } from "@schema";
import { findRecipe, newRecipeName, saveRecipe } from "@services/recipe";
import { TRPCError } from "@trpc/server";
import * as z from "zod";
import { authedProcedure, router } from "../server";

export const recipeRouter = router({
	find: authedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
		const recipe = await findRecipe({ id: input.id });
		if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
		if (recipe.userId !== ctx.session.user.id) throw new TRPCError({ code: "FORBIDDEN" });
		return recipe;
	}),

	create: authedProcedure.mutation(async ({ ctx }) => {
		const name = await newRecipeName(ctx.session.user.id);
		return prisma.recipe.create({
			data: {
				name,
				slug: null,
				userId: ctx.session.user.id,
			},
			select: { id: true },
		});
	}),

	save: authedProcedure.input(Recipe.Save).mutation(async ({ input, ctx }) => {
		const result = await saveRecipe(ctx.session.user.id, input);
		if (!result.ok) throw new TRPCError({ code: result.code, message: result.message });
		return { version: result.version, slug: result.slug };
	}),

	delete: authedProcedure.input(Model.Id).mutation(async ({ input, ctx }) => {
		const recipe = await prisma.recipe.findUnique({ where: { id: input.id } });
		if (!recipe) throw new TRPCError({ code: "NOT_FOUND" });
		if (recipe.userId !== ctx.session.user.id)
			throw new TRPCError({ code: "FORBIDDEN" });
		return prisma.recipe.delete({ where: { id: input.id } });
	}),
});
