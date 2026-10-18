import type { PlaybookRule } from "@/app/lib/mikeApi";
import { tr } from "@/shared/i18n/runtime";

export function createPlaybookRule(index: number): PlaybookRule {
  return {
    id: `rule-${crypto.randomUUID()}`,
    name: tr("pb.newRule", { index }),
    // The content schema requires a concept even before the first edit.
    concept: tr("pb.defaultConcept"),
    scope: "clause",
    required: false,
    guidance: "",
    standard: null,
    fallbacks: [],
    unacceptable: [],
    conditions: [],
    actions: [],
    sourceRefs: [],
  };
}
