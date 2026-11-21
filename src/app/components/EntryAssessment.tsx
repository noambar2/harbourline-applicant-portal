import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Eye,
  Timer,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Button,
  Dialog,
  useDialogClose,
  ProgressBar,
  ProgressRing,
} from "./primitives";

/**
 * Pattern reasoning test - "Complete the pattern".
 * Questions are built from rules (fill/rotation, line count/style) so we can
 * generate as many as we like and the answers and reasoning always agree.
 */

// ── Figure spec ─────────────────────────────────────────────────────────────

type Fill = "empty" | "hatch" | "solid";
type StrokeStyle = "straight" | "wave" | "zigzag";

export type FigureSpec =
  | { kind: "rect"; fill: Fill; rotate: number }
  | {
      kind: "strokes";
      count: number;
      style: StrokeStyle;
      rotate: number;
    };

const OPTION_LETTERS = ["A", "B", "C", "D"];

// ── Drawing the figure ──────────────────────────────────────────────────────

function Figure({
  spec,
  size = 62,
}: {
  spec: FigureSpec;
  /** Pixels, or a CSS string (e.g. "70%") for a fluid size */
  size?: number | string;
}) {
  const uid = useId().replace(/:/g, "");
  const hatchId = `h-${uid}`;
  // Centre of the viewBox - independent of display size
  const c = 31;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 62 62"
      className="block text-[#171c23]"
      aria-hidden
    >
      <defs>
        <pattern
          id={hatchId}
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="5"
            stroke="currentColor"
            strokeWidth="1.1"
          />
        </pattern>
      </defs>

      <g transform={`rotate(${spec.rotate} ${c} ${c})`}>
        {spec.kind === "rect" ? (
          <rect
            x="21"
            y="9"
            width="20"
            height="44"
            fill={
              spec.fill === "solid"
                ? "currentColor"
                : spec.fill === "hatch"
                  ? `url(#${hatchId})`
                  : "none"
            }
            stroke="currentColor"
            strokeWidth="1.2"
          />
        ) : (
          Array.from({ length: spec.count }, (_, i) => {
            // Lines are spread symmetrically around the centre
            const gap = 11;
            const x = 31 + (i - (spec.count - 1) / 2) * gap;
            if (spec.style === "straight")
              return (
                <line
                  key={i}
                  x1={x}
                  y1="12"
                  x2={x}
                  y2="50"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              );
            const d =
              spec.style === "wave"
                ? `M ${x} 12 q 6 6 0 12 q -6 6 0 12 q 6 6 0 14`
                : `M ${x} 12 l 6 8 l -6 8 l 6 8 l -6 8 l 6 6`;
            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            );
          })
        )}
      </g>
    </svg>
  );
}

// ── Building the questions ──────────────────────────────────────────────────

export interface Question {
  /** 9 cells; the last one is empty and is what needs completing */
  grid: (FigureSpec | null)[];
  options: FigureSpec[];
  correct: number;
  explanation: string;
}

const FILL_ORDERS: Fill[][] = [
  ["empty", "hatch", "solid"],
  ["solid", "empty", "hatch"],
  ["hatch", "solid", "empty"],
  ["empty", "solid", "hatch"],
];
const ROT_SETS = [
  [0, 25, 90],
  [0, 45, 90],
  [0, -30, 60],
  [0, 60, 120],
];
const STYLE_SETS: StrokeStyle[][] = [
  ["straight", "wave", "zigzag"],
  ["wave", "zigzag", "straight"],
  ["zigzag", "straight", "wave"],
];
/** Fixed permutations for where the correct answer sits - keeps the mockup stable */
const PERMS = [
  [0, 1, 2, 3],
  [1, 0, 3, 2],
  [2, 3, 0, 1],
  [3, 2, 1, 0],
  [1, 2, 3, 0],
  [2, 0, 1, 3],
];

const FILL_NAME: Record<Fill, string> = {
  empty: "empty",
  hatch: "hatched",
  solid: "solid",
};
const STYLE_NAME: Record<StrokeStyle, string> = {
  straight: "straight",
  wave: "wavy",
  zigzag: "zigzag",
};

/** Orders the four options by a fixed permutation and returns where the correct one ends up */
function arrange(
  candidates: FigureSpec[],
  permIndex: number,
): { options: FigureSpec[]; correct: number } {
  const perm = PERMS[permIndex % PERMS.length];
  const options: FigureSpec[] = [];
  perm.forEach((from, to) => {
    options[to] = candidates[from];
  });
  return { options, correct: perm.indexOf(0) };
}

