import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { Button, SelectField } from "./primitives";
import {
  ALL_TRACKS,
  DECLARATIONS,
  INSTITUTIONS,
  MAX_INSTITUTIONS,
  MAX_TRACKS,
  MIN_TRACKS,
} from "./scholarshipData";
import {
  ScholarshipExportButton,
  DeclarationsBlock,
  IntroScreen,
  ProgressSteps,
  StepHeading,
  SuccessScreen,
  ValidationMessage,
} from "./scholarshipShared";

/**
 * A simplified version of the scholarship survey: instead of panels and tap-to-choose,
 * each preference is one row of dropdowns - a course and its three institutions.
 * The row order is the preference order, so there is no separate ranking step.
 */

type Step = "intro" | 1 | 2 | "success";

const STEP_LABELS = ["Your preferences", "Review and send"];

interface Row {
  key: number;
  trackName: string | null;
  institutions: (string | null)[];
}

const emptyRow = (key: number): Row => ({
  key,
  trackName: null,
  institutions: [null, null, null],
});

/** A dropdown field that can be cleared - SelectField itself can't clear a choice */
function ClearableSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
  onClear,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  options: string[];
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[#171c23] text-[13px] opacity-60">
          {label}
        </span>
        {value && (
          <Button variant="link" onClick={onClear}>
            <X size={13} className="shrink-0" />
            Clear
          </Button>
        )}
      </div>
      <SelectField
        value={value}
        placeholder={placeholder}
        options={options}
        onChange={onChange}
      />
    </div>
  );
}

