import { useLayoutEffect, useState, type ReactNode } from "react";
import {
  ChevronRight,
  ChevronDown,
  BookOpen,
  Play,
  Layers,
  FileText,
} from "lucide-react";
import {
  AdBanner,
  Button,
  FilterChip,
  StatusBadge,
  ProgressBar,
} from "./primitives";
import { Breadcrumbs } from "./TasksAppointmentsPage";
import { useClassicVersion } from "./PageHero";
import { GLASS_CARD } from "./ui/utils";
import EntryAssessmentRunner, {
  type AnswerState,
} from "./EntryAssessment";

// ── Data ────────────────────────────────────────────────────────────────────

type LearningStatus = "In progress" | "Not started" | "Completed";

interface Learning {
  id: string;
  name: string;
  description: string;
  status: LearningStatus;
  /** How many tests the module has and how many are done */
  tests: number;
  testsDone: number;
  /** Module completion percentage */
  progress: number;
}

const pct = (done: number, total: number) =>
  total === 0 ? 0 : Math.round((done / total) * 100);

// ── Entry assessment module ─────────────────────────────────────────────────

const ASSESSMENT_LANGUAGES = [
  { id: "en", label: "English" },
  { id: "zh", label: "Mandarin" },
  { id: "vi", label: "Vietnamese" },
  { id: "ar", label: "Arabic" },
];

const TESTS_PER_TOPIC = 4;
const QUESTIONS_PER_TEST = 12;
/** Correct answers in each completed test - fixed so the mockup stays stable */
const CORRECT_BY_INDEX = [10, 8, 11, 9];
/** Fixed test durations (seconds) and past attempts - stable mockup data */
const DURATION_BY_INDEX = [765, 892, 704, 838];
const PAST_ATTEMPTS: TestAttempt[][] = [
  [
    { date: "12/10/2026", score: 85 },
    { date: "05/10/2026", score: 62 },
    { date: "28/09/2026", score: 74 },
  ],
  [
    { date: "09/10/2026", score: 58 },
    { date: "30/09/2026", score: 67 },
  ],
  [{ date: "02/10/2026", score: 91 }],
  [],
];

export interface TestAttempt {
  date: string;
  score: number;
}

interface EntryAssessment {
  id: string;
  name: string;
  questions: number;
  /** How many questions have been answered so far */
  answered: number;
  correct: number;
  wrong: number;
  /** Duration of the last attempt in seconds (completed tests) */
  duration: number;
  /** Past attempts - newest first */
  attempts: TestAttempt[];
  /** Time limit per question in seconds - if unset, the test is untimed */
  secondsPerQuestion?: number;
}

/** Spreads a completed test's wrong answers across its questions, for the summary view */
function resultsFor(t: EntryAssessment): AnswerState[] {
  let left = t.wrong;
  return Array.from({ length: t.questions }, (_, i) => {
    if (left > 0 && i % 3 === 1) {
      left -= 1;
      return "wrong" as const;
    }
    return "correct" as const;
  }).map((v, i) =>
    // If wrong answers are left over after spreading, mark them from the end
    left > 0 && i >= t.questions - left ? "wrong" : v,
  );
}

const testStatus = (t: EntryAssessment): LearningStatus =>
  t.answered === t.questions
    ? "Completed"
    : t.answered > 0
      ? "In progress"
      : "Not started";

/**
 * Builds a topic's tests: `completed` finished tests,
 * followed by one half-done test if `inProgress` is above zero.
 */
