import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Star,
  Archive,
  ArchiveRestore,
  Clock,
  ChevronDown,
  ArrowUpDown,
  Inbox,
  Mail,
  MailOpen,
  CheckCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useIsMobile } from "./ui/use-mobile";
import {
  SectionHeading,
} from "./TasksAppointmentsPage";
import {
  AdBanner,
  Button,
  Dialog,
  FilterChip,
  PAGE_CONTAINER,
  BUTTON_SIZE,
} from "./primitives";

// ── Data ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  title: string;
  content: string;
  timeAgo: string;
  /** Higher = newer (for sorting) */
  sortIndex: number;
}

const messages: Message[] = [
  {
    id: "campus-shuttle",
    title: "Meet Wattle Shuttle!",
    content: `Dear applicants, meet Wattle Shuttle - the free Harbourline University campus bus app! Coming to Wattle Grove campus by bus or train? Just scan the QR code and ride!
How do I start? Sign in and ride with Wattle Shuttle at https://shuttle.harbourline.edu.au Your student card also holds $20 of travel credit as a backup, in case of faults.
Having trouble? The shuttle help desk is on 03 5444 7888, option 8.
Good luck, and enjoy your start at Harbourline!`,
    timeAgo: "3 days ago",
    sortIndex: 5,
  },
  {
    id: "selection-day-module",
    title: "Your selection day module is waiting",
    content: `Hi Olivia, this is a reminder that a selection day preparation module is available for you on the applicant portal. We recommend practising with the module so you arrive better prepared for selection day. Please note, you can find the selection day module on the Modules page of the portal. It contains hundreds of practice questions and materials. Good luck with your application!`,
    timeAgo: "1 week ago",
    sortIndex: 4,
  },
  {
    id: "welcome-voucher",
    title: "Your Harbourline welcome voucher",
    content: `Hi Olivia,
Your welcome voucher is ready to use.
Activate it with this link: https://perks.harbourline.edu.au
More about the welcome voucher in this article: https://harbourline.edu.au/voucher`,
    timeAgo: "2 weeks ago",
    sortIndex: 3,
  },
  {
    id: "support-person-approved",
    title: "Your support person has been approved",
    content: `Hi Olivia, access for Ruth Collins (careers adviser) has been approved. From now on your support person can view your details and bookings on the applicant portal and help you through the application process.`,
    timeAgo: "3 weeks ago",
    sortIndex: 2,
  },
  {
    id: "welcome",
    title: "Welcome to the applicant portal",
    content: `Hi Olivia, welcome to My profile on the Harbourline applicant portal! Here you can follow your application, view your bookings, fill in surveys and get important updates. Check in every so often to make sure no tasks are waiting for you. Good luck!`,
    timeAgo: "1 month ago",
    sortIndex: 1,
  },
];

