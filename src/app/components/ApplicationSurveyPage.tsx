import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Send,
} from "lucide-react";
import {
  Button,
  Dialog,
  FieldLabel,
  FIELD_CLASS,
  FormTopBar,
  IconCircle,
} from "./primitives";

/**
 * Application survey - one step per topic, and each application-day step
 * opens with a gate question "Did you complete this step?". Answering "No"
 * dims the rest of that step's questions and lets the applicant continue.
 * Leaving the survey keeps a draft so it can be resumed from the same step.
 */

// ── Preset answers ──────────────────────────────────────────────────────────

const SCALE_LABELS: Record<number, string> = {
  1: "Very little",
  2: "A little",
  3: "Somewhat",
  4: "Much",
  5: "Very much",
};

const SCALE_1_5 = [1, 2, 3, 4, 5];

const TEXT_HINT = "Write your comments here.";

type QuestionType =
  | "scale1to5"
  | "yesNo"
  | "choice"
  | "text"
  | "slider";

interface Question {
  section: string;
  text: string;
  type: QuestionType;
  /** The gate question at the top of a step - "Did you complete this step?" */
  gate?: boolean;
  /** Custom options - only for "choice" */
  options?: string[];
  /** Placeholder text for a free-text field */
  hint?: string;
  /** Extra detail field below the choice */
  detail?: {
    label: string;
    /** The field is always shown, or only when a given answer is picked */
    when?: "always" | "Yes";
    required?: boolean;
  };
}

const SECTIONS = {
  data: "Details check",
  interview: "Personal interview",
  tests: "Entry assessment",
  lab: "Health & access needs check",
  medical: "Student support meeting",
  prep: "Preparing for application day",
  office: "About the Admissions Centre",
  execution: "Your application day",
} as const;

const PROFESSIONAL = "Was the help at this step professional and clear?";
const PERSONAL =
  "How personal and courteous were the staff at this step?";

