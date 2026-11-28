import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, LogOut, Megaphone, X } from "lucide-react";
import { useIsMobile } from "./ui/use-mobile";

/**
 * The system's shared building blocks.
 * Each variant is defined here once - no duplicated style classes in screens.
 */

// ── Elevation ───────────────────────────────────────────────────────────────

export const ELEVATION = {
  /** Blue glow on an interactive element on hover */
  hover: "0 0 20px 0 rgba(0, 143, 240, 0.25)",
  /** Everything that floats above content - modal, bottom sheet, tooltip, menu */
  overlay: "0 12px 32px rgba(0,0,0,0.16)",
} as const;

// ── Button ──────────────────────────────────────────────────────────────────

/** Button colour/tone */
export type ButtonVariant =
  | "primary"
  | "success"
  | "tint"
  | "ghost"
  | "outline"
  | "link"
  | "linkDanger";

const BUTTON_TONES: Record<ButtonVariant, string> = {
  primary: "bg-[#008ff0] text-white hover:bg-[#0080d6]",
  success: "bg-[rgba(105,198,0,0.12)] text-[#4e9400]",
  tint: "bg-[rgba(0,143,240,0.1)] text-[#008ff0] hover:bg-[rgba(0,143,240,0.18)]",
  ghost:
    "bg-[#f5f5f7] text-[#171c23] hover:bg-[rgba(23,28,35,0.08)]",
  outline:
    "border-[#008ff0] text-[#008ff0] hover:bg-[rgba(0,143,240,0.06)]",
  link: "text-[#008ff0] hover:underline",
  linkDanger: "text-[#c43c3c] hover:underline",
};

/** The uniform size of every button and chip in the system */
export const CONTROL_SIZE = "rounded-full px-2.5 py-1 text-[12px]";

/** Same size for a borderless button - the transparent border keeps the height */
export const BUTTON_SIZE = `${CONTROL_SIZE} border border-transparent`;

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: {
  variant?: ButtonVariant;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const isLink = variant === "link" || variant === "linkDanger";
  return (
    <button
      {...props}
      className={`flex items-center font-semibold whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        isLink ? "gap-1 text-[13px]" : `gap-1 ${BUTTON_SIZE}`
      } ${BUTTON_TONES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// ── Status badge ────────────────────────────────────────────────────────────

export type StatusVariant =
  | "success"
  | "error"
  | "warning"
  | "neutral";

const BADGE_VARIANTS: Record<
  StatusVariant,
  { chip: string; dot: string }
> = {
  success: {
    chip: "bg-[rgba(105,198,0,0.12)] text-[#4e9400]",
    dot: "bg-[#69c600]",
  },
  error: {
    chip: "bg-[rgba(196,60,60,0.08)] text-[#c43c3c]",
    dot: "bg-[#c43c3c]",
  },
  warning: {
    chip: "bg-[rgba(224,112,0,0.1)] text-[#e07000]",
    dot: "bg-[#e07000]",
  },
  neutral: {
    chip: "bg-[rgba(23,28,35,0.06)] text-[rgba(23,28,35,0.62)]",
    dot: "bg-[rgba(23,28,35,0.3)]",
  },
};

export function StatusBadge({
  variant,
  dot,
  icon,
  children,
}: {
  variant: StatusVariant;
  /** Coloured dot before the text */
  dot?: boolean;
  /** Icon instead of the dot */
  icon?: ReactNode;
  children: ReactNode;
}) {
  const v = BADGE_VARIANTS[variant];
  return (
    <span
      className={`flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1 rounded-full whitespace-nowrap ${v.chip}`}
    >
      {icon}
      {dot && (
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${v.dot}`}
        />
      )}
      {children}
    </span>
  );
}

// ── Progress ────────────────────────────────────────────────────────────────

