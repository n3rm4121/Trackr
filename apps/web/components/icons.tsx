import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowRight01Icon,
  Briefcase01Icon,
  Building01Icon,
  Calendar01Icon,
  BarChartIcon,
  Clock01Icon,
  Delete02Icon,
  DollarCircleIcon,
  Drag01Icon,
  Edit01Icon,
  ExternalLinkIcon,
  FilterIcon,
  InboxIcon,
  KanbanIcon,
  LinkIcon,
  MapPinIcon,
  Moon01Icon,
  MoreVerticalIcon,
  NoteIcon,
  Search01Icon,
  Sun01Icon,
  Tick02Icon,
  TrashIcon,
  Spinner,
} from "@hugeicons/core-free-icons";

// The icon prop is bound at build time, so callers never pass one.
export type BoardIconProps = Omit<
  React.ComponentProps<typeof HugeiconsIcon>,
  "icon" | "altIcon"
>;

function boardIcon(source: IconSvgElement) {
  return function BoardIcon(props: BoardIconProps) {
    return <HugeiconsIcon icon={source} {...props} />;
  };
}

export const IconAdd = boardIcon(Add01Icon);
export const IconArrowRight = boardIcon(ArrowRight01Icon);
export const IconBriefcase = boardIcon(Briefcase01Icon);
export const IconBuilding = boardIcon(Building01Icon);
export const IconCalendar = boardIcon(Calendar01Icon);
export const IconChartBar = boardIcon(BarChartIcon);
export const IconCheck = boardIcon(Tick02Icon);
export const IconClock = boardIcon(Clock01Icon);
export const IconDelete = boardIcon(Delete02Icon);
export const IconDollar = boardIcon(DollarCircleIcon);
export const IconDrag = boardIcon(Drag01Icon);
export const IconEdit = boardIcon(Edit01Icon);
export const IconExternalLink = boardIcon(ExternalLinkIcon);
export const IconFilter = boardIcon(FilterIcon);
export const IconInbox = boardIcon(InboxIcon);
export const IconKanban = boardIcon(KanbanIcon);
export const IconLink = boardIcon(LinkIcon);
export const IconMapPin = boardIcon(MapPinIcon);
export const IconMoon = boardIcon(Moon01Icon);
export const IconMore = boardIcon(MoreVerticalIcon);
export const IconNote = boardIcon(NoteIcon);
export const IconSearch = boardIcon(Search01Icon);
export const IconSun = boardIcon(Sun01Icon);
export const IconTrash = boardIcon(TrashIcon);
export const IconSpinner = boardIcon(Spinner);
