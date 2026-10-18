"use client";

import { useId, useState } from "react";
import { Plus, X } from "lucide-react";
import { ModalSelect } from "@/app/components/modals/ModalSelect";
import { HeaderActionsMenu } from "@/app/components/shared/HeaderActionsMenu";
import { LIQUID_GLASS_FLAT_CLASS } from "@/app/components/ui/liquid-surface";
import { EmptyState } from "@/app/components/ui/empty-state";
import { PillButtonUI } from "@/shared/ui/PillButtonUI";
import { TextButtonUI } from "@/shared/ui/TextButtonUI";
import {
  PlaybookField as Field,
  PLAYBOOK_HELP_CLASS,
  PLAYBOOK_LABEL_CLASS,
  PLAYBOOK_TEXTAREA_CLASS,
} from "./PlaybookField";
import type {
  PlaybookClause,
  PlaybookClauseUsage,
  PlaybookPosition,
  PlaybookRule,
} from "@/app/lib/mikeApi";
import { cn } from "@/app/lib/utils";
import { tr } from "@/shared/i18n/runtime";

type PositionKind = "standard" | "fallbacks" | "unacceptable";
type RuleAction = PlaybookRule["actions"][number];

/**
 * Applies a change that discards text, and offers to reverse it. `undo`
 * receives the rule as it is when Undo is pressed, not as it was removed.
 */
export type UndoableRuleChange = (
  next: PlaybookRule,
  message: string,
  undo: (latest: PlaybookRule) => PlaybookRule,
) => void;

const POSITION_GROUPS: Record<
  PositionKind,
  {
    title: string;
    label: string;
    empty: string;
    usage: PlaybookClauseUsage;
    /** Matches the review's acceptable, needs-review and unacceptable colors. */
    dot: string;
  }
> = {
  standard: {
    dot: "bg-emerald-500",
    get title() {
        return tr("playbooks.playbookRuleForm.standardPosition");
    },
    get label() {
        return tr("playbooks.playbookRuleForm.standard");
    },
    empty: "None yet.",
    usage: "preferred",
  },
  fallbacks: {
    dot: "bg-amber-500",
    get title() {
        return tr("playbooks.playbookRuleForm.fallbackPositions");
    },
    get label() {
        return tr("playbooks.playbookRuleForm.fallback");
    },
    empty: "None yet.",
    usage: "illustrative",
  },
  unacceptable: {
    dot: "bg-red-500",
    get title() {
        return tr("playbooks.playbookRuleForm.unacceptablePositions");
    },
    get label() {
        return tr("playbooks.playbookRuleForm.unacceptable");
    },
    empty: "None yet.",
    usage: "unacceptable",
  },
};

const USAGE_OPTIONS: { value: PlaybookClauseUsage; label: string }[] = [
  { value: "illustrative", get label() {
        return tr("playbooks.playbookRuleForm.illustrative");
    } },
  { value: "preferred", get label() {
        return tr("playbooks.playbookRuleForm.preferred");
    } },
  { value: "verbatim", get label() {
        return tr("playbooks.playbookRuleForm.verbatim");
    } },
  { value: "accepted", get label() {
        return tr("playbooks.playbookRuleForm.previouslyAccepted");
    } },
  { value: "unacceptable", get label() {
        return tr("playbooks.playbookRuleForm.unacceptable");
    } },
];

// A sample clause is one grey tile: its controls along the top and the clause
// text below, with the focus ring on the whole tile rather than the text box.
const CLAUSE_TILE_CLASS =
  "min-w-0 rounded-lg bg-gray-100 transition-shadow focus-within:ring-2 focus-within:ring-gray-300/45";

function positionsOf(rule: PlaybookRule, kind: PositionKind) {
  if (kind !== "standard") return rule[kind];
  return rule.standard ? [rule.standard] : [];
}

function withPositions(
  rule: PlaybookRule,
  kind: PositionKind,
  positions: PlaybookPosition[],
): PlaybookRule {
  return kind === "standard"
    ? { ...rule, standard: positions[0] ?? null }
    : { ...rule, [kind]: positions };
}