// Turn links in the text into clickable links
function Linkify({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noreferrer"
            className="text-[#008ff0] hover:underline break-all"
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}


// ── Message card ────────────────────────────────────────────────────────────

function MessageCard({
  message,
  unread,
  favorite,
  archived,
  onToggleFavorite,
  onToggleArchive,
  onRead,
  onToggleRead,
}: {
  message: Message;
  unread: boolean;
  favorite: boolean;
  archived: boolean;
  onToggleFavorite: () => void;
  onToggleArchive: () => void;
  onRead: () => void;
  onToggleRead: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  /** Whether the text is actually clipped - only then is the "Read full message" button useful */
  const [clipped, setClipped] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    // When expanded there is nothing clipped to measure - keep the previous value
    if (!el || expanded) return;
    const check = () =>
      setClipped(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded, message.content]);

  const toggleExpand = () => setExpanded(!expanded);

  /** Actions that are not "reading" - they should not mark the message as read */
  const withoutRead =
    (fn: () => void) => (e: React.MouseEvent) => {
      e.stopPropagation();
      fn();
    };

  return (
    <div
      // Any click on the card (including a link in the message) marks it as read
      onClick={() => unread && onRead()}
      className="bg-white rounded-[10px] p-5 flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={toggleExpand}
          className="flex items-start sm:items-center gap-2 min-w-0 flex-1 text-left"
        >
          {unread && (
            <span className="w-2 h-2 rounded-full bg-[#008ff0] shrink-0 mt-2 sm:mt-0" />
          )}
          {/* On mobile the title wraps onto two lines and the time drops below it,
              because there is no room left for it on one line with the icons */}
          <span className="min-w-0 flex flex-col items-start gap-0.5">
            <h3
              className={`text-[#171c23] text-[16px] leading-snug sm:truncate sm:max-w-full ${
                unread ? "font-bold" : "font-semibold opacity-80"
              }`}
            >
              {message.title}
            </h3>
            <span className="sm:hidden flex items-center gap-1 text-[#171c23] text-[13px] opacity-50 whitespace-nowrap">
              <Clock size={11} className="shrink-0" />
              {message.timeAgo}
            </span>
          </span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:flex items-center gap-1 text-[#171c23] text-[13px] opacity-50 whitespace-nowrap">
            <Clock size={11} className="shrink-0" />
            {message.timeAgo}
          </span>
          {/* Manual read/unread toggle - next to the card's other actions */}
          <button
            onClick={withoutRead(onToggleRead)}
            aria-label={unread ? "Mark as read" : "Mark as unread"}
            title={unread ? "Mark as read" : "Mark as unread"}
            className={`w-7 h-7 flex items-center justify-center transition-opacity hover:opacity-100 ${
              unread
                ? "text-[#008ff0] opacity-90"
                : "text-[#171c23] opacity-40"
            }`}
          >
            {unread ? (
              <MailOpen size={17} />
            ) : (
              <Mail size={17} />
            )}
          </button>
          <button
            onClick={withoutRead(onToggleFavorite)}
            aria-label={
              favorite ? "Remove from favourites" : "Add to favourites"
            }
            className="w-7 h-7 flex items-center justify-center transition-opacity hover:opacity-100"
          >
            <Star
              size={17}
              className={
                favorite
                  ? "text-[#f5a623]"
                  : "text-[#171c23] opacity-40"
              }
              fill={favorite ? "#f5a623" : "none"}
            />
          </button>
          <button
            onClick={withoutRead(onToggleArchive)}
            aria-label={
              archived ? "Restore from archive" : "Move to archive"
            }
            className="w-7 h-7 flex items-center justify-center text-[#171c23] opacity-40 hover:opacity-100 transition-opacity"
          >
            {archived ? (
              <ArchiveRestore size={17} />
            ) : (
              <Archive size={17} />
            )}
          </button>
        </div>
      </div>

      <p
        ref={textRef}
        className={`text-[#171c23] text-[14px] text-left leading-relaxed whitespace-pre-line ${
          // Two lines on mobile, three on desktop
          expanded ? "" : "line-clamp-2 sm:line-clamp-3 opacity-90"
        }`}
      >
        <Linkify text={message.content} />
      </p>

      {/* The button only appears when the message really is longer than its space */}
      {clipped && (
        <button
          onClick={toggleExpand}
          className="self-start flex items-center gap-1 text-[#008ff0] text-[13px] font-semibold hover:underline"
        >
          {expanded ? "Show less" : "Read full message"}
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

type ReadFilter = "all" | "unread" | "read";

/** Messages already read on first load (the shuttle and selection day module messages are unread) */
export const INITIAL_READ_MESSAGE_IDS = [
  "welcome-voucher",
  "support-person-approved",
  "welcome",
];
export const INITIAL_ARCHIVED_MESSAGE_IDS = ["welcome"];

/** Number of unread, non-archived messages - feeds the bell badge */
export function countUnreadMessages(
  readIds: Set<string>,
  archivedIds: Set<string>,
) {
  return messages.filter(
    (m) => !readIds.has(m.id) && !archivedIds.has(m.id),
  ).length;
}

export default function MessagesPage({
  readIds,
  setReadIds,
  archivedIds,
  setArchivedIds,
  onNavigateHome,
}: {
  readIds: Set<string>;
  setReadIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  archivedIds: Set<string>;
  setArchivedIds: React.Dispatch<
    React.SetStateAction<Set<string>>
  >;
  onNavigateHome?: () => void;
}) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    () => new Set(["welcome-voucher"]),
  );

  const [query, setQuery] = useState("");
  const [readFilter, setReadFilter] =
    useState<ReadFilter>("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [newestFirst, setNewestFirst] = useState(true);
  const [showArchive, setShowArchive] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleIn = (
    setter: React.Dispatch<
      React.SetStateAction<Set<string>>
    >,
    id: string,
  ) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const visibleMessages = useMemo(() => {
    let list = messages.filter(
      (m) => archivedIds.has(m.id) === showArchive,
    );
    if (onlyFavorites)
      list = list.filter((m) => favoriteIds.has(m.id));
    if (readFilter !== "all")
      list = list.filter(
        (m) =>
          readIds.has(m.id) === (readFilter === "read"),
      );
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.content.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) =>
      newestFirst
        ? b.sortIndex - a.sortIndex
        : a.sortIndex - b.sortIndex,
    );
  }, [
    archivedIds,
    favoriteIds,
    readIds,
    showArchive,
    onlyFavorites,
    readFilter,
    newestFirst,
    query,
  ]);

  /** Messages in the current view (inbox/archive) that match the search - the basis for counts */
  const scopeList = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter(
      (m) =>
        archivedIds.has(m.id) === showArchive &&
        (q === "" ||
          m.title.toLowerCase().includes(q) ||
          m.content.toLowerCase().includes(q)),
    );
  }, [archivedIds, showArchive, query]);

  /** Chip counts - each count ignores its own filter so it stays useful */
  const counts = useMemo(() => {
    const byFavorite = onlyFavorites
      ? scopeList.filter((m) => favoriteIds.has(m.id))
      : scopeList;
    const q = query.trim().toLowerCase();
    return {
      all: byFavorite.length,
      unread: byFavorite.filter((m) => !readIds.has(m.id)).length,
      read: byFavorite.filter((m) => readIds.has(m.id)).length,
      favorites: scopeList.filter((m) => favoriteIds.has(m.id))
        .length,
      archived: messages.filter(
        (m) =>
          archivedIds.has(m.id) &&
          (q === "" ||
            m.title.toLowerCase().includes(q) ||
            m.content.toLowerCase().includes(q)),
      ).length,
    };
  }, [
    scopeList,
    onlyFavorites,
    favoriteIds,
    readIds,
    archivedIds,
    query,
  ]);

  /** How many visible messages are unread - for the "Mark all as read" button */
  const unreadVisible = visibleMessages.filter(
    (m) => !readIds.has(m.id),
  ).length;

  const markVisibleAsRead = () =>
    setReadIds(
      (prev) =>
        new Set([...prev, ...visibleMessages.map((m) => m.id)]),
    );

  const searching = query.trim() !== "";
  const filtersActive =
    searching || onlyFavorites || readFilter !== "all";

  const clearFilters = () => {
    setQuery("");
    setOnlyFavorites(false);
    setReadFilter("all");
  };

  /** Filters that move into the dialog on mobile - favourites, sort and archive */
  const extraFilters =
    (onlyFavorites ? 1 : 0) +
    (showArchive ? 1 : 0) +
    (newestFirst ? 0 : 1);

  const clearExtraFilters = () => {
    setOnlyFavorites(false);
    setShowArchive(false);
    setNewestFirst(true);
  };

  const extraChips = (
    <>
      <FilterChip
        active={onlyFavorites}
        onClick={() => setOnlyFavorites(!onlyFavorites)}
        count={counts.favorites}
      >
        <Star
          size={13}
          className="shrink-0"
          fill={onlyFavorites ? "currentColor" : "none"}
        />
        Favourites
      </FilterChip>
      <FilterChip onClick={() => setNewestFirst(!newestFirst)}>
        <ArrowUpDown size={13} className="shrink-0" />
        {newestFirst ? "Newest first" : "Oldest first"}
      </FilterChip>
      <FilterChip
        active={showArchive}
        onClick={() => setShowArchive(!showArchive)}
        count={counts.archived}
      >
        <Archive size={13} className="shrink-0" />
        Archive
      </FilterChip>
    </>
  );

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      <div className={PAGE_CONTAINER}>
        <SectionHeading title="Messages" heroTitle />

        {/* Search and filters */}
        <div className="flex flex-col gap-3 mb-5">
          <div className="bg-white rounded-full h-10 px-4 flex items-center gap-2">
            <Search
              size={15}
              className="text-[#171c23] opacity-40 shrink-0"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages"
              className="flex-1 bg-transparent outline-none text-[14px] text-[#171c23] placeholder:opacity-40"
            />
            {searching && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="w-5 h-5 flex items-center justify-center rounded-full bg-[rgba(23,28,35,0.08)] text-[#171c23] opacity-60 hover:opacity-100 shrink-0"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Read/unread filter */}
            <FilterChip
              active={readFilter === "all"}
              onClick={() => setReadFilter("all")}
              count={counts.all}
            >
              All
            </FilterChip>
            <FilterChip
              active={readFilter === "unread"}
              onClick={() => setReadFilter("unread")}
              count={counts.unread}
            >
              Unread
            </FilterChip>
            <FilterChip
              active={readFilter === "read"}
              onClick={() => setReadFilter("read")}
              count={counts.read}
            >
              Read
            </FilterChip>
            {/* On mobile the other filters move into a "Filter" dialog, as in Tasks */}
            {isMobile ? (
              <button
                onClick={() => setFiltersOpen(true)}
                className={`flex items-center gap-1 ${BUTTON_SIZE} bg-white text-[#171c23] font-semibold whitespace-nowrap transition-shadow hover:[box-shadow:0_0_20px_0_rgba(0,143,240,0.25)]`}
              >
                <SlidersHorizontal size={14} className="shrink-0" />
                Filter
                {extraFilters > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#008ff0] text-white text-[12px] font-bold flex items-center justify-center">
                    {extraFilters}
                  </span>
                )}
              </button>
            ) : (
              <>
                <div className="w-px h-5 bg-[rgba(23,28,35,0.1)] mx-1" />
                {extraChips}
              </>
            )}
          </div>
        </div>

        {/* Filter dialog on mobile */}
        {filtersOpen && (
          <Dialog
            onClose={() => setFiltersOpen(false)}
            title="Filter messages"
            subtitle={`Showing ${visibleMessages.length} of ${counts.all} messages`}
            footer={
              <>
                <Button
                  variant="ghost"
                  onClick={clearExtraFilters}
                  disabled={extraFilters === 0}
                >
                  Clear
                </Button>
                <Button onClick={() => setFiltersOpen(false)}>
                  Show {visibleMessages.length} messages
                </Button>
              </>
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              {extraChips}
            </div>
          </Dialog>
        )}

        {/* Results row: how many are shown + mark all as read */}
        {visibleMessages.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-1">
            <p className="text-[#171c23] text-[13px] opacity-60">
              {searching ? (
                <>
                  {visibleMessages.length} results for "
                  {query.trim()}"
                </>
              ) : (
                <>
                  Showing {visibleMessages.length} of{" "}
                  {counts.all} messages
                  {showArchive ? " in archive" : ""}
                </>
              )}
            </p>
            {unreadVisible > 0 && (
              <button
                onClick={markVisibleAsRead}
                className="flex items-center gap-1 text-[#008ff0] text-[13px] font-semibold hover:underline"
              >
                <CheckCheck size={14} className="shrink-0" />
                Mark all as read ({unreadVisible})
              </button>
            )}
          </div>
        )}

        {/* Message list */}
        {visibleMessages.length === 0 ? (
          <div className="bg-white rounded-[10px] p-10 flex flex-col items-center gap-3 text-center">
            <div className="bg-[rgba(0,143,240,0.08)] w-14 h-14 rounded-full flex items-center justify-center">
              {searching ? (
                <Search size={24} className="text-[#008ff0]" />
              ) : (
                <Inbox size={24} className="text-[#008ff0]" />
              )}
            </div>
            <p className="font-bold text-[#171c23] text-[16px]">
              {searching
                ? `No results for "${query.trim()}"`
                : filtersActive
                  ? "No messages match the filter"
                  : showArchive
                    ? "The archive is empty"
                    : "No messages"}
            </p>
            <p className="text-[#171c23] text-[14px] opacity-60 max-w-[340px]">
              {searching
                ? "Try another search term, or clear the search to see all messages"
                : filtersActive
                  ? "Try changing the filter to see more messages"
                  : showArchive
                    ? "Messages you archive will appear here"
                    : "New messages will appear here"}
            </p>
            {filtersActive && (
              <Button onClick={clearFilters} className="mt-1">
                Clear search and filters
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleMessages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                unread={!readIds.has(message.id)}
                favorite={favoriteIds.has(message.id)}
                archived={archivedIds.has(message.id)}
                onToggleFavorite={() =>
                  toggleIn(setFavoriteIds, message.id)
                }
                onToggleArchive={() =>
                  toggleIn(setArchivedIds, message.id)
                }
                onRead={() =>
                  setReadIds(
                    (prev) => new Set([...prev, message.id]),
                  )
                }
                onToggleRead={() =>
                  setReadIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(message.id))
                      next.delete(message.id);
                    else next.add(message.id);
                    return next;
                  })
                }
              />
            ))}
          </div>
        )}

        <AdBanner />
      </div>
    </section>
  );
}
