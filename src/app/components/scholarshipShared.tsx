import { Check, ChevronRight, GraduationCap, Info } from "lucide-react";
import { IconCircle, type ButtonVariant } from "./primitives";
import {
  ExportPdfButton,
  type PdfCell,
} from "./pdfExport";
import { DECLARATIONS } from "./scholarshipData";

/** Parts shared by the survey versions - the intro screen, declarations, finish screen and progress bar */

export function ValidationMessage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p
      role="alert"
      className="flex items-start gap-1.5 text-[#c43c3c] text-[13px] font-semibold text-left"
    >
      <Info size={14} className="shrink-0 mt-0.5" />
      {children}
    </p>
  );
}

export function StepHeading({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-bold text-[#122736] text-[24px] tracking-tight text-left">
        {title}
        <span className="text-[#69c600]">.</span>
      </h3>
      {children}
    </div>
  );
}

export function ProgressSteps({
  labels,
  current,
}: {
  labels: string[];
  current: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const index = i + 1;
        return (
          <div
            key={label}
            className="flex-1 flex flex-col gap-1.5 min-w-0"
          >
            <div
              className={`h-[6px] rounded-full transition-colors ${
                index <= current
                  ? "bg-[#008ff0]"
                  : "bg-[rgba(23,28,35,0.08)]"
              }`}
            />
            <span
              className={`text-[12px] text-left truncate ${
                index === current
                  ? "text-[#008ff0] font-semibold"
                  : "text-[#171c23] opacity-50"
              }`}
            >
              {index}. {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function IntroScreen() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <IconCircle size={72} bg="rgba(0,143,240,0.1)">
          <GraduationCap size={34} />
        </IconCircle>
        <h3 className="font-bold text-[#122736] text-[24px] tracking-tight">
          Olivia, welcome to the scholarship survey
          <span className="text-[#69c600]">.</span>
        </h3>
      </div>

      {/* One sentence per paragraph - easier to read than one long block of text */}
      <div className="flex flex-col gap-3 text-[#171c23] text-[16px] leading-relaxed text-left">
        <p>
          This survey lets you express interest in the Harbourline Scholars
          Program selection and choose the study area and institution you'd like.
        </p>
        <p>
          Rank up to four courses that interest you, and for each
          course rank up to three campuses or institutions where
          you'd like to study.
        </p>
        <p>
          Your first preference should be the course you want
          most, and so on.
        </p>
      </div>

      <a
        href="https://www.example.com"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 text-[#008ff0] text-[14px] font-semibold hover:underline self-start"
      >
        Learn more about the Harbourline Scholars Program
        <ChevronRight size={15} className="shrink-0" />
      </a>

    </div>
  );
}

export function DeclarationsBlock({
  agreed,
  onToggle,
}: {
  agreed: boolean[];
  onToggle: (index: number) => void;
}) {
  return (
    <div className="bg-[#f5f5f7] rounded-[10px] p-5 flex flex-col gap-3">
      <span className="font-semibold text-[#171c23] text-[15px] text-left">
        Declarations
      </span>
      {DECLARATIONS.map((text, i) => (
        <button
          key={text}
          type="button"
          onClick={() => onToggle(i)}
          aria-pressed={agreed[i]}
          className="flex items-start gap-3 text-left"
        >
          <span
            className={`w-5 h-5 rounded-[6px] border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              agreed[i]
                ? "bg-[#008ff0] border-[#008ff0]"
                : "bg-white border-[rgba(23,28,35,0.25)]"
            }`}
          >
            {agreed[i] && <Check size={13} className="text-white" />}
          </span>
          <span className="text-[#171c23] text-[14px] leading-relaxed">
            {text}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Export the answers to PDF ───────────────────────────────────────────────

/** One preference in the survey - a course and the institutions chosen for it, in order */
export interface ScholarshipChoiceSummary {
  name: string;
  cluster?: string;
  institutions: string[];
}

/** One row per institution, under the preference it was chosen for */
export function scholarshipAnswerRows(
  choices: ScholarshipChoiceSummary[],
): PdfCell[][] {
  return choices.flatMap((choice, i) =>
    choice.institutions.map((institution, j) => [
      i + 1,
      choice.name,
      choice.cluster ?? "",
      j + 1,
      institution,
    ]),
  );
}

/**
 * Exports all of the applicant's choices in the scholarship survey to PDF -
 * shared by the three survey versions, on the summary and the confirmation screen.
 */
export function ScholarshipExportButton({
  choices,
  variant = "outline",
  label,
}: {
  choices: ScholarshipChoiceSummary[];
  variant?: ButtonVariant;
  label?: string;
}) {
  return (
    <ExportPdfButton
      questionnaire="Scholarship survey"
      columns={[
        "Preference",
        "Course",
        "Study area",
        "Institution preference",
        "Institution",
      ]}
      rows={scholarshipAnswerRows(choices)}
      countLabel="Rows"
      meta={[["Preferences", choices.length]]}
      variant={variant}
      label={label}
    />
  );
}

export function SuccessScreen({
  choices,
}: {
  /** The choices that were sent - to export to PDF from the confirmation screen */
  choices?: ScholarshipChoiceSummary[];
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-14 text-center">
      <IconCircle size={72} bg="rgba(105,198,0,0.12)" color="#69c600">
        <Check size={34} />
      </IconCircle>
      <h3 className="font-bold text-[#122736] text-[24px] tracking-tight">
        Your preferences have been sent
        <span className="text-[#69c600]">.</span>
      </h3>
      <p className="text-[#171c23] text-[15px] opacity-60 max-w-[380px] leading-relaxed">
        Your choices have been saved and passed on to the Scholars Program
        selection team. Updates on next steps will be sent to Messages in My profile.
      </p>
      {choices && choices.length > 0 && (
        <ScholarshipExportButton
          choices={choices}
          variant="tint"
          label="Export answers to PDF"
        />
      )}
    </div>
  );
}
