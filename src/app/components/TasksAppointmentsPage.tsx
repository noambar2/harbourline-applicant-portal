import { Fragment, useState, type ReactNode } from "react";
import { useClassicVersion } from "./PageHero";
import {
  ClipboardList,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MapPin,
  CalendarPlus,
  Navigation,
  Check,
  CalendarDays,
  CalendarClock,
  X,
  Send,
  FileText,
  Upload,
  Download,
  Info,
  BookOpen,
  MessageSquare,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useIsMobile } from "./ui/use-mobile";
import { GLASS_CARD } from "./ui/utils";
import { format } from "date-fns";
import { enAU } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Calendar } from "./ui/calendar";
import {
  AdBanner,
  Button,
  Dialog,
  DialogHeader,
  FilterChip,
  IconCircle,
  StatusBadge,
  useDialogClose,
  PAGE_CONTAINER,
  BUTTON_SIZE,
} from "./primitives";

// ── Data ────────────────────────────────────────────────────────────────────

/** Task status - same colour language as the modules */
export type TaskStatus = "Not started" | "In progress" | "Done";

/** Task type - sets the icon and what a tap does */
export type TaskKind =
  | "Form"
  | "Module"
  | "Document"
  | "Survey"
  | "Other";

interface Task {
  id: string;
  name: string;
  kind: TaskKind;
  status: TaskStatus;
  timeLeft: string;
  /** Start of the content - shown on the card as a two-line preview */
  preview: string;
  /** Action text at the bottom of the card */
  action: string;
  /** Progress line (e.g. documents uploaded) - optional */
  progress?: string;
  /** A task in the new (chat) format - "New" badge and its own icon */
  isNew?: boolean;
}

interface DocumentItem {
  id: string;
  name: string;
}

const taskDocuments: DocumentItem[] = [
  { id: "optometrist", name: "Eye test report" },
  { id: "other-medical", name: "Medical certificate" },
];

/** Number of days left, taken from the displayed text */
const daysLeft = (task: Task) =>
  Number(task.timeLeft.match(/\d+/)?.[0] ?? Infinity);

/** Most urgent first; done tasks at the end */
const byUrgency = (a: Task, b: Task) =>
  Number(a.status === "Done") - Number(b.status === "Done") ||
  daysLeft(a) - daysLeft(b);

/** The open task with the fewest days left */
export const mostUrgentTask = () =>
  tasks.filter((t) => t.status !== "Done").sort(byUrgency)[0];

const tasks: Task[] = [
  {
    id: "data-verification",
    name: "Details check",
    kind: "Other",
    status: "Not started",
    timeLeft: "2 days left to complete",
    preview:
      "Instead of a form, a short chat with the admissions assistant. We'll go over your address, emergency contacts and bank details together, you confirm or fix them, and the ID check on application day is already done.",
    action: "Go to chat",
    isNew: true,
  },
  {
    id: "interests",
    name: "Interests survey",
    kind: "Form",
    status: "Not started",
    timeLeft: "3 days left to fill in",
    preview:
      "In this survey you're asked to describe yourself and some areas of your life. It helps our admissions advisers point you towards courses that suit your skills and interests as closely as possible.",
    action: "Go to survey",
  },
  {
    id: "scholarship",
    name: "Scholarship survey",
    kind: "Form",
    status: "Not started",
    timeLeft: "7 days left to fill in",
    preview:
      "This survey registers your interest in the Harbourline Scholars Program and the study areas and campuses you'd like. Rank up to four study areas you're interested in, and up to three campuses for each one.",
    action: "Go to survey",
  },
  {
    id: "survey",
    name: "Application survey",
    kind: "Survey",
    status: "Not started",
    timeLeft: "14 days left to fill in",
    preview:
      "Now that you've finished application day, we'd love to hear how it went. The survey asks how happy you were with each step of the day, the preparation beforehand and the Admissions Centre, and takes about 5 minutes.",
    action: "Go to survey",
  },
  {
    id: "documents",
    name: "Upload documents",
    kind: "Document",
    status: "In progress",
    timeLeft: "12 days left to complete",
    preview:
      "We couldn't find some documents linked to your health & access needs form. Please make sure they've all been uploaded. Tick the documents you've already uploaded:",
    action: "Task details",
    progress: `0 of ${taskDocuments.length} documents uploaded`,
  },
  {
    id: "assessment-learning",
    name: "Entry assessment prep",
    kind: "Module",
    status: "In progress",
    timeLeft: "24 days left to finish",
    preview:
      "This module prepares you for the Harbourline Entry Assessment (HEA) on application day. It includes practice in quantitative reasoning, spatial reasoning, analogies and following instructions.",
    action: "Go to module",
    progress: "8 of 24 tests completed",
  },
  {
    id: "satisfaction-survey",
    name: "Feedback survey",
    kind: "Survey",
    status: "Not started",
    timeLeft: "9 days left to fill in",
    preview:
      "We'd love to hear how you found the applicant portal. The survey is short, anonymous and takes about two minutes. Your answers help us improve the service for future applicants.",
    action: "Go to survey",
  },
  {
    id: "contact-details",
    name: "Update contact details",
    kind: "Other",
    status: "Done",
    timeLeft: "Completed 12/06/2026",
    preview:
      "We asked you to check that your contact details are up to date - phone, email and postal address. They've been updated and there's nothing more you need to do.",
    action: "View details",
  },
  {
    id: "medical-questionnaire",
    name: "Health & access needs form",
    kind: "Form",
    status: "Done",
    timeLeft: "Completed 28/05/2026",
    preview:
      "This form collects information about your health and any access needs ahead of application day. It's been submitted and passed on to the health & access team at the Admissions Centre.",
    action: "View form",
  },
];

