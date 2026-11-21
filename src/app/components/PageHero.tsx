import { createContext, useContext, type ReactNode } from "react";
import profileHero from "../../imports/heroes/profile.jpg";
import tasksHero from "../../imports/heroes/tasks.jpg";
import learningsHero from "../../imports/heroes/learnings.jpg";
import appointmentsHero from "../../imports/heroes/appointments.jpg";
import messagesHero from "../../imports/heroes/messages.jpg";
import inquiriesHero from "../../imports/heroes/inquiries.jpg";
import settingsHero from "../../imports/heroes/settings.jpg";

/** Whether the site shows the classic version (photo heroes at the top of each page) */
export const ClassicVersionContext = createContext(false);
export const useClassicVersion = () =>
  useContext(ClassicVersionContext);

interface Hero {
  title: string;
  image: string;
  /** Which part of the image stays visible when it is cropped to the hero height */
  position: string;
}

// Pages not listed here (surveys and chat) are shown without a hero
const HEROES: Record<string, Hero> = {
  profile: {
    title: "Hello Olivia",
    image: profileHero,
    // The facade runs behind the card, so the glass picks up both sky and stone
    position: "center 48%",
  },
  tasks: {
    title: "Tasks",
    image: tasksHero,
    position: "center 55%",
  },
  learnings: {
    title: "Modules",
    image: learningsHero,
    position: "center 50%",
  },
  appointments: {
    title: "Bookings",
    image: appointmentsHero,
    position: "center 60%",
  },
  messages: {
    title: "Messages",
    image: messagesHero,
    position: "center 22%",
  },
  inquiries: {
    title: "Enquiries",
    image: inquiriesHero,
    position: "center 8%",
  },
  settings: {
    title: "Settings",
    image: settingsHero,
    position: "center 40%",
  },
};

export function PageHero({
  page,
  children,
}: {
  page: string;
  /** Content that sits on the image below the title */
  children?: ReactNode;
}) {
  const hero = HEROES[page];
  if (!hero) return null;

  return (
    <section className="page-hero relative isolate min-h-[140px] md:min-h-[200px] flex flex-col justify-end overflow-hidden bg-[#122736]">
      <img
        src={hero.image}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: hero.position }}
      />
      {/* Dark layer in the site's navy, slightly lighter */}
      <div className="hero-overlay absolute inset-0" />
      <div className="relative px-4 sm:px-6 md:px-10 pt-10 md:pt-6 pb-5 md:pb-6">
        {/* Same typography as the page headings, in white on the image */}
        <h1 className="font-bold text-white text-[28px] sm:text-[34px] tracking-tight text-left">
          {hero.title}
          <span className="text-[#69c600]">.</span>
        </h1>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </section>
  );
}