function insertAt<T>(items: T[], index: number, item: T) {
  const next = [...items];
  next.splice(Math.min(index, next.length), 0, item);
  return next;
}

function positionLabel(kind: PositionKind, index: number) {
  const { label } = POSITION_GROUPS[kind];
  return kind === "standard"
    ? label
    : tr("pb.positionN", { label, number: index + 1 });
}

/** A clause whose usage contradicts the position it illustrates. */
export function clauseUsageConflict(
  kind: PositionKind,
  usage: PlaybookClauseUsage,
) {
  if (kind === "unacceptable")
    return usage === "illustrative" || usage === "unacceptable"
      ? null
      : tr("playbooks.playbookRuleForm.conflictsUnacceptablePosition");
  return usage === "unacceptable"
    ? tr("playbooks.playbookRuleForm.conflictsAcceptablePosition")
    : null;
}

/** Source markers such as P4 or T2R3C1, written out for people. */
export function describeSourceRefs(refs: string[]) {
  return refs
    .map((ref) => {
      const paragraph = /^P(\d+)$/.exec(ref);
      if (paragraph) return tr("pb.paragraph", { number: paragraph[1] });
      const cell = /^T(\d+)R(\d+)C(\d+)$/.exec(ref);
      if (cell) return tr("playbooks.playbookRuleForm.tableRowCell", { cell: cell[1], cell2: cell[2], cell3: cell[3] });
      return ref;
    })
    .join("; ");
}

export type RuleFormTab = "details" | "positions" | "escalation";

export const RULE_FORM_TABS: { id: RuleFormTab; label: string }[] = [
  { id: "details", get label() {
        return tr("playbooks.playbookRuleForm.overview");
    } },
  { id: "positions", get label() {
        return tr("playbooks.playbookRuleForm.positions");
    } },
  { id: "escalation", get label() {
        return tr("playbooks.playbookRuleForm.escalation");
    } },
];

export function PlaybookRuleForm({
  tab,
  rule,
  onChange,
  onUndoableChange,
}: {
  tab: RuleFormTab;
  rule: PlaybookRule;
  onChange: (rule: PlaybookRule) => void;
  onUndoableChange: UndoableRuleChange;
}) {
  const scopeId = useId();
  const requiredId = useId();
  if (tab === "positions")
    return (
      <div className="space-y-4">
        {(["standard", "fallbacks", "unacceptable"] as const).map((kind) => (
          <PositionGroup
            key={kind}
            kind={kind}
            rule={rule}
            onChange={onChange}
            onUndoableChange={onUndoableChange}
          />
        ))}
      </div>
    );
  if (tab === "escalation")
    return (
      <EscalationField
        value={rule.actions}
        onChange={(actions) => onChange({ ...rule, actions })}
      />
    );
  return (
    <div className="space-y-4">
      {rule.sourceRefs.length > 0 && (
        <p className="text-xs text-gray-500 [overflow-wrap:anywhere]">
          {tr("playbooks.playbookRuleForm.source", { describeSourceRefs: describeSourceRefs(rule.sourceRefs) })}
        </p>
      )}
      <div className="grid gap-4 @[32rem]:grid-cols-2">
        <div className="min-w-0">
          <label
            htmlFor={scopeId}
            className={`mb-2 block ${PLAYBOOK_LABEL_CLASS}`}
          >
            {tr("playbooks.playbookRuleForm.scope")}
          </label>
          <ModalSelect
            variant="flat"
            id={scopeId}
            value={rule.scope}
            onChange={(scope) =>
              onChange({ ...rule, scope: scope as PlaybookRule["scope"] })
            }
            options={[
              { value: "clause", label: tr("playbooks.playbookRuleForm.clause") },
              { value: "agreement", label: tr("playbooks.playbookRuleForm.wholeAgreement") },
            ]}
          />
          <p className="mt-2 text-xs text-gray-500">
            {tr("playbooks.playbookRuleForm.chooseWhetherRuleAppliesIndividual")}
          </p>
        </div>
        <div className="min-w-0">
          <label
            htmlFor={requiredId}
            className={`mb-2 block ${PLAYBOOK_LABEL_CLASS}`}
          >
            {tr("playbooks.playbookRuleForm.requirement")}
          </label>
          <ModalSelect
            variant="flat"
            id={requiredId}
            value={rule.required ? "required" : "optional"}
            onChange={(value) =>
              onChange({ ...rule, required: value === "required" })
            }
            options={[
              { value: "optional", label: tr("playbooks.playbookRuleForm.optional") },
              { value: "required", label: tr("playbooks.playbookRuleForm.required") },
            ]}
          />
          <p className="mt-2 text-xs text-gray-500">
            {rule.required
              ? tr("playbooks.playbookRuleForm.ifContractDoesnTContain")
              : tr("playbooks.playbookRuleForm.reviewDoesnTFlagContract")}
          </p>
        </div>
      </div>
      <Field
        label={tr("playbooks.playbookRuleForm.conceptDetect")}
        description={tr("playbooks.playbookRuleForm.describeTermSoReviewCan")}
        value={rule.concept}
        onChange={(concept) => onChange({ ...rule, concept })}
        multiline
      />
      <ConditionsField
        value={rule.conditions}
        onChange={(conditions) => onChange({ ...rule, conditions })}
      />
      <Field
        label={tr("playbooks.playbookRuleForm.additionalGuidance")}
        description={tr("playbooks.playbookRuleForm.contextPrioritiesReviewShouldApply")}
        value={rule.guidance}
        onChange={(guidance) => onChange({ ...rule, guidance })}
        multiline
      />
    </div>
  );
}

function parseLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Conditions are saved as one sentence each. The field keeps the typed text
 * so a blank line survives until the next condition is typed; the server
 * rejects an empty condition.
 */
function ConditionsField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const id = useId();
  const helpId = useId();
  const [text, setText] = useState(() => value.join("\n"));
  // Adopt conditions replaced from outside, such as an undo or an import.
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    if (parseLines(text).join("\n") !== value.join("\n"))
      setText(value.join("\n"));
  }
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={`mb-2 block ${PLAYBOOK_LABEL_CLASS}`}>
        {tr("playbooks.playbookRuleForm.appliesOnlyWhen")}
      </label>
      <textarea
        id={id}
        value={text}
        rows={2}
        aria-describedby={helpId}
        onChange={(event) => {
          setText(event.target.value);
          const next = parseLines(event.target.value);
          if (next.join("\n") !== value.join("\n")) onChange(next);
        }}
        className={`${PLAYBOOK_TEXTAREA_CLASS} min-h-[3.25rem]`}
      />
      <p id={helpId} className={PLAYBOOK_HELP_CLASS}>
        {tr("playbooks.playbookRuleForm.oneConditionPerLineLeave")}
      </p>
    </div>
  );
}

function savedActions(rows: RuleAction[]) {
  return rows.filter((row) => row.instruction.trim());
}

function sameActions(a: RuleAction[], b: RuleAction[]) {
  return (
    a.length === b.length &&
    a.every(
      (row, index) =>
        row.scenario === b[index].scenario &&
        row.instruction === b[index].instruction,
    )
  );
}

/**
 * Escalations need an instruction before they can be saved, so rows being
 * written stay local until they have one.
 */