export interface Appointment {
  id: string;
  name: string;
  day: string;
  date: string;
  time: string;
  location: string;
  /** Full booking information (can be long) - shown in the booking details dialog */
  details?: string;
  /** Whether there's a digital booking letter to download */
  digitalOrder?: boolean;
  /** Number of times the booking has been moved (up to 2) */
  rescheduleCount?: number;
  /** Past bookings only */
  attended?: boolean;
}

const APPLICATION_DAY_DETAILS = `You're booked in for application day. Please bring:
1. Your booking letter (sent by email).
2. Proof of identity (passport, driver licence or Proof of Age card).
3. Plan to stay for about 5 hours, and bring food and water.
4. If you've seen a psychologist, counsellor or social worker, bring a letter from them if you'd like support on the day.
5. If you've had a learning, educational or neurological assessment, bring a printed copy.
6. Complete your online forms before you arrive - the health & access needs form and the details check.

Health documents to upload to the applicant portal before you arrive, and bring with you (only if they apply to you):
1. If you have an ongoing health condition - a letter from your specialist describing the condition, its effects and any medication you take.
2. The health form from your booking letter, signed by your GP (we can't start your assessment without it completed and signed).
3. If you'd like adjustments for the entry assessment - a recent medical certificate for access needs.
4. A recent GP report (from the last 3 months).
5. If you're short-sighted (-4 or more) and/or have astigmatism over 2 - a recent report from your optometrist.

Wellbeing documents to upload before you arrive, and bring with you:
1. A treatment summary from your psychologist, counsellor or social worker (if you're seeing one now or have in the past).
2. A letter about how you're going at school or work.
3. If you've been assessed or diagnosed, or have documents about support needs, a developmental condition or autism - please bring them.

Other documents to upload before you arrive or bring with you:
1. A prescription for regular attention medication (if you take it, you may prefer to bring it with you and take it before the assessment rather than at home in the morning).

Upload all documents to the applicant portal at least 5 days before application day at portal.harbourline.edu.au, and bring them with you on the day. Good luck!`;

export const upcomingAppointments: Appointment[] = [
  {
    id: "festival",
    name: "Open Day and campus tour",
    day: "Tuesday",
    date: "28/07/2026",
    time: "17:00",
    location: "Wattle Grove campus, Main Lawn",
    rescheduleCount: 0,
  },
  {
    id: "tzav-rishon",
    name: "Application day - Admissions Centre",
    day: "Sunday",
    date: "09/08/2026",
    time: "08:30",
    location: "Admissions Centre, Wattle Grove",
    details: APPLICATION_DAY_DETAILS,
    digitalOrder: true,
    rescheduleCount: 1,
  },
  {
    id: "selectionDay",
    name: "Selection day - entry assessment session",
    day: "Wednesday",
    date: "02/09/2026",
    time: "09:00",
    location: "Building C, Wattle Grove campus",
    details: `Selection day looks at your abilities across a range of skills so we can match you with the best-fit course.

Please bring:
1. Proof of identity (passport or driver licence).
2. Glasses or contact lenses if you use them.
3. Food and water - the day runs for several hours.

We recommend finishing the selection day prep module in the applicant portal before you arrive, so you feel more prepared.`,
    rescheduleCount: 2,
  },
  {
    id: "medical",
    name: "Health & access needs appointment",
    day: "Monday",
    date: "21/09/2026",
    time: "10:15",
    location: "Health Centre, Wattle Grove campus",
    details: `A follow-up appointment to complete your health & access needs profile.

Please bring:
1. Proof of identity.
2. Any relevant medical documents you haven't uploaded yet.
3. A list of any regular medication you take.`,
    rescheduleCount: 0,
  },
  {
    id: "hebrew-test",
    name: "English proficiency test",
    day: "Thursday",
    date: "15/10/2026",
    time: "11:30",
    location: "Admissions Centre, Wattle Grove",
    details: `The English proficiency test checks your language level so we can match you with the right course.

Please bring proof of identity. The test takes about an hour and needs no preparation.`,
    rescheduleCount: 0,
  },
  {
    id: "unit-day",
    name: "Campus interview - Engineering & IT",
    day: "Monday",
    date: "09/11/2026",
    time: "07:45",
    location: "Engineering Hub, Wattle Grove campus",
    details: `An interview day for Engineering & IT applicants - including tests, simulations and a one-on-one interview.

Please bring:
1. Proof of identity.
2. Food and water - the day runs for about 8 hours.
3. Comfortable clothes.`,
    rescheduleCount: 0,
  },
];