function fillRotateQuestion(i: number): Question {
  const fills = FILL_ORDERS[i % FILL_ORDERS.length];
  const rots = ROT_SETS[i % ROT_SETS.length];
  const cell = (r: number, c: number): FigureSpec => ({
    kind: "rect",
    fill: fills[c],
    rotate: rots[r],
  });

  const grid: (FigureSpec | null)[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      grid.push(r === 2 && c === 2 ? null : cell(r, c));

  const answer = cell(2, 2);
  const otherFill = fills[(2 + 1) % 3];
  const otherRot = rots[(2 + 1) % 3];
  const { options, correct } = arrange(
    [
      answer,
      { kind: "rect", fill: otherFill, rotate: rots[2] },
      { kind: "rect", fill: fills[2], rotate: otherRot },
      { kind: "rect", fill: otherFill, rotate: otherRot },
    ],
    i,
  );

  return {
    grid,
    options,
    correct,
    explanation: `In each row the shape is rotated by the same angle, and each column has its own fill (${FILL_NAME[fills[0]]}, ${FILL_NAME[fills[1]]}, ${FILL_NAME[fills[2]]}). The missing cell is in the row rotated ${rots[2]} degrees and the column with the ${FILL_NAME[fills[2]]} fill, so answer ${OPTION_LETTERS[correct]} meets both rules.`,
  };
}

function countStyleQuestion(i: number): Question {
  const styles = STYLE_SETS[i % STYLE_SETS.length];
  const baseRot = [0, 0, 0][i % 3];
  const cell = (r: number, c: number): FigureSpec => ({
    kind: "strokes",
    count: c + 1,
    style: styles[r],
    rotate: baseRot,
  });

  const grid: (FigureSpec | null)[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      grid.push(r === 2 && c === 2 ? null : cell(r, c));

  const answer = cell(2, 2);
  const otherStyle = styles[(2 + 1) % 3];
  const { options, correct } = arrange(
    [
      answer,
      {
        kind: "strokes",
        count: 3,
        style: otherStyle,
        rotate: baseRot,
      },
      {
        kind: "strokes",
        count: 2,
        style: styles[2],
        rotate: baseRot,
      },
      {
        kind: "strokes",
        count: 1,
        style: otherStyle,
        rotate: baseRot,
      },
    ],
    i + 2,
  );

  return {
    grid,
    options,
    correct,
    explanation: `Each row keeps one line style (${STYLE_NAME[styles[0]]}, ${STYLE_NAME[styles[1]]}, ${STYLE_NAME[styles[2]]}), and each column adds one more line. The missing cell needs three ${STYLE_NAME[styles[2]]} lines, so answer ${OPTION_LETTERS[correct]} is correct.`,
  };
}

export function buildQuestions(count: number): Question[] {
  return Array.from({ length: count }, (_, i) =>
    i % 2 === 0
      ? fillRotateQuestion(Math.floor(i / 2))
      : countStyleQuestion(Math.floor(i / 2)),
  );
}

// ── Grid cell ───────────────────────────────────────────────────────────────

function GridCell({
  spec,
  large,
}: {
  spec: FigureSpec | null;
  large?: boolean;
}) {
  return (
    <div className="aspect-square flex items-center justify-center border border-[rgba(23,28,35,0.25)]">
      {spec ? (
        <Figure spec={spec} size={large ? "80%" : "67%"} />
      ) : (
        <span
          className={`font-bold text-[#171c23] leading-none ${
            large ? "text-[clamp(30px,8vmin,64px)]" : "text-[30px]"
          }`}
        >
          ?
        </span>
      )}
    </div>
  );
}

/**
 * The question image is sized from the screen height so the answers always fit
 * above the button row. The numbers are the height of everything else (headings,
 * answers, footer); on mobile the answers wrap to two rows and the header is shorter.
 */
const GRID_MAX_W =
  "max-w-[clamp(150px,calc(100dvh_-_530px),420px)] md:max-w-[clamp(150px,calc(100dvh_-_450px),420px)]";

function QuestionGrid({
  question,
  large,
}: {
  question: Question;
  large?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-3 w-full mx-auto bg-white ${
        large ? "max-w-[min(88vw,78vh)]" : GRID_MAX_W
      }`}
    >
      {question.grid.map((spec, i) => (
        <GridCell key={i} spec={spec} large={large} />
      ))}
    </div>
  );
}

/**
 * Full-screen view of the question image.
 * Closes with the X, Esc or a click on the backdrop.
 */
function ImageLightbox({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    // Lock page scroll behind the image
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Question image, full screen"
      onClick={onClose}
      className="fixed inset-0 z-[200] bg-[rgba(18,23,30,0.85)] backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close image"
        className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X size={24} />
      </button>
      {/* Clicking the image itself doesn't close it - only the backdrop */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full flex justify-center"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Question image - tapping opens it full screen */
function ZoomableQuestionGrid({ question }: { question: Question }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-native-enter
        aria-label="Enlarge image to full screen"
        className={`group relative block w-full ${GRID_MAX_W} mx-auto cursor-zoom-in rounded-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008ff0] focus-visible:ring-offset-4`}
      >
        <QuestionGrid question={question} />
      </button>
      {open && (
        <ImageLightbox onClose={() => setOpen(false)}>
          <QuestionGrid question={question} large />
        </ImageLightbox>
      )}
    </>
  );
}

// ── Answer card ─────────────────────────────────────────────────────────────

function OptionCard({
  spec,
  letter,
  selected,
  state,
  onClick,
}: {
  spec: FigureSpec;
  letter: string;
  selected: boolean;
  /** After checking: the correct one, the wrong pick, or neutral */
  state: "correct" | "wrong" | "idle";
  onClick?: () => void;
}) {
  const tone =
    state === "correct"
      ? "bg-[rgba(105,198,0,0.12)] border-[#4e9400]"
      : state === "wrong"
        ? "bg-[rgba(196,60,60,0.1)] border-[#c43c3c]"
        : selected
          ? "bg-[rgba(0,143,240,0.1)] border-[#008ff0]"
          : "bg-white border-[rgba(23,28,35,0.12)] hover:border-[rgba(0,143,240,0.35)]";

  const badgeTone =
    state === "correct"
      ? "bg-[#4e9400] text-white"
      : state === "wrong"
        ? "bg-[#c43c3c] text-white"
        : selected
          ? "bg-[#008ff0] text-white"
          : // Opaque, in the card border tone - not transparent
            "bg-[#e3e4e5] text-[#171c23]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={selected}
      className={`relative rounded-[10px] border p-4 flex flex-col items-center gap-2 transition-colors disabled:cursor-default ${tone}`}
    >
      <span
        className={`absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold ${badgeTone}`}
      >
        {letter}
      </span>
      <Figure spec={spec} size={56} />
      {state === "correct" && (
        <Check size={16} className="text-[#4e9400]" />
      )}
      {state === "wrong" && (
        <X size={16} className="text-[#c43c3c]" />
      )}
    </button>
  );
}

/** A question's four options, with their checked state */
function OptionsGrid({
  question,
  choice,
  revealed,
  onPick,
}: {
  question: Question;
  choice: number | null;
  revealed: boolean;
  onPick: (i: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {question.options.map((spec, i) => (
        <OptionCard
          key={i}
          spec={spec}
          letter={OPTION_LETTERS[i]}
          selected={choice === i}
          state={
            !revealed
              ? "idle"
              : i === question.correct
                ? "correct"
                : choice === i
                  ? "wrong"
                  : "idle"
          }
          onClick={revealed ? undefined : () => onPick(i)}
        />
      ))}
    </div>
  );
}

/** Answer keys: the letter A-D (any case, or by physical key on other layouts), or 1-4 */
const OPTION_KEY_CODES = ["KeyA", "KeyB", "KeyC", "KeyD"];
function optionIndexFromKey(e: KeyboardEvent): number {
  const byLetter = OPTION_LETTERS.indexOf(e.key.toUpperCase());
  if (byLetter >= 0) return byLetter;
  const byCode = OPTION_KEY_CODES.indexOf(e.code);
  if (byCode >= 0) return byCode;
  const digit = Number(e.key);
  return digit >= 1 && digit <= 4 ? digit - 1 : -1;
}

/** The sample question shown with the timed test's instructions */
const SAMPLE_QUESTION = countStyleQuestion(1);

// ── Question number strip ───────────────────────────────────────────────────

export type AnswerState = "correct" | "wrong" | "unanswered";

export function QuestionStrip({
  states,
  current,
  onJump,
  size = "md",
  /** Scrolls sideways instead of wrapping - for the narrow nav bar */
  scroll,
}: {
  states: AnswerState[];
  current?: number;
  onJump?: (i: number) => void;
  size?: "sm" | "md";
  scroll?: boolean;
}) {
  const dim =
    size === "sm"
      ? "w-7 h-7 text-[12px]"
      : "w-9 h-9 text-[14px]";
  return (
    <div
      className={
        scroll
          ? "flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1"
          : `flex flex-wrap ${size === "sm" ? "gap-1.5" : "gap-2"}`
      }
    >
      {states.map((s, i) => {
        const isCurrent = i === current;
        const tone =
          s === "correct"
            ? "bg-[rgba(105,198,0,0.12)] text-[#4e9400] border-[#4e9400]"
            : s === "wrong"
              ? "bg-[rgba(196,60,60,0.1)] text-[#c43c3c] border-[#c43c3c]"
              : "bg-white text-[#171c23] border-[rgba(23,28,35,0.12)]";
        return (
          <button
            key={i}
            type="button"
            onClick={onJump ? () => onJump(i) : undefined}
            disabled={!onJump}
            aria-current={isCurrent ? "step" : undefined}
            className={`shrink-0 rounded-full border font-bold tabular-nums transition-colors disabled:cursor-default ${dim} ${tone} ${
              isCurrent
                ? "ring-2 ring-[#008ff0] ring-offset-2"
                : ""
            }`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Correct/wrong breakdown - two chips with a subtle background.
 * `size` "sm" for the outer test card, "md" for the summary.
 */
export function ScoreChips({
  correct,
  wrong,
  size = "md",
}: {
  correct: number;
  wrong: number;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5";
  const text = size === "sm" ? "text-[12px]" : "text-[13px]";
  const icon = size === "sm" ? 13 : 15;
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex items-center gap-1.5 rounded-full bg-[rgba(105,198,0,0.12)] text-[#4e9400] font-semibold ${pad} ${text}`}
      >
        <Check size={icon} className="shrink-0" />
        {correct} correct
      </span>
      <span
        className={`flex items-center gap-1.5 rounded-full bg-[rgba(196,60,60,0.1)] text-[#c43c3c] font-semibold ${pad} ${text}`}
      >
        <X size={icon} className="shrink-0" />
        {wrong} wrong
      </span>
    </div>
  );
}

