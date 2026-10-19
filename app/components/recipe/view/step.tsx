import { activeStepIdAtom } from "@atoms/recipe";
import { Panel } from "@components/app";
import { useScrollNavigationContext } from "@hooks/scroll-navigation";
import { formatIngredient, type IngredientMap, summarizeStep } from "@lib/ingredient-ref";
import type { StepData } from "@services/recipe";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { InstructionText } from "./instruction-text";

interface Props extends React.ComponentProps<"div"> {
  index: number;
  step: StepData;
  single: boolean;
  ingredients: IngredientMap;
  scale: number;
}

export function Step({ index, single, step, ingredients, scale }: Props) {
  const id = `step_${index}`;
  const activeId = useAtomValue(activeStepIdAtom);
  const { scrollTo } = useScrollNavigationContext();
  const used = useMemo(() => summarizeStep(step, ingredients), [step, ingredients]);

  return (
    <Panel.Section
      id={id}
      className={activeId === id ? "panel__section--active" : undefined}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        if (window.getSelection()?.toString()) return;
        console.log(e);
        scrollTo(id);
      }}
    >
      {!single && (
        <Panel.Title>
          <span className="panel__index">{index}</span>
          {step.name}
        </Panel.Title>
      )}

      {(used.length > 0 || step.intro) &&
        <div className="flex gap-1 border-b">
          {used.length > 0 && (
            <Panel.Item className="step__ingredients">
              {used.map(({ ingredient, amount }) => (
                <span key={ingredient.id}>{formatIngredient(ingredient, amount, scale)}</span>
              ))}
            </Panel.Item>
          )}

          {step.intro && (
            <Panel.Item className="step__intro">{step.intro}</Panel.Item>
          )}
        </div>
      }

      <Panel.Item>
        {step.instructions.map((instruction, i) => (
          <div key={instruction.id} className="instruction">
            <span>{i + 1}.</span>
            <span>
              <InstructionText text={instruction.text} ingredients={ingredients} scale={scale} />
            </span>
          </div>
        ))}
      </Panel.Item>
    </Panel.Section>
  );
}