export const pastAppointments: Appointment[] = [
  {
    id: "interview",
    name: "Admissions interview",
    day: "Thursday",
    date: "14/05/2026",
    time: "11:00",
    location: "Admissions Centre, Wattle Grove",
    attended: true,
  },
  {
    id: "medical-a",
    name: "Health check - stage 1",
    day: "Monday",
    date: "23/03/2026",
    time: "09:30",
    location: "Health Centre, Wattle Grove campus",
    attended: true,
  },
  {
    id: "hebrew-test",
    name: "English proficiency test",
    day: "Wednesday",
    date: "11/02/2026",
    time: "13:00",
    location: "Admissions Centre, Wattle Grove",
    attended: false,
  },
];

const MAX_RESCHEDULES = 2;

// ── Breadcrumbs ──────────────────────────────────────────────────────────────

export function Breadcrumbs({
  items,
}: {
  /** The last item is the current page (no onClick) */
  items: { label: string; onClick?: () => void }[];
}) {
  return (
    <nav className="flex items-center gap-1.5 text-[14px] mb-4">
      {items.map((item, i) => (
        <Fragment key={item.label}>
          {i > 0 && (
            <ChevronRight
              size={14}
              className="text-[#171c23] opacity-40 shrink-0"
            />
          )}
          {item.onClick ? (
            <button
              type="button"
              onClick={item.onClick}
              className="text-[#008ff0] font-semibold hover:underline underline-offset-4"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-[#171c23] opacity-70">
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

// ── Section heading ──────────────────────────────────────────────────────────

export function SectionHeading({
  title,
  subtitle,
  className = "mb-5",
  heroTitle = false,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  /** The heading matches the hero heading, so it's hidden in the classic version */
  heroTitle?: boolean;
}) {
  const classic = useClassicVersion();
  // An empty div stays so buttons on the same row don't move
  if (heroTitle && classic) return <div />;

  return (
    <div className={`text-left ${className}`}>
      <h2 className="font-bold text-[#122736] text-[28px] sm:text-[34px] tracking-tight inline">
        {title}
        <span className="text-[#69c600]">.</span>
      </h2>
      {subtitle && (
        <p className="text-[#171c23] text-[14px] opacity-50 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ── Task card ────────────────────────────────────────────────────────────────

/** Task status badge - same colours as the module statuses */
function TaskStatusBadge({ status }: { status: TaskStatus }) {
  if (status === "In progress")
    return (
      <span className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1 rounded-full whitespace-nowrap bg-[rgba(0,143,240,0.1)] text-[#008ff0]">
        <span className="w-2 h-2 rounded-full shrink-0 bg-[#008ff0]" />
        {status}
      </span>
    );
  return (
    <StatusBadge
      variant={status === "Done" ? "success" : "neutral"}
      dot
    >
      {status}
    </StatusBadge>
  );
}

const TASK_ICONS: Record<TaskKind, typeof ClipboardList> = {
  Form: ClipboardList,
  Module: BookOpen,
  Document: FileText,
  Survey: MessageSquare,
  Other: Info,
};

/**
 * Task card - the same anatomy for every task type:
 * icon + status badge, task name and time left, progress line (if any),
 * and finally the preview and the action link.
 */
function TaskCard({
  task,
  onClick,
  expanded,
  children,
}: {
  task: Task;
  onClick: () => void;
  /** On mobile the documents task opens inside the card */
  expanded?: boolean;
  children?: ReactNode;
}) {
  const Icon = task.isNew ? Sparkles : TASK_ICONS[task.kind];
  const isPanel = task.kind === "Document";
  return (
    <div className="bg-white rounded-[10px] flex flex-col h-full transition-all duration-200 border border-transparent hover:[box-shadow:0_0_20px_0_rgba(0,143,240,0.25)] hover:border-[rgba(0,143,240,0.2)]">
      <button
        onClick={onClick}
        className="group p-4 md:p-5 flex flex-col gap-2 md:gap-3 text-left w-full flex-1 cursor-pointer"
      >
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="bg-[rgba(0,143,240,0.1)] w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0">
            <Icon size={16} className="text-[#008ff0]" />
          </div>
          <span className="flex items-center gap-1.5">
            {task.isNew && (
              <span className="text-[12px] font-bold px-2.5 py-1 rounded-full bg-[rgba(105,198,0,0.14)] text-[#4e9400]">
                New
              </span>
            )}
            <TaskStatusBadge status={task.status} />
          </span>
        </div>

        <div className="flex flex-col items-start gap-1 w-full min-w-0">
          <h3 className="font-bold text-[#171c23] text-[18px] text-left">
            {task.name}
          </h3>
          <span
            className={`flex items-center gap-1.5 text-[13px] font-semibold ${task.status === "Done" ? "text-[#171c23] opacity-50" : "text-[#e07000]"}`}
          >
            <Clock size={13} className="shrink-0" />
            {task.timeLeft}
          </span>
          {task.progress && (
            <span className="text-[#171c23] text-[13px] font-semibold opacity-60">
              {task.progress}
            </span>
          )}
          {/* The wrapper is needed because line-clamp doesn't survive when the paragraph is a flex item */}
          <div className="w-full">
            <p
              className={`text-[#171c23] text-[13px] opacity-60 leading-snug ${expanded ? "" : "line-clamp-1 md:line-clamp-2"}`}
            >
              {task.preview}
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[#008ff0] text-[14px] font-semibold whitespace-nowrap mt-auto">
          {task.action}
          {isPanel ? (
            <ChevronDown
              size={16}
              className={`md:hidden transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          ) : null}
          <ChevronRight
            size={16}
            className={`${isPanel ? "hidden md:inline-block" : ""} transition-transform duration-200 group-hover:translate-x-0.5`}
          />
        </span>
      </button>
      {children}
    </div>
  );
}

// ── Documents checklist ──────────────────────────────────────────────────────

/** The documents list - same content in the mobile panel and the desktop popup */
function DocumentsChecklist({
  uploaded,
  onToggle,
}: {
  uploaded: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        {taskDocuments.map((doc) => {
          const isUploaded = !!uploaded[doc.id];
          return (
            <button
              key={doc.id}
              onClick={() => onToggle(doc.id)}
              className={`flex items-center justify-between gap-3 rounded-[8px] px-4 py-3 text-left transition-colors border ${
                isUploaded
                  ? "bg-[rgba(105,198,0,0.08)] border-[rgba(105,198,0,0.25)]"
                  : "bg-[#f5f5f7] border-transparent hover:border-[rgba(0,143,240,0.2)]"
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-5 h-5 rounded-[8px] flex items-center justify-center shrink-0 border transition-colors ${
                    isUploaded
                      ? "bg-[#69c600] border-[#69c600]"
                      : "bg-white border-[rgba(23,28,35,0.25)]"
                  }`}
                >
                  {isUploaded && (
                    <Check size={13} className="text-white" />
                  )}
                </span>
                <span
                  className={`text-[14px] font-semibold truncate ${
                    isUploaded ? "text-[#4e9400]" : "text-[#171c23]"
                  }`}
                >
                  {doc.name}
                </span>
              </span>
              <span
                className={`text-[13px] font-semibold whitespace-nowrap shrink-0 ${
                  isUploaded
                    ? "text-[#4e9400]"
                    : "text-[#171c23] opacity-50"
                }`}
              >
                {isUploaded ? "Uploaded" : "Not uploaded"}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-end mt-4 pt-4 border-t border-[rgba(23,28,35,0.05)]">
        <Button>
          <Upload size={14} className="shrink-0" />
          Upload missing files
        </Button>
      </div>
    </>
  );
}

// ── Reschedule dialog / bottom sheet ─────────────────────────────────────────

function RescheduleSuccess({
  rangeLabel,
}: {
  rangeLabel: string | null;
}) {
  const close = useDialogClose();
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <IconCircle
        size={56}
        bg="rgba(105,198,0,0.12)"
        color="#69c600"
      >
        <Check size={26} />
      </IconCircle>
      <p className="font-bold text-[#171c23] text-[18px]">
        Request sent for approval
      </p>
      <p className="text-[#171c23] text-[14px] opacity-60 max-w-[300px]">
        You asked to move this booking to {rangeLabel}. We'll let you
        know as soon as it's approved
      </p>
      <Button onClick={close} className="mt-2">
        Close
      </Button>
    </div>
  );
}

function RescheduleDialog({
  appointment,
  rescheduleCount,
  onSubmit,
  onClose,
}: {
  appointment: Appointment;
  rescheduleCount: number;
  onSubmit: (range: DateRange) => void;
  onClose: () => void;
}) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [submitted, setSubmitted] = useState(false);

  const maxedOut = rescheduleCount >= MAX_RESCHEDULES;

  const handleSubmit = () => {
    if (!range?.from || !range?.to) return;
    onSubmit(range);
    setSubmitted(true);
  };

  const rangeLabel =
    range?.from && range?.to
      ? `${format(range.from, "dd/MM/yyyy")} - ${format(range.to, "dd/MM/yyyy")}`
      : null;

  return (
    <Dialog
      onClose={onClose}
      width={440}
      title="Reschedule booking"
      subtitle={appointment.name}
      bodyClassName={submitted ? "px-5 py-10" : "px-5 py-4"}
      footer={
        !submitted && !maxedOut ? (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3 w-full">
            <span className="text-[#171c23] text-[13px] opacity-60 text-center md:text-left">
              {rangeLabel
                ? `Selected: ${rangeLabel}`
                : "No dates selected yet"}
            </span>
            <Button
              onClick={handleSubmit}
              disabled={!range?.from || !range?.to}
            >
              <Send size={14} className="shrink-0" />
              Submit for approval
            </Button>
          </div>
        ) : undefined
      }
    >
      {submitted ? (
        <RescheduleSuccess rangeLabel={rangeLabel} />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Reschedule counter */}
          <div
            className={`flex items-center gap-2 text-[13px] font-semibold rounded-[8px] px-3 py-2 ${
              maxedOut
                ? "bg-[rgba(196,60,60,0.08)] text-[#c43c3c]"
                : "bg-[rgba(0,143,240,0.08)] text-[#008ff0]"
            }`}
          >
            <CalendarClock size={15} className="shrink-0" />
            {maxedOut
              ? `This booking has been moved ${MAX_RESCHEDULES} times and can't be moved again`
              : `This booking has been moved ${rescheduleCount} of ${MAX_RESCHEDULES} times allowed`}
          </div>

          {!maxedOut && (
            <>
              <p className="text-[#171c23] text-[14px] text-left">
                Select the dates you can make, and we'll send the
                request for approval
              </p>
              <div className="flex justify-center">
                <Calendar
                  // Explicit colour - in dark mode it switches to light text
                  className="app-calendar text-[#171c23]"
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={1}
                  locale={enAU}
                  disabled={{ before: new Date() }}
                  classNames={{
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    // Same width as the day cells (size-9) so the headings line up over the columns
                    head_cell:
                      "text-muted-foreground w-9 font-normal text-[0.8rem]",
                    // The light range background sits on the cell as a continuous band;
                    // at the ends (left of the start cell, right of the end cell) the band rounds around the blue circle
                    cell: "relative p-0 text-center text-sm size-9 [&:has([aria-selected])]:bg-[rgba(var(--brand-rgb,0,143,240),0.16)] [&:has(.day-range-start)]:rounded-l-full [&:has(.day-range-end)]:rounded-r-full first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full",
                    day: "inline-flex items-center justify-center size-9 p-0 font-normal rounded-full cursor-pointer transition-colors hover:bg-[rgba(0,143,240,0.08)] aria-selected:opacity-100",
                    // Solid colour only at the ends - the days in between get the cell's band
                    day_selected: "",
                    day_range_start:
                      "day-range-start bg-[#008ff0] !text-white rounded-full hover:bg-[#008ff0]",
                    day_range_end:
                      "day-range-end bg-[#008ff0] !text-white rounded-full hover:bg-[#008ff0]",
                    day_range_middle:
                      "text-[#171c23] rounded-none hover:bg-transparent",
                    day_today:
                      "border border-[#008ff0] text-[#008ff0]",
                  }}
                  components={{
                    // In LTR the library renders IconLeft in the "previous month" button (left)
                    // and IconRight in the "next month" button (right) - the arrows point outwards
                    IconLeft: () => <ChevronLeft className="size-4" />,
                    IconRight: () => <ChevronRight className="size-4" />,
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </Dialog>
  );
}

function AppointmentDetailsDialog({
  appointment,
  past,
  confirmed,
  onConfirm,
  onClose,
  onReschedule,
}: {
  appointment: Appointment;
  past: boolean;
  confirmed: boolean;
  onConfirm: () => void;
  onClose: () => void;
  onReschedule: () => void;
}) {
  return (
    <Dialog
      onClose={onClose}
      width={560}
      bodyClassName="px-5 py-4"
      header={
        <DialogHeader title={appointment.name}>
          {/* Date + add to calendar */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[#171c23] text-[14px] min-w-0">
              <CalendarDays
                size={15}
                className="text-[#008ff0] shrink-0"
              />
              {appointment.day}, {appointment.date} |{" "}
              {appointment.time}
            </span>
            {!past && (
              <Button variant="link">
                <CalendarPlus size={13} className="shrink-0" />
                Add to calendar
              </Button>
            )}
          </div>
          {/* Location + directions */}
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[#171c23] text-[14px] min-w-0">
              <MapPin
                size={15}
                className="text-[#008ff0] shrink-0"
              />
              {appointment.location}
            </span>
            {!past && (
              <Button variant="link">
                <Navigation size={13} className="shrink-0" />
                Directions
              </Button>
            )}
          </div>
          {appointment.digitalOrder && (
            <div className="flex justify-center pt-1">
              <Button variant="link">
                <Download size={15} className="shrink-0" />
                Download booking letter
              </Button>
            </div>
          )}
        </DialogHeader>
      }
      footer={
        !past ? (
          <DetailsFooter
            confirmed={confirmed}
            onConfirm={onConfirm}
            onReschedule={onReschedule}
          />
        ) : undefined
      }
    >
      <p className="text-[#171c23] text-[14px] text-left leading-relaxed whitespace-pre-line">
        {appointment.details}
      </p>
    </Dialog>
  );
}

/** Booking actions - separate so it can close the dialog before opening the reschedule dialog */
function DetailsFooter({
  confirmed,
  onConfirm,
  onReschedule,
}: {
  confirmed: boolean;
  onConfirm: () => void;
  onReschedule: () => void;
}) {
  const close = useDialogClose();
  return (
    <>
      <Button
        variant="tint"
        onClick={() => {
          close();
          setTimeout(onReschedule, 280);
        }}
      >
        <CalendarClock size={14} className="shrink-0" />
        Reschedule
      </Button>
      <Button
        variant={confirmed ? "success" : "primary"}
        onClick={onConfirm}
      >
        {confirmed && <Check size={15} className="shrink-0" />}
        {confirmed ? "Attendance confirmed" : "Confirm attendance"}
      </Button>
    </>
  );
}

// ── Appointment card ─────────────────────────────────────────────────────────

export function AppointmentCard({
  appointment,
  past = false,
  glass = false,
}: {
  appointment: Appointment;
  past?: boolean;
  /** Glass surface instead of white - for cards that aren't in focus in the carousel */
  glass?: boolean;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rescheduleCount, setRescheduleCount] = useState(
    appointment.rescheduleCount ?? 0,
  );

  return (
    <div
      className={`${glass ? GLASS_CARD : "bg-white"} w-full rounded-[10px] p-5 flex flex-col gap-2`}
    >
      {rescheduleOpen && (
        <RescheduleDialog
          appointment={appointment}
          rescheduleCount={rescheduleCount}
          onSubmit={() =>
            setRescheduleCount((count) =>
              Math.min(count + 1, MAX_RESCHEDULES),
            )
          }
          onClose={() => setRescheduleOpen(false)}
        />
      )}

      {detailsOpen && (
        <AppointmentDetailsDialog
          appointment={appointment}
          past={past}
          confirmed={confirmed}
          onConfirm={() => setConfirmed(!confirmed)}
          onClose={() => setDetailsOpen(false)}
          onReschedule={() => setRescheduleOpen(true)}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-[#171c23] text-[18px] text-left">
          {appointment.name}
        </h3>
        {past && (
          <StatusBadge
            variant={appointment.attended ? "success" : "error"}
            icon={
              appointment.attended ? (
                <Check size={13} className="shrink-0" />
              ) : (
                <X size={13} className="shrink-0" />
              )
            }
          >
            {appointment.attended ? "Attended" : "Didn't attend"}
          </StatusBadge>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[#171c23] text-[14px] min-w-0">
            <CalendarDays
              size={15}
              className="text-[#008ff0] shrink-0"
            />
            {appointment.day}, {appointment.date} |{" "}
            {appointment.time}
          </p>
          {!past && (
            <Button variant="link" className="shrink-0">
              <CalendarPlus size={13} className="shrink-0" />
              Add to calendar
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-[#171c23] text-[14px] min-w-0">
            <MapPin
              size={15}
              className="text-[#008ff0] shrink-0"
            />
            {appointment.location}
          </p>
          {!past && (
            <Button variant="link" className="shrink-0">
              <Navigation size={13} className="shrink-0" />
              Directions
            </Button>
          )}
        </div>
      </div>

      {/* Preview of the booking information + a button for the full details */}
      {appointment.details && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[#171c23] text-[13px] text-left leading-relaxed opacity-60 line-clamp-2">
            {appointment.details}
          </p>
          <Button
            variant="link"
            onClick={() => setDetailsOpen(true)}
            className="self-start"
          >
            <Info size={14} className="shrink-0" />
            Full booking details
          </Button>
        </div>
      )}

        {appointment.digitalOrder && (
      <div className="flex items-center justify-center my-0 pt-2 border-t border-[rgba(23,28,35,0.05)]">
          <Button variant="link" className="shrink-0">
            <Download size={14} className="shrink-0" />
            Download booking letter
          </Button>
        </div>
        )}
{/* card outside */}
      {!past && (
        <div className="app-card-actions flex flex-wrap items-center justify-end gap-2 mt-auto pt-3 border-t border-[rgba(23,28,35,0.05)]">
          {/* {appointment.digitalOrder && (
            <Button variant="tint">
              <Download size={14} className="shrink-0" />
              Download booking letter
            </Button>
          )} */}
          <Button
            onClick={() => setRescheduleOpen(true)}
            variant="tint"
          >
            <CalendarClock size={14} className="shrink-0" />
            Reschedule
          </Button>
          <Button
            onClick={() => setConfirmed(!confirmed)}
            variant={confirmed ? "success" : "primary"}
          >
            {confirmed && <Check size={14} className="shrink-0" />}
            {confirmed ? "Attendance confirmed" : "Confirm attendance"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | TaskStatus;
type KindFilter = "all" | TaskKind;

/** One filter group inside the filter dialog - a label with chips below */
function FilterGroup({
  label,
  options,
}: {
  label: string;
  options: {
    key: string;
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
  }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-full text-[#171c23] text-[13px] opacity-50 mb-0.5">
        {label}
      </span>
      {options.map((o) => (
        <FilterChip
          key={o.key}
          active={o.active}
          // An empty chip can't be tapped - otherwise you land on "no results"
          disabled={o.count === 0 && !o.active}
          count={o.count}
          onClick={o.onClick}
        >
          {o.label}
        </FilterChip>
      ))}
    </div>
  );
}

export default function TasksAppointmentsPage({
  onOpenTask,
  onOpenLearning,
}: {
  onOpenTask?: (id: string) => void;
  onOpenLearning?: () => void;
  onViewAllAppointments?: () => void;
}) {
  const isMobile = useIsMobile();
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilters =
    (statusFilter === "all" ? 0 : 1) + (kindFilter === "all" ? 0 : 1);
  const clearFilters = () => {
    setStatusFilter("all");
    setKindFilter("all");
  };

  /** The documents task - opens in a popup on desktop and a panel on mobile */
  const [docsOpen, setDocsOpen] = useState(false);
  const [uploaded, setUploaded] = useState<
    Record<string, boolean>
  >({});
  const toggleDoc = (id: string) =>
    setUploaded((prev) => ({ ...prev, [id]: !prev[id] }));
  const uploadedCount = taskDocuments.filter(
    (d) => uploaded[d.id],
  ).length;

  const matchStatus = (t: Task, f: StatusFilter) =>
    f === "all" || t.status === f;
  const matchKind = (t: Task, f: KindFilter) =>
    f === "all" || t.kind === f;

  const visible = tasks
    .filter(
      (t) =>
        matchStatus(t, statusFilter) && matchKind(t, kindFilter),
    )
    .sort(byUrgency);

  /** Chip count - taking only the other group's filter into account */
  const countStatus = (f: StatusFilter) =>
    tasks.filter(
      (t) => matchStatus(t, f) && matchKind(t, kindFilter),
    ).length;
  const countKind = (f: KindFilter) =>
    tasks.filter(
      (t) => matchStatus(t, statusFilter) && matchKind(t, f),
    ).length;

  const handleTaskClick = (task: Task) => {
    if (task.kind === "Document") {
      setDocsOpen((v) => !v);
      return;
    }
    if (task.kind === "Module") {
      onOpenLearning?.();
      return;
    }
    onOpenTask?.(task.id);
  };

  const documentsTask = tasks.find((t) => t.kind === "Document")!;

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      {/* Heading + filter button; the filters themselves open in a dialog */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <SectionHeading title="Tasks" className="mb-0" heroTitle />
        <button
          onClick={() => setFiltersOpen(true)}
          className={`flex items-center gap-1 ${BUTTON_SIZE} bg-white text-[#171c23] font-semibold whitespace-nowrap transition-shadow hover:[box-shadow:0_0_20px_0_rgba(0,143,240,0.25)]`}
        >
          <SlidersHorizontal size={14} className="shrink-0" />
          Filter
          {activeFilters > 0 && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#008ff0] text-white text-[12px] font-bold flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Results line - same as in Messages */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1">
        <p className="text-[#171c23] text-[13px] opacity-60">
          Showing {visible.length} of {tasks.length} tasks
        </p>
        {activeFilters > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-[#008ff0] text-[13px] font-semibold hover:underline"
          >
            <X size={14} className="shrink-0" />
            Clear filters
          </button>
        )}
      </div>

      {filtersOpen && (
        <Dialog
          onClose={() => setFiltersOpen(false)}
          width={480}
          title="Filter tasks"
          subtitle={`${visible.length} of ${tasks.length} tasks match`}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={clearFilters}
                disabled={activeFilters === 0}
              >
                Clear
              </Button>
              <Button onClick={() => setFiltersOpen(false)}>
                Show {visible.length} tasks
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-5">
            <FilterGroup
              label="Status"
              options={(
                [
                  { key: "all", label: "All" },
                  { key: "Not started", label: "Not started" },
                  { key: "In progress", label: "In progress" },
                  { key: "Done", label: "Done" },
                ] as { key: StatusFilter; label: string }[]
              ).map((o) => ({
                key: o.key,
                label: o.label,
                count: countStatus(o.key),
                active: statusFilter === o.key,
                onClick: () => setStatusFilter(o.key),
              }))}
            />
            <FilterGroup
              label="Task type"
              options={(
                [
                  { key: "all", label: "All" },
                  { key: "Form", label: "Form" },
                  { key: "Module", label: "Module" },
                  { key: "Document", label: "Document" },
                  { key: "Survey", label: "Survey" },
                  { key: "Other", label: "Other" },
                ] as { key: KindFilter; label: string }[]
              ).map((o) => ({
                key: o.key,
                label: o.label,
                count: countKind(o.key),
                active: kindFilter === o.key,
                onClick: () => setKindFilter(o.key),
              }))}
            />
          </div>
        </Dialog>
      )}

      {/* 4 cards per row on desktop, one per row on mobile */}
      {visible.length === 0 ? (
        <div className="bg-white rounded-[10px] p-10 flex flex-col items-center gap-3 text-center">
          <IconCircle size={56} bg="rgba(0,143,240,0.08)">
            <ClipboardList size={24} />
          </IconCircle>
          <p className="font-bold text-[#171c23] text-[16px]">
            No tasks match your filters
          </p>
          <p className="text-[#171c23] text-[14px] opacity-60">
            Try changing the filters to see more tasks
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
          {visible.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              expanded={
                task.kind === "Document" && isMobile && docsOpen
              }
              onClick={() => handleTaskClick(task)}
            >
              {/* On mobile the documents open inside the card */}
              {task.kind === "Document" && isMobile && docsOpen && (
                <div className="px-5 pb-5 pt-4 border-t border-[rgba(23,28,35,0.05)]">
                  <DocumentsChecklist
                    uploaded={uploaded}
                    onToggle={toggleDoc}
                  />
                </div>
              )}
            </TaskCard>
          ))}
        </div>
      )}

      {/* On desktop the documents task opens in a popup */}
      {docsOpen && !isMobile && (
        <Dialog
          onClose={() => setDocsOpen(false)}
          width={560}
          header={
            <DialogHeader
              title={documentsTask.name}
              subtitle={`${uploadedCount} of ${taskDocuments.length} documents uploaded · ${documentsTask.timeLeft}`}
            />
          }
        >
          <p className="text-[#171c23] text-[14px] text-left leading-relaxed opacity-70 mb-4">
            {documentsTask.preview}
          </p>
          <DocumentsChecklist
            uploaded={uploaded}
            onToggle={toggleDoc}
          />
        </Dialog>
      )}

      <AdBanner />
    </section>
  );
}
