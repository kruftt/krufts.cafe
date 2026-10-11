import type { ParsedAmount } from "@lib/amount";
import { atom } from "jotai";

export const parsedAmountsAtom = atom<Record<string, ParsedAmount | null>>({});
export const parsedServesAtom = atom<ParsedAmount | null>(null);
