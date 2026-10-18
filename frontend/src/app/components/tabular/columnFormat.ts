import type { LucideIcon } from "lucide-react";
import { AlignLeft, List, Hash, DollarSign, ToggleLeft, Calendar, Tag, Percent, Banknote } from "lucide-react";
import type { ColumnFormat } from "../shared/types";
import { tr } from "@/shared/i18n/runtime";

export const FORMAT_OPTIONS: Array<{ value: ColumnFormat; label: string; icon: LucideIcon; iconClassName: string }> = [
    { value: "text",            get label() {
        return tr("tabular.columnFormat.freeText");
    },       icon: AlignLeft,  iconClassName: "text-sky-500"     },
    { value: "bulleted_list",   get label() {
        return tr("tabular.columnFormat.bulletedList");
    },   icon: List,       iconClassName: "text-indigo-500"  },
    { value: "number",          get label() {
        return tr("tabular.columnFormat.number");
    },          icon: Hash,       iconClassName: "text-violet-500"  },
    { value: "percentage",      get label() {
        return tr("tabular.columnFormat.percentage");
    },      icon: Percent,    iconClassName: "text-fuchsia-500" },
    { value: "monetary_amount", get label() {
        return tr("tabular.columnFormat.monetaryAmount");
    }, icon: Banknote,   iconClassName: "text-emerald-600" },
    { value: "currency",        get label() {
        return tr("tabular.columnFormat.currency");
    },        icon: DollarSign, iconClassName: "text-teal-600"    },
    { value: "yes_no",          get label() {
        return tr("tabular.columnFormat.yesNo");
    },        icon: ToggleLeft, iconClassName: "text-amber-500"   },
    { value: "date",            get label() {
        return tr("tabular.columnFormat.date");
    },            icon: Calendar,   iconClassName: "text-rose-500"    },
    { value: "tag",             get label() {
        return tr("tabular.columnFormat.tags");
    },            icon: Tag,        iconClassName: "text-orange-500"  },
];

export function formatLabel(format: ColumnFormat): string {
    return FORMAT_OPTIONS.find((o) => o.value === format)?.label ?? tr("tabular.columnFormat.text");
}

export function formatIcon(format: ColumnFormat): LucideIcon {
    return FORMAT_OPTIONS.find((o) => o.value === format)?.icon ?? AlignLeft;
}

export function formatIconClassName(format: ColumnFormat): string {
    return FORMAT_OPTIONS.find((o) => o.value === format)?.iconClassName ?? "text-sky-500";
}
