import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  AppointmentCard,
  SectionHeading,
  upcomingAppointments,
  pastAppointments,
  type Appointment,
} from "./TasksAppointmentsPage";
import { useIsMobile } from "./ui/use-mobile";
import { AdBanner, LayoutSwitch } from "./primitives";

/** Bookings grid - one card per row on mobile, three on desktop */
const APPOINTMENTS_GRID =
  "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch";

/** How many bookings each view option shows */
const SHORT_LIST = 3;

/**
 * The focused booking stops this far from the left edge (set by the
 * track's ps/scroll-ps) - so the previous booking peeks in on the left
 * and the next one on the right.
 */

/**
 * Infinite bookings carousel - the focused card stops on the left, white
 * and full size, while its neighbours on either side are smaller and glassy.
 *
 * The loop works by repeating the list three times: the user always
 * scrolls inside the middle copy, and when the scroll crosses out of it
 * it is "snapped back" by exactly one copy's width - the content is the
 * same, so the jump can't be seen.
 */
const COPIES = 3;

function AppointmentsCarousel({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const track = useRef<HTMLDivElement>(null);
  /** Position of the focused card in the repeated list */
  const [focus, setFocus] = useState(0);
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined);

  const count = appointments.length;
  const loop = Array.from({ length: COPIES }, () => appointments)
    .flat()
    .map((a, i) => ({ appointment: a, key: `${a.id}-${i}` }));

  /** Card width + gap - the carousel's basic step */
  const step = () => {
    const el = track.current;
    // offsetWidth rather than getBoundingClientRect - to ignore the scale
    const card = el?.querySelector<HTMLElement>("[data-card]");
    return card
      ? card.offsetWidth + 16
      : Math.round((el?.clientWidth ?? 0) * 0.8);
  };

  /** Width of one copy of the list */
  const copyWidth = () => count * step();

  /**
   * The focused card is derived from the scroll position (not by measuring
   * positions), because right after the loop jump the measurements still
   * reflect the previous state. The track padding equals the
   * scroll-padding, so card i stops at i*step.
   */
  const sync = () => {
    const el = track.current;
    if (!el) return;
    const pos = Math.max(0, el.scrollLeft);
    const i = Math.round(pos / Math.max(step(), 1));
    setFocus(Math.max(0, Math.min(loop.length - 1, i)));
  };

  /** Moves the scroll back into the middle copy - only once motion has stopped */
  const normalize = () => {
    const el = track.current;
    if (!el) return;
    const copy = copyWidth();
    const pos = el.scrollLeft;
    if (pos < copy)
      el.scrollTo({ left: pos + copy, behavior: "instant" });
    else if (pos >= 2 * copy)
      el.scrollTo({ left: pos - copy, behavior: "instant" });
    else return;
    // The jump doesn't guarantee a scroll event - refresh the focus by hand
    sync();
  };

  const onScroll = () => {
    sync();
    clearTimeout(settle.current);
    settle.current = setTimeout(normalize, 140);
  };

  // Start in the middle copy so the user can also scroll backwards
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: copyWidth(), behavior: "instant" });
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [count]);

  /** i is a position in the repeated list - so "next" after the last is the first */
  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    // Update the focus straight away rather than waiting for scroll events
    setFocus(i);
    el.scrollTo({ left: i * step(), behavior: "smooth" });
    clearTimeout(settle.current);
    settle.current = setTimeout(normalize, 500);
  };

  const arrow =
    "w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#008ff0] shadow-[0_8px_32px_rgba(18,39,54,0.16)] transition-shadow hover:[box-shadow:0_0_20px_0_rgba(0,143,240,0.25)]";

  return (
    <div className="relative">
      {/* Floating arrows - desktop only, on mobile you swipe.
          An infinite loop has no end, so they're always active */}
      <button
        onClick={() => goTo(focus - 1)}
        aria-label="Previous booking"
        className={`hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 ${arrow}`}
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => goTo(focus + 1)}
        aria-label="Next booking"
        className={`hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 ${arrow}`}
      >
        <ChevronRight size={20} />
      </button>

      {/* The track bleeds to the full screen width (cancelling the page
          padding), and the focused card stops PEEK from the left edge - so
          the previous booking peeks in on the left and the next on the right */}
      <div className="-mx-4 sm:-mx-6 md:-mx-10">
        <div
          ref={track}
          onScroll={onScroll}
          className="flex items-stretch gap-4 overflow-x-auto snap-x snap-proximity py-2 ps-14 sm:ps-16 md:ps-20 pe-4 sm:pe-6 md:pe-10 scroll-ps-14 sm:scroll-ps-16 md:scroll-ps-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {loop.map(({ appointment, key }, i) => {
            const focused = i === focus;
            return (
              <div
                key={key}
                data-card
                className={`relative snap-start shrink-0 flex w-[86%] sm:w-[380px] origin-center transition-all duration-300 ${
                  focused
                    ? "scale-100 opacity-100"
                    : "scale-[0.94] opacity-80"
                }`}
              >
                <AppointmentCard
                  appointment={appointment}
                  glass={!focused}
                />
                {/* A card that isn't focused - tapping it brings it into
                    focus instead of triggering the buttons inside it */}
                {!focused && (
                  <button
                    onClick={() => goTo(i)}
                    aria-label={`Go to ${appointment.name}`}
                    className="absolute inset-0 z-10 cursor-pointer rounded-[10px]"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Position dots - one per booking, whichever copy you're in */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {appointments.map((a, i) => {
          const active = focus % count === i;
          return (
            <button
              key={a.id}
              onClick={() => goTo(focus - (focus % count) + i)}
              aria-label={`Go to booking ${i + 1}`}
              aria-current={active}
              className={`h-2 rounded-full transition-all duration-200 ${
                active
                  ? "w-6 bg-[#69c600]"
                  : "w-2 bg-[rgba(23,28,35,0.2)] hover:bg-[rgba(23,28,35,0.35)]"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function MyAppointmentsPage() {
  const isMobile = useIsMobile();
  const [layout, setLayout] = useState<1 | 2>(1);

  // Option 1: the next three bookings. Option 2: all bookings
  const shown =
    layout === 1
      ? upcomingAppointments.slice(0, SHORT_LIST)
      : upcomingAppointments;

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mb-5">
        <SectionHeading title="Upcoming bookings" className="mb-0" />
        <LayoutSwitch
          value={layout}
          onChange={setLayout}
          labels={[
            `${SHORT_LIST} bookings`,
            `${upcomingAppointments.length} bookings`,
          ]}
        />
      </div>

      {/* Option 1 on desktop - a grid; everything else - the carousel */}
      {layout === 1 && !isMobile ? (
        <div className={APPOINTMENTS_GRID}>
          {shown.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
            />
          ))}
        </div>
      ) : (
        <AppointmentsCarousel key={layout} appointments={shown} />
      )}

      <div className="mt-10">
        <SectionHeading title="Past bookings" />
        <div className={APPOINTMENTS_GRID}>
          {pastAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              past
            />
          ))}
        </div>
      </div>

      <AdBanner />
    </section>
  );
}