const QUESTIONS: Question[] = [
  // ── Details check ──
  {
    section: SECTIONS.data,
    text: "Did you complete the details check?",
    type: "yesNo",
    gate: true,
  },
  { section: SECTIONS.data, text: PROFESSIONAL, type: "scale1to5" },
  { section: SECTIONS.data, text: PERSONAL, type: "scale1to5" },
  {
    section: SECTIONS.data,
    text: "General comments on the details check.",
    type: "text",
    hint: TEXT_HINT,
  },

  // ── Personal interview ──
  {
    section: SECTIONS.interview,
    text: "Did you complete the personal interview?",
    type: "yesNo",
    gate: true,
  },
  {
    section: SECTIONS.interview,
    text: PROFESSIONAL,
    type: "scale1to5",
  },
  { section: SECTIONS.interview, text: PERSONAL, type: "scale1to5" },
  {
    section: SECTIONS.interview,
    text: "General comments on the personal interview.",
    type: "text",
    hint: TEXT_HINT,
  },

  // ── Entry assessment ──
  {
    section: SECTIONS.tests,
    text: "Did you complete the entry assessment?",
    type: "yesNo",
    gate: true,
  },
  {
    section: SECTIONS.tests,
    text: "Were there disruptions during the assessment that broke your focus?",
    type: "scale1to5",
  },
  { section: SECTIONS.tests, text: PERSONAL, type: "scale1to5" },
  {
    section: SECTIONS.tests,
    text: "If you have a learning or psychological assessment report, did you send it before arriving at the Admissions Centre?",
    type: "choice",
    options: ["Yes", "No", "I don't have a report"],
  },
  {
    section: SECTIONS.tests,
    text: "General comments on the entry assessment.",
    type: "text",
    hint: TEXT_HINT,
  },

  // ── Health & access needs check ──
  {
    section: SECTIONS.lab,
    text: "Did you complete the health & access needs check?",
    type: "yesNo",
    gate: true,
  },
  {
    section: SECTIONS.lab,
    text: "Did you send any health or access documents before arriving at the Admissions Centre?",
    type: "yesNo",
  },
  {
    section: SECTIONS.lab,
    text: "General comments on the health & access needs check.",
    type: "text",
    hint: TEXT_HINT,
  },

  // ── Student support meeting ──
  {
    section: SECTIONS.medical,
    text: "Did you complete the student support meeting?",
    type: "yesNo",
    gate: true,
  },
  { section: SECTIONS.medical, text: PROFESSIONAL, type: "scale1to5" },
  { section: SECTIONS.medical, text: PERSONAL, type: "scale1to5" },
  {
    section: SECTIONS.medical,
    text: "How professional and courteous was the support adviser?",
    type: "scale1to5",
  },
  {
    section: SECTIONS.medical,
    text: "Did you fill in the online health form and send it signed by a GP?",
    type: "yesNo",
    detail: { label: "Details", when: "always" },
  },
  {
    section: SECTIONS.medical,
    text: "General comments on the student support meeting.",
    type: "text",
    hint: TEXT_HINT,
  },

  // ── Preparing for application day ──
  {
    section: SECTIONS.prep,
    text: "Did your school help you prepare for application day?",
    type: "yesNo",
  },
  {
    section: SECTIONS.prep,
    text: "Did you prepare for application day anywhere else?",
    type: "yesNo",
    detail: {
      label: "If you prepared elsewhere, where?",
      when: "Yes",
      required: true,
    },
  },
  {
    section: SECTIONS.prep,
    text: "If you sent documents or reports before arriving at the Admissions Centre, how did you send them?",
    type: "choice",
    options: [
      "Applicant portal",
      "Email",
      "Post",
      "I didn't send documents beforehand",
    ],
  },
  {
    section: SECTIONS.prep,
    text: "Were you told your documents and reports were received and processed before you arrived?",
    type: "yesNo",
  },
  {
    section: SECTIONS.prep,
    text: "Did the preparation help you understand how application day runs?",
    type: "yesNo",
    detail: { label: "Details", when: "always" },
  },
  {
    section: SECTIONS.prep,
    text: "General comments.",
    type: "text",
    hint: TEXT_HINT,
  },

  // ── About the Admissions Centre ──
  {
    section: SECTIONS.office,
    text: "Clear signs and directions.",
    type: "slider",
  },
  {
    section: SECTIONS.office,
    text: "Tidiness and cleanliness of the Admissions Centre.",
    type: "slider",
  },
  {
    section: SECTIONS.office,
    text: "Overall, how satisfied were you with waiting times on application day?",
    type: "slider",
  },
  {
    section: SECTIONS.office,
    text: "Overall satisfaction with application day.",
    type: "slider",
  },
  {
    section: SECTIONS.office,
    text: "Is there a staff member you remember, for better or worse?",
    type: "text",
    hint: TEXT_HINT,
  },
  {
    section: SECTIONS.office,
    text: "General comments.",
    type: "text",
    hint: TEXT_HINT,
  },

  // ── Your application day ──
  {
    section: SECTIONS.execution,
    text: "How much did the preparation and info sessions help you get ready for application day?",
    type: "scale1to5",
  },
  {
    section: SECTIONS.execution,
    text: "How useful was the guidance you got on application day?",
    type: "scale1to5",
  },
  {
    section: SECTIONS.execution,
    text: "Did you meet your school's careers adviser, and did they answer your questions?",
    type: "yesNo",
    detail: { label: "Details", when: "always" },
  },
  {
    section: SECTIONS.execution,
    text: "Following your comments, may we share this survey and your details with the admissions team for follow-up?",
    type: "yesNo",
  },
];

/** Question number from the spec - the gate questions we added are not counted */
const SPEC_NUMBERS = QUESTIONS.reduce<Record<number, number>>(
  (acc, question, index) => {
    if (!question.gate) {
      acc[index] = Object.keys(acc).length + 1;
    }
    return acc;
  },
  {},
);

/** Each survey topic is one step, holding all of that topic's questions */
const STEPS = QUESTIONS.reduce<
  { section: string; items: { question: Question; index: number }[] }[]
>((acc, question, index) => {
  const current = acc[acc.length - 1];
  if (current && current.section === question.section) {
    current.items.push({ question, index });
  } else {
    acc.push({ section: question.section, items: [{ question, index }] });
  }
  return acc;
}, []);

