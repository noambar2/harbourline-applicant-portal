import type { ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Inbox,
  Mail,
} from "lucide-react";
import { IconCircle } from "./primitives";
import { inquiryAwaitingApplicant } from "./InquiriesPage";
import { learningInProgress } from "./LearningsPage";
import { GLASS_CARD } from "./ui/utils";
import { mostUrgentTask, upcomingAppointments } from "./TasksAppointmentsPage";

interface NextStep {
  icon: (size: number) => ReactNode;
  label: string;
  title: string;
  detail: string;
  /** Shorter version for the mobile row */
  shortDetail?: string;
  detailClassName: string;
  onClick: () => void;
}

/** Desktop - a card with all the details */
function NextStepCard({ step }: { step: NextStep }) {
  return (
    <button
      onClick={step.onClick}
      title={`${step.title} - ${step.detail}`}
      className={`${GLASS_CARD} group rounded-[10px] p-3 flex items-center gap-2.5 text-left w-full min-w-0`}
    >
      <IconCircle
        bg="rgba(var(--brand-rgb,0,107,191),0.1)"
        color="var(--brand)"
        className="shrink-0"
      >
        {step.icon(18)}
      </IconCircle>
      <span className="flex flex-col flex-1 min-w-0">
        <span className="text-[#171c23] text-[13px] opacity-60 truncate">
          {step.label}
        </span>
        <span className="font-bold text-[#171c23] text-[16px] truncate">
          {step.title}
        </span>
        <span
          className={`text-[13px] font-semibold truncate ${step.detailClassName}`}
        >
          {step.detail}
        </span>
      </span>
      <ChevronRight
        size={18}
        className="text-[#008ff0] shrink-0 transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
}

/** Mobile - one slim row: icon, title and a short detail at the end */
function NextStepRow({ step }: { step: NextStep }) {
  return (
    <button
      onClick={step.onClick}
      aria-label={`${step.label}: ${step.title}${step.shortDetail ? `, ${step.shortDetail}` : ""}`}
      className="flex items-center gap-2.5 min-h-[46px] px-4 text-left w-full min-w-0 border-b border-[rgba(23,28,35,0.06)] last:border-b-0"
    >
      <span className="text-[#008ff0] shrink-0">{step.icon(16)}</span>
      <span className="font-semibold text-[#171c23] text-[14px] truncate flex-1 min-w-0">
        {step.title}
      </span>
      {step.shortDetail && (
        <span
          className={`text-[12px] font-semibold whitespace-nowrap shrink-0 ${step.detailClassName}`}
        >
          {step.shortDetail}
        </span>
      )}
      <ChevronRight size={15} className="text-[#008ff0] shrink-0" />
    </button>
  );
}

/** Next steps - whatever needs attention, right as you open My profile */
export function NextSteps({
  unreadCount,
  onOpenTasks,
  onOpenAppointments,
  onOpenInquiries,
  onOpenLearning,
  onOpenMessages,
}: {
  unreadCount: number;
  onOpenTasks: () => void;
  onOpenAppointments: () => void;
  onOpenInquiries: () => void;
  onOpenLearning: () => void;
  onOpenMessages: () => void;
}) {
  const task = mostUrgentTask();
  const appointment = upcomingAppointments[0];
  const inquiry = inquiryAwaitingApplicant();
  // If the module is also the most urgent task, show it only once
  const learning = learningInProgress();
  const showLearning = learning && learning.name !== task?.name;

  const steps: NextStep[] = [];
  if (task)
    steps.push({
      icon: (size) => <ClipboardList size={size} />,
      label: "Most urgent task",
      title: task.name,
      detail: task.timeLeft,
      shortDetail: `${task.timeLeft.match(/\d+/)?.[0]} days left`,
      detailClassName: "text-[#e07000]",
      onClick: onOpenTasks,
    });
  if (appointment)
    steps.push({
      icon: (size) => <CalendarDays size={size} />,
      label: "Next booking",
      title: appointment.name,
      detail: `${appointment.day}, ${appointment.date} | ${appointment.time}`,
      shortDetail: appointment.date,
      detailClassName: "text-[#171c23] opacity-70",
      onClick: onOpenAppointments,
    });
  if (inquiry)
    steps.push({
      icon: (size) => <Inbox size={size} />,
      label: "Enquiry waiting on you",
      title: inquiry.subject,
      detail: inquiry.awaitingRecruit ?? "",
      shortDetail: "Waiting on you",
      detailClassName: "text-[#e07000]",
      onClick: onOpenInquiries,
    });
  if (showLearning)
    steps.push({
      icon: (size) => <BookOpen size={size} />,
      label: "Module in progress",
      title: learning.name,
      detail: `${learning.testsDone} of ${learning.tests} tests · ${learning.progress}%`,
      shortDetail: `${learning.progress}%`,
      detailClassName: "text-[#008ff0]",
      onClick: onOpenLearning,
    });
  if (unreadCount > 0)
    steps.push({
      icon: (size) => <Mail size={size} />,
      label: "Messages",
      title:
        unreadCount === 1
          ? "1 unread message"
          : `${unreadCount} unread messages`,
      detail: "Go to all messages",
      detailClassName: "text-[#008ff0]",
      onClick: onOpenMessages,
    });

  return (
    <div className="pt-2 first:pt-0">
      <h2 className="font-bold text-[#122736] text-[28px] sm:text-[34px] tracking-tight text-left mb-3">
        Next steps<span className="text-[#69c600]">.</span>
      </h2>
      <div className={`${GLASS_CARD} rounded-[10px] md:hidden`}>
        {steps.map((step) => (
          <NextStepRow key={step.label} step={step} />
        ))}
      </div>
      <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-5 gap-3">
        {steps.map((step) => (
          <NextStepCard key={step.label} step={step} />
        ))}
      </div>
    </div>
  );
}
