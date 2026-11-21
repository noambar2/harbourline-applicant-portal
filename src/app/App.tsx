import { useState, useEffect, useRef } from "react";
import {
  Search,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Pencil,
  Info,
  Settings,
  User,
} from "lucide-react";
import harbourlineLogo from '../imports/harbourline-logo.svg';
import LearningsPage from './components/LearningsPage';
import TasksAppointmentsPage from './components/TasksAppointmentsPage';
import MyAppointmentsPage from './components/MyAppointmentsPage';
import InterestsSurveyPage from './components/InterestsSurveyPage';
import ScholarshipSurveyPage from './components/ScholarshipSurveyPage';
import ApplicationSurveyPage from './components/ApplicationSurveyPage';
import DataVerificationChatPage from './components/DataVerificationChatPage';
import SettingsPage from './components/SettingsPage';
import InquiriesPage from './components/InquiriesPage';
import MessagesPage, {
  INITIAL_READ_MESSAGE_IDS,
  INITIAL_ARCHIVED_MESSAGE_IDS,
  countUnreadMessages,
} from './components/MessagesPage';
import { GLASS_CARD } from './components/ui/utils';
import { NextSteps } from './components/NextSteps';
import {
  ClassicVersionContext,
  PageHero,
  useClassicVersion,
} from './components/PageHero';
import {
  THEMES,
  DEFAULT_THEME,
  accentFor,
  getTheme,
  heroGradientBg,
  themeVars,
} from './themes';
import {
  AdBanner,
  Button,
  LayoutSwitch,
  Dialog,
  DialogHeader,
  IconCircle,
  StatusBadge,
  useDialogClose,
  CONTROL_SIZE,
} from './components/primitives';
import {
  ContactEditDialog,
  ParentEditDialog,
  CompanionWizard,
  AuthPermissionsBlock,
  AddCompanionBtn,
  MAX_COMPANIONS,
  type ContactInfo,
  type Parent,
  type Companion,
} from './components/PersonalDetailsForms';

type Page =
  | "profile"
  | "learnings"
  | "tasks"
  | "appointments"
  | "interestsForm"
  | "scholarshipForm"
  | "surveyForm"
  | "dataChat"
  | "settings"
  | "messages"
  | "inquiries";

// ── Hooks ────────────────────────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" && window.innerWidth < 768,
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ── Inline assets ────────────────────────────────────────────────────────────

function HarbourlineLogo({ className }: { className?: string }) {
  return <img src={harbourlineLogo} alt="Harbourline University" className={className} />;
}