/** Follow-up articles on the finish screen - the next steps in the admissions process */
const NEXT_STEPS: { title: string; text: string }[] = [
  {
    title: "Application day",
    text: "What happens on application day, which steps there are and how to prepare.",
  },
  {
    title: "Selection day",
    text: "A day of tasks and challenges that shows which courses suit you best.",
  },
  {
    title: "Course preferences",
    text: "How to rank courses and pathways, and what happens to your choices next.",
  },
  {
    title: "Faculty interviews",
    text: "Interview days for specific faculties and courses, and what to know first.",
  },
  {
    title: "Start of studies",
    text: "What to bring, when to arrive and what happens from orientation to your offer.",
  },
];

interface Answer {
  value?: string;
  detail?: string;
}

/**
 * The survey draft lives outside the component - leaving and coming back
 * resumes at the same question with the answers already given.
 */
const draftStore: { answers: Record<number, Answer>; step: number } = {
  answers: {},
  step: 0,
};

/** A question that needs an answer - any question that is not free text */
const isRequired = (question: Question) => question.type !== "text";

const isAnswered = (question: Question, answer: Answer) => {
  if (!isRequired(question)) return true;
  if (!answer.value) return false;
  const needsDetail =
    question.detail?.required &&
    (question.detail.when === "always" ||
      answer.value === question.detail.when);
  return !needsDetail || Boolean(answer.detail?.trim());
};

// ── Answer controls ─────────────────────────────────────────────────────────

/** Single-choice option - radio circle and label, as in the interests survey */
function RadioOption({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className="flex items-center gap-2.5 text-left w-fit"
    >
      <span
        className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          selected
            ? "border-[#008ff0]"
            : "border-[rgba(23,28,35,0.3)]"
        }`}
      >
        {selected && (
          <span className="w-[11px] h-[11px] rounded-full bg-[#008ff0]" />
        )}
      </span>
      <span className="text-[#171c23] text-[15px]">{label}</span>
    </button>
  );
}

/** Choice option as a card - for scales and questions with custom options */
function OptionCard({
  label,
  badge,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  badge?: number;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`w-full flex items-center gap-3 rounded-[10px] border px-4 py-3.5 text-left transition-colors ${
        selected
          ? "border-[#008ff0] bg-[rgba(0,143,240,0.06)]"
          : "border-[rgba(23,28,35,0.12)] bg-white hover:border-[rgba(0,143,240,0.35)]"
      }`}
    >
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold ${
          selected
            ? "bg-[#008ff0] text-white"
            : "bg-[rgba(23,28,35,0.06)] text-[#171c23]"
        }`}
      >
        {badge ?? (selected ? <Check size={14} /> : "")}
      </span>
      <span
        className={`text-[15px] text-[#171c23] ${selected ? "font-semibold" : ""}`}
      >
        {label}
      </span>
    </button>
  );
}

