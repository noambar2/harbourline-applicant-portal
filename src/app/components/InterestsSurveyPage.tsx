import {
  Button,
  IconCircle,
  FieldLabel as SharedFieldLabel,
  FormTopBar,
  SelectField,
  FIELD_CLASS,
} from "./primitives";
import { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  Check,
  Send,
} from "lucide-react";

// ── Options ─────────────────────────────────────────────────────────────────

const HOBBY_OPTIONS = [
  "Photography",
  "Sport",
  "Music",
  "Reading",
  "Cooking",
  "Gaming",
  "Other",
];

const EXPERIENCE_OPTIONS = [
  "Under 1 year",
  "1-3",
  "3-5",
  "5 or more",
];

const DOMAIN_OPTIONS = [
  "Office",
  "Graphic design",
  "Coding",
  "Video editing",
  "Social media",
];

type YesNo = "Yes" | "No";

// ── Form primitives ──────────────────────────────────────────────────────────

/** Every field in the survey is required - a thin wrapper over the shared components */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <SharedFieldLabel required>{children}</SharedFieldLabel>;
}

function YesNoRadio({
  value,
  onChange,
}: {
  value: YesNo | null;
  onChange: (value: YesNo) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {(["Yes", "No"] as YesNo[]).map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
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
            <span className="text-[#171c23] text-[15px]">
              {option}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ControlScale({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2.5">
        {[1, 2, 3, 4, 5].map((level) => {
          const selected = value === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              className={`flex-1 h-[52px] rounded-[10px] text-[18px] font-semibold border transition-colors ${
                selected
                  ? "bg-[rgba(0,143,240,0.06)] border-[#008ff0] text-[#008ff0]"
                  : "bg-white border-[rgba(23,28,35,0.12)] text-[#171c23] hover:bg-[rgba(0,143,240,0.06)]"
              }`}
            >
              {level}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[13px] text-[#171c23] opacity-60">
        <span>Beginner</span>
        <span>Advanced</span>
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button variant="outline" type="button" onClick={onClick}>
      {children}
    </Button>
  );
}

// ── Steps content ────────────────────────────────────────────────────────────

const TOTAL_QUESTION_STEPS = 2;

function IntroContent() {
  return (
    <div className="flex flex-col">
      <h3 className="font-bold text-[#122736] text-[24px] tracking-tight text-left mb-4">
        Hi Olivia! Welcome to the interests survey
        <span className="text-[#69c600]">.</span>
      </h3>
      <div className="text-left text-[#171c23] text-[15px] leading-relaxed flex flex-col gap-3">
        <p>
          In this survey you'll be asked to describe yourself and
          some areas of your life. It helps our admissions team
          point you towards courses, clubs and opportunities that
          suit your skills and interests as closely as possible.
        </p>
        <p>
          The survey is personal and covers only you. Everything
          you share is kept confidential and used only by the
          admissions team at Harbourline University.
        </p>
        <p>
          There are no "right" or "wrong" answers. Please answer
          honestly, as this helps the university match you with
          the options that suit you best.
        </p>
        <p>
          Most questions are multiple choice and appear in one of
          these formats:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>Choosing an answer from several options</li>
          <li>Choosing from a list</li>
        </ul>
        <p className="font-semibold">Please note:</p>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>
            Some questions take a single answer and some take more
            than one
          </li>
          <li>Multiple-choice questions will say so</li>
          <li>
            Sometimes an "Other" option appears with space to type
            your own answer
          </li>
        </ul>
        <p>
          You can go back to change your answers, and move on to
          the next screen using the buttons below.
        </p>
        <p>
          Thanks for taking part - we wish you a great start to
          your studies.
        </p>
      </div>
    </div>
  );
}

function SuccessContent() {
  return (
    <div className="flex flex-col items-center gap-4 py-14 text-center">
      <IconCircle size={64} bg="rgba(105,198,0,0.12)" color="#69c600">
        <Check size={30} />
      </IconCircle>
      <h3 className="font-bold text-[#122736] text-[24px] tracking-tight">
        Survey submitted
        <span className="text-[#69c600]">.</span>
      </h3>
      <p className="text-[#171c23] text-[15px] opacity-60 max-w-[340px]">
        Thanks for taking part! Your answers have been saved and
        passed on to the admissions team
      </p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type Step = "intro" | 1 | 2 | "success";

export default function InterestsSurveyPage({
  onExit,
}: {
  onExit: () => void;
}) {
  const [step, setStep] = useState<Step>("intro");

  // Step 1 answers
  const [hobby, setHobby] = useState<string | null>(null);
  const [experience, setExperience] = useState<string | null>(
    null,
  );
  const [wasCounselor, setWasCounselor] = useState<YesNo | null>(
    null,
  );
  const [counselorYears, setCounselorYears] = useState("");

  // Step 2 answers
  const [volunteered, setVolunteered] = useState<YesNo | null>(
    null,
  );
  const [domain, setDomain] = useState<string | null>(null);
  const [controlLevel, setControlLevel] = useState<number | null>(
    null,
  );

  const step1Valid =
    hobby !== null &&
    experience !== null &&
    wasCounselor !== null &&
    (wasCounselor === "No" || counselorYears.trim() !== "");

  const step2Valid =
    volunteered !== null &&
    domain !== null &&
    controlLevel !== null;

  const showProgress = step === 1 || step === 2;

  return (
    // The section stretches (flex-1) to the bottom of the page, so the sticky nav buttons always sit at the bottom of the screen
    <section className="bg-white px-4 sm:px-6 md:px-10 flex flex-col flex-1">
      <FormTopBar
        title="Interests survey"
        counter={
          showProgress
            ? `Step ${step} of ${TOTAL_QUESTION_STEPS}`
            : undefined
        }
        progress={
          showProgress
            ? ((step as number) / TOTAL_QUESTION_STEPS) * 100
            : undefined
        }
        width={640}
        onExit={onExit}
      />

      {/* Scrollable content */}
      <div className="flex-1 w-full max-w-[640px] mx-auto py-6">
        {step === "intro" && <IntroContent />}

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <h3 className="font-bold text-[#122736] text-[24px] tracking-tight text-left">
              Free time and interests
              <span className="text-[#69c600]">.</span>
            </h3>

            <div>
              <FieldLabel>
                What do you like to do in your free time?
              </FieldLabel>
              <SelectField
                value={hobby}
                placeholder="Choose an interest"
                options={HOBBY_OPTIONS}
                onChange={(value) => {
                  setHobby(value);
                  setExperience(null);
                }}
              />
            </div>

            {hobby && (
              <div>
                <FieldLabel>
                  Years of experience in{" "}
                  {hobby === "Other" ? "this interest" : hobby.toLowerCase()}
                </FieldLabel>
                <SelectField
                  value={experience}
                  placeholder="Choose a range"
                  options={EXPERIENCE_OPTIONS}
                  onChange={setExperience}
                />
              </div>
            )}

            <div>
              <FieldLabel>
                Have you been a youth group leader or coach for a year or more?
              </FieldLabel>
              <YesNoRadio
                value={wasCounselor}
                onChange={(value) => {
                  setWasCounselor(value);
                  if (value === "No") setCounselorYears("");
                }}
              />
            </div>

            {wasCounselor === "Yes" && (
              <div>
                <FieldLabel>Number of years</FieldLabel>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={counselorYears}
                  onChange={(e) =>
                    setCounselorYears(e.target.value)
                  }
                  placeholder="Enter number of years"
                  className={FIELD_CLASS}
                />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <h3 className="font-bold text-[#122736] text-[24px] tracking-tight text-left">
              Free time and interests
              <span className="text-[#69c600]">.</span>
            </h3>

            <div>
              <FieldLabel>
                Have you volunteered or held a role in your community?
              </FieldLabel>
              <YesNoRadio
                value={volunteered}
                onChange={setVolunteered}
              />
            </div>

            <div>
              <FieldLabel>
                Choose a skill you have and rate your level
              </FieldLabel>
              <SelectField
                value={domain}
                placeholder="Choose a skill"
                options={DOMAIN_OPTIONS}
                onChange={(value) => {
                  setDomain(value);
                  setControlLevel(null);
                }}
              />
            </div>

            {domain && (
              <div>
                <FieldLabel>{domain}</FieldLabel>
                <ControlScale
                  value={controlLevel}
                  onChange={setControlLevel}
                />
              </div>
            )}
          </div>
        )}

        {step === "success" && <SuccessContent />}
      </div>

      {/* Sticky footer - the nav buttons are always visible at the bottom */}
      <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3.5 bg-white/95 backdrop-blur-md border-t border-[rgba(23,28,35,0.08)] mt-auto">
        <div className="max-w-[640px] mx-auto flex items-center justify-between gap-3">
          {step === "intro" && (
            <>
              <SecondaryButton onClick={onExit}>
                Back to tasks
              </SecondaryButton>
              <PrimaryButton onClick={() => setStep(1)}>
                Continue
              </PrimaryButton>
            </>
          )}

          {step === 1 && (
            <>
              <SecondaryButton onClick={() => setStep("intro")}>
                Back
              </SecondaryButton>
              <PrimaryButton
                onClick={() => setStep(2)}
                disabled={!step1Valid}
              >
                Next
              </PrimaryButton>
            </>
          )}

          {step === 2 && (
            <>
              <SecondaryButton onClick={() => setStep(1)}>
                Back
              </SecondaryButton>
              <PrimaryButton
                onClick={() => setStep("success")}
                disabled={!step2Valid}
              >
                <Send size={15} className="shrink-0" />
                Submit survey
              </PrimaryButton>
            </>
          )}

          {step === "success" && (
            <div className="w-full flex justify-center">
              <PrimaryButton onClick={onExit}>
                Back to tasks
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