function ProfileAvatar({ className }: { className?: string }) {
  return (
    <div
      className={`bg-[#008ff0] flex items-center justify-center rounded-full shrink-0 ${className ?? "w-9 h-9"}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <path
          d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z"
          fill="white"
        />
      </svg>
    </div>
  );
}

// ── Data ────────────────────────────────────────────────────────────────────

const qualityScores = [
  { label: "People skills", value: 5 },
  { label: "Fieldwork", value: 1 },
  { label: "Teaching", value: 3 },
  { label: "Organisation", value: 5 },
  { label: "Technical use", value: 3 },
  { label: "Problem fixing", value: 4 },
  { label: "Focus", value: 1 },
  { label: "Sustained attention", value: 3 },
  { label: "Information processing", value: 4 },
  { label: "Persistence", value: 5 },
  { label: "Teamwork", value: 2 },
  { label: "Leadership", value: 2 },
  { label: "Spatial reasoning", value: 1 },
  { label: "Maturity", value: 3 },
  { label: "Self-management", value: 4 },
];

/** A short explanation for each selection-day skill - shown on hover over the info icon */
const SELECTION_DAY_SKILL_INFO: Record<string, string> = {
  "People skills":
    "Building rapport, listening and helping others.",
  Fieldwork: "Working outdoors and on site - navigation, stamina and physical effort.",
  Teaching: "Explaining ideas clearly and guiding a group.",
  Organisation:
    "Planning and managing resources, time and tasks.",
  "Technical use":
    "Learning and operating technical systems and equipment.",
  "Problem fixing":
    "Troubleshooting, maintaining and repairing equipment.",
  Focus:
    "Staying on one thing despite noise and distractions.",
  "Sustained attention":
    "Keeping concentration over time on a repetitive task.",
  "Information processing":
    "Taking in, analysing and drawing conclusions from new information.",
  Persistence:
    "Putting in effort and sticking with long, hard tasks.",
  Teamwork:
    "Cooperating, contributing to the group and considering others.",
  Leadership:
    "Leading others, making decisions and taking responsibility.",
  "Spatial reasoning":
    "Understanding how objects relate in space, and finding your way.",
  Maturity:
    "Good judgement, personal responsibility and coping under pressure.",
  "Self-management":
    "Following rules, meeting deadlines and working within a structure.",
};

/** The six numeric scores. `interactive` = has an explanation in a tooltip/bottom sheet in option 1 */
const scoreCards: {
  label: string;
  value: number;
  max: number;
  interactive?: boolean;
}[] = [
  { label: "Entry assessment", value: 30, max: 90, interactive: true },
  { label: "English", value: 8, max: 8, interactive: true },
  {
    label: "Access needs",
    value: 97,
    max: 97,
    interactive: true,
  },
  { label: "Wellbeing", value: 2, max: 5, interactive: true },
  { label: "Sustained attention", value: 3, max: 5, interactive: true },
  { label: "Leadership potential", value: 4, max: 5, interactive: true },
];

const SELECTION_DAY_LABEL = "Selection day";
const ASSESSMENT_LABEL = "Entry assessment";

/** Entry assessment sub-test breakdown - shown as a bar chart in every more-info view */
const ASSESSMENT_MAX = 90;
const ASSESSMENT_TICKS = [90, 80, 70, 60, 50, 40, 30, 20, 10, 0];
const ASSESSMENT_BREAKDOWN = [
  { label: "Quantitative reasoning", value: 40 },
  { label: "Verbal instructions", value: 30 },
  { label: "Visual analogies", value: 20 },
  { label: "Verbal analogies", value: 30 },
];

const GAUGE_INFO: Record<string, { explanation: string }> = {
  "Entry assessment": {
    explanation: `The Harbourline Entry Assessment (HEA) measures your reasoning through quantitative, verbal and memory tasks. You sat the assessment at the Admissions Centre, and it is scored from 10 (lowest) to 90 (highest) in steps of 10.`,
  },
  English: {
    explanation: `Your English proficiency score reflects your level of English. It is based on the speaking task in your personal interview, and some applicants also complete a reading comprehension task.\n\nThe score ranges from 5 (lowest) to 8 (highest).\nTogether with other results, it is a threshold for some courses and for the Harbourline Scholars Program.\nThe score is used only for admissions and does not appear on your academic record.`,
  },
  "Access needs": {
    explanation:
      "Your access needs profile records any health or disability support you may need on campus, so we can plan adjustments for your studies.",
  },
  "Selection day": {
    explanation: `Selection day looks at a range of skills so we can match each applicant to the course that best fits their abilities, their goals and the needs of each faculty.`,
  },
  Wellbeing: {
    explanation: `Your wellbeing score comes from the personal interview at the Admissions Centre and reflects how ready you feel for the move to university life.\n\nThe score ranges from 1 (lowest) to 5 (highest) and, together with other results, helps us offer the right support from your first week.`,
  },
  "Sustained attention": {
    explanation: `Sustained attention is measured on selection day and looks at your ability to stay focused over time on a repetitive task.\n\nThe score ranges from 1 (lowest) to 5 (highest) and is one factor for courses that need long periods of focus.`,
  },
  "Leadership potential": {
    explanation: `Leadership potential combines your assessment results, the skills measured on selection day and your personal interview, and reflects your potential for leadership programs and student roles.\n\nThe score ranges from 1 (lowest) to 5 (highest) and isn't final - it may be updated during your studies.`,
  },
};

// ── Assessment chart ──────────────────────────────────────────────────────────────

/** Bar chart of the entry assessment sub-tests. Y axis: 0-90 in steps of 10 */
function AssessmentChart() {
  // The bars "grow" on entry - pleasant, and it highlights the comparison between sub-tests
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="w-full" dir="ltr">
      <div className="flex gap-2.5">
        {/* Y axis */}
        <div className="flex flex-col justify-between h-[190px] shrink-0 text-[10px] text-[rgba(23,28,35,0.4)] tabular-nums text-left">
          {ASSESSMENT_TICKS.map((t) => (
            <span key={t} className="leading-none">
              {t}
            </span>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          {/* Plot area */}
          <div className="relative h-[190px]">
            {ASSESSMENT_TICKS.map((t, i) => (
              <div
                key={t}
                className={`absolute inset-x-0 border-t ${t === 0 ? "border-[rgba(23,28,35,0.12)]" : "border-[rgba(23,28,35,0.05)]"}`}
                style={{
                  top: `${(i / (ASSESSMENT_TICKS.length - 1)) * 100}%`,
                }}
              />
            ))}
            <div className="absolute inset-0 flex items-end">
              {ASSESSMENT_BREAKDOWN.map((b) => (
                <div
                  key={b.label}
                  className="flex-1 flex justify-center items-end h-full px-1.5"
                >
                  <div
                    className="relative w-full max-w-[30px] rounded-t-[6px] transition-[height] duration-700 ease-out"
                    style={{
                      height: grown
                        ? `${(b.value / ASSESSMENT_MAX) * 100}%`
                        : 0,
                      background:
                        "linear-gradient(to top, var(--brand, #008ff0), rgba(var(--brand-rgb, 0,143,240), 0.5))",
                    }}
                  >
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 text-[11px] font-bold text-[#008ff0] tabular-nums">
                      {b.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* X-axis labels - aligned under the bars */}
          <div className="flex pt-2.5">
            {ASSESSMENT_BREAKDOWN.map((b) => (
              <div
                key={b.label}
                className="flex-1 px-1 text-center text-[11px] leading-tight text-[rgba(23,28,35,0.62)]"
              >
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tooltip (desktop) ────────────────────────────────────────────────────────

function GaugeTooltip({
  x,
  y,
  label,
  value,
}: {
  x: number;
  y: number;
  label: string;
  value: number;
}) {
  const info = GAUGE_INFO[label];
  if (!info) return null;

  // The entry assessment tooltip is wider to fit the chart beside the text
  const hasChart = label === ASSESSMENT_LABEL;
  const TOOLTIP_W = hasChart ? 620 : 300;
  const OFFSET = 18;
  const left =
    x + OFFSET + TOOLTIP_W > window.innerWidth
      ? x - TOOLTIP_W - OFFSET
      : x + OFFSET;
  const estimatedHeight = hasChart ? 280 : 160;
  const top =
    y + OFFSET + estimatedHeight > window.innerHeight
      ? y - estimatedHeight - OFFSET
      : y + OFFSET;

  return (
    <div
      className="fixed z-[500] pointer-events-none bg-white rounded-[10px] p-4"
      style={{
        left,
        top,
        width: TOOLTIP_W,
        boxShadow: "0 12px 32px rgba(0,0,0,0.16)",
      }}
    >
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="font-bold text-[#171c23] text-[16px]">
          {label}
        </span>
        {value > 0 && (
          <span className="stat-number text-[#008ff0] text-[20px]">
            {value}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <ScoreDetails label={label} />
      </div>
    </div>
  );
}

// ── Bottom Sheet (mobile) ────────────────────────────────────────────────────

function BottomSheet({
  label,
  value,
  onClose,
}: {
  label: string;
  value: number;
  onClose: () => void;
}) {
  return (
    <Dialog
      onClose={onClose}
      header={
        <DialogHeader
          title={
            <span className="flex items-baseline gap-1.5">
              {label}
              <span className="stat-number text-[#008ff0] text-[24px]">
                {value}
              </span>
            </span>
          }
        />
      }
    >
      <div className="flex flex-col gap-4">
        <ScoreDetails label={label} />
      </div>
    </Dialog>
  );
}

// ── Primitives ───────────────────────────────────────────────────────────────

function SemiGauge({
  value,
  max,
}: {
  value: number;
  max: number;
}) {
  const r = 80;
  const arc = Math.PI * r;
  const fill = (value / max) * arc;
  return (
    <div
      className="relative"
      style={{ width: 180, height: 96 }}
    >
      <svg
        width="180"
        height="90"
        viewBox="0 0 180 90"
        className="block overflow-visible w-[120px] md:w-[180px] mx-auto"
      >
        <path
          d="M 10 90 A 80 80 0 0 1 170 90"
          fill="none"
          stroke="var(--gauge-track, #f5f5f7)"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M 10 90 A 80 80 0 0 1 170 90"
          fill="none"
          stroke="var(--brand, #008ff0)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${arc}`}
        />
      </svg>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center leading-none pb-1">
        <span className="stat-number text-[#171c23] text-[28px] tracking-tight">
          {value}
        </span>
        <span className="text-[rgba(23,28,35,0.5)] text-[13px]">
          /{max}
        </span>
      </div>
    </div>
  );
}

interface GaugeCardProps {
  label: string;
  value: number;
  max: number;
  display?: "gauge" | "number";
  interactive?: boolean;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
  hovered?: boolean;
}

function GaugeCard({
  label,
  value,
  max,
  display = "gauge",
  interactive,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  onClick,
  hovered,
}: GaugeCardProps) {
  return (
    <div
      className={`bg-white rounded-[10px] flex-1 min-w-0 p-3 sm:p-5 flex flex-col items-center gap-2 transition-all duration-200 select-none ${interactive ? "cursor-pointer" : ""}`}
      style={
        hovered
          ? {
              boxShadow: "0 0 20px 0 rgba(0, 143, 240, 0.25)",
              border: "1px solid rgba(0, 143, 240, 0.2)",
            }
          : undefined
      }
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <p className="font-bold text-[#171c23] text-[15px] sm:text-[16px] text-left w-full flex items-center gap-1.5">
        {label}
        {interactive && (
          <Info
            size={15}
            className="hidden md:inline-block shrink-0 opacity-40"
          />
        )}
      </p>
      {/* The value is centred in the remaining space - cards stretch to the selection-day card height */}
      <div className="flex-1 w-full flex items-center justify-center">
        {display === "number" ? (
          <p className="stat-number text-[#008ff0] text-[44px] sm:text-[52px] leading-none tracking-tight">
            {value}
          </p>
        ) : (
          <SemiGauge value={value} max={max} />
        )}
      </div>
      {interactive ? (
        <p className="md:hidden text-[#171c23] text-[13px] sm:text-[14px] text-left w-full opacity-70">
          Tap for more info
        </p>
      ) : (
        <p
          aria-hidden
          className="md:hidden invisible text-[13px] sm:text-[14px] w-full"
        >
          &nbsp;
        </p>
      )}
    </div>
  );
}


function KpiCard({
  label,
  value,
  subtitle,
  valueClassName,
  glass,
  interactive,
  onClick,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  valueClassName?: string;
  glass?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`${glass ? GLASS_CARD : "bg-white"} rounded-[10px] flex-1 min-w-0 p-5 flex flex-col items-center justify-between gap-2 ${interactive ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <p className="font-bold text-[#171c23] text-[15px] sm:text-[16px] text-left w-full">
        {label}
      </p>
      <p
        className={`stat-number text-[#008ff0] leading-none tracking-tight ${valueClassName ?? "text-[44px] sm:text-[52px]"}`}
      >
        {value}
      </p>
      {subtitle ? (
        <p className="text-[#171c23] text-[14px] text-left w-full opacity-70">
          {subtitle}
        </p>
      ) : (
        <p
          aria-hidden
          className="invisible text-[14px] w-full"
        >
          &nbsp;
        </p>
      )}
    </div>
  );
}

// Combined card: countdown to the start of studies + estimated start date + predicted offer
/** Clear glass for a card that sits on an image - defined in themes.css */
const PHOTO_GLASS_CARD = "photo-glass";

function StartDateCard({
  days,
  date,
  hebrewDate,
  assignment,
  onPhoto = false,
}: {
  days: number;
  date: string;
  hebrewDate: string;
  assignment: string;
  /** On a dark image the glass needs to be lighter so the text stays legible */
  onPhoto?: boolean;
}) {
  // On clear glass over a dark image the text and lines turn light
  const labelColor = onPhoto ? "text-white" : "text-[#171c23]";
  const valueColor = onPhoto ? "text-white" : "text-[#008ff0]";
  const dividerColor = onPhoto
    ? "bg-white/25"
    : "bg-[rgba(23,28,35,0.08)]";

  return (
    <div
      className={`${onPhoto ? PHOTO_GLASS_CARD : `${GLASS_CARD} rounded-[10px]`} col-span-2 md:col-span-3 min-w-0 flex flex-col md:flex-row md:items-stretch`}
    >
      {/* Days to start + estimated date */}
      <div className="flex items-stretch min-w-0 md:flex-[2]">
        <div className="flex-1 min-w-0 px-3 py-3 sm:px-4 flex flex-col items-center justify-between gap-1">
          <p className={`font-normal ${labelColor} text-[14px] sm:text-[15px] text-center w-full`}>
            Days to start
          </p>
          <p className={`stat-number ${valueColor} text-[30px] sm:text-[34px] leading-none tracking-tight`}>
            {days}
          </p>
          <p className={`${labelColor} text-[12px] sm:text-[13px] opacity-70 whitespace-nowrap`}>
            {Math.floor(days / 30.44)} months and{" "}
            {days - Math.round(Math.floor(days / 30.44) * 30.44)} days
          </p>
        </div>

        {/* Subtle divider */}
        <div className={`w-px ${dividerColor} my-3 sm:my-4 shrink-0`} />

        <div className="flex-1 min-w-0 px-3 py-3 sm:px-4 flex flex-col items-center justify-between gap-1">
          <p className={`font-normal ${labelColor} text-[14px] sm:text-[15px] text-center w-full`}>
            Estimated start date
          </p>
          <p className={`stat-number ${valueColor} text-[24px] sm:text-[22px] leading-none tracking-tight whitespace-nowrap`}>
            {date}
          </p>
          <p className={`${labelColor} text-[12px] sm:text-[13px] opacity-70 whitespace-nowrap`}>
            {hebrewDate}
          </p>
        </div>
      </div>

      {/* Divider: horizontal on mobile, vertical on desktop */}
      <div className={`h-px w-auto mx-4 md:h-auto md:w-px md:mx-0 md:my-4 ${dividerColor} shrink-0`} />

      {/* Predicted offer */}
      <div className="min-w-0 md:flex-[1] px-3 py-3 sm:px-4 flex flex-col items-center justify-between gap-1">
        <p className={`font-normal ${labelColor} text-[14px] sm:text-[15px] text-center w-full`}>
          Predicted offer
        </p>
        <p className={`font-semibold ${valueColor} text-[24px] sm:text-[22px] leading-none tracking-tight text-center`}>
          {assignment}
        </p>
        <p
          aria-hidden
          className="invisible text-[12px] sm:text-[13px] w-full"
        >
          &nbsp;
        </p>
      </div>
    </div>
  );
}

const START_DATE = {
  days: 186,
  date: "01/03/2027",
  hebrewDate: "Semester 1, 2027",
  assignment: "B. Engineering (Hons)",
};

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-start min-w-[100px]">
      <span className="text-[#171c23] text-[13px] opacity-50 whitespace-nowrap">
        {label}
      </span>
      <span className="text-[#171c23] text-[15px] whitespace-nowrap">
        {value}
      </span>
    </div>
  );
}


function SubSection({
  title,
  className = "mb-3",
}: {
  title: string;
  className?: string;
}) {
  return (
    <p
      className={`font-semibold text-[#171c23] text-[15px] ${className}`}
    >
      {title}
    </p>
  );
}

// ── Logout confirmation dialog ────────────────────────────────────────────────

function LogoutConfirmDialog({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <Dialog
      onClose={onClose}
      width={380}
      bodyClassName="px-6 pt-6 pb-2"
      footer={<LogoutActions />}
    >
      <div className="flex flex-col items-center text-center">
        <IconCircle size={56} className="mb-4">
          <LogOut size={24} />
        </IconCircle>
        <h3 className="font-bold text-[#171c23] text-[20px] mb-1.5">
          Log out
        </h3>
        <p className="text-[#171c23] text-[14px] opacity-60">
          Do you want to log out of your applicant portal?
        </p>
      </div>
    </Dialog>
  );
}

function LogoutActions() {
  const close = useDialogClose();
  return (
    <div className="flex gap-3 w-full">
      <Button
        variant="ghost"
        onClick={close}
        className="flex-1 justify-center"
      >
        Cancel
      </Button>
      <Button onClick={close} className="flex-1 justify-center">
        Log out
      </Button>
    </div>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────

function Header({
  activePage,
  onNavigate,
  unreadCount,
  navGradient,
}: {
  activePage: Page;
  onNavigate: (page: Page) => void;
  /** Number of unread messages - for the badge on the "Messages" menu item */
  unreadCount: number;
  /** Nav-bar gradient - comes from the theme */
  navGradient: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const navTabs = [
    "Messages",
    "Enquiries",
    "Modules",
    "Tasks",
    "Bookings",
    "My profile",
  ];
  const tabToPage: Record<string, Page> = {
    Messages: "messages",
    Enquiries: "inquiries",
    Modules: "learnings",
    "My profile": "profile",
    Tasks: "tasks",
    Bookings: "appointments",
  };
  /** Count badge on a menu item - currently only for unread messages */
  const tabCount = (tab: string) =>
    tab === "Messages" && unreadCount > 0 ? unreadCount : 0;
  const isActiveTab = (tab: string) =>
    tabToPage[tab] === activePage;
  const handleTabClick = (tab: string) => {
    const page = tabToPage[tab];
    if (page) onNavigate(page);
  };

  const NavCount = ({ tab }: { tab: string }) => {
    const count = tabCount(tab);
    if (!count) return null;
    return (
      <span
        aria-label={`${count} unread messages`}
        className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#c43c3c] text-white text-[11px] font-bold flex items-center justify-center leading-none shrink-0"
      >
        {count}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="hidden md:flex bg-[#122736] items-center justify-between px-10 py-1.5">
        {/* Left: logo + main nav */}
        <div className="flex items-center gap-6 text-white text-[15px]">
          <HarbourlineLogo className="h-[32px] pb-2" />
          <span className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
            How to apply <ChevronDown size={14} />
          </span>
          <span className="cursor-pointer hover:opacity-80 transition-opacity">
            Courses
          </span>
          <span className="cursor-pointer hover:opacity-80 transition-opacity">
            Forms
          </span>
          <span className="cursor-pointer hover:opacity-80 transition-opacity">
            News
          </span>
          <span className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
            Campuses <ChevronDown size={14} />
          </span>
        </div>
        {/* Right: utility links */}
        <div className="flex items-center gap-6 text-white text-[15px]">
          <span className="cursor-pointer hover:opacity-80 transition-opacity">
            FAQs
          </span>
          <span className="cursor-pointer hover:opacity-80 transition-opacity">
            Contact us
          </span>
          <span className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
            English <ChevronDown size={14} />
          </span>
        </div>
      </div>

      <div
        className="text-white relative"
        style={{
          background:
            navGradient,
        }}
      >
        <div className="hidden md:flex items-center justify-between px-10 h-[54px]">
          <nav className="flex flex-row-reverse items-center gap-1">
            {navTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`px-4 py-1 rounded text-[15px] whitespace-nowrap transition-colors flex items-center gap-2 ${
                  isActiveTab(tab)
                    ? "bg-white/10 font-semibold"
                    : "opacity-80 hover:opacity-100 hover:bg-white/5"
                }`}
              >
                {tab}
                <NavCount tab={tab} />
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-full px-4 h-8 flex items-center gap-2 w-[220px]">
              <Search size={15} />
              <span className="text-white/70 text-[14px]">
                Search
              </span>
            </div>
            <button
              onClick={() => onNavigate("settings")}
              className={`flex items-center justify-center transition-opacity ${
                activePage === "settings"
                  ? "opacity-100"
                  : "opacity-80 hover:opacity-100"
              }`}
              aria-label="Settings"
            >
              <Settings size={17} />
            </button>
            <div className="w-px h-6 bg-white/20 mx-1" />
            {/* User block: icon, name, log out */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <User size={17} />
              </div>
              <span className="text-[14px] font-semibold whitespace-nowrap">
                Olivia Bennett
              </span>
              <button
                aria-label="Log out"
                onClick={() => setLogoutOpen(true)}
                className="flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </div>

        <div className="md:hidden flex items-center justify-between px-4 h-[64px] bg-[#122736]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="w-9 h-9 flex items-center justify-center"
            >
              {mobileOpen ? (
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}
            </button>
            <HarbourlineLogo className="h-[32px] pb-2" />
          </div>
          <div className="flex items-center gap-4">
            <Search size={17} />
            <button
              onClick={() => onNavigate("settings")}
              className="flex items-center justify-center"
              aria-label="Settings"
            >
              <Settings size={17} />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden absolute top-full inset-x-0 z-50 border-t border-white/10 bg-[#122736] shadow-[0_12px_32px_rgba(0,0,0,0.16)]">
            {/* User block: icon, name, log out */}
            <div
              className="flex items-center justify-between gap-2 w-full px-5 py-4 border-b border-white/10"
            >
              <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <User size={19} />
              </div>
              <div className="text-[16px] font-semibold">
                Olivia Bennett
              </div>
              </div>
              <button
                className=" flex flex-row-reverse items-center gap-1.5 text-[14px] font-semibold opacity-80 hover:opacity-100 transition-opacity"
                onClick={() => {
                  setMobileOpen(false);
                  setLogoutOpen(true);
                }}
              >
                <LogOut size={17} />
                Log out
              </button>
            </div>
            <div className="flex flex-col-reverse">
              {navTabs.map((tab) => (
                <button
                  key={tab}
                  className={`w-full text-left px-5 py-3.5 text-[16px] border-b border-white/5 flex items-center gap-2 ${
                    isActiveTab(tab)
                      ? "bg-white/10 font-semibold"
                      : ""
                  }`}
                  onClick={() => {
                    handleTabClick(tab);
                    setMobileOpen(false);
                  }}
                >
                  {tab}
                  <NavCount tab={tab} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {logoutOpen && (
        <LogoutConfirmDialog onClose={() => setLogoutOpen(false)} />
      )}
    </header>
  );
}

// ── Quality Section ───────────────────────────────────────────────────────────

function SelectionDayCard() {
  // On mobile the card is closed by default and opens on tap (like the personal details accordion)
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-[10px] p-5 flex flex-col gap-4 md:h-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-2 w-full text-left md:pointer-events-none"
      >
        <h3 className="font-bold text-[#171c23] text-[18px] flex items-center gap-1.5">
          Selection day
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          {/* "Completed" status badge - same style as the module cards */}
          <StatusBadge variant="success" dot>
            Completed
          </StatusBadge>
          <ChevronDown
            size={20}
            className={`md:hidden shrink-0 text-[#171c23] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {/* The general explanation always shows on desktop; on mobile it opens with the accordion */}
      <p
        className={`${open ? "block" : "hidden"} md:block text-[#171c23] text-[14px] text-left leading-relaxed`}
      >
        {GAUGE_INFO[SELECTION_DAY_LABEL].explanation}
      </p>
      <div
        className={`${open ? "grid" : "hidden"} md:grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-x-3 gap-y-4 md:flex-1 md:content-evenly`}
      >
        {qualityScores.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center min-w-0"
          >
            {/* Fixed label height so all the info icons sit on the same line */}
            <span className="min-h-[32px] flex items-center justify-center text-[#122736] text-[13px] text-center leading-tight opacity-70">
              {item.label}
            </span>
            <span className="flex items-center gap-1">
              <span className="stat-number text-[#122736] text-[20px]">
                {item.value}
              </span>
              <SelectionDaySkillInfo label={item.label} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * A score's explanation content - shared by every more-info view
 * (tooltip on desktop, bottom sheet on mobile and the tab panel in option 2).
 */
function ScoreDetails({ label }: { label: string }) {
  const explanation = (
    <p className="text-[#171c23] text-[14px] leading-relaxed text-left whitespace-pre-line flex-1">
      {GAUGE_INFO[label]?.explanation}
    </p>
  );
  // Entry assessment and selection day show extra content - beside the text on desktop, below it on mobile
  const aside =
    label === ASSESSMENT_LABEL ? (
      <div className="w-full md:w-[320px] shrink-0">
        <AssessmentChart />
      </div>
    ) : label === SELECTION_DAY_LABEL ? (
      <div className="w-full md:w-[58%] shrink-0 grid grid-cols-3 md:grid-cols-5 gap-x-3 gap-y-4">
        {qualityScores.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center min-w-0"
          >
            {/* Fixed label height so all the info icons sit on the same line */}
            <span className="min-h-[32px] flex items-center justify-center text-[#122736] text-[13px] text-center leading-tight opacity-70">
              {item.label}
            </span>
            <span className="flex items-center gap-1">
              <span className="stat-number text-[#122736] text-[20px]">
                {item.value}
              </span>
              <SelectionDaySkillInfo label={item.label} />
            </span>
          </div>
        ))}
      </div>
    ) : null;

  if (!aside) return explanation;

  return (
    <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
      {explanation}
      {aside}
    </div>
  );
}

/** Info icon next to a selection-day skill - the short explanation opens on hover */
function SelectionDaySkillInfo({ label }: { label: string }) {
  const info = SELECTION_DAY_SKILL_INFO[label];
  if (!info) return null;
  return (
    <span className="relative group inline-flex shrink-0">
      <Info
        size={12}
        className="opacity-40 group-hover:opacity-100 transition-opacity"
        aria-label={info}
      />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[180px] rounded-[8px] bg-[#122736] text-white text-[11px] font-normal leading-snug p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
      >
        {info}
      </span>
    </span>
  );
}

/** Score name + value - for the panel/bottom-sheet title */
function ScoreTitle({ label }: { label: string }) {
  const score = scoreCards.find((s) => s.label === label);
  return (
    <span className="flex items-baseline gap-1.5">
      {label}
      {score && (
        <span className="stat-number text-[#008ff0] text-[20px]">
          {score.value}
        </span>
      )}
    </span>
  );
}

/** Tile content: score name + value (or a "Completed" badge for selection day) */
function ScoreTileContent({ label }: { label: string }) {
  const score = scoreCards.find((s) => s.label === label);
  return (
    <>
      <span className="font-bold text-[#171c23] text-[14px] text-center leading-tight">
        {label}
      </span>
      <span className="flex items-center justify-center">
        {score ? (
          <span className="stat-number text-[#008ff0] text-[32px] leading-none tracking-tight">
            {score.value}
          </span>
        ) : (
          <StatusBadge variant="success" dot>
            Completed
          </StatusBadge>
        )}
      </span>
    </>
  );
}

/**
 * Option 2: scores are always visible, no tap needed.
 * Desktop - compact chips (name + score) that wrap to another row as scores are added,
 *           and the selected one's explanation shows in the card below.
 * Mobile  - a sideways-scrolling strip of tiles; a tap opens a bottom sheet.
 */
const SCORE_TABS = [...scoreCards.map((s) => s.label), SELECTION_DAY_LABEL];

/**
 * Horizontally scrolling strip with a clear sign there is more content:
 * a fade at the edge you can keep scrolling towards + a partial tile peeking at the edge.
 */
function ScoreStrip({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const pos = Math.abs(el.scrollLeft);
      setEdges({ start: pos > 4, end: pos < max - 4 });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // In LTR the start is on the left and scrolling continues to the right
  const mask = `linear-gradient(to right, ${
    edges.start ? "transparent 0, #000 28px" : "#000 0"
  }, ${
    edges.end ? "#000 calc(100% - 28px), transparent 100%" : "#000 100%"
  })`;

  return (
    <div className="relative">
      <div
        ref={ref}
        aria-label="Scores"
        className="flex gap-2 overflow-x-auto snap-x scroll-ps-4 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        {children}
      </div>
      {/* Subtle arrow hinting at the scroll direction */}
      {edges.end && (
        <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 -ml-1 flex items-center">
          <span className="w-6 h-6 rounded-full bg-white shadow-[0_2px_8px_rgba(18,39,54,0.16)] flex items-center justify-center">
            <ChevronRight
              size={14}
              className="text-[#008ff0]"
            />
          </span>
        </div>
      )}
    </div>
  );
}

function ScoreTabs() {
  const isMobile = useIsMobile();
  const [active, setActive] = useState(SCORE_TABS[0]);
  const [sheet, setSheet] = useState<string | null>(null);

  if (isMobile) {
    return (
      <>
        {/* Sideways strip - bleeds to the screen edge, with a fade on the edge that has more content */}
        <ScoreStrip>
          {SCORE_TABS.map((label) => (
            <button
              key={label}
              onClick={() => setSheet(label)}
              className="snap-start shrink-0 w-[112px] bg-white rounded-[10px] p-2.5 flex flex-col items-center justify-between gap-1.5"
            >
              <ScoreTileContent label={label} />
            </button>
          ))}
        </ScoreStrip>
        {sheet && (
          <Dialog
            onClose={() => setSheet(null)}
            header={
              <DialogHeader title={<ScoreTitle label={sheet} />} />
            }
          >
            <div className="flex flex-col gap-4">
              <ScoreDetails label={sheet} />
            </div>
          </Dialog>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Chips - same language as the filter chips in messages/enquiries */}
      <div
        role="tablist"
        aria-label="Scores"
        className="flex flex-wrap items-center gap-2"
      >
        {SCORE_TABS.map((label) => {
          const score = scoreCards.find((s) => s.label === label);
          const isActive = label === active;
          return (
            <button
              key={label}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(label)}
              className={`flex items-center gap-1 ${CONTROL_SIZE} font-semibold whitespace-nowrap border backdrop-blur-lg text-[#171c23] transition-all ${
                isActive
                  ? "bg-white border-transparent shadow-[0_8px_32px_rgba(18,39,54,0.12)]"
                  : "bg-white/30 border-white/50 shadow-[0_8px_32px_rgba(18,39,54,0.12)] hover:bg-white hover:shadow-[0_0_20px_0_rgba(0,143,240,0.25)]"
              }`}
            >
              {label}
              {score ? (
                <span className="stat-number text-[16px] leading-none text-[#008ff0]">
                  {score.value}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[12px] text-[#4e9400]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4e9400]" />
                  Completed
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        className="bg-white rounded-[10px] p-5 flex flex-col gap-4"
      >
        <h3 className="font-bold text-[#171c23] text-[18px] text-left">
          <ScoreTitle label={active} />
        </h3>
        <ScoreDetails label={active} />
      </div>
    </div>
  );
}

function QualitySection({
  onNavigate,
  onOpenLearning,
  unreadCount,
}: {
  onNavigate: (page: Page) => void;
  onOpenLearning: () => void;
  unreadCount: number;
}) {
  const isMobile = useIsMobile();
  const classic = useClassicVersion();
  const [layout, setLayout] = useState<1 | 2>(1);

  // Desktop tooltip: which card + cursor position
  const [hoveredCard, setHoveredCard] = useState<{
    label: string;
    value: number;
  } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Mobile bottom sheet: which card
  const [sheetCard, setSheetCard] = useState<{
    label: string;
    value: number;
  } | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const gaugeProps = (label: string, value: number) => ({
    label,
    value,
    interactive: true,
    hovered: hoveredCard?.label === label,
    onMouseEnter: () => {
      if (!isMobile) setHoveredCard({ label, value });
    },
    onMouseLeave: () => setHoveredCard(null),
    onMouseMove: handleMouseMove,
    onClick: () => {
      if (isMobile) setSheetCard({ label, value });
    },
  });

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-4">
      {/* Desktop tooltip */}
      {!isMobile && hoveredCard && (
        <GaugeTooltip
          x={tooltipPos.x}
          y={tooltipPos.y}
          label={hoveredCard.label}
          value={hoveredCard.value}
        />
      )}

      {/* Mobile bottom sheet */}
      {sheetCard && (
        <BottomSheet
          label={sheetCard.label}
          value={sheetCard.value}
          onClose={() => setSheetCard(null)}
        />
      )}

      {/* Page title - in the classic version it shows in the hero */}
      {!classic && (
        <h2 className="font-bold text-[#122736] text-[28px] sm:text-[34px] tracking-tight text-left mb-6">
          Hello Olivia<span className="text-[#69c600]">.</span>
        </h2>
      )}

      <div className="flex flex-col gap-4">
        {/* Start-of-studies data - full width */}
        {!classic && <StartDateCard {...START_DATE} />}

        <NextSteps
          unreadCount={unreadCount}
          onOpenTasks={() => onNavigate("tasks")}
          onOpenAppointments={() => onNavigate("appointments")}
          onOpenInquiries={() => onNavigate("inquiries")}
          onOpenLearning={onOpenLearning}
          onOpenMessages={() => onNavigate("messages")}
        />

        {/* Assessment results title + layout switch - sits directly above what it changes */}
        <div className="pt-2">
          <div className="flex items-center justify-between gap-4 mb-1">
            <h2 className="font-bold text-[#122736] text-[28px] sm:text-[34px] tracking-tight text-left">
              Assessment results<span className="text-[#69c600]">.</span>
            </h2>
            {/* <LayoutSwitch value={layout} onChange={setLayout} /> */}
          </div>
          <p className="text-[#171c23] text-[14px] opacity-50 text-left">
            Please note: these results aren't final and may change
            before your start date
            {layout === 1 && (
              <span className="md:hidden">
                {" · "}Tap a score for more info
              </span>
            )}
          </p>
        </div>

        {layout === 2 ? (
          /* Scores (2 rows) + selection day beside them, at the same height */
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            {/* Scores take two thirds of the width - 3 columns in two rows */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full md:flex-[2] md:min-w-0">
              {scoreCards.map((s) => (
                <GaugeCard
                  key={s.label}
                  max={s.max}
                  display="number"
                  {...(s.interactive
                    ? gaugeProps(s.label, s.value)
                    : { label: s.label, value: s.value })}
                />
              ))}
            </div>
            {/* Selection day - a third of the container width */}
            <div className="w-full md:flex-1 md:min-w-0">
              <SelectionDayCard />
            </div>
          </div>
        ) : (
          <ScoreTabs />
        )}
      </div>
    </section>
  );
}

// ── Personal Detail Cards ─────────────────────────────────────────────────────

function PersonalInfoContent({
  contact,
  onEditContact,
}: {
  contact: ContactInfo;
  onEditContact: () => void;
}) {
  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Even 6-column grid - fields sit closer and wrap to the next row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-x-5 gap-y-4">
        <InfoField label="Full name" value="Olivia Bennett" />
        <InfoField label="Gender" value="Female" />
        <InfoField label="Year level" value="Year 12" />
        <InfoField label="Date of birth" value="14/03/2008" />
        <InfoField label="Country of birth" value="Australia" />
        <InfoField label="Citizenship" value="Australian" />
        <InfoField label="Applicant ID" value="2564376487" />
      </div>
      <div className="pt-4 border-t border-[rgba(23,28,35,0.05)]">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="font-semibold text-[#171c23] text-[15px]">
            Contact details
          </p>
          <button
            onClick={onEditContact}
            className="flex items-center gap-1 text-[#008ff0] text-[13px] font-semibold hover:underline"
          >
            <Pencil size={13} className="shrink-0" />
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-x-5 gap-y-4">
          <InfoField label="Phone" value={contact.phone} />
          <InfoField label="Email" value={contact.email} />
          {/* Long addresses - span 2 columns so they don't collide */}
          <div className="col-span-2">
            <InfoField label="Address" value={contact.address} />
          </div>
          <div className="col-span-2">
            <InfoField
              label="Postal address"
              value={contact.mailingAddress}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Schools by stage - most recent first */
const SCHOOLS = [
  {
    stage: "Senior secondary (Years 11–12)",
    name: "Bayview Secondary College",
    years: "2024 – 2025",
  },
  {
    stage: "Junior secondary (Years 7–10)",
    name: "Bayview Secondary College",
    years: "2020 – 2023",
  },
  {
    stage: "Primary",
    name: "Wattle Park Primary School",
    years: "2013 – 2019",
  },
];

/** VCE subjects - subject, study score (out of 50), and whether it was completed early in Year 11 */
const VCE_SUBJECTS: {
  subject: string;
  score: number;
  early?: boolean;
}[] = [
  { subject: "English", score: 38 },
  { subject: "Mathematical Methods", score: 36 },
  { subject: "Specialist Mathematics", score: 34 },
  { subject: "Physics", score: 37 },
  { subject: "Chemistry", score: 33 },
  { subject: "Psychology", score: 41, early: true },
];

function EducationContent() {
  return (
    // On desktop: schools and VCE subjects side by side with a divider
    <div className="p-5 grid md:grid-cols-2 gap-5 md:gap-0">
      <div className="md:pr-5 md:border-r md:border-[rgba(23,28,35,0.08)] flex flex-col gap-4">
        {SCHOOLS.map(({ stage, name, years }) => (
          <div key={stage}>
            <SubSection title={stage} className="mb-1" />
            {/* Fixed width for the school column - years line up across stages */}
            <div className="flex flex-wrap gap-x-5 gap-y-3 justify-start sm:grid sm:grid-cols-[220px_minmax(0,1fr)]">
              <InfoField label="School" value={name} />
              <InfoField label="Years" value={years} />
            </div>
          </div>
        ))}
      </div>
      {/* On mobile the subjects drop to their own column - a divider between the two parts */}
      <div className="md:pl-5 pt-5 border-t border-[rgba(23,28,35,0.05)] md:pt-0 md:border-t-0">
        <SubSection title="VCE subjects" />
        <div className="flex flex-wrap gap-2">
          {VCE_SUBJECTS.map(({ subject, score, early }) => (
            <div
              key={subject}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 ${
                early
                  ? "bg-[rgba(105,198,0,0.1)] border border-[rgba(105,198,0,0.45)]"
                  : "bg-white border border-[rgba(0,143,240,0.35)]"
              }`}
            >
              <span className="text-[#171c23] text-[14px] font-semibold whitespace-nowrap">
                {subject}
              </span>
              <span
                className={`text-[13px] font-bold whitespace-nowrap ${early ? "text-[#4e9400]" : "text-[#008ff0]"}`}
              >
                · {score}
              </span>
              {/* Completed early, in Year 11 - distinguished from the Year 12 subjects */}
              {early && (
                <span className="text-[#4e9400] text-[11px] font-semibold whitespace-nowrap bg-[rgba(105,198,0,0.16)] rounded-full px-1.5 py-0.5">
                  Year 11
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="text-[#171c23] text-[12px] opacity-50 mt-3">
          Study scores out of 50 · ATAR 92.45. The subject in green
          was completed early, in Year 11
        </p>
      </div>
    </div>
  );
}

/** Entry header: role + name on the left, edit button on the right */
function EntryHeader({
  prefix,
  name,
  onEdit,
}: {
  prefix: string;
  name: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <p className="font-semibold text-[#171c23] text-[16px] truncate min-w-0">
        <span className="opacity-50 font-normal text-[14px]">
          {prefix} ·{" "}
        </span>
        {name}
      </p>
      <button
        onClick={onEdit}
        className="flex items-center gap-1 text-[#008ff0] text-[13px] font-semibold hover:underline shrink-0"
      >
        <Pencil size={13} className="shrink-0" />
        Edit
      </button>
    </div>
  );
}

function ParentEntry({
  parent,
  onEdit,
  onToggleAuth,
}: {
  parent: Parent;
  onEdit: () => void;
  onToggleAuth: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <EntryHeader
        prefix={parent.relation}
        name={parent.name}
        onEdit={onEdit}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-x-5 gap-y-4">
        <InfoField label="Phone" value={parent.phone} />
        <InfoField label="Email" value={parent.email} />
        {/* Long address - spans 2 columns so it doesn't collide */}
        <div className="col-span-2">
          <InfoField label="Home address" value={parent.address} />
        </div>
      </div>
      <AuthPermissionsBlock
        authorized={parent.authorized}
        onToggle={onToggleAuth}
      />
    </div>
  );
}

function ParentsContent({
  parents,
  onEdit,
  onToggleAuth,
}: {
  parents: Parent[];
  onEdit: (p: Parent) => void;
  onToggleAuth: (id: string) => void;
}) {
  return (
    <div className="p-5 flex flex-col gap-5">
      {parents.map((parent, i) => (
        <div
          key={parent.id}
          className={
            i > 0
              ? "pt-5 border-t border-[rgba(23,28,35,0.05)]"
              : ""
          }
        >
          <ParentEntry
            parent={parent}
            onEdit={() => onEdit(parent)}
            onToggleAuth={() => onToggleAuth(parent.id)}
          />
        </div>
      ))}
    </div>
  );
}

function CompanionEntry({
  companion,
  onEdit,
  onToggleAuth,
}: {
  companion: Companion;
  onEdit: () => void;
  onToggleAuth: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <EntryHeader
        prefix={companion.type}
        name={`${companion.firstName} ${companion.lastName}`}
        onEdit={onEdit}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-x-5 gap-y-4">
        <InfoField
          label="Date of birth"
          value={companion.dateOfBirth}
        />
        <InfoField label="Phone" value={companion.phone} />
        <InfoField label="Email" value={companion.email} />
      </div>
      <AuthPermissionsBlock
        authorized={companion.authorized}
        onToggle={onToggleAuth}
      />
    </div>
  );
}

function CompanionsContent({
  companions,
  onEdit,
  onToggleAuth,
}: {
  companions: Companion[];
  onEdit: (c: Companion) => void;
  onToggleAuth: (id: string) => void;
}) {
  if (companions.length === 0) {
    return (
      <div className="p-5">
        <p className="text-[#171c23] text-[14px] opacity-60 text-center py-4">
          No support people yet. You can add up to {MAX_COMPANIONS} people
          who can help you with your application.
        </p>
      </div>
    );
  }
  return (
    <div className="p-5 flex flex-col gap-5">
      {companions.map((companion, i) => (
        <div
          key={companion.id}
          className={
            i > 0
              ? "pt-5 border-t border-[rgba(23,28,35,0.05)]"
              : ""
          }
        >
          <CompanionEntry
            companion={companion}
            onEdit={() => onEdit(companion)}
            onToggleAuth={() => onToggleAuth(companion.id)}
          />
        </div>
      ))}
    </div>
  );
}


// ── Personal Section ──────────────────────────────────────────────────────────

const INITIAL_CONTACT: ContactInfo = {
  phone: "0412 345 678",
  email: "olivia@example.com",
  address: "Unit 5, 32 Wattle Street, Bendigo VIC 3550",
  mailingAddress: "Unit 5, 32 Wattle Street, Bendigo VIC 3550",
};

const INITIAL_PARENTS: Parent[] = [
  {
    id: "father",
    relation: "Father",
    name: "Daniel Bennett",
    phone: "0423 456 789",
    email: "dan@example.com",
    address: "Unit 5, 32 Wattle Street, Bendigo VIC 3550",
    authorized: true,
  },
  {
    id: "mother",
    relation: "Mother",
    name: "Sarah Bennett",
    phone: "0434 567 890",
    email: "sarah@example.com",
    address: "Unit 5, 32 Wattle Street, Bendigo VIC 3550",
    authorized: true,
  },
];

const INITIAL_COMPANIONS: Companion[] = [
  {
    id: "ruth",
    type: "Careers adviser",
    firstName: "Ruth",
    lastName: "Collins",
    dateOfBirth: "17/08/1979",
    phone: "0451 209 774",
    email: "ruth@example.com",
    authorized: true,
  },
];

const personalSections = [
  { key: "personal", label: "Personal information" },
  { key: "education", label: "Education" },
  { key: "parents", label: "Parents" },
  { key: "companions", label: "Support people" },
];

function PersonalSection() {
  // "Personal information" is open by default; opening another section closes the previous one
  const [openKey, setOpenKey] = useState<string | null>(
    "personal",
  );

  // ── Editable data ──
  const [contact, setContact] =
    useState<ContactInfo>(INITIAL_CONTACT);
  const [parents, setParents] =
    useState<Parent[]>(INITIAL_PARENTS);
  const [companions, setCompanions] = useState<Companion[]>(
    INITIAL_COMPANIONS,
  );

  // ── Edit dialogs ──
  const [contactOpen, setContactOpen] = useState(false);
  const [editingParent, setEditingParent] =
    useState<Parent | null>(null);
  /** null = closed, "new" = add, object = edit */
  const [companionForm, setCompanionForm] = useState<
    Companion | "new" | null
  >(null);

  const saveParent = (updated: Parent) =>
    setParents((list) =>
      list.map((p) => (p.id === updated.id ? updated : p)),
    );
  const toggleParentAuth = (id: string) =>
    setParents((list) =>
      list.map((p) =>
        p.id === id ? { ...p, authorized: !p.authorized } : p,
      ),
    );

  const saveCompanion = (updated: Companion) =>
    setCompanions((list) =>
      list.some((c) => c.id === updated.id)
        ? list.map((c) => (c.id === updated.id ? updated : c))
        : [...list, updated],
    );
  const toggleCompanionAuth = (id: string) =>
    setCompanions((list) =>
      list.map((c) =>
        c.id === id ? { ...c, authorized: !c.authorized } : c,
      ),
    );

  const personalContent = (
    <PersonalInfoContent
      contact={contact}
      onEditContact={() => setContactOpen(true)}
    />
  );
  const parentsContent = (
    <ParentsContent
      parents={parents}
      onEdit={setEditingParent}
      onToggleAuth={toggleParentAuth}
    />
  );
  const companionsContent = (
    <CompanionsContent
      companions={companions}
      onEdit={setCompanionForm}
      onToggleAuth={toggleCompanionAuth}
    />
  );

  return (
    <section className="px-4 sm:px-6 md:px-10 py-6 pb-12">
      <div className="text-left mb-6">
        <h2 className="font-bold text-[#122736] text-[28px] sm:text-[34px] tracking-tight inline">
          Personal details<span className="text-[#69c600]">.</span>
        </h2>
      </div>

      {/* Accordion at every size - one section open at a time */}
      <div className="flex flex-col gap-3 md:gap-5">
        {personalSections.map(({ key, label }) => {
          const isOpen = openKey === key;
          return (
            <div
              key={key}
              className="bg-white rounded-[10px] overflow-hidden"
            >
              {/* Title row - always visible */}
              <button
                onClick={() => setOpenKey(isOpen ? null : key)}
                aria-expanded={isOpen}
                className="w-full h-[64px] md:h-[60px] flex items-center justify-between px-5"
              >
                <span className="font-bold text-[#171c23] text-[18px]">
                  {label}
                </span>
                <ChevronDown
                  size={20}
                  className={`text-[#171c23] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {/* Open content - in the same card */}
              {isOpen && (
                <div className="border-t border-[rgba(23,28,35,0.05)]">
                  {key === "personal" && personalContent}
                  {key === "education" && <EducationContent />}
                  {key === "parents" && parentsContent}
                  {key === "companions" && (
                    <>
                      {/* Support people row: count + add (the title is already in the accordion button) */}
                      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(23,28,35,0.05)]">
                        <p className="text-[#171c23] text-[13px] opacity-50">
                          {companions.length} of {MAX_COMPANIONS}{" "}
                          support people
                        </p>
                        <AddCompanionBtn
                          disabled={
                            companions.length >= MAX_COMPANIONS
                          }
                          onClick={() => setCompanionForm("new")}
                        />
                      </div>
                      {companionsContent}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Edit dialogs ── */}
      {contactOpen && (
        <ContactEditDialog
          contact={contact}
          onSave={setContact}
          onClose={() => setContactOpen(false)}
        />
      )}
      {editingParent && (
        <ParentEditDialog
          parent={editingParent}
          onSave={saveParent}
          onClose={() => setEditingParent(null)}
        />
      )}
      {companionForm && (
        <CompanionWizard
          companion={
            companionForm === "new" ? undefined : companionForm
          }
          onSave={saveCompanion}
          onClose={() => setCompanionForm(null)}
        />
      )}

      <AdBanner />
    </section>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

const CLASSIC_VERSION_KEY = "harbourline-classic-version";

export default function App() {
  const isMobile = useIsMobile();
  const [page, setPage] = useState<Page>("profile");
  /** How the modules page is entered - from the menu (start) or straight into a module */
  const [learningsEntry, setLearningsEntry] = useState<
    "intro" | "assessment"
  >("intro");
  // Theme - changes the brand colour, background and gradients (the top header doesn't change)
  const [themeId, setThemeId] = useState(DEFAULT_THEME.id);
  const [learningsHero, setLearningsHero] = useState(true);
  const theme = getTheme(themeId);
  // In the colourful theme each page has its own accent hue
  const accent = accentFor(theme, page);
  // The version with images is the default; the choice in settings is saved in the browser
  const [classicVersion, setClassicVersion] = useState(() => {
    try {
      return localStorage.getItem(CLASSIC_VERSION_KEY) !== "0";
    } catch {
      return true;
    }
  });
  const changeClassicVersion = (next: boolean) => {
    setClassicVersion(next);
    try {
      localStorage.setItem(CLASSIC_VERSION_KEY, next ? "1" : "0");
    } catch {
      // Without storage access the choice simply isn't saved
    }
  };

  // Message state lives here so the badge reflects unread messages
  const [messageReadIds, setMessageReadIds] = useState<Set<string>>(
    () => new Set(INITIAL_READ_MESSAGE_IDS),
  );
  const [messageArchivedIds, setMessageArchivedIds] = useState<
    Set<string>
  >(() => new Set(INITIAL_ARCHIVED_MESSAGE_IDS));
  const unreadMessages = countUnreadMessages(
    messageReadIds,
    messageArchivedIds,
  );

  return (
    <ClassicVersionContext.Provider value={classicVersion}>
    <div
      dir="ltr"
      lang="en-AU"
      // Portal target for dialogs - the theme variables live here
      data-app-root
      style={{
        ...themeVars(theme, accent),
        fontFamily: "'Noto Sans', sans-serif",
        backgroundColor: accent.pageBg ?? theme.pageBg,
        backgroundImage: heroGradientBg(
          theme,
          isMobile ? -200 : 0,
          isMobile ? 1 : 1.4,
          isMobile ? 1 : 0.7,
          accent,
          // In the details check chat - no white rings, just the gradient
          page !== "dataChat",
        ),
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        transition: "background-color 300ms ease",
      }}
      className={`min-h-[100dvh] flex flex-col ${theme.dark ? "dark" : ""} ${theme.surface ? "navy-cards" : ""} ${theme.playful ? "playful" : ""}`}
    >
      {/* Inside a survey the "Tasks" tab stays selected */}
      <Header
        activePage={
          page === "interestsForm" ||
          page === "scholarshipForm" ||
          page === "surveyForm" ||
          page === "dataChat"
            ? "tasks"
            : page
        }
        onNavigate={(next) => {
          // Entering modules from the menu always starts from the beginning
          if (next === "learnings") setLearningsEntry("intro");
          setPage(next);
        }}
        unreadCount={unreadMessages}
        navGradient={accent.navGradient}
      />
      {classicVersion && (page !== "learnings" || learningsHero) && (
        <PageHero page={page}>
          {page === "profile" && (
            <StartDateCard {...START_DATE} onPhoto />
          )}
        </PageHero>
      )}
      <main className="flex-1 flex flex-col">
        {page === "learnings" ? (
          <LearningsPage
            key={learningsEntry}
            initialView={learningsEntry}
            onHeroChange={setLearningsHero}
          />
        ) : page === "tasks" ? (
          <TasksAppointmentsPage
            onViewAllAppointments={() => setPage("appointments")}
            // Each survey opens on its own page
            onOpenTask={(id) =>
              setPage(
                id === "scholarship"
                  ? "scholarshipForm"
                  : id === "survey"
                    ? "surveyForm"
                    : id === "data-verification"
                      ? "dataChat"
                      : "interestsForm",
              )
            }
            // The module's task card opens the module itself
            onOpenLearning={() => {
              setLearningsEntry("assessment");
              setPage("learnings");
            }}
          />
        ) : page === "interestsForm" ? (
          <InterestsSurveyPage
            onExit={() => setPage("tasks")}
          />
        ) : page === "scholarshipForm" ? (
          <ScholarshipSurveyPage
            onExit={() => setPage("tasks")}
            onGoHome={() => setPage("profile")}
          />
        ) : page === "surveyForm" ? (
          <ApplicationSurveyPage
            onExit={() => setPage("tasks")}
            onGoHome={() => setPage("profile")}
          />
        ) : page === "dataChat" ? (
          <DataVerificationChatPage
            onExit={() => setPage("tasks")}
            onGoHome={() => setPage("profile")}
          />
        ) : page === "appointments" ? (
          <MyAppointmentsPage />
        ) : page === "settings" ? (
          <SettingsPage
            onNavigateHome={() => setPage("profile")}
            themes={THEMES}
            themeId={themeId}
            onThemeChange={setThemeId}
            classicVersion={classicVersion}
            onClassicVersionChange={changeClassicVersion}
          />
        ) : page === "messages" ? (
          <MessagesPage
            readIds={messageReadIds}
            setReadIds={setMessageReadIds}
            archivedIds={messageArchivedIds}
            setArchivedIds={setMessageArchivedIds}
            onNavigateHome={() => setPage("profile")}
          />
        ) : page === "inquiries" ? (
          <InquiriesPage
            onNavigateHome={() => setPage("profile")}
          />
        ) : (
          <>
            <QualitySection
              onNavigate={setPage}
              // Straight into the module, without the intro screen
              onOpenLearning={() => {
                setLearningsEntry("assessment");
                setPage("learnings");
              }}
              unreadCount={unreadMessages}
            />
            <PersonalSection />
          </>
        )}
      </main>
    </div>
    </ClassicVersionContext.Provider>
  );
}