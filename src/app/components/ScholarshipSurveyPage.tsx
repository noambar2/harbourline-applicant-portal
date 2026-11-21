import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { CONTROL_SIZE } from "./primitives";
import ScholarshipSurveyDetailed from "./ScholarshipSurveyDetailed";
import ScholarshipSurveySimple from "./ScholarshipSurveySimple";
import ScholarshipSurveySheet from "./ScholarshipSurveySheet";

/**
 * Three versions of the scholarship survey, for comparison:
 * Option 1 - choose from study areas, with a course panel that opens inside the list.
 * Option 2 - a simple form of dropdowns, one row per preference.
 * Option 3 - a list of preferences, with the choice made in a side panel / bottom sheet.
 */

const VARIANTS = [1, 2, 3] as const;
type Variant = (typeof VARIANTS)[number];

/**
 * The switch between design versions is hidden ahead of launch - the survey opens in option 3.
 * To bring it back, just set the value to true.
 */
const VARIANT_SWITCH_ENABLED = false;

function VariantSwitch({
  value,
  onChange,
}: {
  value: Variant;
  onChange: (v: Variant) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-[rgba(23,28,35,0.06)] p-1 shrink-0">
      {VARIANTS.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          aria-pressed={value === opt}
          className={`${CONTROL_SIZE} whitespace-nowrap transition-colors ${
            value === opt
              ? "bg-white text-[#008ff0] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
              : "text-[rgba(23,28,35,0.62)] hover:text-[#171c23]"
          }`}
        >
          Option {opt}
        </button>
      ))}
    </div>
  );
}

export default function ScholarshipSurveyPage({
  onExit,
  onGoHome,
}: {
  onExit: () => void;
  onGoHome: () => void;
}) {
  const [variant, setVariant] = useState<Variant>(3);

  return (
    <div className="flex flex-col flex-1">
      {/* Breadcrumbs + switch between design versions */}
      <div className="bg-white px-4 sm:px-6 md:px-10 pt-6 pb-4 flex items-center justify-between gap-3 flex-wrap">
        <nav className="flex items-center gap-1.5 text-[14px]">
          <button
            type="button"
            onClick={onExit}
            className="text-[#008ff0] font-semibold hover:underline underline-offset-4"
          >
            Tasks
          </button>
          <ChevronRight
            size={14}
            className="text-[#171c23] opacity-40 shrink-0"
          />
          <span className="text-[#171c23] opacity-70">
            Scholarship survey
          </span>
        </nav>
        {VARIANT_SWITCH_ENABLED && (
          <VariantSwitch value={variant} onChange={setVariant} />
        )}
      </div>

      {/* The key resets the survey state on every version switch */}
      {variant === 1 && (
        <ScholarshipSurveyDetailed
          key="detailed"
          onExit={onExit}
          onGoHome={onGoHome}
        />
      )}
      {variant === 2 && (
        <ScholarshipSurveySimple
          key="simple"
          onExit={onExit}
          onGoHome={onGoHome}
        />
      )}
      {variant === 3 && (
        <ScholarshipSurveySheet
          key="sheet"
          onExit={onExit}
          onGoHome={onGoHome}
        />
      )}
    </div>
  );
}