function buildTests(
  topicId: string,
  completed: number,
  inProgress: number,
): EntryAssessment[] {
  return Array.from({ length: TESTS_PER_TOPIC }, (_, i) => {
    const n = i + 1;
    const done = n <= completed;
    const current = n === completed + 1 && inProgress > 0;
    const correct = done
      ? CORRECT_BY_INDEX[i % CORRECT_BY_INDEX.length]
      : 0;
    return {
      id: `${topicId}-${n}`,
      name: `Test ${n}`,
      questions: QUESTIONS_PER_TEST,
      answered: done
        ? QUESTIONS_PER_TEST
        : current
          ? inProgress
          : 0,
      correct,
      wrong: done ? QUESTIONS_PER_TEST - correct : 0,
      duration:
        DURATION_BY_INDEX[i % DURATION_BY_INDEX.length],
      attempts: done
        ? PAST_ATTEMPTS[i % PAST_ATTEMPTS.length]
        : [],
    };
  });
}

interface AssessmentTopic {
  id: string;
  name: string;
  tests: EntryAssessment[];
}

const assessmentTopics: AssessmentTopic[] = [
  {
    id: "instructions",
    name: "Instructions",
    tests: buildTests("instructions", 0, 0),
  },
  {
    id: "shape",
    name: "Pattern reasoning",
    // Pattern reasoning test 3 is limited to 40 seconds per question
    tests: buildTests("shape", 2, 8).map((t) =>
      t.id === "shape-3" ? { ...t, secondsPerQuestion: 40 } : t,
    ),
  },
  {
    id: "verbal-analogies",
    name: "Verbal analogies",
    tests: buildTests("verbal-analogies", 2, 0),
  },
  {
    id: "shape-analogies",
    name: "Shape analogies",
    tests: buildTests("shape-analogies", 2, 5),
  },
  {
    id: "quantitative",
    name: "Numerical reasoning",
    tests: buildTests("quantitative", 2, 0),
  },
  {
    id: "full",
    name: "Full tests",
    tests: buildTests("full", 0, 0),
  },
];

const topicDone = (t: AssessmentTopic) =>
  t.tests.filter((x) => testStatus(x) === "Completed").length;
const topicProgress = (t: AssessmentTopic) =>
  pct(topicDone(t), t.tests.length);

// Entry assessment module data is derived from the topics, so the numbers always agree
const assessmentTests = assessmentTopics.reduce(
  (n, t) => n + t.tests.length,
  0,
);
const assessmentDone = assessmentTopics.reduce(
  (n, t) => n + topicDone(t),
  0,
);
const assessmentProgress = pct(assessmentDone, assessmentTests);

const learnings: Learning[] = [
  {
    id: "assessment",
    name: "Entry assessment prep",
    description:
      "This module gets you ready for the Harbourline Entry Assessment on application day. Jump in and start practising - good luck!",
    status: "In progress",
    tests: assessmentTests,
    testsDone: assessmentDone,
    progress: assessmentProgress,
  },
  {
    id: "hebrew",
    name: "English proficiency",
    description:
      "This module helps you prepare for the English proficiency check and lift your result. Jump in and start practising - good luck!",
    status: "Not started",
    tests: 8,
    testsDone: 0,
    progress: 0,
  },
  {
    id: "selectionDay",
    name: "Selection day prep",
    description:
      "This module gets you ready for selection day - interviews, group tasks and course matching. Come and see what to expect - good luck!",
    status: "Completed",
    tests: 6,
    testsDone: 6,
    progress: 100,
  },
];

/** The module the applicant is currently partway through */
export const learningInProgress = () =>
  learnings.find((l) => l.status === "In progress");

/** Overall completion - share of tests done across all modules */
const totalTests = learnings.reduce((sum, l) => sum + l.tests, 0);
const totalTestsDone = learnings.reduce(
  (sum, l) => sum + l.testsDone,
  0,
);
const overallProgress = pct(totalTestsDone, totalTests);

// ── Status badge ─────────────────────────────────────────────────────────────