export default function ScholarshipSurveySimple({
  onExit,
  onGoHome,
}: {
  onExit: () => void;
  onGoHome: () => void;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [rows, setRows] = useState<Row[]>([
    emptyRow(1),
    emptyRow(2),
  ]);
  const [nextKey, setNextKey] = useState(3);
  const [agreed, setAgreed] = useState<boolean[]>(
    DECLARATIONS.map(() => false),
  );
  const [summaryError, setSummaryError] = useState<string | null>(
    null,
  );

  const trackByName = (name: string) =>
    ALL_TRACKS.find((t) => t.name === name);

  const updateRow = (key: number, patch: Partial<Row>) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  };

  const setInstitution = (
    key: number,
    index: number,
    value: string | null,
  ) => {
    setRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? {
              ...r,
              institutions: r.institutions.map((v, i) =>
                i === index ? value : v,
              ),
            }
          : r,
      ),
    );
  };

  const addRow = () => {
    if (rows.length >= MAX_TRACKS) return;
    setRows((prev) => [...prev, emptyRow(nextKey)]);
    setNextKey((k) => k + 1);
  };

  const removeRow = (key: number) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    setRows((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  /** Only the complete rows - a course and at least one institution */
  const filledRows = rows.filter(
    (r) => r.trackName && r.institutions.some(Boolean),
  );

  /** Rows with a course chosen but no institution */
  const partialRows = rows.filter(
    (r) => r.trackName && !r.institutions.some(Boolean),
  );

  /** You can continue only when two preferences are complete and no course is missing an institution */
  const canContinue =
    filledRows.length >= MIN_TRACKS && partialRows.length === 0;

  const allAgreed = agreed.every(Boolean);

  /** The choices as exported to PDF - preference, course and institutions */
  const summaryChoices = filledRows.map((row) => {
    const track = trackByName(row.trackName!);
    return {
      name: track?.name ?? row.trackName!,
      cluster: track?.cluster,
      institutions: row.institutions.filter(Boolean) as string[],
    };
  });

  const submit = () => {
    if (!allAgreed) {
      setSummaryError("To send the survey, please confirm all the declarations");
      return;
    }
    setSummaryError(null);
    setStep("success");
  };

  const showProgress = step === 1 || step === 2;

  return (
    <section className="bg-white px-4 sm:px-6 md:px-10 flex flex-col flex-1">
      {showProgress && (
        <div className="sticky top-[64px] md:top-[98px] z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3 bg-white/90 backdrop-blur-md border-b border-[rgba(23,28,35,0.06)]">
          <div className="max-w-[760px] mx-auto">
            <ProgressSteps
              labels={STEP_LABELS}
              current={step as number}
            />
          </div>
        </div>
      )}

      <div className="flex-1 w-full max-w-[760px] mx-auto py-6">
        {/* ── Intro screen ── */}
        {step === "intro" && <IntroScreen />}

        {/* ── Step 1: preference rows ── */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <StepHeading title="Your preferences">
              <p className="text-[#171c23] text-[14px] leading-relaxed text-left opacity-70">
                Each row is one preference: choose a course and your
                preferred institutions for it. The row order is your
                order of preference - move a row up or down with the
                arrows.
              </p>
              {!canContinue && (
                <span className="text-[#171c23] text-[13px] opacity-60 text-left">
                  {partialRows.length > 0
                    ? "Choose at least one institution for each course you picked to continue."
                    : `To continue to the review, fill in at least ${MIN_TRACKS} preferences - a course and at least one institution in each.`}
                </span>
              )}
            </StepHeading>

            <div className="flex flex-col gap-4">
              {rows.map((row, i) => {
                const track = row.trackName
                  ? trackByName(row.trackName)
                  : undefined;
                const usedTracks = rows
                  .filter((r) => r.key !== row.key)
                  .map((r) => r.trackName)
                  .filter(Boolean) as string[];
                const trackOptions = ALL_TRACKS.filter(
                  (t) => !usedTracks.includes(t.name),
                ).map((t) => t.name);

                return (
                  <div
                    key={row.key}
                    className="bg-white rounded-[10px] border border-[rgba(23,28,35,0.1)] p-4 sm:p-5 flex flex-col gap-4"
                  >
                    {/* Row header: preference number, move arrows and remove */}
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-[#008ff0] text-white font-bold text-[15px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-[#171c23] text-[15px] flex-1 text-left">
                        Preference {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        aria-label="Move up"
                        className="w-7 h-7 rounded-[8px] border border-[rgba(23,28,35,0.12)] flex items-center justify-center text-[#171c23] disabled:opacity-30 hover:border-[rgba(0,143,240,0.35)]"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(i, 1)}
                        disabled={i === rows.length - 1}
                        aria-label="Move down"
                        className="w-7 h-7 rounded-[8px] border border-[rgba(23,28,35,0.12)] flex items-center justify-center text-[#171c23] disabled:opacity-30 hover:border-[rgba(0,143,240,0.35)]"
                      >
                        <ChevronDown size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        disabled={rows.length <= 1}
                        aria-label={`Remove preference ${i + 1}`}
                        className="w-7 h-7 rounded-[8px] border border-[rgba(23,28,35,0.12)] flex items-center justify-center text-[#c43c3c] disabled:opacity-30 hover:border-[rgba(196,60,60,0.4)]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Course choice */}
                    <ClearableSelect
                      label="Course"
                      value={row.trackName}
                      placeholder="Choose a course"
                      options={trackOptions}
                      onChange={(v) =>
                        updateRow(row.key, { trackName: v })
                      }
                      onClear={() =>
                        updateRow(row.key, {
                          trackName: null,
                          institutions: [null, null, null],
                        })
                      }
                    />

                    {track && (
                      <>
                        {/* A short course overview - opens only on demand */}
                        <details className="bg-[#f5f5f7] rounded-[10px] px-4 py-3">
                          <summary className="cursor-pointer text-[#171c23] text-[13px] font-semibold text-left marker:content-['']">
                            <span className="flex items-center justify-between gap-2">
                              About the course ({track.cluster})
                              <ChevronDown
                                size={15}
                                className="opacity-60 shrink-0"
                              />
                            </span>
                          </summary>
                          <p className="text-[#171c23] text-[13px] leading-relaxed text-left mt-2">
                            {track.about}
                          </p>
                        </details>

                        {/* The three institutions in order of preference */}
                        <div className="flex flex-col gap-3">
                          <span className="font-semibold text-[#171c23] text-[14px] text-left">
                            Institutions by preference
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {Array.from({
                              length: MAX_INSTITUTIONS,
                            }).map((_, j) => {
                              const used = row.institutions.filter(
                                (v, k) => k !== j && v,
                              ) as string[];
                              return (
                                <ClearableSelect
                                  key={j}
                                  label={`Preference ${j + 1}${j === 0 ? "" : " (optional)"}`}
                                  value={row.institutions[j]}
                                  placeholder="Choose an institution"
                                  options={INSTITUTIONS.filter(
                                    (n) => !used.includes(n),
                                  )}
                                  onChange={(v) =>
                                    setInstitution(row.key, j, v)
                                  }
                                  onClear={() =>
                                    setInstitution(row.key, j, null)
                                  }
                                />
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="justify-center"
                onClick={addRow}
                disabled={rows.length >= MAX_TRACKS}
              >
                <Plus size={15} className="shrink-0" />
                Add preference
              </Button>
              <span className="text-[#171c23] text-[13px] opacity-60 text-left">
                {rows.length >= MAX_TRACKS
                  ? `You've chosen all ${MAX_TRACKS} preferences`
                  : `${rows.length} of ${MAX_TRACKS} preferences added`}
              </span>
            </div>
          </div>
        )}

        {/* ── Step 2: review and send ── */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <StepHeading title="Review and send">
              <p className="text-[#171c23] text-[14px] leading-relaxed text-left opacity-70">
                Here are your choices in order of preference. It's
                worth a final check - once sent, you won't be able
                to change your choices in this survey.
              </p>
            </StepHeading>

            {/* Export all the answers to a PDF */}
            <div className="flex">
              <ScholarshipExportButton choices={summaryChoices} />
            </div>

            {/* Table view - each course with its chosen institutions */}
            <div className="rounded-[10px] border border-[rgba(23,28,35,0.1)] overflow-hidden">
              <div className="hidden sm:grid grid-cols-[48px_1fr_1.2fr] bg-[#f5f5f7] text-[#171c23] text-[13px] font-semibold">
                <span className="px-3 py-2.5">#</span>
                <span className="px-3 py-2.5">Course</span>
                <span className="px-3 py-2.5">
                  Institutions by preference
                </span>
              </div>
              {filledRows.map((row, i) => {
                const track = trackByName(row.trackName!)!;
                const institutions = row.institutions.filter(
                  Boolean,
                ) as string[];
                return (
                  <div
                    key={row.key}
                    className="grid grid-cols-1 sm:grid-cols-[48px_1fr_1.2fr] border-t border-[rgba(23,28,35,0.08)]"
                  >
                    <div className="px-3 pt-3 sm:py-3 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#008ff0] text-white text-[12px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="sm:hidden font-semibold text-[#171c23] text-[14px]">
                        {track.name}
                      </span>
                    </div>
                    <div className="hidden sm:flex px-3 py-3 flex-col items-start">
                      <span className="font-semibold text-[#171c23] text-[14px]">
                        {track.name}
                      </span>
                      <span className="text-[#171c23] text-[12px] opacity-50">
                        {track.cluster}
                      </span>
                    </div>
                    <ol className="px-3 pb-3 pt-2 sm:py-3 flex flex-col gap-1.5">
                      {institutions.map((name, j) => (
                        <li
                          key={name}
                          className="flex items-center gap-2 text-[#171c23] text-[13px]"
                        >
                          <span className="w-5 h-5 rounded-full bg-[rgba(0,143,240,0.12)] text-[#008ff0] text-[11px] font-bold flex items-center justify-center shrink-0">
                            {j + 1}
                          </span>
                          {name}
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>

            <DeclarationsBlock
              agreed={agreed}
              onToggle={(i) => {
                setAgreed((prev) =>
                  prev.map((v, j) => (j === i ? !v : v)),
                );
                setSummaryError(null);
              }}
            />

            {summaryError && (
              <ValidationMessage>{summaryError}</ValidationMessage>
            )}
          </div>
        )}

        {/* ── Sent confirmation screen ── */}
        {step === "success" && (
          <SuccessScreen choices={summaryChoices} />
        )}
      </div>

      {/* Bottom navigation bar */}
      <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3.5 bg-white/95 backdrop-blur-md border-t border-[rgba(23,28,35,0.08)] mt-auto">
        <div className="max-w-[760px] mx-auto flex items-center justify-between gap-3">
          {step === "intro" && (
            <>
              <Button variant="outline" onClick={onExit}>
                Back to tasks
              </Button>
              <Button onClick={() => setStep(1)}>Let's start</Button>
            </>
          )}

          {step === 1 && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep("intro")}
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!canContinue}
              >
                Continue to review
                <ChevronRight size={16} className="shrink-0" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={submit} disabled={!allAgreed}>
                <Send size={15} className="shrink-0" />
                Send
              </Button>
            </>
          )}

          {step === "success" && (
            <div className="w-full flex justify-center">
              <Button onClick={onGoHome}>Go to home</Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