function EscalationField({
  value,
  onChange,
}: {
  value: RuleAction[];
  onChange: (value: RuleAction[]) => void;
}) {
  const [rows, setRows] = useState(value);
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    if (!sameActions(savedActions(rows), value)) setRows(value);
  }
  function commit(next: RuleAction[]) {
    setRows(next);
    const saved = savedActions(next);
    if (!sameActions(saved, value)) onChange(saved);
  }
  function addEscalation() {
    commit([...rows, { scenario: "", instruction: "" }]);
  }
  if (rows.length === 0)
    return (
      <EmptyState
        title={tr("playbooks.playbookRuleForm.escalations")}
        description={tr("playbooks.playbookRuleForm.describeSituationReviewMayMeet")}
        className="m-auto w-fit max-w-full py-12"
        action={
          <PillButtonUI tone="black" onClick={addEscalation}>
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            {tr("playbooks.playbookRuleForm.addEscalation")}
          </PillButtonUI>
        }
      />
    );
  return (
    <div className="min-w-0 space-y-4">
      {rows.map((row, index) => (
        <fieldset
          key={index}
          className={`min-w-0 space-y-3 rounded-xl px-3 pb-3 pt-1.5 md:px-4 md:pb-4 md:pt-2 ${LIQUID_GLASS_FLAT_CLASS}`}
        >
          <legend className="sr-only">{tr("playbooks.playbookRuleForm.escalation2", { value: index + 1 })}</legend>
          <div className="flex h-8 items-center justify-between gap-2">
            <span
              aria-hidden="true"
              className="text-sm font-medium text-gray-900"
            >
              {tr("playbooks.playbookRuleForm.escalation2", { value: index + 1 })}
            </span>
            <HeaderActionsMenu
              title={tr("playbooks.playbookRuleForm.actionsEscalation", { value: index + 1 })}
              triggerClassName="h-6 w-6 shrink-0"
              items={[
                {
                  label: tr("playbooks.playbookRuleForm.duplicate"),
                  onSelect: () =>
                    commit([
                      ...rows.slice(0, index + 1),
                      { ...row },
                      ...rows.slice(index + 1),
                    ]),
                },
                {
                  label: tr("playbooks.playbookRuleForm.delete"),
                  variant: "danger" as const,
                  onSelect: () => commit(rows.filter((_, i) => i !== index)),
                },
              ]}
            />
          </div>
          <Field
            label={tr("playbooks.playbookRuleForm.when")}
            value={row.scenario}
            onChange={(scenario) =>
              commit(rows.map((r, i) => (i === index ? { ...r, scenario } : r)))
            }
          />
          <Field
            label={tr("playbooks.playbookRuleForm.then")}
            value={row.instruction}
            onChange={(instruction) =>
              commit(
                rows.map((r, i) => (i === index ? { ...r, instruction } : r)),
              )
            }
            multiline="grow"
          />
        </fieldset>
      ))}
      <TextButtonUI className="-ml-2" onClick={addEscalation}>
        <Plus aria-hidden="true" className="h-3.5 w-3.5" />
        {tr("playbooks.playbookRuleForm.addEscalation")}
      </TextButtonUI>
    </div>
  );
}