/** Horizontal progress bar */
export function ProgressBar({
  value,
  className = "h-1.5",
  color = "bg-[#008ff0]",
}: {
  value: number;
  className?: string;
  /** Fill colour class - for semantic use (green/red) */
  color?: string;
}) {
  return (
    <div
      className={`w-full rounded-full bg-[rgba(23,28,35,0.08)] overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

/** Progress ring with the value in the centre and an optional label below */
export function ProgressRing({
  value,
  size = 76,
  label,
  valueClassName = "text-[15px]",
  suffix = "%",
}: {
  value: number;
  size?: number;
  label?: string;
  valueClassName?: string;
  suffix?: string;
}) {
  const stroke = size >= 120 ? 12 : 7;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="-rotate-90 block">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--gauge-track, #f5f5f7)"
          strokeWidth={stroke}
        />
        {/* At 0% draw nothing - a round cap draws a dot even at zero length */}
        {value > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--brand, #008ff0)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * circumference} ${circumference}`}
            className="transition-[stroke-dasharray] duration-700 ease-out"
          />
        )}
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span
          className={`stat-number text-[#171c23] tabular-nums tracking-tight ${valueClassName}`}
        >
          {value}
          {suffix}
        </span>
        {label && (
          <span className="text-[#171c23] text-[13px] opacity-50 mt-1.5">
            {label}
          </span>
        )}
      </span>
    </div>
  );
}

// ── Layout ──────────────────────────────────────────────────────────────────

/** Uniform content width for sub-pages (tasks, bookings, messages, settings) */
export const PAGE_CONTAINER = "md:max-w-[760px] md:mx-auto";

// ── Filter chip ─────────────────────────────────────────────────────────────

/**
 * Filter/choice chip - same look everywhere: on the page background and inside dialogs.
 * The border is what defines it when the background behind it is white (e.g. in a filter dialog).
 */
