import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Check,
  GraduationCap,
  Info,
  RotateCcw,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {
  Button,
  IconCircle,
  FIELD_CLASS,
} from "./primitives";
import {
  ALL_TRACKS,
  CLUSTERS,
  Choice,
  DECLARATIONS,
  INSTITUTIONS,
  MAX_INSTITUTIONS,
  MAX_TRACKS,
  MIN_TRACKS,
  Track,
} from "./scholarshipData";


// ── Shared bits ─────────────────────────────────────────────────────────────

function ValidationMessage({ children }: { children: React.ReactNode }) {
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

function StepHeading({
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

// ── Step 1: tracks + institutions ───────────────────────────────────────────

/** An institution card - tapping it adds it to the preference order */
function InstitutionButton({
  name,
  rank,
  disabled,
  onClick,
}: {
  name: string;
  rank: number | null;
  /** The maximum number of institutions is already chosen and this one isn't among them */
  disabled: boolean;
  onClick: () => void;
}) {
  const selected = rank !== null;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      title={selected ? "Tap again to remove this institution" : undefined}
      className={`flex items-center justify-between gap-2 rounded-[10px] border px-4 py-3 text-left transition-colors ${
        selected
          ? "border-[#008ff0] bg-[rgba(0,143,240,0.06)]"
          : disabled
            ? "border-[rgba(23,28,35,0.1)] bg-white opacity-40 cursor-not-allowed"
            : "border-[rgba(23,28,35,0.12)] bg-white hover:border-[rgba(0,143,240,0.35)]"
      }`}
    >
      <span
        className={`text-[14px] min-w-0 ${selected ? "font-semibold text-[#171c23]" : "text-[#171c23]"}`}
      >
        {name}
      </span>
      {selected && (
        <span className="w-6 h-6 rounded-full bg-[#008ff0] text-white text-[13px] font-bold flex items-center justify-center shrink-0">
          {rank}
        </span>
      )}
    </button>
  );
}

function TrackPanel({
  track,
  draft,
  added,
  tracksFull,
  error,
  onToggleInstitution,
  onReset,
  onAdd,
  onRemove,
  onClose,
}: {
  track: Track;
  draft: string[];
  added: boolean;
  /** The maximum number of courses is already chosen, so no more can be added */
  tracksFull: boolean;
  error: string | null;
  onToggleInstitution: (name: string) => void;
  onReset: () => void;
  onAdd: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const institutionsFull = draft.length >= MAX_INSTITUTIONS;
  return (
    <div className="bg-white rounded-[10px] border border-[rgba(0,143,240,0.25)] flex flex-col">
      {/* Course title + its study area */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="flex flex-col items-start min-w-0">
          <h4 className="font-bold text-[#171c23] text-[18px] text-left">
            {track.name}
          </h4>
          <span className="text-[#171c23] text-[13px] opacity-50">
            {track.cluster}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-8 h-8 flex items-center justify-center text-[#171c23] opacity-50 hover:opacity-100 shrink-0 -mt-1"
        >
          <X size={18} />
        </button>
      </div>

      {/* Course overview - the heading is fixed, the content changes */}
      <div className="px-5 pt-4 flex flex-col gap-1.5">
        <span className="text-[#171c23] text-[13px] opacity-50">
          About the course
        </span>
        <p className="text-[#171c23] text-[14px] leading-relaxed text-left">
          {track.about}
        </p>
      </div>

      {/* Choose institutions by preference */}
      <div className="px-5 pt-5 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-[#171c23] text-[15px] text-left">
            Choose institutions by preference
          </span>
          <p className="text-[#171c23] text-[13px] opacity-60 text-left leading-relaxed">
            The order you tap is your order of preference. Tap a
            chosen institution again to remove it - numbers update automatically.
          </p>
          <div className="flex items-center justify-between gap-3 mt-1">
            <span className="text-[#171c23] text-[13px] font-semibold">
              {draft.length === 0
                ? `You can choose up to ${MAX_INSTITUTIONS} institutions`
                : `${draft.length} of ${MAX_INSTITUTIONS} institutions chosen`}
            </span>
            {draft.length > 0 && (
              <Button variant="link" onClick={onReset}>
                <RotateCcw size={13} className="shrink-0" />
                Reset
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {INSTITUTIONS.map((name) => (
            <InstitutionButton
              key={name}
              name={name}
              rank={
                draft.indexOf(name) >= 0
                  ? draft.indexOf(name) + 1
                  : null
              }
              disabled={
                institutionsFull && !draft.includes(name)
              }
              onClick={() => onToggleInstitution(name)}
            />
          ))}
        </div>

        {institutionsFull && (
          <p className="text-[#171c23] text-[13px] opacity-60 text-left">
            You've chosen all {MAX_INSTITUTIONS} institutions. To swap one,
            tap one of your chosen institutions again.
          </p>
        )}
      </div>

      {/* Add / remove the course */}
      <div className="px-5 py-5 mt-4 border-t border-[rgba(23,28,35,0.06)] flex flex-col gap-2">
        {error && <ValidationMessage>{error}</ValidationMessage>}
        {added ? (
          <Button variant="outline" onClick={onRemove}>
            <Trash2 size={15} className="shrink-0" />
            Remove course
          </Button>
        ) : (
          <>
            <Button onClick={onAdd} disabled={tracksFull}>
              Add course
            </Button>
            {tracksFull && (
              <p className="text-[#171c23] text-[13px] opacity-60 text-left">
                You've chosen all {MAX_TRACKS} courses. To add this
                course, first remove one of the courses you chose.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** A sticky strip that always shows the courses chosen so far, with their institutions */
function SelectedTray({
  items,
  onRemove,
  onOpen,
}: {
  items: { track: Track; institutions: string[] }[];
  onRemove: (trackId: string) => void;
  onOpen: (trackId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[#171c23] text-[13px] font-semibold text-left">
        Your courses ({items.length}/{MAX_TRACKS})
      </span>
      {items.length === 0 ? (
        <p className="text-[#171c23] text-[13px] opacity-50 text-left">
          No courses chosen yet. Open a course from the list, choose
          institutions and tap "Add course".
        </p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {items.map(({ track, institutions }, i) => (
            <div
              key={track.id}
              className="shrink-0 max-w-[240px] bg-[rgba(0,143,240,0.06)] border border-[rgba(0,143,240,0.25)] rounded-[10px] ps-2 pe-3 py-2 flex items-center gap-2"
            >
              <span className="w-6 h-6 rounded-full bg-[#008ff0] text-white text-[12px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <button
                type="button"
                onClick={() => onOpen(track.id)}
                className="flex flex-col items-start min-w-0 text-left"
              >
                <span className="font-semibold text-[#171c23] text-[13px] truncate max-w-full">
                  {track.name}
                </span>
                <span className="text-[#171c23] text-[12px] opacity-55 truncate max-w-full">
                  {institutions.join(" · ")}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onRemove(track.id)}
                aria-label={`Remove ${track.name}`}
                className="w-6 h-6 flex items-center justify-center rounded-full text-[#171c23] opacity-45 hover:opacity-100 hover:text-[#c43c3c] shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

type Step = "intro" | 1 | 2 | 3 | "success";

const STEP_LABELS = [
  "Choose courses",
  "Rank preferences",
  "Review and send",
];

function ProgressSteps({ current }: { current: number }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => {
          const index = i + 1;
          const done = index < current;
          const active = index === current;
          return (
            <div
              key={label}
              className="flex-1 flex flex-col gap-1.5 min-w-0"
            >
              <div
                className={`h-[6px] rounded-full transition-colors ${
                  done || active
                    ? "bg-[#008ff0]"
                    : "bg-[rgba(23,28,35,0.08)]"
                }`}
              />
              <span
                className={`text-[12px] text-left truncate ${
                  active
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
    </div>
  );
}

export default function ScholarshipSurveyDetailed({
  onExit,
  onGoHome,
}: {
  onExit: () => void;
  onGoHome: () => void;
}) {
  const [step, setStep] = useState<Step>("intro");

  // ── Step 1 ──
  const [openTrackId, setOpenTrackId] = useState<string | null>(
    null,
  );
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [choices, setChoices] = useState<Choice[]>([]);
  const [query, setQuery] = useState("");
  const [openClusters, setOpenClusters] = useState<string[]>([
    CLUSTERS[0].name,
  ]);
  const [panelError, setPanelError] = useState<string | null>(null);

  // ── Step 3 ──
  const [agreed, setAgreed] = useState<boolean[]>(
    DECLARATIONS.map(() => false),
  );
  const [summaryError, setSummaryError] = useState<string | null>(
    null,
  );

  const openTrack = ALL_TRACKS.find((t) => t.id === openTrackId);
  const chosenIds = choices.map((c) => c.trackId);
  const searching = query.trim() !== "";

  /** Search filter - autocomplete on the course name */
  const visibleClusters = useMemo(() => {
    if (!searching) return CLUSTERS;
    const q = query.trim().toLowerCase();
    return CLUSTERS.map((c) => ({
      ...c,
      tracks: c.tracks.filter((t) => t.name.toLowerCase().includes(q)),
    })).filter((c) => c.tracks.length > 0);
  }, [query, searching]);

  const noResults = searching && visibleClusters.length === 0;

  const trackDraft = (id: string) => draft[id] ?? [];

  /** Tapping an institution adds it to the end of the order; tapping again removes it and the numbers update */
  const toggleInstitution = (trackId: string, name: string) => {
    setPanelError(null);
    const current = trackDraft(trackId);
    if (current.includes(name)) {
      setDraft((prev) => ({
        ...prev,
        [trackId]: current.filter((n) => n !== name),
      }));
      return;
    }
    if (current.length >= MAX_INSTITUTIONS) return; // the buttons are dimmed anyway
    setDraft((prev) => ({
      ...prev,
      [trackId]: [...current, name],
    }));
  };

  const addTrack = (track: Track) => {
    const institutions = trackDraft(track.id);
    if (institutions.length === 0) {
      setPanelError(
        "To add a course, choose at least one institution where you'd like to study",
      );
      return;
    }
    if (choices.length >= MAX_TRACKS) return; // the button is disabled anyway
    setPanelError(null);
    setChoices((prev) => [
      ...prev,
      { trackId: track.id, institutions },
    ]);
  };

  const removeTrack = (trackId: string) => {
    setChoices((prev) => prev.filter((c) => c.trackId !== trackId));
    setPanelError(null);
  };

  /** You can continue only after choosing at least two courses */
  const canContinue = choices.length >= MIN_TRACKS;

  const goToStep2 = () => {
    setOpenTrackId(null);
    setStep(2);
  };

  /** Move a course in the ranking - up or down the list */
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= choices.length) return;
    setChoices((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const allAgreed = agreed.every(Boolean);

  const submit = () => {
    if (!allAgreed) {
      setSummaryError(
        "To send the survey, please confirm all the declarations",
      );
      return;
    }
    setSummaryError(null);
    setStep("success");
  };

  const trackById = (id: string) =>
    ALL_TRACKS.find((t) => t.id === id)!;

  const showProgress = step === 1 || step === 2 || step === 3;

  return (
    <section className="bg-white px-4 sm:px-6 md:px-10 flex flex-col flex-1">

      {/* Progress bar - shown only inside the survey steps */}
      {showProgress && (
        <div className="sticky top-[64px] md:top-[98px] z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3 bg-white/90 backdrop-blur-md border-b border-[rgba(23,28,35,0.06)]">
          <div className="max-w-[760px] mx-auto">
            <ProgressSteps current={step as number} />
          </div>
        </div>
      )}

      <div className="flex-1 w-full max-w-[760px] mx-auto py-6">
        {/* ── Intro screen ── */}
        {step === "intro" && (
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
                This survey lets you express interest in the Harbourline
                Scholars Program selection and choose the study area
                and institution you'd like.
              </p>
              <p>
                Rank up to four courses that interest you, and for
                each course rank up to three campuses or
                institutions where you'd like to study.
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

            <div className="bg-[#f5f5f7] rounded-[10px] p-5 flex flex-col gap-3">
              <span className="font-semibold text-[#171c23] text-[15px]">
                Survey steps
              </span>
              <ol className="flex flex-col gap-2.5">
                {STEP_LABELS.map((label, i) => (
                  <li
                    key={label}
                    className="flex items-center gap-3 text-[#171c23] text-[14px]"
                  >
                    <span className="w-7 h-7 rounded-full bg-white text-[#008ff0] font-bold text-[13px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {label}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* ── Step 1: choose courses and institutions ── */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <StepHeading title="Choose courses and institutions">
              <p className="text-[#171c23] text-[14px] leading-relaxed text-left opacity-70">
                To move to the next step, choose your courses. You
                can choose up to {MAX_TRACKS} courses.
              </p>
              {!canContinue && (
                <span className="text-[#171c23] text-[13px] opacity-60 text-left">
                  To continue to the next step, choose at least {MIN_TRACKS}{" "}
                  courses.
                </span>
              )}
            </StepHeading>

            {/* Course search */}
            <div className="flex flex-col gap-2">
              <div className="bg-white border border-[rgba(23,28,35,0.12)] rounded-full h-10 px-4 flex items-center gap-2">
                <Search
                  size={15}
                  className="text-[#171c23] opacity-40 shrink-0"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search courses"
                  className="flex-1 bg-transparent outline-none text-[14px] text-[#171c23] placeholder:opacity-40"
                />
                {searching && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-[rgba(23,28,35,0.08)] text-[#171c23] opacity-60 hover:opacity-100 shrink-0"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              {noResults && (
                <p className="text-[#171c23] text-[13px] opacity-60 text-left">
                  No results found for "{query.trim()}"
                </p>
              )}
            </div>

            {/* The list of study areas and courses */}
            <div className="flex flex-col gap-3">
              {visibleClusters.map((cluster) => {
                const open =
                  searching ||
                  openClusters.includes(cluster.name);
                return (
                  <div
                    key={cluster.name}
                    className="bg-white rounded-[10px] border border-[rgba(23,28,35,0.1)] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenClusters((prev) =>
                          prev.includes(cluster.name)
                            ? prev.filter((c) => c !== cluster.name)
                            : [...prev, cluster.name],
                        )
                      }
                      aria-expanded={open}
                      className="w-full h-[52px] px-4 flex items-center justify-between gap-2"
                    >
                      <span className="font-semibold text-[#171c23] text-[15px]">
                        {cluster.name}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`text-[#171c23] opacity-60 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                      />
                    </button>

                    {open && (
                      <div className="border-t border-[rgba(23,28,35,0.06)] flex flex-col">
                        {cluster.tracks.map((t) => {
                          const track = { ...t, cluster: cluster.name };
                          const chosen = chosenIds.includes(track.id);
                          const isOpen = openTrackId === track.id;
                          return (
                            <div key={track.id}>
                              <div
                                className={`flex items-center justify-between gap-2 px-4 h-[46px] ${isOpen ? "bg-[rgba(0,143,240,0.06)]" : ""}`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPanelError(null);
                                    setOpenTrackId(
                                      isOpen ? null : track.id,
                                    );
                                  }}
                                  className="flex items-center gap-2 min-w-0 flex-1 text-left"
                                >
                                  {chosen && (
                                    <Check
                                      size={15}
                                      className="text-[#4e9400] shrink-0"
                                    />
                                  )}
                                  <span
                                    className={`text-[14px] truncate ${chosen ? "font-semibold text-[#171c23]" : "text-[#171c23]"}`}
                                  >
                                    {track.name}
                                  </span>
                                </button>
                                {chosen && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeTrack(track.id)
                                    }
                                    aria-label={`Remove ${track.name}`}
                                    className="w-7 h-7 flex items-center justify-center text-[#c43c3c] opacity-70 hover:opacity-100 shrink-0"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>

                              {isOpen && (
                                <div className="px-3 pb-3">
                                  <TrackPanel
                                    track={track}
                                    draft={trackDraft(track.id)}
                                    added={chosen}
                                    tracksFull={
                                      choices.length >= MAX_TRACKS
                                    }
                                    error={panelError}
                                    onToggleInstitution={(name) =>
                                      toggleInstitution(
                                        track.id,
                                        name,
                                      )
                                    }
                                    onReset={() => {
                                      setDraft((prev) => ({
                                        ...prev,
                                        [track.id]: [],
                                      }));
                                      setPanelError(null);
                                    }}
                                    onAdd={() => addTrack(track)}
                                    onRemove={() =>
                                      removeTrack(track.id)
                                    }
                                    onClose={() =>
                                      setOpenTrackId(null)
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 2: rank the courses ── */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <StepHeading title="Rank your courses by preference">
              <p className="text-[#171c23] text-[14px] leading-relaxed text-left opacity-70">
                Of the {choices.length} courses you chose, rank them
                by how much you want each one. When you're done,
                tap Continue.
              </p>
            </StepHeading>

            <ol className="flex flex-col gap-3">
              {choices.map((choice, i) => {
                const track = trackById(choice.trackId);
                return (
                  <li
                    key={choice.trackId}
                    className="bg-white rounded-[10px] border border-[rgba(23,28,35,0.1)] p-4 flex items-center gap-3"
                  >
                    <span className="w-8 h-8 rounded-full bg-[#008ff0] text-white font-bold text-[15px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className="font-semibold text-[#171c23] text-[15px]">
                        {track.name}
                      </span>
                      <span className="text-[#171c23] text-[13px] opacity-50 truncate max-w-full">
                        {choice.institutions.join(" · ")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
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
                        disabled={i === choices.length - 1}
                        aria-label="Move down"
                        className="w-7 h-7 rounded-[8px] border border-[rgba(23,28,35,0.12)] flex items-center justify-center text-[#171c23] disabled:opacity-30 hover:border-[rgba(0,143,240,0.35)]"
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="text-[#171c23] text-[13px] opacity-50 text-left">
              1 = the course you want most, and the last number =
              the least.
            </p>
          </div>
        )}

        {/* ── Step 3: review and send ── */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <StepHeading title="Review and send">
              <p className="text-[#171c23] text-[14px] leading-relaxed text-left opacity-70">
                Here are your choices in order of preference. It's
                worth a final check - once sent, you won't be
                able to change your choices in this survey.
              </p>
            </StepHeading>

            <div className="flex flex-col gap-3">
              {choices.map((choice, i) => {
                const track = trackById(choice.trackId);
                return (
                  <div
                    key={choice.trackId}
                    className="bg-white rounded-[10px] border border-[rgba(23,28,35,0.1)] p-5 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-[#008ff0] text-white font-bold text-[15px] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex flex-col items-start min-w-0">
                        <span className="font-bold text-[#171c23] text-[16px]">
                          {track.name}
                        </span>
                        <span className="text-[#171c23] text-[13px] opacity-50">
                          {track.cluster}
                        </span>
                      </div>
                    </div>
                    <ol className="flex flex-col gap-2 ps-11">
                      {choice.institutions.map((name, j) => (
                        <li
                          key={name}
                          className="flex items-center gap-2.5 text-[#171c23] text-[14px]"
                        >
                          <span className="w-5 h-5 rounded-full bg-[rgba(0,143,240,0.12)] text-[#008ff0] text-[12px] font-bold flex items-center justify-center shrink-0">
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

            {/* Declarations */}
            <div className="bg-[#f5f5f7] rounded-[10px] p-5 flex flex-col gap-3">
              <span className="font-semibold text-[#171c23] text-[15px] text-left">
                Declarations
              </span>
              {DECLARATIONS.map((text, i) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => {
                    setAgreed((prev) =>
                      prev.map((v, j) => (j === i ? !v : v)),
                    );
                    setSummaryError(null);
                  }}
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
                    {agreed[i] && (
                      <Check size={13} className="text-white" />
                    )}
                  </span>
                  <span className="text-[#171c23] text-[14px] leading-relaxed">
                    {text}
                  </span>
                </button>
              ))}
            </div>

            {summaryError && (
              <ValidationMessage>{summaryError}</ValidationMessage>
            )}
          </div>
        )}

        {/* ── Sent confirmation screen ── */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-14 text-center">
            <IconCircle
              size={72}
              bg="rgba(105,198,0,0.12)"
              color="#69c600"
            >
              <Check size={34} />
            </IconCircle>
            <h3 className="font-bold text-[#122736] text-[24px] tracking-tight">
              Your preferences have been sent
              <span className="text-[#69c600]">.</span>
            </h3>
            <p className="text-[#171c23] text-[15px] opacity-60 max-w-[380px] leading-relaxed">
              Your choices have been saved and passed on to the
              Scholars Program selection team. Updates on next steps
              will be sent to Messages in My profile.
            </p>
          </div>
        )}
      </div>

      {/* Bottom navigation bar */}
      <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3.5 bg-white/95 backdrop-blur-md border-t border-[rgba(23,28,35,0.08)] mt-auto">
        {/* Tray of chosen courses - stays visible throughout step 1 */}
        {step === 1 && (
          <div className="max-w-[760px] mx-auto pb-3 mb-3 border-b border-[rgba(23,28,35,0.08)]">
            <SelectedTray
              items={choices.map((c) => ({
                track: trackById(c.trackId),
                institutions: c.institutions,
              }))}
              onRemove={removeTrack}
              onOpen={(id) => {
                setPanelError(null);
                setOpenTrackId(id);
                setOpenClusters((prev) => {
                  const cluster = trackById(id).cluster!;
                  return prev.includes(cluster)
                    ? prev
                    : [...prev, cluster];
                });
              }}
            />
          </div>
        )}
        <div className="max-w-[760px] mx-auto flex items-center justify-between gap-3">
          {step === "intro" && (
            <>
              <Button variant="outline" onClick={onExit}>
                Back to tasks
              </Button>
              <Button onClick={() => setStep(1)}>
                Let's start
              </Button>
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
              <Button onClick={goToStep2} disabled={!canContinue}>
                Done, next step
                <ChevronRight size={16} className="shrink-0" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Continue to review
                <ChevronRight size={16} className="shrink-0" />
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => setStep(2)}>
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