function PositionGroup({
  kind,
  rule,
  onChange,
  onUndoableChange,
}: {
  kind: PositionKind;
  rule: PlaybookRule;
  onChange: (rule: PlaybookRule) => void;
  onUndoableChange: UndoableRuleChange;
}) {
  const group = POSITION_GROUPS[kind];
  const headingId = useId();
  const positions = positionsOf(rule, kind);
  const canAdd = kind !== "standard" || positions.length === 0;

  function setPositions(next: PlaybookPosition[]) {
    onChange(withPositions(rule, kind, next));
  }

  function removePosition(index: number) {
    const removed = positions[index];
    const next = withPositions(
      rule,
      kind,
      positions.filter((_, i) => i !== index),
    );
    if (!removed.criteria.trim() && removed.sampleClauses.length === 0) {
      onChange(next);
      return;
    }
    onUndoableChange(
      next,
      tr("playbooks.playbookRuleForm.removed", { positionLabel: positionLabel(kind, index) }),
      (latest) => {
        const current = positionsOf(latest, kind);
        if (kind === "standard" && current.length) return latest;
        return withPositions(latest, kind, insertAt(current, index, removed));
      },
    );
  }

  function movePosition(index: number, offset: -1 | 1) {
    const next = [...positions];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    setPositions(next);
  }

  function removeClause(positionIndex: number, clauseIndex: number) {
    const position = positions[positionIndex];
    const removed = position.sampleClauses[clauseIndex];
    const next = withPositions(
      rule,
      kind,
      positions.map((entry, i) =>
        i === positionIndex
          ? {
              ...entry,
              sampleClauses: entry.sampleClauses.filter(
                (_, j) => j !== clauseIndex,
              ),
            }
          : entry,
      ),
    );
    if (!removed.text.trim()) {
      onChange(next);
      return;
    }
    onUndoableChange(
      next,
      tr("playbooks.playbookRuleForm.removedClauseFrom", { value: clauseIndex + 1, positionLabel: positionLabel(kind, positionIndex) }),
      (latest) => {
        const current = positionsOf(latest, kind);
        if (!current[positionIndex]) return latest;
        return withPositions(
          latest,
          kind,
          current.map((entry, i) =>
            i === positionIndex
              ? {
                  ...entry,
                  sampleClauses: insertAt(
                    entry.sampleClauses,
                    clauseIndex,
                    removed,
                  ),
                }
              : entry,
          ),
        );
      },
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 space-y-3 rounded-2xl bg-gray-100/70 px-3 pb-3 pt-2 md:px-4 md:pb-4 md:pt-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <h4
          id={headingId}
          className="flex items-center gap-2 text-sm font-medium text-gray-900"
        >
          <span
            aria-hidden="true"
            className={`h-2 w-2 shrink-0 rounded-full ${group.dot}`}
          />
          {group.title}
        </h4>
        {canAdd && (
          <TextButtonUI
            onClick={() =>
              setPositions([
                ...positions,
                { name: group.label, criteria: "", sampleClauses: [] },
              ])
            }
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            {tr("playbooks.playbookRuleForm.add")}
          </TextButtonUI>
        )}
      </div>
      {positions.length === 0 ? (
        <p className="text-xs text-gray-500">{group.empty}</p>
      ) : (
        positions.map((position, index) => (
          <PositionCard
            key={index}
            kind={kind}
            index={index}
            count={positions.length}
            position={position}
            onChange={(next) =>
              setPositions(positions.map((p, i) => (i === index ? next : p)))
            }
            onMove={(offset) => movePosition(index, offset)}
            onRemove={() => removePosition(index)}
            onRemoveClause={(clauseIndex) => removeClause(index, clauseIndex)}
          />
        ))
      )}
    </section>
  );
}

function PositionCard({
  kind,
  index,
  count,
  position,
  onChange,
  onMove,
  onRemove,
  onRemoveClause,
}: {
  kind: PositionKind;
  index: number;
  count: number;
  position: PlaybookPosition;
  onChange: (position: PlaybookPosition) => void;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
  onRemoveClause: (clauseIndex: number) => void;
}) {
  const label = positionLabel(kind, index);
  const ordered = kind !== "standard";
  return (
    <fieldset
      // The name field's own height adds space above its text, so the card's
      // top padding is smaller than its sides.
      className={`min-w-0 space-y-4 rounded-xl px-3 pb-3 pt-1.5 md:px-4 md:pb-4 md:pt-2 ${LIQUID_GLASS_FLAT_CLASS}`}
    >
      <legend className="sr-only">{label}</legend>
      <div className="flex items-center gap-2">
        {ordered && (
          <span
            aria-hidden="true"
            className="shrink-0 text-sm tabular-nums text-gray-500"
          >
            {index + 1}.
          </span>
        )}
        <input
          aria-label={tr("pb.nameOf", { label })}
          value={position.name}
          placeholder={label}
          onChange={(event) =>
            onChange({ ...position, name: event.target.value })
          }
          className="h-8 min-w-0 flex-1 rounded-md bg-transparent px-1 text-sm font-medium text-gray-900 outline-none transition-colors placeholder:text-gray-400 hover:bg-app-surface-hover focus-visible:ring-2 focus-visible:ring-blue-500/40"
        />
        <HeaderActionsMenu
          title={tr("playbooks.playbookRuleForm.actions", { label })}
          triggerClassName="h-6 w-6 shrink-0"
          items={[
            ...(ordered && count > 1
              ? [
                  {
                    label: tr("playbooks.playbookRuleForm.moveUp"),
                    disabled: index === 0,
                    onSelect: () => onMove(-1),
                  },
                  {
                    label: tr("playbooks.playbookRuleForm.moveDown"),
                    disabled: index === count - 1,
                    onSelect: () => onMove(1),
                  },
                ]
              : []),
            {
              label: tr("playbooks.playbookRuleForm.removePosition"),
              variant: "danger" as const,
              onSelect: onRemove,
            },
          ]}
        />
      </div>
      <Field
        label={tr("playbooks.playbookRuleForm.criteria")}
        value={position.criteria}
        onChange={(criteria) => onChange({ ...position, criteria })}
        multiline
      />
      <div className="min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h5 className={PLAYBOOK_LABEL_CLASS}>{tr("playbooks.playbookRuleForm.sampleClauses")}</h5>
          <TextButtonUI
            onClick={() =>
              onChange({
                ...position,
                sampleClauses: [
                  ...position.sampleClauses,
                  {
                    text: "",
                    usage: POSITION_GROUPS[kind].usage,
                    sourceRefs: [],
                  },
                ],
              })
            }
          >
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            {tr("playbooks.playbookRuleForm.addClause")}
          </TextButtonUI>
        </div>
        {position.sampleClauses.map((clause, clauseIndex) => (
          <SampleClause
            key={clauseIndex}
            kind={kind}
            index={clauseIndex}
            clause={clause}
            onChange={(next) =>
              onChange({
                ...position,
                sampleClauses: position.sampleClauses.map((entry, i) =>
                  i === clauseIndex ? next : entry,
                ),
              })
            }
            onRemove={() => onRemoveClause(clauseIndex)}
          />
        ))}
      </div>
    </fieldset>
  );
}

function SampleClause({
  kind,
  index,
  clause,
  onChange,
  onRemove,
}: {
  kind: PositionKind;
  index: number;
  clause: PlaybookClause;
  onChange: (clause: PlaybookClause) => void;
  onRemove: () => void;
}) {
  const textId = useId();
  const usageId = useId();
  const conflictId = useId();
  const conflict = clauseUsageConflict(kind, clause.usage);
  return (
    <div className={CLAUSE_TILE_CLASS}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-3 pr-1 pt-1">
        <label htmlFor={textId} className="text-xs font-medium text-gray-500">
          {tr("playbooks.playbookRuleForm.clause2", { value: index + 1 })}
        </label>
        <div className="ml-auto flex min-w-0 items-center gap-1">
          <ModalSelect
            variant="flat"
            id={usageId}
            aria-label={tr("playbooks.playbookRuleForm.clauseUsage", { value: index + 1 })}
            value={clause.usage}
            onChange={(usage) =>
              onChange({ ...clause, usage: usage as PlaybookClauseUsage })
            }
            options={USAGE_OPTIONS}
            className="h-7 w-auto max-w-full gap-1 rounded-lg bg-transparent px-2 text-xs"
            menuClassName="w-44"
          />
          <TextButtonUI
            size="icon-xs"
            aria-label={tr("playbooks.playbookRuleForm.removeClause", { value: index + 1 })}
            title={tr("playbooks.playbookRuleForm.removeClause2")}
            onClick={onRemove}
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
          </TextButtonUI>
        </div>
      </div>
      <textarea
        id={textId}
        value={clause.text}
        rows={3}
        aria-describedby={conflict ? conflictId : undefined}
        onChange={(event) => onChange({ ...clause, text: event.target.value })}
        className={cn(
          PLAYBOOK_TEXTAREA_CLASS,
          "bg-transparent focus:border-transparent focus:ring-0",
        )}
      />
      {conflict && (
        <p id={conflictId} className="px-3 pb-2 text-xs text-amber-800">
          {conflict}
        </p>
      )}
    </div>
  );
}
