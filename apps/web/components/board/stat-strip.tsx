import { IconBriefcase, IconCheck, IconClock, type BoardIconProps } from "@/components/icons";

type Chip = {
  id: string;
  label: string;
  value: number;
  icon: (props: BoardIconProps) => React.JSX.Element;
  tone: string;
};

export function StatStrip({
  total,
  activeInterviews,
  offers,
}: {
  total: number;
  activeInterviews: number;
  offers: number;
}) {
  const chips: Chip[] = [
    {
      id: "total",
      label: "Total applications",
      value: total,
      icon: IconBriefcase,
      tone: "text-foreground",
    },
    {
      id: "interviews",
      label: "Active interviews",
      value: activeInterviews,
      icon: IconClock,
      tone: "text-amber-600 dark:text-amber-400",
    },
    {
      id: "offers",
      label: "Offers",
      value: offers,
      icon: IconCheck,
      tone: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div
      data-testid="stat-strip"
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Board summary"
    >
      {chips.map((chip) => {
        const Icon = chip.icon;
        return (
          <div
            key={chip.id}
            className="bg-card flex items-center gap-2 rounded-full border px-3 py-1.5"
          >
            <Icon aria-hidden className={`size-4 shrink-0 ${chip.tone}`} />
            <span className={`text-sm font-semibold tabular-nums ${chip.tone}`}>
              {chip.value}
            </span>
            <span className="text-muted-foreground text-xs">{chip.label}</span>
          </div>
        );
      })}
    </div>
  );
}