export function FilterChip({
  active,
  disabled,
  count,
  onClick,
  children,
  ...props
}: {
  active?: boolean;
  disabled?: boolean;
  /** Number of items this filter will return */
  count?: number;
  onClick: () => void;
  children: ReactNode;
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "disabled" | "children"
>) {
  return (
    <button
      {...props}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex items-center gap-1 ${CONTROL_SIZE} font-semibold whitespace-nowrap border transition-colors ${
        active
          ? "bg-white border-[#008ff0] text-[#008ff0]"
          : disabled
            ? "bg-[rgba(23,28,35,0.05)] border-[rgba(23,28,35,0.12)] text-[#171c23] opacity-35 cursor-not-allowed"
            : "bg-[rgba(23,28,35,0.05)] border-[rgba(23,28,35,0.12)] text-[#171c23] hover:border-[rgba(0,143,240,0.35)]"
      }`}
    >
      {children}
      {count !== undefined && (
        <span
          className={`text-[12px] font-bold ${active ? "" : "opacity-70"}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/** Layout switch - next to a section heading that has two display options */
export function LayoutSwitch({
  value,
  onChange,
  labels,
}: {
  value: 1 | 2;
  onChange: (v: 1 | 2) => void;
  /** Option labels; defaults to "Option 1" / "Option 2" */
  labels?: [string, string];
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-[rgba(23,28,35,0.06)] p-1 shrink-0">
      {([1, 2] as const).map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          aria-pressed={value === opt}
          className={`${CONTROL_SIZE} whitespace-nowrap transition-colors ${
            value === opt
              ? "bg-white text-[#008ff0] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
              : "text-[rgba(23,28,35,0.62)] hover:text-[#171c23]"
          }`}
        >
          {labels ? labels[opt - 1] : `Option ${opt}`}
        </button>
      ))}
    </div>
  );
}

// ── Questionnaire top bar ───────────────────────────────────────────────────

/**
 * The sticky header of a questionnaire or survey: title, exit, progress bar
 * and step/question counter. Shared by all multi-step forms.
 */
export function FormTopBar({
  title,
  counter,
  progress,
  width = 760,
  onExit,
}: {
  title: string;
  /** e.g. "Question 8 of 33" - shown only together with the progress bar */
  counter?: string;
  /** Progress percentage; without it only the title row is shown */
  progress?: number;
  width?: number;
  onExit: () => void;
}) {
  return (
    <div className="sticky top-[64px] md:top-[98px] z-30 -mx-4 sm:-mx-6 md:-mx-10 px-4 sm:px-6 md:px-10 py-3 bg-white/90 backdrop-blur-md border-b border-[rgba(23,28,35,0.06)]">
      <div
        className="mx-auto flex flex-col gap-2"
        style={{ maxWidth: width }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-[#171c23] text-[14px]">
            {title}
          </span>
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 text-[#171c23] text-[13px] font-semibold opacity-60 hover:opacity-100"
          >
            <LogOut size={14} className="shrink-0" />
            Exit
          </button>
        </div>
        {progress !== undefined && (
          <>
            <ProgressBar value={progress} />
            {counter && (
              <span className="text-[#171c23] text-[12px] opacity-55 text-left">
                {counter}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Ad ──────────────────────────────────────────────────────────────────────

/**
 * Ad space - a full-width banner at the bottom of the main pages only
 * (profile, bookings, tasks, modules, enquiries, messages).
 * Deliberately low so it doesn't compete with the page content.
 */
export function AdBanner({
  className = "",
}: {
  className?: string;
}) {
  return (
    <aside
      aria-label="Advertisement"
      className={`mt-10 w-full rounded-[10px] overflow-hidden border border-[rgba(0,143,240,0.2)] ${className}`}
      style={{
        background:
          "linear-gradient(90deg, rgba(var(--brand-rgb, 0,143,240),0.14) 0%, rgba(var(--brand-rgb, 0,143,240),0.05) 55%, rgba(105,198,0,0.10) 100%)",
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
        <span className="hidden sm:flex w-10 h-10 rounded-full bg-[rgba(0,143,240,0.12)] items-center justify-center shrink-0">
          <Megaphone size={18} className="text-[#008ff0]" />
        </span>
        <div className="min-w-0">
          <span className="block text-[#171c23] text-[11px] opacity-50 mb-0.5">
            Advertisement
          </span>
          <p className="font-bold text-[#171c23] text-[16px] leading-tight truncate">
            Harbourline student perks club
          </p>
          <p className="text-[#171c23] text-[13px] opacity-70 leading-tight">
            Exclusive discounts before your first semester
          </p>
        </div>
      </div>
    </aside>
  );
}

// ── Form fields ─────────────────────────────────────────────────────────────

/** Field frame - identical in every form in the system */
export const FIELD_CLASS =
  "w-full bg-white border border-[rgba(23,28,35,0.12)] rounded-[10px] px-4 py-3 text-left text-[15px] text-[#171c23] placeholder:text-[rgba(23,28,35,0.4)] outline-none transition-colors focus:border-[#008ff0]";

export function FieldLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <p className="text-left font-semibold text-[#171c23] text-[16px] mb-2.5">
      {children}
      {required && <span className="text-[#c43c3c]"> *</span>}
    </p>
  );
}

export function TextField({
  label,
  required,
  value,
  onChange,
  type = "text",
  placeholder,
  dir,
  ...rest
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  dir?: "rtl" | "ltr";
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "dir"
>) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        {...rest}
        type={type}
        value={value}
        dir={dir}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={FIELD_CLASS}
      />
    </div>
  );
}

/**
 * A picker in the system's style (not a native select) - with a dropdown list.
 * One value by default, or several with `multiple`: then the list stays open
 * and each selected option gets a tick.
 */
export type SelectFieldProps = {
  label?: string;
  required?: boolean;
  placeholder: string;
  options: string[];
} & (
  | {
      multiple?: false;
      value: string | null;
      onChange: (value: string) => void;
    }
  | {
      multiple: true;
      value: string[];
      onChange: (value: string[]) => void;
    }
);

export function SelectField(props: SelectFieldProps) {
  const { label, required, placeholder, options } = props;
  /** The selected values - always an array, even for a single choice */
  const selected = props.multiple
    ? props.value
    : props.value
      ? [props.value]
      : [];

  const [open, setOpen] = useState(false);

  const pick = (option: string) => {
    if (props.multiple) {
      // Several values: a click adds or removes the option, and the list stays open
      props.onChange(
        props.value.includes(option)
          ? props.value.filter((v) => v !== option)
          : [...props.value, option],
      );
      return;
    }
    props.onChange(option);
    setOpen(false);
  };
  const trigger = useRef<HTMLButtonElement>(null);
  /**
   * The list opens in a portal with fixed positioning, not inside the field: inside a
   * scrolling dialog it was clipped and you had to scroll to see the options.
   */
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    flip: boolean;
  } | null>(null);

  const menu = useRef<HTMLDivElement>(null);

  // Opening from the keyboard: focus moves to the selected option, or the first
  const menuReady = open && pos !== null;
  useEffect(() => {
    if (!menuReady || !menu.current) return;
    const selected = menu.current.querySelector<HTMLElement>(
      '[aria-selected="true"]',
    );
    (selected ?? menu.current.querySelector<HTMLElement>("button"))?.focus({
      preventScroll: true,
    });
  }, [menuReady]);

  const closeMenu = () => {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  };

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    // The event doesn't propagate - Esc closes the list, not the dialog behind it
    e.stopPropagation();
    if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      closeMenu();
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(
      menu.current?.querySelectorAll<HTMLElement>("button") ?? [],
    );
    const step = e.key === "ArrowDown" ? 1 : -1;
    const next =
      (items.indexOf(document.activeElement as HTMLElement) +
        step +
        items.length) %
      items.length;
    items[next]?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const el = trigger.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const below = window.innerHeight - r.bottom - 16;
      const above = r.top - 16;
      // If there's no room below - open upwards
      const flip = below < 200 && above > below;
      setPos({
        top: flip ? r.top - 6 : r.bottom + 6,
        left: r.left,
        width: r.width,
        maxHeight: Math.max(120, Math.min(224, flip ? above : below)),
        flip,
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  return (
    <div>
      {label && (
        <FieldLabel required={required}>{label}</FieldLabel>
      )}
      <div className="relative">
        <button
          ref={trigger}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className={`w-full bg-white border rounded-[10px] px-4 py-3 flex items-center justify-between gap-2 text-left transition-colors ${
            open
              ? "border-[#008ff0]"
              : "border-[rgba(23,28,35,0.12)] hover:border-[rgba(23,28,35,0.25)]"
          }`}
        >
          <span
            className={`text-[15px] truncate ${selected.length ? "text-[#171c23]" : "text-[rgba(23,28,35,0.4)]"}`}
          >
            {selected.length ? selected.join(" · ") : placeholder}
          </span>
          <ChevronDown
            size={18}
            className={`text-[#171c23] opacity-50 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open &&
          pos &&
          createPortal(
            <div>
              <div
                className="fixed inset-0 z-[500]"
                onClick={() => setOpen(false)}
              />
              <div
                ref={menu}
                role="listbox"
                onKeyDown={onMenuKeyDown}
                className="fixed z-[510] bg-white rounded-[10px] border border-[rgba(23,28,35,0.08)] overflow-y-auto py-1"
                style={{
                  top: pos.top,
                  left: pos.left,
                  width: pos.width,
                  maxHeight: pos.maxHeight,
                  transform: pos.flip
                    ? "translateY(-100%)"
                    : undefined,
                  boxShadow: ELEVATION.overlay,
                }}
              >
                {options.map((option) => {
                  const isSelected = selected.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => pick(option)}
                      className={`w-full text-left px-4 py-2.5 text-[15px] flex items-center justify-between gap-2 transition-colors hover:bg-[rgba(0,143,240,0.06)] ${
                        isSelected
                          ? "text-[#008ff0] font-semibold"
                          : "text-[#171c23]"
                      }`}
                    >
                      <span className="truncate">{option}</span>
                      {isSelected && (
                        <Check size={16} className="shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.querySelector("[data-app-root]") ??
              document.body,
          )}
      </div>
    </div>
  );
}

// ── Icon circle ─────────────────────────────────────────────────────────────

export function IconCircle({
  children,
  size = 40,
  bg = "rgba(0,143,240,0.1)",
  color = "#008ff0",
  className = "",
}: {
  children: ReactNode;
  size?: number;
  bg?: string;
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        color,
      }}
    >
      {children}
    </div>
  );
}

// ── Dialog (modal on desktop / bottom-sheet on mobile) ──────────────────────

const DialogCloseContext = createContext<() => void>(() => {});
/** Closes the dialog with the animation - available to any descendant */
export const useDialogClose = () => useContext(DialogCloseContext);

/** The title id - so a screen reader announces the dialog's name */
const DialogTitleIdContext = createContext<string | undefined>(undefined);

const FOCUSABLE =
  'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Dialog keyboard behaviour: focus enters the dialog on open and returns on close,
 * Tab stays inside the dialog and Esc closes it.
 */
export function useModalA11y(close: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });
    return () => previous?.focus?.({ preventScroll: true });
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    const panel = panelRef.current;
    const items = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter((el) => el.offsetParent !== null);
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panel)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return { panelRef, onKeyDown };
}

export function DialogHeader({
  title,
  subtitle,
  children,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Extra content under the title (e.g. date/location rows) */
  children?: ReactNode;
}) {
  const close = useDialogClose();
  const titleId = useContext(DialogTitleIdContext);
  return (
    <div className="flex flex-col gap-2.5 px-5 py-4 border-b border-[rgba(23,28,35,0.08)] shrink-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col min-w-0">
          {title && (
            <span
              id={titleId}
              className="font-bold text-[#171c23] text-[18px]"
            >
              {title}
            </span>
          )}
          {subtitle && (
            <span className="text-[#171c23] text-[13px] opacity-60 mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
        <button
          onClick={close}
          aria-label="Close"
          className="w-8 h-8 flex items-center justify-center text-[#171c23] opacity-60 hover:opacity-100 shrink-0 -mt-1"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  );
}

export function Dialog({
  onClose,
  width = 480,
  title,
  subtitle,
  header,
  footer,
  children,
  bodyClassName = "px-5 py-5",
}: {
  onClose: () => void;
  width?: number;
  /** Standard title (with a close button) */
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Custom header - replaces the standard one */
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
}) {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 280);
  }, [onClose]);

  const { panelRef, onKeyDown } = useModalA11y(close);
  const titleId = useId();
  const hasTitle = Boolean(title || header);
  const panelProps = {
    ref: panelRef,
    role: "dialog",
    "aria-modal": true,
    "aria-labelledby": hasTitle ? titleId : undefined,
    "aria-label": hasTitle ? undefined : "Dialog",
    tabIndex: -1,
    onKeyDown,
  };

  const content = (
    // flex-1/min-h-0 chain - so the body scrolls and the footer always sticks to the bottom
    <div className="flex flex-col flex-1 min-h-0">
      {header ?? ((title || subtitle) && (
        <DialogHeader title={title} subtitle={subtitle} />
      ))}
      <div
        className={`overflow-y-auto flex-1 min-h-0 ${bodyClassName}`}
      >
        {children}
      </div>
      {footer && (
        <div className={`${isMobile ? "app-sheet-footer " : ""}flex flex-wrap items-center justify-end gap-2 px-5 py-4 border-t border-[rgba(23,28,35,0.08)] shrink-0`}>
          {footer}
        </div>
      )}
    </div>
  );

  // Portal to body: otherwise a parent with a transform (e.g. a card in a carousel)
  // makes the fixed element position relative to it, and the dialog opens inside the card
  return createPortal(
    <DialogCloseContext.Provider value={close}>
    <DialogTitleIdContext.Provider value={titleId}>
      {isMobile ? (
        <div className="fixed inset-0 z-[400]">
          <div
            className="app-sheet-backdrop absolute inset-0 transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0 }}
            onClick={close}
          />
          <div
            {...panelProps}
            className="app-sheet outline-none absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl transition-transform duration-300 ease-out flex flex-col min-h-[50vh] max-h-[92vh]"
            style={{
              transform: visible
                ? "translateY(0)"
                : "translateY(100%)",
            }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="app-sheet-handle w-10 h-1 rounded-full bg-[rgba(23,28,35,0.15)]" />
            </div>
            {content}
          </div>
        </div>
      ) : (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center p-4"
         
        >
          <div
            className="absolute inset-0 bg-black/20 transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0 }}
            onClick={close}
          />
          <div
            {...panelProps}
            className="outline-none relative bg-white rounded-[10px] w-full max-h-[85vh] flex flex-col transition-all duration-300"
            style={{
              maxWidth: width,
              opacity: visible ? 1 : 0,
              transform: visible
                ? "translateY(0) scale(1)"
                : "translateY(12px) scale(0.98)",
              boxShadow: ELEVATION.overlay,
            }}
          >
            {content}
          </div>
        </div>
      )}
    </DialogTitleIdContext.Provider>
    </DialogCloseContext.Provider>,
    // The app root (not body) - that's where the theme variables live
    document.querySelector("[data-app-root]") ?? document.body,
  );
}