// ── Test screen ─────────────────────────────────────────────────────────────

type Step = "instructions" | "sample" | "question" | "summary";

/**
 * The check result and explanation - shown in the sticky footer above the buttons,
 * so they're visible straight after checking without scrolling.
 */
function ExplanationPanel({
  question,
  choice,
}: {
  question: Question;
  choice: number | null;
}) {
  const right = choice === question.correct;
  const letter = OPTION_LETTERS[question.correct];
  const title = right
    ? "Correct!"
    : choice === null
      ? `No answer chosen · The correct answer is ${letter}`
      : `Incorrect · The correct answer is ${letter}`;
  return (
    <div
      role="status"
      className={`rounded-[10px] px-4 py-3 flex flex-col gap-1.5 max-h-[34vh] overflow-y-auto ${
        right
          ? "bg-[rgba(105,198,0,0.1)]"
          : "bg-[rgba(196,60,60,0.08)]"
      }`}
    >
      <p
        className={`flex items-center gap-1.5 font-bold text-[15px] text-left ${
          right ? "text-[#4e9400]" : "text-[#c43c3c]"
        }`}
      >
        {right ? (
          <CheckCircle2 size={17} className="shrink-0" />
        ) : (
          <XCircle size={17} className="shrink-0" />
        )}
        {title}
      </p>
      <p className="text-[#171c23] text-[14px] leading-relaxed text-left">
        <span className="font-semibold">Explanation: </span>
        {question.explanation}
      </p>
    </div>
  );
}