/** 1-5 rating bar - the same control as the skill scale in the interests survey */
function RatingBar({
  value,
  disabled,
  onChange,
}: {
  value?: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2.5">
        {SCALE_1_5.map((n) => {
          const selected = value === String(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(String(n))}
              disabled={disabled}
              aria-pressed={selected}
              aria-label={`${n} - ${SCALE_LABELS[n]}`}
              className={`flex-1 h-[52px] rounded-[10px] text-[18px] font-semibold border transition-colors ${
                selected
                  ? "bg-[rgba(0,143,240,0.06)] border-[#008ff0] text-[#008ff0]"
                  : "bg-white border-[rgba(23,28,35,0.12)] text-[#171c23] hover:bg-[rgba(0,143,240,0.06)]"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[13px] text-[#171c23] opacity-60">
        <span>{SCALE_LABELS[1]}</span>
        <span>{SCALE_LABELS[5]}</span>
      </div>
    </div>
  );
}

/** One question within a step: number, wording, answer control and detail field */
function QuestionBlock({
  question,
  number,
  answer,
  disabled,
  onValue,
  onDetail,
}: {
  question: Question;
  /** Question number from the spec; the gate question has none */
  number?: number;
  answer: Answer;
  /** Step not completed - the question is dimmed and not required */
  disabled?: boolean;
  onValue: (v: string) => void;
  onDetail: (v: string) => void;
}) {
  const showDetail =
    question.detail &&
    (question.detail.when === "always" ||
      answer.value === question.detail.when);

  return (
    <div
      aria-disabled={disabled}
      className={`flex flex-col ${disabled ? "opacity-40 pointer-events-none select-none" : ""}`}
    >
      {number !== undefined && (
        <span className="text-[#171c23] text-[12px] opacity-45 text-left mb-1">
          Question {number}
        </span>
      )}
      <FieldLabel required={isRequired(question)}>
        {question.text}
      </FieldLabel>

      {question.type === "text" ? (
        <textarea
          value={answer.value ?? ""}
          onChange={(e) => onValue(e.target.value)}
          placeholder={question.hint}
          rows={4}
          disabled={disabled}
          className={`${FIELD_CLASS} resize-none leading-relaxed`}
        />
      ) : question.type === "slider" ||
        question.type === "scale1to5" ? (
        <RatingBar
          value={answer.value}
          disabled={disabled}
          onChange={onValue}
        />
      ) : question.type === "yesNo" ? (
        <div className="flex flex-col gap-2.5">
          {["Yes", "No"].map((label) => (
            <RadioOption
              key={label}
              label={label}
              selected={answer.value === label}
              disabled={disabled}
              onClick={() => onValue(label)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(question.options ?? []).map((label) => (
            <OptionCard
              key={label}
              label={label}
              selected={answer.value === label}
              disabled={disabled}
              onClick={() => onValue(label)}
            />
          ))}
        </div>
      )}

      {/* Detail field - always shown, or only after a given answer */}
      {showDetail && question.detail && (
        <div className="mt-4">
          <FieldLabel required={question.detail.required}>
            {question.detail.label}
            {!question.detail.required && (
              <span className="text-[#171c23] opacity-50 font-normal">
                {" "}
                (optional)
              </span>
            )}
          </FieldLabel>
          <textarea
            value={answer.detail ?? ""}
            onChange={(e) => onDetail(e.target.value)}
            rows={3}
            disabled={disabled}
            className={`${FIELD_CLASS} resize-none leading-relaxed`}
          />
        </div>
      )}
    </div>
  );
}

// ── The page ────────────────────────────────────────────────────────────────

export default function ApplicationSurveyPage({
  onExit,
  onGoHome,
}: {
  onExit: () => void;
  onGoHome: () => void;
}) {
  const [step, setStep] = useState(draftStore.step);
  const [answers, setAnswers] = useState<Record<number, Answer>>(
    draftStore.answers,
  );
  const [done, setDone] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  // Save the draft on every change - so leaving and returning resumes at the same point
  useEffect(() => {
    draftStore.answers = answers;
    draftStore.step = step;
  }, [answers, step]);

  // Moving between steps always starts at the top of the topic
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const current = STEPS[step];

  const setValue = (index: number, value: string) =>
    setAnswers((prev) => ({
      ...prev,
      [index]: { ...prev[index], value },
    }));

  const setDetail = (index: number, detail: string) =>
    setAnswers((prev) => ({
      ...prev,
      [index]: { ...prev[index], detail },
    }));

  /** The step's gate question, if the current topic has one */
  const gate = current.items.find(({ question }) => question.gate);
  const gateAnswer = gate ? answers[gate.index]?.value : undefined;
  /** Marked "No" - the rest of the step's questions are dimmed and not required */
  const stationSkipped = gateAnswer === "No";

  /** Continue only once every required question in the topic is answered */
  const canContinue = stationSkipped
    ? true
    : current.items.every(({ question, index }) =>
        isAnswered(question, answers[index] ?? {}),
      );

  const last = step === STEPS.length - 1;

  const submit = () => {
    draftStore.answers = {};
    draftStore.step = 0;
    setDone(true);
  };

  const leave = () => {
    setExitOpen(false);
    onExit();
  };

  // ── Finish screen ──
  if (done) {
    return (
      <section className="bg-white px-4 sm:px-6 md:px-10 py-6 flex flex-col flex-1">
        <div className="flex-1 w-full max-w-[640px] mx-auto flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4 text-center py-6">
            <IconCircle
              size={72}
              bg="rgba(105,198,0,0.12)"
              color="#69c600"
            >
              <Check size={34} />
            </IconCircle>
            <h3 className="font-bold text-[#122736] text-[24px] tracking-tight">
              Survey completed
              <span className="text-[#69c600]">.</span>
            </h3>
            <p className="text-[#171c23] text-[15px] opacity-60 max-w-[420px] leading-relaxed">
              Thanks for your feedback. It helps us improve the
              Admissions Centre and application day for future
              applicants.
            </p>
          </div>

          {/* Article cards - each step in the process with a short summary and a link */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-[#171c23] text-[18px] text-left">
                Next steps in your application
              </span>
              <span className="text-[#171c23] text-[13px] opacity-60 text-left">
                Short articles on what to expect next.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {NEXT_STEPS.map((step) => (
                <a
                  key={step.title}
                  href="https://www.example.com"
                  target="_blank"
                  rel="noreferrer"
                  className="group bg-white rounded-[10px] border border-[rgba(23,28,35,0.1)] px-4 py-3 flex flex-col gap-1 transition-colors hover:border-[rgba(0,143,240,0.4)]"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#171c23] text-[15px] group-hover:text-[#008ff0]">
                      {step.title}
                    </span>
                    <ChevronRight
                      size={15}
                      className="shrink-0 text-[#171c23] opacity-35 transition-transform group-hover:translate-x-0.5 group-hover:text-[#008ff0] group-hover:opacity-100"
                    />
                  </span>
                  <p className="text-[#171c23] text-[13px] opacity-60 leading-snug text-left">
                    {step.text}
                  </p>
                </a>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <Button onClick={onGoHome}>Back to home</Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white px-4 sm:px-6 md:px-10 flex flex-col flex-1">
      <FormTopBar
        title="Application survey"
        counter={`Step ${step + 1} of ${STEPS.length} · ${current.section}`}
        progress={((step + 1) / STEPS.length) * 100}
        width={640}
        onExit={() => setExitOpen(true)}
      />

      <div className="flex-1 w-full max-w-[640px] mx-auto py-6">
        <div className="flex flex-col gap-6">
          <h3 className="font-bold text-[#122736] text-[24px] tracking-tight text-left">
            {current.section}
            <span className="text-[#69c600]">.</span>
          </h3>

          {/* All of the topic's questions, separated by a thin line */}
          <div className="flex flex-col divide-y divide-[rgba(23,28,35,0.08)]">
            {current.items.map(({ question, index }, i) => (
              <div
                key={index}
                className={i === 0 ? "pb-6" : "py-6 last:pb-0"}
              >
                <QuestionBlock
                  question={question}
                  number={SPEC_NUMBERS[index]}
                  answer={answers[index] ?? {}}
                  disabled={stationSkipped && !question.gate}
                  onValue={(v) => setValue(index, v)}
                  onDetail={(v) => setDetail(index, v)}
                />
              </div>
            ))}
          </div>

          {stationSkipped ? (
            <span className="text-[#171c23] text-[13px] opacity-60 text-left">
              You marked this step as not completed - the other
              questions aren't required, so you can move on.
            </span>
          ) : (
            !canContinue && (
              <span className="text-[#171c23] text-[13px] opacity-60 text-left">
                Answer all required questions in this topic to
                continue. Comment fields are optional.
              </span>
            )
          )}
        </div>
      </div>

      {/* Navigation between topics */}
      <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3.5 bg-white/95 backdrop-blur-md border-t border-[rgba(23,28,35,0.08)] mt-auto">
        <div className="max-w-[640px] mx-auto flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setStep((i) => Math.max(0, i - 1))}
            disabled={step === 0}
          >
            <ChevronLeft size={16} className="shrink-0" />
            Previous step
          </Button>
          {last ? (
            <Button onClick={submit} disabled={!canContinue}>
              <Send size={15} className="shrink-0" />
              Finish and send
            </Button>
          ) : (
            <Button
              onClick={() => setStep((i) => i + 1)}
              disabled={!canContinue}
            >
              Continue
              <ChevronRight size={16} className="shrink-0" />
            </Button>
          )}
        </div>
      </div>

      {exitOpen && (
        <Dialog
          onClose={() => setExitOpen(false)}
          width={420}
          title="Leave the survey?"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setExitOpen(false)}
              >
                Keep going
              </Button>
              <Button variant="primary" onClick={leave}>
                Leave survey
              </Button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <IconCircle size={40}>
              <ClipboardList size={18} />
            </IconCircle>
            <p className="text-[#171c23] text-[14px] leading-relaxed text-left">
              Your answers so far will be saved as a draft, and
              next time you can pick up from the same step.
            </p>
          </div>
        </Dialog>
      )}
    </section>
  );
}
