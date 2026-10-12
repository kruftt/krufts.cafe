-- CreateTable
CREATE TABLE "meal_plan_entry" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "meal_plan_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plan_note" (
    "userId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "meal_plan_note_pkey" PRIMARY KEY ("userId","day")
);

-- CreateIndex
CREATE INDEX "meal_plan_entry_userId_day_position_idx" ON "meal_plan_entry"("userId", "day", "position");

-- AddForeignKey
ALTER TABLE "meal_plan_entry" ADD CONSTRAINT "meal_plan_entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_entry" ADD CONSTRAINT "meal_plan_entry_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plan_note" ADD CONSTRAINT "meal_plan_note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