/**
 * After checking, the panel above the buttons grows - scroll to the bottom
 * so the answers stay visible above it.
 */
function revealScroll() {
  window.setTimeout(
    () =>
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      }),
    50,
  );
}

/** Content body + sticky footer - same layout as the interests survey */
function TestShell({
  children,
  footer,
  footerTop,
}: {
  children: ReactNode;
  footer: ReactNode;
  /** Extra content above the button row (e.g. the explanation on mobile) */
  footerTop?: ReactNode;
}) {
  return (
    <>
      <div
        data-test-keys
        className="flex-1 w-full max-w-[640px] mx-auto py-6"
      >
        {children}
      </div>
      {/* The buttons are always visible at the bottom of the screen */}
      <div
        data-test-keys
        className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3.5 bg-white/95 backdrop-blur-md border-t border-[rgba(23,28,35,0.08)] mt-auto">
        <div className="max-w-[640px] mx-auto flex flex-col gap-3">
          {footerTop}
          <div className="flex items-center justify-between gap-3">
            {footer}
          </div>
        </div>
      </div>
    </>
  );
}

/** Confirm leaving the test - opens from the X */
function ExitConfirmDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      onClose={onClose}
      title="Leave the test"
      footer={<ExitActions onConfirm={onConfirm} />}
    >
      <p className="text-[#171c23] text-[15px] leading-relaxed text-left">
        Your progress is saved and you can pick up from the same
        point later. Leave the test?
      </p>
    </Dialog>
  );
}

function ExitActions({ onConfirm }: { onConfirm: () => void }) {
  const close = useDialogClose();
  return (
    <div className="flex gap-3 w-full">
      <Button
        variant="ghost"
        onClick={close}
        className="flex-1 justify-center"
      >
        Keep going
      </Button>
      <Button
        onClick={onConfirm}
        className="flex-1 justify-center"
      >
        Leave
      </Button>
    </div>
  );
}