function LearningStatusBadge({
  status,
}: {
  status: LearningStatus;
}) {
  // "In progress" is a brand state so it gets the brand tint; the rest use the standard variants
  if (status === "In progress")
    return (
      <span className="flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1 rounded-full whitespace-nowrap bg-[rgba(0,143,240,0.1)] text-[#008ff0]">
        <span className="w-2 h-2 rounded-full shrink-0 bg-[#008ff0]" />
        {status}
      </span>
    );
  return (
    <StatusBadge
      variant={status === "Completed" ? "success" : "neutral"}
      dot
    >
      {status}
    </StatusBadge>
  );
}

// ── Page head (title + progress on one row in desktop) ───────────────────────

function LearningIcon({
  tone = "brand",
}: {
  tone?: "brand" | "success";
}) {
  return (
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
        tone === "success"
          ? "bg-[rgba(105,198,0,0.12)]"
          : "bg-[rgba(0,143,240,0.1)]"
      }`}
    >
      <BookOpen
        size={22}
        className={
          tone === "success"
            ? "text-[#4e9400]"
            : "text-[#008ff0]"
        }
      />
    </div>
  );
}

/** Progress panel - compact, on one row */
function ProgressPanel({
  meta,
  value,
}: {
  meta: ReactNode;
  value: number;
}) {
  return (
    <div
      className={`${GLASS_CARD} rounded-[10px] px-4 py-3 flex items-center gap-3.5 w-full`}
    >
      <span className="stat-number text-[#008ff0] text-[26px] leading-none tracking-tight tabular-nums shrink-0">
        {value}%
      </span>
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 text-left">
        {meta}
        <ProgressBar value={value} />
      </div>
    </div>
  );
}

/**
 * The title row. On desktop the progress panel is taken out of the flow (absolute)
 * and sits on the right edge, so it doesn't affect the spacing of the title or what's below.
 */
function PageHead({
  icon,
  title,
  subtitle,
  panel,
  heroTitle = false,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  panel?: ReactNode;
  /** The title matches the hero title, so it is hidden in the classic version */
  heroTitle?: boolean;
}) {
  const classic = useClassicVersion();
  return (
    <div
      className={`relative mb-6 ${panel ? "md:min-h-[68px]" : ""}`}
    >
      <div
        className={`flex items-center gap-3 min-w-0 ${panel ? "md:min-h-[68px] md:pr-[380px]" : ""}`}
      >
        {icon}
        <div className="min-w-0 text-left">
          {!(heroTitle && classic) && (
            <h2 className="font-bold text-[#122736] text-[28px] sm:text-[34px] tracking-tight">
              {title}
              <span className="text-[#69c600]">.</span>
            </h2>
          )}
          {subtitle && (
            <p className="text-[#171c23] text-[14px] opacity-50 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {panel && (
        <div className="mt-4 md:mt-0 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 md:w-[340px]">
          {panel}
        </div>
      )}
    </div>
  );
}

// ── Shared card ─────────────────────────────────────────────────────────────

const CARD_CLASS =
  "group bg-white rounded-[10px] p-5 flex flex-col gap-3 text-left w-full transition-all duration-200 border border-transparent hover:[box-shadow:0_0_20px_0_rgba(0,143,240,0.25)] hover:border-[rgba(0,143,240,0.2)]";

/** Action link at the bottom of the card - brand text with an arrow that moves on hover */
function CardAction({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1 text-[#008ff0] text-[14px] font-semibold">
      {label}
      <ChevronRight
        size={16}
        className="transition-transform duration-200 group-hover:translate-x-0.5"
      />
    </span>
  );
}

/**
 * One card for modules, topics and tests - same anatomy at every level:
 * icon + title + status badge, description, progress bar and action links.
 * A single action makes the whole card clickable; two or more show as separate links.
 */
function EntityCard({
  icon,
  title,
  badge,
  description,
  stat,
  meta,
  percent,
  actions,
}: {
  icon: ReactNode;
  title: string;
  badge?: ReactNode;
  description?: ReactNode;
  /** Highlighted value (e.g. a score) - shown without the description's dimming */
  stat?: ReactNode;
  /** The text beside the percentage, above the progress bar */
  meta?: ReactNode;
  percent?: number;
  actions: { label: string; onClick: () => void }[];
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="bg-[rgba(0,143,240,0.1)] w-10 h-10 rounded-full flex items-center justify-center shrink-0">
            {icon}
          </div>
          <h3 className="font-bold text-[#171c23] text-[18px] leading-tight line-clamp-2">
            {title}
          </h3>
        </div>
        {badge}
      </div>

      {(description || stat) && (
        <div className="w-full flex items-start justify-between gap-3">
          {description && (
            <div className="text-[#171c23] text-[14px] leading-relaxed opacity-70 min-w-0">
              {description}
            </div>
          )}
          {stat && <div className="shrink-0">{stat}</div>}
        </div>
      )}

      {percent !== undefined && (
        <div className="w-full flex flex-col gap-1.5 mt-auto">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#171c23] text-[13px] opacity-50">
              {meta}
            </span>
            <span className="font-bold text-[#008ff0] text-[13px] tabular-nums">
              {percent}%
            </span>
          </div>
          <ProgressBar value={percent} />
        </div>
      )}
    </>
  );

  // One action - the whole card is clickable
  if (actions.length === 1)
    return (
      <button
        onClick={actions[0].onClick}
        className={`${CARD_CLASS} cursor-pointer`}
      >
        {content}
        <CardAction label={actions[0].label} />
      </button>
    );

  return (
    <div className={CARD_CLASS}>
      {content}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="cursor-pointer"
          >
            <CardAction label={a.label} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Learning card ────────────────────────────────────────────────────────────

function LearningCard({
  learning,
  onClick,
}: {
  learning: Learning;
  onClick: () => void;
}) {
  return (
    <EntityCard
      icon={<BookOpen size={18} className="text-[#008ff0]" />}
      title={learning.name}
      badge={<LearningStatusBadge status={learning.status} />}
      description={learning.description}
      meta={`${learning.testsDone} of ${learning.tests} tests`}
      percent={learning.progress}
      actions={[
        {
          label:
            learning.status === "Not started"
              ? "Start module"
              : learning.status === "Completed"
                ? "View module"
                : "Continue module",
          onClick,
        },
      ]}
    />
  );
}

// ── Intro (video) ────────────────────────────────────────────────────────────

/** Intro screen: explainer video and a button to the module list */
function LearningsIntro({ onContinue }: { onContinue: () => void }) {
  const classic = useClassicVersion();
  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      <div className="md:max-w-[760px] md:mx-auto">
        {!classic && (
          <div className="text-left mb-1">
            <h2 className="font-bold text-[#122736] text-[28px] sm:text-[34px] tracking-tight inline">
              Modules<span className="text-[#69c600]">.</span>
            </h2>
          </div>
        )}
        <p className="text-[#171c23] text-[14px] opacity-50 text-left mb-6">
          Before you start, watch this short video on how the
          modules work and how to get the most out of them
        </p>

        <div className="bg-white rounded-[10px] p-5 flex flex-col gap-5">
          {/* Video player */}
          <div
            className="relative w-full md:max-w-[440px] md:mx-auto aspect-video rounded-[10px] overflow-hidden bg-[#122736]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 22% 22%, rgba(var(--brand-rgb, 0,143,240), 0.55), transparent 55%), radial-gradient(circle at 82% 82%, rgba(105,198,0,0.35), transparent 55%)",
            }}
          >
            <button
              type="button"
              aria-label="Play the explainer video"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 group"
            >
              <span className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-[0_8px_32px_rgba(18,39,54,0.24)] transition-transform duration-200 group-hover:scale-105">
                <Play
                  size={26}
                  className="text-[#008ff0] ml-[3px]"
                  fill="currentColor"
                />
              </span>
              <span className="text-white text-[15px] font-semibold">
                How the modules work · 2:14
              </span>
            </button>
          </div>

          <p className="text-[#171c23] text-[14px] leading-relaxed text-left">
            The modules on the applicant portal help you arrive ready
            for application day and selection day. Each module has
            practice sets and short tests, and you can stop and come
            back at any time - your progress saves automatically.
          </p>

          <div className="flex justify-end">
            <Button onClick={onContinue}>
              Go to modules
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>

        <AdBanner />
      </div>
    </section>
  );
}

// ── Entry assessment module ─────────────────────────────────────────────────

function TopicCard({
  topic,
  onOpen,
}: {
  topic: AssessmentTopic;
  onOpen: () => void;
}) {
  const done = topicDone(topic);
  const total = topic.tests.length;
  return (
    <EntityCard
      icon={<Layers size={18} className="text-[#008ff0]" />}
      title={topic.name}
      badge={
        <LearningStatusBadge
          status={
            done === total
              ? "Completed"
              : done > 0
                ? "In progress"
                : "Not started"
          }
        />
      }
      meta={`${done} of ${total} tests`}
      percent={topicProgress(topic)}
      actions={[
        {
          label:
            done === 0
              ? "Start practising"
              : done === total
                ? "View tests"
                : "Keep practising",
          onClick: onOpen,
        },
      ]}
    />
  );
}

/** FAQs at the bottom of the module page */
const ASSESSMENT_FAQ: { q: string; a: string }[] = [
  {
    q: "What is the entry assessment score?",
    a: "The Harbourline Entry Assessment (HEA) gives a score from 10 to 90, based on the tests you sit on application day. It's one of the things the admissions team uses to match applicants with courses, alongside your Year 12 results, health & access needs and your interview.",
  },
  {
    q: "How long does the module take?",
    a: "There's no time limit. Each topic has a few short tests of 10-15 minutes, and you can stop partway and come back at any time - your progress saves automatically.",
  },
  {
    q: "Can I redo a test I've already done?",
    a: "Yes. When you finish a test, a summary shows your right and wrong answers, and you can start another attempt from there. The test card shows your latest score.",
  },
  {
    q: "Does practice affect my entry assessment score?",
    a: "No. Practice isn't counted in your score and isn't sent to the admissions team. It's there so you know the question types and test format, and arrive on the day calm and ready.",
  },
  {
    q: "Can I practise in another language?",
    a: "Yes. Choose a language at the top of the page - English, Mandarin, Vietnamese or Arabic. It only changes the wording of the practice questions, and you can switch at any time.",
  },
];

/** FAQ accordion - one item open at a time */
function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mt-10">
      <h2 className="font-bold text-[#122736] text-[22px] sm:text-[24px] tracking-tight text-left mb-4">
        Frequently asked questions<span className="text-[#69c600]">.</span>
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={item.q}
              className={`${GLASS_CARD} rounded-[10px] overflow-hidden`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <span className="font-semibold text-[#171c23] text-[16px] min-w-0">
                  {item.q}
                </span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 text-[#171c23] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <p className="px-5 pb-4 pt-1 text-[#171c23] text-[14px] leading-relaxed text-left opacity-70">
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AssessmentLearningPage({
  onBackToList,
  onOpenTopic,
}: {
  onBackToList: () => void;
  onOpenTopic: (id: string) => void;
}) {
  const [language, setLanguage] = useState(ASSESSMENT_LANGUAGES[0].id);

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      <Breadcrumbs
        items={[
          { label: "Modules", onClick: onBackToList },
          { label: "Entry assessment prep" },
        ]}
      />

      <PageHead
        icon={<LearningIcon tone="success" />}
        title="Entry assessment prep"
        panel={
          <ProgressPanel
            value={assessmentProgress}
            meta={
              <div className="flex items-center gap-2 min-w-0">
                <LearningStatusBadge status="In progress" />
                <p className="text-[#171c23] text-[13px] opacity-50 truncate">
                  {assessmentDone} of {assessmentTests} tests
                </p>
              </div>
            }
          />
        }
      />

      {/* Language choice */}
      <p className="font-semibold text-[#171c23] text-[15px] text-left mb-2">
        Module language
      </p>
      <div
        role="radiogroup"
        aria-label="Module language"
        className="flex flex-wrap items-center gap-2 mb-6"
      >
        {ASSESSMENT_LANGUAGES.map((lang) => (
          <FilterChip
            key={lang.id}
            role="radio"
            aria-checked={language === lang.id}
            active={language === lang.id}
            onClick={() => setLanguage(lang.id)}
          >
            {lang.label}
          </FilterChip>
        ))}
      </div>

      <p className="font-semibold text-[#171c23] text-[15px] text-left mb-3">
        Choose a topic to practise
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
        {assessmentTopics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            onOpen={() => onOpenTopic(topic.id)}
          />
        ))}
      </div>

      <Faq items={ASSESSMENT_FAQ} />
    </section>
  );
}

// ── Topic page ──────────────────────────────────────────────────────────────

function PendingTestCard({
  test,
  onOpen,
}: {
  test: EntryAssessment;
  onOpen: () => void;
}) {
  const status = testStatus(test);
  // No description - the answered count already shows above the progress bar
  return (
    <EntityCard
      icon={<FileText size={18} className="text-[#008ff0]" />}
      title={test.name}
      badge={<LearningStatusBadge status={status} />}
      meta={`${test.answered} of ${test.questions} questions`}
      percent={pct(test.answered, test.questions)}
      actions={[
        {
          label:
            status === "In progress"
              ? "Continue test"
              : "Start test",
          onClick: onOpen,
        },
      ]}
    />
  );
}

/** Completed test - compact view; another attempt is started from the summary */
function CompletedTestCard({
  test,
  onSummary,
}: {
  test: EntryAssessment;
  onSummary: () => void;
}) {
  return (
    <EntityCard
      icon={<FileText size={18} className="text-[#008ff0]" />}
      title={test.name}
      badge={<LearningStatusBadge status="Completed" />}
      description={`You got ${test.correct}/${test.questions} questions right`}
      stat={
        <span className="flex flex-col items-end leading-none">
          <span className="text-[#171c23] text-[12px] opacity-50 whitespace-nowrap">
            Overall score
          </span>
          <span className="stat-number text-[#008ff0] text-[26px] tracking-tight tabular-nums mt-1">
            {pct(test.correct, test.questions)}
          </span>
        </span>
      }
      actions={[
        { label: "Test summary", onClick: onSummary },
      ]}
    />
  );
}

function TopicPage({
  topic,
  onBackToList,
  onBackToAssessment,
  onOpenTest,
}: {
  topic: AssessmentTopic;
  onBackToList: () => void;
  onBackToAssessment: () => void;
  onOpenTest: (testId: string, mode: "run" | "summary") => void;
}) {
  const done = topic.tests.filter(
    (t) => testStatus(t) === "Completed",
  );
  const pending = topic.tests.filter(
    (t) => testStatus(t) !== "Completed",
  );

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      {/* The breadcrumb shows the topic sits inside the entry assessment module, so the title is the topic name */}
      <Breadcrumbs
        items={[
          { label: "Modules", onClick: onBackToList },
          { label: "Entry assessment prep", onClick: onBackToAssessment },
          { label: topic.name },
        ]}
      />

      <PageHead
        icon={<LearningIcon tone="success" />}
        title={topic.name}
        panel={
          <ProgressPanel
            value={topicProgress(topic)}
            meta={
              <p className="text-[#171c23] text-[13px] opacity-50">
                {done.length} of {topic.tests.length} tests completed
              </p>
            }
          />
        }
      />

      {pending.length > 0 && (
        <>
          <p className="font-semibold text-[#171c23] text-[15px] text-left mb-3">
            Tests to complete
            <span className="opacity-50 font-normal">
              {" "}
              ({pending.length})
            </span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch mb-8">
            {pending.map((t) => (
              <PendingTestCard
                key={t.id}
                test={t}
                onOpen={() => onOpenTest(t.id, "run")}
              />
            ))}
          </div>
        </>
      )}

      {done.length > 0 && (
        <>
          <p className="font-semibold text-[#171c23] text-[15px] text-left mb-3">
            Completed tests
            <span className="opacity-50 font-normal">
              {" "}
              ({done.length})
            </span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
            {done.map((t) => (
              <CompletedTestCard
                key={t.id}
                test={t}
                onSummary={() => onOpenTest(t.id, "summary")}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type View =
  | { kind: "intro" }
  | { kind: "list" }
  | { kind: "assessment" }
  | { kind: "topic"; id: string }
  | {
      kind: "test";
      topicId: string;
      testId: string;
      mode: "run" | "summary";
    };

export default function LearningsPage({
  initialView = "intro",
  onHeroChange,
}: {
  /** "assessment" - open the module itself directly (e.g. from the task card) */
  initialView?: "intro" | "assessment";
  /** The hero image shows only on the video screen and the module list */
  onHeroChange?: (visible: boolean) => void;
}) {
  const [view, setView] = useState<View>(
    initialView === "assessment" ? { kind: "assessment" } : { kind: "intro" },
  );

  // Before paint, so the image doesn't flicker when switching screens
  useLayoutEffect(() => {
    onHeroChange?.(view.kind === "intro" || view.kind === "list");
  }, [view.kind, onHeroChange]);

  if (view.kind === "intro")
    return (
      <LearningsIntro
        onContinue={() => setView({ kind: "list" })}
      />
    );

  if (view.kind === "assessment")
    return (
      <AssessmentLearningPage
        onBackToList={() => setView({ kind: "list" })}
        onOpenTopic={(id) => setView({ kind: "topic", id })}
      />
    );

  if (view.kind === "topic") {
    const topic = assessmentTopics.find((t) => t.id === view.id);
    if (topic)
      return (
        <TopicPage
          topic={topic}
          onBackToList={() => setView({ kind: "list" })}
          onBackToAssessment={() => setView({ kind: "assessment" })}
          onOpenTest={(testId, mode) =>
            setView({
              kind: "test",
              topicId: topic.id,
              testId,
              mode,
            })
          }
        />
      );
  }

  if (view.kind === "test") {
    const topic = assessmentTopics.find((t) => t.id === view.topicId);
    const test = topic?.tests.find((t) => t.id === view.testId);
    if (topic && test)
      return (
        <EntryAssessmentRunner
          key={`${test.id}-${view.mode}`}
          topicName={topic.name}
          testName={test.name}
          questionCount={test.questions}
          initialResults={
            view.mode === "summary" ? resultsFor(test) : undefined
          }
          initialDuration={test.duration}
          attempts={test.attempts}
          secondsPerQuestion={test.secondsPerQuestion}
          onExit={() => setView({ kind: "topic", id: topic.id })}
        />
      );
  }

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      <PageHead
        title="Modules"
        heroTitle
        subtitle="Find all your modules here, practise and track your progress"
        panel={
          <ProgressPanel
            value={overallProgress}
            meta={
              <div className="flex items-baseline gap-2 min-w-0">
                <h3 className="font-bold text-[#171c23] text-[14px] shrink-0">
                  My progress
                </h3>
                <p className="text-[#171c23] text-[13px] opacity-50 truncate">
                  {totalTestsDone} of {totalTests} tests
                </p>
              </div>
            }
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
        {learnings.map((learning) => (
          <LearningCard
            key={learning.id}
            learning={learning}
            onClick={() => {
              if (learning.id === "assessment")
                setView({ kind: "assessment" });
            }}
          />
        ))}
      </div>

      {/* Only on the main modules page - not inside a module, topic or test */}
      <AdBanner />
    </section>
  );
}
