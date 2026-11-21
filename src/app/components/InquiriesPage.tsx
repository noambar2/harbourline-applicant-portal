import { useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Phone,
  Globe,
  Paperclip,
  Check,
  Clock,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Inbox,
  FileText,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import {
  Button,
  StatusBadge,
  Dialog,
  SelectField,
  FieldLabel,
  FIELD_CLASS,
  PAGE_CONTAINER,
  IconCircle,
  AdBanner,
  FilterChip,
  LayoutSwitch,
} from "./primitives";
import { SectionHeading } from "./TasksAppointmentsPage";

// ── Data ────────────────────────────────────────────────────────────────────

type InquiryStatus = "received" | "inProgress" | "closed";
type Channel = "Phone" | "Online";

/** A document attached to an enquiry - in admin view it can only be viewed inside the app */
interface InquiryFile {
  id: string;
  name: string;
  kind: "image" | "doc";
  /** Temporary in-browser URL for a file that was actually attached (blob:) */
  url?: string;
}

/** An entry in the handling history - shown to admins */
interface HistoryEntry {
  date: string;
  text: string;
  by: string;
}

interface Inquiry {
  id: string;
  number: string;
  subject: string;
  topic: string;
  openDate: string;
  closeDate?: string;
  status: InquiryStatus;
  /** What the applicant needs to do for the enquiry to keep moving */
  awaitingRecruit?: string;
  channel: Channel;
  files: InquiryFile[];
  response?: string;
  /** Who is handling the enquiry - shown in admin view */
  handler?: string;
  /** Handling history - shown in admin view */
  history: HistoryEntry[];
}

const INQUIRIES: Inquiry[] = [
  {
    id: "46656641",
    number: "46656641",
    subject: "How to contact Admissions",
    topic: "General",
    openDate: "19/07/2026",
    closeDate: "19/07/2026",
    status: "closed",
    channel: "Phone",
    files: [],
    handler: "Information & Support, Admissions",
    response:
      "Hi Olivia, you can contact us through the applicant portal or by calling the Admissions Centre on 1300 555 010. Good luck!",
    history: [
      {
        date: "19/07/2026",
        text: "Enquiry opened by phone",
        by: "Admissions Centre",
      },
      {
        date: "19/07/2026",
        text: "Final response sent and enquiry closed",
        by: "Emma Walsh",
      },
    ],
  },
  {
    id: "46658120",
    number: "46658120",
    subject: "Request to move my health appointment",
    topic: "Health & access needs",
    openDate: "12/09/2026",
    status: "inProgress",
    awaitingRecruit: "Please attach a signed request form",
    channel: "Online",
    files: [
      {
        id: "f1",
        name: "GP letter.pdf",
        kind: "doc",
      },
      { id: "f2", name: "Proof of identity.jpg", kind: "image" },
    ],
    handler: "Health & Access team, Admissions",
    history: [
      {
        date: "12/09/2026",
        text: "Enquiry opened by the applicant",
        by: "Applicant portal",
      },
      {
        date: "13/09/2026",
        text: "Enquiry routed to the Health & Access team",
        by: "Automatic routing",
      },
      {
        date: "14/09/2026",
        text: "Medical documents received and sent for review",
        by: "Liam Nguyen",
      },
    ],
  },
  {
    id: "46659003",
    number: "46659003",
    subject: "Question about the Harbourline Scholars Program",
    topic: "Scholarships",
    openDate: "21/09/2026",
    status: "received",
    channel: "Online",
    files: [],
    history: [
      {
        date: "21/09/2026",
        text: "Enquiry opened by the applicant",
        by: "Applicant portal",
      },
    ],
  },
];

/** Teams a reopened enquiry can be assigned to */
const TEAMS = [
  "Information & Support, Admissions",
  "Health & Access team, Admissions",
  "Scholarships team",
  "Student Wellbeing team",
  "Admissions Centre, Wattle Grove",
];

/**
 * A list inside a card: about 4 rows on mobile and 6 on desktop, then it
 * scrolls internally - so an enquiry with dozens of documents doesn't stretch the card.
 */
const LIST_SCROLL =
  "flex flex-col gap-2 w-full max-h-[200px] md:max-h-[280px] overflow-y-auto pe-1";

/** An open enquiry waiting for the applicant to act */
export const inquiryAwaitingApplicant = () =>
  INQUIRIES.find((i) => i.awaitingRecruit && i.status !== "closed");

const STATUS_LABELS: Record<InquiryStatus, string> = {
  received: "Received",
  inProgress: "In progress",
  closed: "Closed",
};

/** Today's date as DD/MM/YYYY - like the other dates on the page */
const today = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// ── Create form options ──────────────────────────────────────────────────────

const TOPICS: Record<string, string[]> = {
  "Selection & assessment": [
    "Selection day booking",
    "Request to defer assessment",
    "Appeal against results",
  ],
  Scholarships: [
    "Applying for the Scholars Program",
    "Study areas",
    "Payments and conditions",
  ],
  "Engineering & IT pathways": ["Applying", "Entry requirements"],
  "Health & access needs": [
    "Health & access needs form",
    "Health form - GP statement and eye test",
    "Request a review panel",
    "Request a support person for a booking",
    "Change a booking / send documents to cancel one",
  ],
  Wellbeing: [
    "Wellbeing documents",
    "Request a panel",
  ],
  "Student life": ["Accommodation", "Fees and payments", "Semester breaks"],
  "Alternative entry - volunteering/pathways": [
    "Community leadership",
    "Volunteering",
  ],
  General: [
    "Ways to contact us",
    "Update personal details",
    "General request",
  ],
  Surveys: ["Details check", "Interests survey"],
};
const MAIN_TOPICS = Object.keys(TOPICS);

const MAX_FILES = 10;

/**
 * The admin view (responding, reopening, managing documents) is built but
 * hidden for launch. To bring it back, just set this to true.
 */
const ADMIN_VIEW_ENABLED = false;

// ── Inquiry card ─────────────────────────────────────────────────────────────

function InfoPair({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-start min-w-0">
      <span className="text-[#171c23] text-[13px] opacity-50 whitespace-nowrap">
        {label}
      </span>
      <span className="text-[#171c23] text-[15px] whitespace-nowrap">
        {value}
      </span>
    </div>
  );
}

function InquiryStatusBadge({ inquiry }: { inquiry: Inquiry }) {
  if (inquiry.status === "closed")
    return (
      <StatusBadge variant="success" dot>
        Closed
      </StatusBadge>
    );
  if (inquiry.awaitingRecruit)
    return (
      <StatusBadge
        variant="warning"
        icon={<Paperclip size={13} className="shrink-0" />}
      >
        Waiting on you
      </StatusBadge>
    );
  if (inquiry.status === "inProgress")
    return (
      <StatusBadge
        variant="warning"
        icon={<Clock size={13} className="shrink-0" />}
      >
        In progress
      </StatusBadge>
    );
  return (
    <StatusBadge
      variant="neutral"
      icon={<Inbox size={13} className="shrink-0" />}
    >
      Received
    </StatusBadge>
  );
}

/** A file picked in the browser, as an enquiry document record */
const toInquiryFiles = (picked: File[]): InquiryFile[] =>
  picked.map((f, i) => ({
    id: `${Date.now()}-${i}`,
    name: f.name,
    kind: f.type.startsWith("image/") ? "image" : "doc",
    // In-browser URL, so the file can be shown in the viewer
    url: URL.createObjectURL(f),
  }));

function InquiryCard({
  inquiry,
  admin = false,
  onRespond,
  onReopen,
  onAddFiles,
  onSendForReview,
}: {
  inquiry: Inquiry;
  /** Admin view - adds the handler, history and handling actions */
  admin?: boolean;
  onRespond?: (response: string, status: InquiryStatus) => void;
  onReopen?: (team: string) => void;
  onAddFiles?: (files: File[]) => void;
  onSendForReview?: (files: File[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [respondOpen, setRespondOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [viewFile, setViewFile] = useState<InquiryFile | null>(
    null,
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const closed = inquiry.status === "closed";

  return (
    <div className="relative bg-white rounded-[10px] flex flex-col transition-shadow hover:[box-shadow:0_0_20px_0_rgba(0,143,240,0.2)]">
      {/* Header: subject + status badge. The after layer makes the whole card tappable */}
      <button
        onClick={() => (admin ? setOpen(!open) : setDetailsOpen(true))}
        className="p-5 flex items-start justify-between gap-3 text-left w-full after:absolute after:inset-0 after:rounded-[10px]"
      >
        <div className="flex flex-col items-start gap-1 min-w-0">
          <h3 className="font-bold text-[#171c23] text-[18px] text-left">
            {inquiry.subject}
          </h3>
          <span className="text-[#171c23] text-[13px] opacity-50">
            {inquiry.topic}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <InquiryStatusBadge inquiry={inquiry} />
          {admin && (
            <ChevronDown
              size={20}
              className={`text-[#171c23] shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          )}
        </div>
      </button>

      {/* Details - always visible */}
      <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-4">
        <InfoPair label="Enquiry number" value={inquiry.number} />
        <InfoPair
          label="Date opened"
          value={inquiry.openDate}
        />
        {closed && inquiry.closeDate && (
          <InfoPair label="Closed on" value={inquiry.closeDate} />
        )}
        <div className="flex flex-col items-start min-w-0">
          <span className="text-[#171c23] text-[13px] opacity-50 whitespace-nowrap">
            Attachments
          </span>
          <span className="flex items-center gap-1.5 text-[#171c23] text-[15px]">
            <Paperclip
              size={14}
              className="text-[#008ff0] shrink-0"
            />
            {inquiry.files.length > 0
              ? `${inquiry.files.length} files`
              : "No files attached"}
          </span>
        </div>
        {/* The handler - admin info, shown only in admin view */}
        {admin && (
          <InfoPair
            label="Handled by"
            value={inquiry.handler ?? "Not yet assigned"}
          />
        )}
      </div>

      {!admin && (
        <span className="px-5 pb-4 -mt-1 flex items-center gap-1 text-[#008ff0] text-[13px] font-semibold">
          Tap for more details
          <ChevronRight size={15} className="shrink-0" />
        </span>
      )}

      {/* Expanded content - admin view only; for the applicant the details open in a sheet */}
      {open && admin && (
        <div className="px-5 pb-5 flex flex-col gap-5 border-t border-[rgba(23,28,35,0.05)] pt-5">
          <div className="flex flex-col items-start gap-1">
            <span className="text-[#171c23] text-[13px] opacity-50">
              Channel
            </span>
            <span className="flex items-center gap-1.5 text-[#171c23] text-[15px] font-semibold">
              {inquiry.channel === "Phone" ? (
                <Phone size={15} className="text-[#008ff0] shrink-0" />
              ) : (
                <Globe size={15} className="text-[#008ff0] shrink-0" />
              )}
              {inquiry.channel}
            </span>
          </div>

          {inquiry.response ? (
            <div className="flex flex-col items-start gap-1">
              <span className="text-[#171c23] text-[13px] opacity-50">
                Response
              </span>
              <p className="text-[#171c23] text-[15px] font-semibold text-left leading-relaxed">
                {inquiry.response}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#171c23] text-[14px] opacity-60 bg-[#f5f5f7] rounded-[8px] px-4 py-3">
              <Clock size={15} className="text-[#008ff0] shrink-0" />
              Your enquiry is being handled. We'll update you here once there's a response.
            </div>
          )}

          {/* ── Admin view: history, documents and handling actions ── */}
          {admin && (
            <>
              {/* On desktop the history and documents share the row;
                  both lists are height-limited and scroll internally */}
              <div className="grid md:grid-cols-2 gap-5 md:gap-6">
                {/* Handling history */}
                <div className="flex flex-col items-start gap-2 min-w-0">
                  <span className="text-[#171c23] text-[13px] opacity-50">
                    Handling history
                  </span>
                  <ol className={LIST_SCROLL}>
                    {inquiry.history.map((h, i) => (
                      <li
                        key={`${h.date}-${i}`}
                        className="flex items-start gap-2.5 text-left"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#008ff0] shrink-0 mt-1.5" />
                        <span className="min-w-0">
                          <span className="block text-[#171c23] text-[14px]">
                            {h.text}
                          </span>
                          <span className="block text-[#171c23] text-[12px] opacity-50">
                            {h.date} · {h.by}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Enquiry documents - viewable inside the app only */}
                <div className="flex flex-col items-start gap-2 min-w-0">
                  <span className="text-[#171c23] text-[13px] opacity-50">
                    Enquiry documents
                  </span>
                  {inquiry.files.length === 0 ? (
                    <span className="text-[#171c23] text-[14px] opacity-60">
                      No documents attached
                    </span>
                  ) : (
                    <div className={LIST_SCROLL}>
                      {inquiry.files.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between gap-3 bg-[#f5f5f7] rounded-[8px] px-4 py-2.5"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            {f.kind === "image" ? (
                              <ImageIcon
                                size={15}
                                className="text-[#008ff0] shrink-0"
                              />
                            ) : (
                              <FileText
                                size={15}
                                className="text-[#008ff0] shrink-0"
                              />
                            )}
                            <span className="text-[#171c23] text-[14px] truncate">
                              {f.name}
                            </span>
                          </span>
                          <Button
                            variant="link"
                            onClick={() => setViewFile(f)}
                            className="shrink-0"
                          >
                            <Eye size={14} className="shrink-0" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Admin actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {closed ? (
                  <Button onClick={() => setReopenOpen(true)}>
                    <RotateCcw size={14} className="shrink-0" />
                    Reopen enquiry
                  </Button>
                ) : (
                  <Button onClick={() => setRespondOpen(true)}>
                    <Send size={14} className="shrink-0" />
                    Respond and update status
                  </Button>
                )}
                <Button
                  variant="tint"
                  onClick={() => fileInput.current?.click()}
                >
                  <Paperclip size={14} className="shrink-0" />
                  Attach document
                </Button>
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    if (picked.length) onAddFiles?.(picked);
                    e.target.value = "";
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {detailsOpen && (
        <InquiryDetailsDialog
          inquiry={inquiry}
          onClose={() => setDetailsOpen(false)}
          onSendForReview={onSendForReview}
        />
      )}
      {respondOpen && (
        <RespondDialog
          inquiry={inquiry}
          onClose={() => setRespondOpen(false)}
          onSubmit={(text, status) => {
            onRespond?.(text, status);
            setRespondOpen(false);
          }}
        />
      )}
      {reopenOpen && (
        <ReopenDialog
          inquiry={inquiry}
          onClose={() => setReopenOpen(false)}
          onSubmit={(team) => {
            onReopen?.(team);
            setReopenOpen(false);
          }}
        />
      )}
      {viewFile && (
        <FileViewerDialog
          file={viewFile}
          onClose={() => setViewFile(null)}
        />
      )}
    </div>
  );
}

// ── Admin dialogs ───────────────────────────────────────────────────────────

/** Give a final response and update the enquiry status (including closing it) */
function RespondDialog({
  inquiry,
  onClose,
  onSubmit,
}: {
  inquiry: Inquiry;
  onClose: () => void;
  onSubmit: (response: string, status: InquiryStatus) => void;
}) {
  const [text, setText] = useState(inquiry.response ?? "");
  const [status, setStatus] = useState<InquiryStatus>(
    inquiry.status === "received" ? "inProgress" : inquiry.status,
  );

  return (
    <Dialog
      title="Respond to enquiry"
      subtitle={`${inquiry.subject} · Enquiry ${inquiry.number}`}
      width={520}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={text.trim() === ""}
            onClick={() => onSubmit(text.trim(), status)}
          >
            <Send size={14} className="shrink-0" />
            Send response
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel required>Response to the applicant</FieldLabel>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Write the response the applicant will see"
            className={`${FIELD_CLASS} resize-none`}
          />
        </div>
        <SelectField
          label="Status after responding"
          value={STATUS_LABELS[status]}
          placeholder="Choose a status"
          options={(
            ["received", "inProgress", "closed"] as InquiryStatus[]
          ).map((s) => STATUS_LABELS[s])}
          onChange={(label) =>
            setStatus(
              (
                Object.keys(STATUS_LABELS) as InquiryStatus[]
              ).find((s) => STATUS_LABELS[s] === label) ??
                "inProgress",
            )
          }
        />
      </div>
    </Dialog>
  );
}

/** Reopen a closed enquiry and assign it to a team */
function ReopenDialog({
  inquiry,
  onClose,
  onSubmit,
}: {
  inquiry: Inquiry;
  onClose: () => void;
  onSubmit: (team: string) => void;
}) {
  const [team, setTeam] = useState(inquiry.handler ?? TEAMS[0]);

  return (
    <Dialog
      title="Reopen enquiry"
      subtitle={`${inquiry.subject} · Enquiry ${inquiry.number}`}
      width={480}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(team)}>
            <RotateCcw size={14} className="shrink-0" />
            Reopen
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-[#171c23] text-[14px] leading-relaxed opacity-70 text-left">
          The enquiry goes back to "In progress" and is assigned to the team
          you choose. The previous response stays in the handling history.
        </p>
        <SelectField
          label="Assign to team"
          value={team}
          placeholder="Choose a team"
          options={TEAMS}
          onChange={setTeam}
        />
      </div>
    </Dialog>
  );
}

/** View a document inside the app - no downloading or saving to the device */
function FileViewerDialog({
  file,
  onClose,
}: {
  file: InquiryFile;
  onClose: () => void;
}) {
  return (
    <Dialog
      title={file.name}
      subtitle="View only - the file can't be downloaded or saved"
      width={560}
      onClose={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <div
        // Block the context menu and text selection - viewing is in-app only
        onContextMenu={(e) => e.preventDefault()}
        className="select-none bg-[#f5f5f7] rounded-[10px] overflow-hidden h-[320px] sm:h-[420px] flex items-center justify-center"
      >
        {file.url && file.kind === "image" ? (
          <img
            src={file.url}
            alt={file.name}
            draggable={false}
            className="max-h-full max-w-full object-contain pointer-events-none"
          />
        ) : file.url ? (
          // toolbar=0 hides the PDF viewer's download/print bar
          <iframe
            src={`${file.url}#toolbar=0&navpanes=0`}
            title={file.name}
            className="w-full h-full border-0"
          />
        ) : (
          // A file from the sample data - there's no real file to show
          <div className="flex flex-col items-center justify-center gap-3 text-center px-6">
            <IconCircle size={64} bg="rgba(0,143,240,0.1)">
              {file.kind === "image" ? (
                <ImageIcon size={28} />
              ) : (
                <FileText size={28} />
              )}
            </IconCircle>
            <p className="font-semibold text-[#171c23] text-[15px]">
              {file.name}
            </p>
            <p className="flex items-center gap-1.5 text-[#171c23] text-[13px] opacity-60">
              <EyeOff size={14} className="shrink-0" />
              This file can only be viewed in the app
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
}

// ── Create inquiry dialog ────────────────────────────────────────────────────

/** The file upload area - shared by a new enquiry and adding to an existing one */
function FileUploadField({
  files,
  setFiles,
}: {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list);
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES));
  };

  return (
    <div>
      <FieldLabel>Upload files</FieldLabel>
      <p className="text-[#171c23] text-[13px] opacity-50 mb-2 leading-relaxed">
        You can attach up to {MAX_FILES} PDF / JPG files, up to 5MB
        in total.
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={files.length >= MAX_FILES}
        className="w-full flex items-center justify-center gap-2 bg-[#f5f5f7] border border-dashed border-[rgba(23,28,35,0.25)] rounded-[10px] px-4 py-4 text-[#171c23] text-[14px] opacity-70 hover:opacity-100 hover:border-[#008ff0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Paperclip size={16} className="shrink-0" />
        Drag files here or tap to choose
      </button>

      {files.length > 0 && (
        <div className="flex flex-col gap-2 mt-3">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center justify-between gap-2 bg-[#f5f5f7] rounded-[8px] px-3 py-2"
            >
              <span className="flex items-center gap-2 min-w-0 text-[#171c23] text-[14px]">
                <FileText
                  size={15}
                  className="text-[#008ff0] shrink-0"
                />
                <span className="truncate">{file.name}</span>
              </span>
              <button
                onClick={() =>
                  setFiles((prev) =>
                    prev.filter((_, idx) => idx !== i),
                  )
                }
                aria-label="Remove file"
                className="w-6 h-6 flex items-center justify-center text-[#171c23] opacity-50 hover:opacity-100 shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <span className="text-[13px] text-[#171c23] opacity-50">
            {files.length} of {MAX_FILES} files
          </span>
        </div>
      )}
    </div>
  );
}

/** All enquiry details, the handling history, and adding information for review */
function InquiryDetailsDialog({
  inquiry,
  onClose,
  onSendForReview,
}: {
  inquiry: Inquiry;
  onClose: () => void;
  onSendForReview?: (files: File[]) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [sent, setSent] = useState(false);
  const [viewFile, setViewFile] = useState<InquiryFile | null>(null);
  const closed = inquiry.status === "closed";
  const canSend = files.length > 0;

  if (sent) {
    return (
      <Dialog onClose={onClose} footer={<Button onClick={onClose}>Close</Button>}>
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <IconCircle size={64} bg="rgba(105,198,0,0.12)" color="#69c600">
            <Check size={30} />
          </IconCircle>
          <p className="font-bold text-[#171c23] text-[20px]">
            Sent for review
          </p>
          <p className="text-[#171c23] text-[14px] opacity-60 max-w-[320px] leading-relaxed">
            We've received your files. We'll update you here and by
            email once the review is done.
          </p>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      title={inquiry.subject}
      subtitle={inquiry.topic}
      width={560}
      onClose={onClose}
      footer={
        closed ? (
          <Button onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={!canSend}
              onClick={() => {
                onSendForReview?.(files);
                setSent(true);
              }}
            >
              <Send size={14} className="shrink-0" />
              Send for review
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-start gap-2">
          <InquiryStatusBadge inquiry={inquiry} />
          {!closed && inquiry.awaitingRecruit && (
            <p className="w-full rounded-[8px] bg-[rgba(224,112,0,0.1)] p-3 text-[#e07000] text-[14px] font-semibold text-left">
              {inquiry.awaitingRecruit}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <InfoPair label="Enquiry number" value={inquiry.number} />
          <InfoPair label="Date opened" value={inquiry.openDate} />
          {closed && inquiry.closeDate && (
            <InfoPair label="Closed on" value={inquiry.closeDate} />
          )}
          <InfoPair label="Channel" value={inquiry.channel} />
        </div>

        {inquiry.response ? (
          <div className="flex flex-col items-start gap-1">
            <span className="text-[#171c23] text-[13px] opacity-50">
              Response
            </span>
            <p className="text-[#171c23] text-[15px] font-semibold text-left leading-relaxed">
              {inquiry.response}
            </p>
          </div>
        ) : (
          !inquiry.awaitingRecruit && (
            <div className="flex items-center gap-2 text-[#171c23] text-[14px] bg-[#f5f5f7] rounded-[8px] px-4 py-3">
              <Clock size={15} className="text-[#008ff0] shrink-0" />
              Your enquiry is being handled. We'll update you here once there's a response.
            </div>
          )
        )}

        {inquiry.files.length > 0 && (
          <div className="flex flex-col gap-2">
            <FieldLabel>Enquiry documents</FieldLabel>
            {inquiry.files.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-3 bg-[#f5f5f7] rounded-[8px] px-3 py-2"
              >
                <span className="flex items-center gap-2 min-w-0 text-[#171c23] text-[14px]">
                  <FileText size={15} className="text-[#008ff0] shrink-0" />
                  <span className="truncate">{f.name}</span>
                </span>
                <Button
                  variant="link"
                  onClick={() => setViewFile(f)}
                  className="shrink-0"
                >
                  <Eye size={14} className="shrink-0" />
                  View
                </Button>
              </div>
            ))}
          </div>
        )}

        {!closed && <FileUploadField files={files} setFiles={setFiles} />}

        <div className="flex flex-col gap-2">
          <FieldLabel>Handling history</FieldLabel>
          <ol className="flex flex-col gap-3">
            {inquiry.history.map((h, i) => (
              <li
                key={`${h.date}-${i}`}
                className="flex items-start gap-2.5 text-left"
              >
                <span className="w-2 h-2 rounded-full bg-[#008ff0] shrink-0 mt-1.5" />
                <span className="min-w-0">
                  <span className="block text-[#171c23] text-[14px]">
                    {h.text}
                  </span>
                  <span className="block text-[#171c23] text-[12px] opacity-60">
                    {h.date}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {viewFile && (
        <FileViewerDialog
          file={viewFile}
          onClose={() => setViewFile(null)}
        />
      )}
    </Dialog>
  );
}

function CreateInquiryDialog({ onClose }: { onClose: () => void }) {
  const [mainTopic, setMainTopic] = useState<string | null>(null);
  const [subTopic, setSubTopic] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const subOptions = mainTopic ? TOPICS[mainTopic] : [];
  const valid =
    !!mainTopic && !!subTopic && text.trim() !== "";

  if (submitted) {
    return (
      <Dialog onClose={onClose} footer={<Button onClick={onClose}>Close</Button>}>
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <IconCircle size={64} bg="rgba(105,198,0,0.12)" color="#69c600">
            <Check size={30} />
          </IconCircle>
          <p className="font-bold text-[#171c23] text-[20px]">
            Enquiry sent
          </p>
          <p className="text-[#171c23] text-[14px] opacity-60 max-w-[320px] leading-relaxed">
            We've received your enquiry about {mainTopic} · {subTopic}.
            We'll update you here and by email once there's a response.
          </p>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      title="New enquiry"
      subtitle="Choose a topic, describe your request and attach files if needed"
      width={520}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid} onClick={() => setSubmitted(true)}>
            Send
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <SelectField
          label="Main topic"
          required
          value={mainTopic}
          placeholder="Choose a topic"
          options={MAIN_TOPICS}
          onChange={(v) => {
            setMainTopic(v);
            setSubTopic(null);
          }}
        />
        <SelectField
          label="Subtopic"
          required
          value={subTopic}
          placeholder={
            mainTopic ? "Choose a subtopic" : "Choose a main topic first"
          }
          options={subOptions}
          onChange={setSubTopic}
        />

        <div>
          <FieldLabel required>Your enquiry</FieldLabel>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) =>
                setText(e.target.value.slice(0, 400))
              }
              rows={4}
              placeholder="Describe your enquiry..."
              className={`${FIELD_CLASS} resize-none`}
            />
            <span className="absolute bottom-2.5 right-3 text-[12px] text-[rgba(23,28,35,0.4)]">
              {text.length}/400
            </span>
          </div>
        </div>

        <FileUploadField files={files} setFiles={setFiles} />
      </div>
    </Dialog>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type InquiryFilter = "all" | "open" | "closed";

export default function InquiriesPage({
  onNavigateHome,
}: {
  onNavigateHome?: () => void;
}) {
  const [filter, setFilter] = useState<InquiryFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  /** 1 = applicant view (default), 2 = admin view */
  const [role, setRole] = useState<1 | 2>(1);
  // The admin view is built but hidden until launch - to bring it back: true
  const admin = ADMIN_VIEW_ENABLED && role === 2;
  /** Enquiries are kept in state because admins can update them */
  const [inquiries, setInquiries] = useState<Inquiry[]>(INQUIRIES);

  /** Update one enquiry + log a line in the handling history */
  const updateInquiry = (
    id: string,
    change: Partial<Inquiry>,
    historyText: string,
  ) =>
    setInquiries((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              ...change,
              history: [
                ...q.history,
                {
                  date: today(),
                  text: historyText,
                  by: "Admissions admin",
                },
              ],
            }
          : q,
      ),
    );

  const counts = useMemo(
    () => ({
      all: inquiries.length,
      open: inquiries.filter((q) => q.status !== "closed").length,
      closed: inquiries.filter((q) => q.status === "closed")
        .length,
    }),
    [inquiries],
  );

  const visible = useMemo(
    () =>
      inquiries
        .filter((q) =>
          filter === "all"
            ? true
            : filter === "closed"
              ? q.status === "closed"
              : q.status !== "closed",
        )
        // Enquiries waiting on the applicant come first
        .sort(
          (a, b) =>
            Number(!a.awaitingRecruit) - Number(!b.awaitingRecruit),
        ),
    [filter, inquiries],
  );

  const filters: { key: InquiryFilter; label: string; count: number }[] =
    [
      { key: "all", label: "All", count: counts.all },
      { key: "open", label: "Open", count: counts.open },
      {
        key: "closed",
        label: "Closed",
        count: counts.closed,
      },
    ];

  return (
    <section className="px-4 sm:px-6 md:px-10 pt-8 pb-12">
      <div className={PAGE_CONTAINER}>

        {/* Heading + view switch; in the classic version the heading is in the hero, so no gap is needed */}
        <div className="flex flex-wrap items-center gap-3 has-[h2]:mb-5">
          <SectionHeading title="Enquiries" className="mb-0" heroTitle />
          {ADMIN_VIEW_ENABLED && (
            <LayoutSwitch
              value={role}
              onChange={setRole}
              labels={["Applicant", "Admin"]}
            />
          )}
        </div>

        {/* Filters + new enquiry on the same row */}
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {filters.map((f) => (
              <FilterChip
                key={f.key}
                active={filter === f.key}
                onClick={() => setFilter(f.key)}
                count={f.count}
              >
                {f.label}
              </FilterChip>
            ))}
          </div>
          <Button
            className="shrink-0"
            onClick={() => setCreateOpen(true)}
          >
            <span className="text-[16px] leading-none">+</span>
            New enquiry
          </Button>
        </div>

        {/* Enquiries list */}
        {visible.length === 0 ? (
          <div className="bg-white rounded-[10px] p-10 flex flex-col items-center gap-3 text-center">
            <IconCircle size={56} bg="rgba(0,143,240,0.08)">
              <Inbox size={24} />
            </IconCircle>
            <p className="font-bold text-[#171c23] text-[16px]">
              No enquiries to show
            </p>
            <p className="text-[#171c23] text-[14px] opacity-60">
              Enquiries you open will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {visible.map((inquiry) => (
              <InquiryCard
                key={inquiry.id}
                inquiry={inquiry}
                admin={admin}
                onRespond={(response, status) =>
                  updateInquiry(
                    inquiry.id,
                    {
                      response,
                      status,
                      closeDate:
                        status === "closed"
                          ? today()
                          : undefined,
                    },
                    status === "closed"
                      ? "Final response sent and enquiry closed"
                      : `Response sent and status changed to "${STATUS_LABELS[status]}"`,
                  )
                }
                onReopen={(team) =>
                  updateInquiry(
                    inquiry.id,
                    {
                      status: "inProgress",
                      closeDate: undefined,
                      handler: team,
                    },
                    `Enquiry reopened and assigned to ${team}`,
                  )
                }
                onAddFiles={(picked) =>
                  updateInquiry(
                    inquiry.id,
                    {
                      awaitingRecruit: undefined,
                      files: [
                        ...inquiry.files,
                        ...toInquiryFiles(picked),
                      ],
                    },
                    picked.length === 1
                      ? `Document attached: ${picked[0].name}`
                      : `${picked.length} documents attached`,
                  )
                }
                onSendForReview={(picked) =>
                  updateInquiry(
                    inquiry.id,
                    {
                      awaitingRecruit: undefined,
                      status: "inProgress",
                      files: [
                        ...inquiry.files,
                        ...toInquiryFiles(picked),
                      ],
                    },
                    "The applicant attached files and sent them for review",
                  )
                }
              />
            ))}
          </div>
        )}

        <AdBanner />
      </div>

      {createOpen && (
        <CreateInquiryDialog onClose={() => setCreateOpen(false)} />
      )}
    </section>
  );
}