/** Per-question timer - countdown with a progress bar, red in the last 10 seconds */
function QuestionTimer({
  left,
  total,
  timedOut,
}: {
  left: number;
  total: number;
  timedOut: boolean;
}) {
  const urgent = left <= 10;
  const color = urgent ? "#c43c3c" : "#008ff0";
  return (
    <div
      className="shrink-0 flex flex-col items-stretch gap-1.5 min-w-[96px]"
      role="timer"
      aria-live={urgent ? "assertive" : "off"}
      aria-label={
        timedOut ? "Time's up" : `${left} seconds left`
      }
    >
      <span
        className="flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-[14px] font-bold tabular-nums transition-colors"
        style={{
          color,
          background: urgent
            ? "rgba(196,60,60,0.1)"
            : "rgba(0,143,240,0.1)",
        }}
      >
        <Timer size={15} className="shrink-0" />
        {timedOut ? "Time's up" : fmtDuration(left)}
      </span>
      <div className="h-1 w-full rounded-full bg-[rgba(23,28,35,0.08)] overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-linear"
          style={{
            width: `${(left / total) * 100}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

/** seconds -> mm:ss */
const fmtDuration = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(Math.round(sec) % 60).padStart(2, "0")}`;

/** Summary stat card - icon, label, value and optional bar */
function StatCard({
  icon,
  label,
  value,
  caption,
  bar,
  barColor,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  caption?: string;
  bar?: number;
  barColor?: string;
}) {
  return (
    <div className="bg-white rounded-[10px] border border-[rgba(23,28,35,0.08)] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[#171c23] text-[14px] opacity-70">
          {label}
        </p>
        {icon}
      </div>
      <p className="stat-number text-[#171c23] text-[28px] leading-none tracking-tight tabular-nums">
        {value}
      </p>
      {bar !== undefined ? (
        <ProgressBar value={bar} color={barColor} />
      ) : (
        caption && (
          <p className="text-[#171c23] text-[13px] opacity-50">
            {caption}
          </p>
        )
      )}
    </div>
  );
}

export default function EntryAssessmentRunner({
  topicName,
  testName,
  questionCount,
  /** Ready-made results - for a completed test, open straight to the summary */
  initialResults,
  /** Previous attempt duration in seconds - for a completed test */
  initialDuration,
  /** Past attempts to show in the summary */
  attempts = [],
  secondsPerQuestion,
  onExit,
}: {
  topicName: string;
  testName: string;
  questionCount: number;
  initialResults?: AnswerState[];
  initialDuration?: number;
  attempts?: { date: string; score: number }[];
  /** Time limit per question in seconds - when it runs out the question locks and is graded */
  secondsPerQuestion?: number;
  onExit: () => void;
}) {
  const [exitOpen, setExitOpen] = useState(false);
  /** Start timestamp for timing the test, and final duration at the end */
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | undefined>(
    initialDuration,
  );
  const questions = useMemo(
    () => buildQuestions(questionCount),
    [questionCount],
  );

  const [step, setStep] = useState<Step>(
    initialResults ? "summary" : "instructions",
  );
  const [index, setIndex] = useState(0);
  // Clamped navigation - the index never leaves the question range
  const goPrev = () =>
    setIndex((i) => Math.max(0, i - 1));
  const goNext = () =>
    setIndex((i) => Math.min(questionCount - 1, i + 1));
  /** In review mode (from the summary) answers are shown and the strip can be used to navigate */
  const [reviewing, setReviewing] = useState(false);
  /**
   * The answer picked for each question. For a pre-completed test we rebuild the picks:
   * a correct question picks the right answer, a wrong one picks one of the wrong ones.
   */
  const [picked, setPicked] = useState<(number | null)[]>(() =>
    initialResults
      ? initialResults.map((s, i) =>
          s === "correct"
            ? questions[i].correct
            : (questions[i].correct + 1) % 4,
        )
      : Array(questionCount).fill(null),
  );
  /** Which questions have been checked/submitted */
  const [checked, setChecked] = useState<boolean[]>(() =>
    Array(questionCount).fill(!!initialResults),
  );

  /** Time left on each question - kept when moving between questions */
  const [remaining, setRemaining] = useState<number[]>(() =>
    Array(questionCount).fill(secondsPerQuestion ?? 0),
  );
  const timerActive =
    !!secondsPerQuestion &&
    step === "question" &&
    !reviewing &&
    !checked[index];

  useEffect(() => {
    if (!timerActive) return;
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        const next = [...prev];
        next[index] = Math.max(0, next[index] - 1);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerActive, index]);


  // Final grading: anything other than the right answer (including no answer) counts as wrong once checked
  const graded: AnswerState[] = picked.map((p, i) =>
    p !== null && p === questions[i].correct
      ? "correct"
      : checked[i]
        ? "wrong"
        : "unanswered",
  );
  const correctCount = graded.filter(
    (s) => s === "correct",
  ).length;
  const wrongCount = graded.filter((s) => s === "wrong").length;

  const restart = () => {
    setPicked(Array(questionCount).fill(null));
    setChecked(Array(questionCount).fill(false));
    setRemaining(
      Array(questionCount).fill(secondsPerQuestion ?? 0),
    );
    setReviewing(false);
    setIndex(0);
    setStartedAt(Date.now());
    setDuration(undefined);
    setStep("question");
  };

  const goSample = () => {
    window.scrollTo({ top: 0 });
    setStep("sample");
  };

  const beginTest = () => {
    window.scrollTo({ top: 0 });
    setStartedAt(Date.now());
    setStep("question");
  };

  /** Open the answer review from the first question */
  const reviewFromStart = () => {
    setIndex(0);
    setReviewing(true);
    setStep("question");
  };

  // Go to the summary - any unanswered question becomes wrong here
  const goSummary = () => {
    setChecked(Array(questionCount).fill(true));
    setReviewing(false);
    if (startedAt)
      setDuration((Date.now() - startedAt) / 1000);
    setStep("summary");
  };

  const timed = !!secondsPerQuestion;
  const isLast = index === questionCount - 1;

  /**
   * Timed test: lock in the answer (without revealing it) and move on.
   * No going back, and answers are only revealed in the summary.
   */
  const advance = () => {
    setChecked((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
    if (isLast) goSummary();
    else goNext();
  };

  // Time's up - move to the next question (an unanswered question counts as wrong)
  useEffect(() => {
    if (timerActive && remaining[index] === 0) advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, remaining, index]);

  /** The sample question in the instructions - the only place to check an answer in the timed test */
  const [sampleChoice, setSampleChoice] = useState<number | null>(
    null,
  );
  const [sampleChecked, setSampleChecked] = useState(false);

  /** Keyboard actions for the current screen - refreshed every render */
  const keysRef = useRef<{
    select?: (i: number) => void;
    enter?: () => void;
  }>({});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Not while a dialog or full-screen image is open
      if (document.querySelector('[aria-modal="true"]')) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]"))
        return;
      const keys = keysRef.current;

      if (e.key === "Enter") {
        // Enter on a button outside the test area (e.g. the X) - default behaviour
        const inScope =
          !t ||
          t === document.body ||
          (!!t.closest("[data-test-keys]") &&
            !t.closest("[data-native-enter]"));
        if (!inScope || !keys.enter) return;
        e.preventDefault();
        keys.enter();
        return;
      }

      const i = optionIndexFromKey(e);
      if (i < 0 || !keys.select) return;
      e.preventDefault();
      keys.select(i);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  keysRef.current = {};

  let body: ReactNode;
  let footer: ReactNode;
  let footerTop: ReactNode;

  if (step === "instructions") {
    body = (
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-[#122736] text-[24px] tracking-tight text-left">
          Test instructions<span className="text-[#69c600]">.</span>
        </h3>
        <p className="text-[#171c23] text-[15px] leading-relaxed text-left">
          This test has {questionCount} "complete the pattern"
          questions. Each one shows a 3×3 grid with the last shape
          missing - choose the option out of four that completes
          the pattern.
        </p>
        <ul className="text-[#171c23] text-[15px] leading-relaxed text-left list-disc pl-5 flex flex-col gap-1.5">
          <li>Each question has only one correct answer.</li>
          {timed ? (
            <>
              <li>
                You have {secondsPerQuestion} seconds per question. When
                time runs out you move on automatically, and an
                unanswered question counts as wrong.
              </li>
              <li>You can't skip a question or go back to a previous one.</li>
              <li>
                Answers and explanations appear only at the end. Before
                you start there's a practice question where you can
                check your answer.
              </li>
            </>
          ) : (
            <>
              <li>
                After you check an answer, the correct one is shown
                with an explanation.
              </li>
              <li>
                You can skip between questions and come back using the
                buttons at the bottom of the screen.
              </li>
              <li>
                The test is untimed and your progress saves
                automatically.
              </li>
            </>
          )}
          <li>
            You can answer with the keyboard (A-D or 1-4) and
            continue with Enter.
          </li>
        </ul>

      </div>
    );
    // In the timed test the instructions lead to a sample question on its own page
    const next = timed ? goSample : beginTest;
    footer = (
      <>
        <Button variant="outline" onClick={onExit}>
          Back to topic
        </Button>
        <Button onClick={next}>
          {timed ? "Try a sample" : "Start the test"}
          {timed && <ChevronRight size={15} />}
        </Button>
      </>
    );
    keysRef.current = { enter: next };
  } else if (step === "sample") {
    const checkSample = () => {
      setSampleChecked(true);
      revealScroll();
    };
    body = (
      <div className="flex flex-col gap-6">
        <div className="text-left">
          <p className="font-semibold text-[#171c23] text-[16px]">
            Sample question
          </p>
          <p className="text-[#171c23] text-[13px] opacity-50 mt-0.5">
            Untimed - choose an answer and check it. Tap the image to
            see it full screen
          </p>
        </div>
        <ZoomableQuestionGrid question={SAMPLE_QUESTION} />
        <OptionsGrid
          question={SAMPLE_QUESTION}
          choice={sampleChoice}
          revealed={sampleChecked}
          onPick={setSampleChoice}
        />
      </div>
    );
    if (sampleChecked)
      footerTop = (
        <ExplanationPanel
          question={SAMPLE_QUESTION}
          choice={sampleChoice}
        />
      );
    const canCheck = sampleChoice !== null && !sampleChecked;
    footer = (
      <>
        <Button variant="outline" onClick={() => setStep("instructions")}>
          <ChevronLeft size={15} />
          Instructions
        </Button>
        {canCheck ? (
          <Button onClick={checkSample}>Check</Button>
        ) : (
          <Button onClick={beginTest}>Start the test</Button>
        )}
      </>
    );
    keysRef.current = {
      select: (i) => {
        if (!sampleChecked) setSampleChoice(i);
      },
      enter: canCheck ? checkSample : beginTest,
    };
  } else if (step === "summary") {
    const score = Math.round(
      (correctCount / questionCount) * 100,
    );
    body = (
      <div className="flex flex-col gap-4">
        {/* Main card: score ring and next actions */}
        <div className="bg-white rounded-[10px] border border-[rgba(23,28,35,0.08)] p-6 flex flex-col items-center gap-5">
          <div className="text-center flex flex-col gap-1">
            <p className="font-bold text-[#171c23] text-[16px]">
              {score >= 60
                ? "Well done on finishing the test!"
                : "You've finished the test"}
            </p>
            <p className="text-[#171c23] text-[14px] opacity-70 leading-relaxed">
              {score >= 60
                ? "You passed. Keep practising to push your result even higher."
                : "Have a look at the explanations and try again - every attempt helps."}
            </p>
          </div>
          <ProgressRing
            value={score}
            size={160}
            label="Overall score"
            valueClassName="text-[44px]"
            suffix=""
          />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={restart}>
              <RotateCcw size={15} className="shrink-0" />
              Try again
            </Button>
            <Button variant="ghost" onClick={reviewFromStart}>
              <Eye size={15} className="shrink-0" />
              View questions
            </Button>
          </div>
        </div>

        {/* Performance stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Correct answers"
            value={String(correctCount)}
            icon={
              <CheckCircle2
                size={18}
                className="text-[#4e9400] shrink-0"
              />
            }
            bar={score}
            barColor="bg-[#4e9400]"
          />
          <StatCard
            label="Wrong answers"
            value={String(wrongCount)}
            icon={
              <XCircle
                size={18}
                className="text-[#c43c3c] shrink-0"
              />
            }
            bar={100 - score}
            barColor="bg-[#c43c3c]"
          />
          <StatCard
            label="Time taken"
            value={
              duration !== undefined
                ? fmtDuration(duration)
                : "—"
            }
            caption="Minutes and seconds"
            icon={
              <Timer
                size={18}
                className="text-[#008ff0] shrink-0"
              />
            }
          />
        </div>

        {/* Question breakdown */}
        <div className="bg-white rounded-[10px] border border-[rgba(23,28,35,0.08)] p-5 flex flex-col gap-3">
          <p className="font-semibold text-[#171c23] text-[15px] text-left">
            Question breakdown
            <span className="font-normal opacity-50">
              {" "}
              · Tap to see the answer
            </span>
          </p>
          <QuestionStrip
            states={graded}
            onJump={(i) => {
              setIndex(i);
              setReviewing(true);
              setStep("question");
            }}
          />
        </div>

        {/* Previous attempts */}
        {attempts.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-[#171c23] text-[15px] text-left">
              Previous attempts
            </p>
            <div className="bg-white rounded-[10px] border border-[rgba(23,28,35,0.08)] overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#f5f5f7] text-[#171c23] text-[13px] font-semibold">
                <span>Date</span>
                <span>Score</span>
              </div>
              {attempts.map((a) => (
                <div
                  key={a.date}
                  className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[rgba(23,28,35,0.05)] text-[14px]"
                >
                  <span className="text-[#171c23] opacity-70">
                    {a.date}
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      a.score >= 60
                        ? "text-[#4e9400]"
                        : "text-[#c43c3c]"
                    }`}
                  >
                    {a.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
    footer = (
      <>
        <Button variant="outline" onClick={onExit}>
          Back to topic
        </Button>
        {/* <ScoreChips correct={correctCount} wrong={wrongCount} /> */}
      </>
    );
  } else {
    const q = questions[index];
    const revealed = checked[index];
    const choice = picked[index];

    const setChoice = (i: number) => {
      if (revealed) return;
      setPicked((prev) => {
        const next = [...prev];
        next[index] = i;
        return next;
      });
    };

    const submit = () => {
      setChecked((prev) => {
        const next = [...prev];
        next[index] = true;
        return next;
      });
      revealScroll();
    };

    body = (
      <div className="flex flex-col gap-6">
        {/* Question number + instruction, aligned left; the timer on the right */}
        <div className="flex items-start justify-between gap-3">
          <div className="text-left">
            <p className="font-semibold text-[#171c23] text-[16px]">
              {index + 1}. Complete the pattern
            </p>
            <p className="text-[#171c23] text-[13px] opacity-50 mt-0.5">
              There is only one correct answer
            </p>
          </div>
          {secondsPerQuestion && !reviewing && (
            <QuestionTimer
              left={remaining[index]}
              total={secondsPerQuestion}
              timedOut={remaining[index] === 0}
            />
          )}
        </div>

        <ZoomableQuestionGrid question={q} />

        <OptionsGrid
          question={q}
          choice={choice}
          revealed={revealed}
          onPick={setChoice}
        />
      </div>
    );

    // Result and explanation - above the buttons so they're always visible without scrolling
    if (revealed)
      footerTop = <ExplanationPanel question={q} choice={choice} />;

    if (reviewing) {
      footer = (
        <>
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={index === 0}
          >
            <ChevronLeft size={15} />
            Previous
          </Button>
          <Button
            variant="link"
            onClick={() => {
              setReviewing(false);
              setStep("summary");
            }}
          >
            Back to summary
          </Button>
          <Button
            variant="outline"
            onClick={goNext}
            disabled={index === questionCount - 1}
          >
            Next
            <ChevronRight size={15} />
          </Button>
        </>
      );
      keysRef.current = { enter: goNext };
    } else if (timed) {
      // Timed test: forward only, and only once an answer is chosen
      footer = (
        <>
          <span className="text-[#171c23] text-[14px] opacity-60 tabular-nums">
            Question {index + 1} of {questionCount}
          </span>
          <Button onClick={advance} disabled={choice === null}>
            {isLast ? "See summary" : "Next question"}
            {!isLast && <ChevronRight size={15} />}
          </Button>
        </>
      );
      keysRef.current = {
        select: setChoice,
        enter: () => {
          if (choice !== null) advance();
        },
      };
    } else {
      footer = (
        <>
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={index === 0}
          >
            <ChevronLeft size={15} />
            Previous question
          </Button>

          {!revealed && choice !== null ? (
            <Button onClick={submit}>Check</Button>
          ) : index === questionCount - 1 ? (
            <Button onClick={goSummary}>See summary</Button>
          ) : (
            <Button onClick={goNext}>
              {choice === null && !revealed ? "Skip" : "Next question"}
              <ChevronRight size={15} />
            </Button>
          )}
        </>
      );
      // Enter runs the primary action: check, then move to the next question
      keysRef.current = {
        select: setChoice,
        enter: () => {
          if (!revealed && choice !== null) submit();
          else if (isLast) goSummary();
          else goNext();
        },
      };
    }
  }

  return (
    // The section stretches to the bottom of the page so the sticky footer is always at the bottom of the screen
    <section className="bg-white px-4 sm:px-6 md:px-10 flex flex-col flex-1">
      {/*
        Fixed top bar: centred title and an exit button on the right.
        In answer review the question strip is added - beside the title on desktop,
        and on mobile as a second, sideways-scrolling row, so navigation is always to hand.
      */}
      <div className="sticky top-[64px] md:top-[98px] z-40 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 bg-white border-b border-[rgba(23,28,35,0.08)]">
        <div className="relative h-14 flex items-center justify-center gap-5">
          <p className="text-[#171c23] text-[15px] font-semibold text-center px-10 shrink-0">
            {topicName} · {testName}
          </p>
          {reviewing && (
            <div className="hidden md:block min-w-0">
              <QuestionStrip
                states={graded}
                current={index}
                onJump={(i) => setIndex(i)}
                size="sm"
                scroll
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => setExitOpen(true)}
            aria-label="Leave the test"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-[#171c23] opacity-60 hover:opacity-100 hover:bg-[rgba(23,28,35,0.06)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {reviewing && (
          <div className="md:hidden pb-2 -mt-1">
            <QuestionStrip
              states={graded}
              current={index}
              onJump={(i) => setIndex(i)}
              size="sm"
              scroll
            />
          </div>
        )}
      </div>

      <TestShell footer={footer} footerTop={footerTop}>
        {body}
      </TestShell>

      {exitOpen && (
        <ExitConfirmDialog
          onClose={() => setExitOpen(false)}
          onConfirm={onExit}
        />
      )}
    </section>
  );
}
