import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  Eye,
  FileCheck,
  Landmark,
  LogOut,
  MapPin,
  MessageCircle,
  Paperclip,
  PenLine,
  Send,
  ShieldCheck,
  Signature,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";
import { Button, Dialog, IconCircle, ProgressBar } from "./primitives";
import { GLASS_CARD } from "./ui/utils";

/**
 * Details check in chat - instead of the "details check" step form on
 * enrolment day, the admissions assistant shows the applicant what's on
 * file, asks them to confirm or correct it, and fills in what's missing
 * with them. The chat is scripted (no server) - each step knows what to
 * show, which quick replies to offer and where to go next.
 * The design is borrowed from the admissions assistant, in portal colours.
 */

// ── Data ─────────────────────────────────────────────────────────────────────

interface Address {
  city: string;
  street: string;
  house: string;
  entrance: string;
  floor: string;
  apt: string;
  zip: string;
}

interface Relative {
  relation: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** null - not yet known whether they live at the same address */
  sameAddress: boolean | null;
  /** Free-text address, when they don't live at the same address */
  address: string;
}

type RelativeField = "phone" | "email" | "name" | "address";

interface Data {
  address: Address;
  phone: string;
  relatives: [Relative, Relative];
  bank: { name: string; branch: string; account: string; proof: string };
  adjustments: boolean | null;
  /** The contact being worked on, and the field being fixed */
  cursor: { rel: 0 | 1; field: RelativeField };
  /** Came from a fix in the summary - at the end of the topic, go back to the summary */
  fixing: boolean;
  /** Fields updated in the chat - marked on the cards */
  changed: string[];
}

const INITIAL_DATA: Data = {
  address: {
    city: "Bendigo",
    street: "Wattle Street",
    house: "32",
    entrance: "",
    floor: "",
    apt: "5",
    zip: "",
  },
  phone: "0412345678",
  relatives: [
    {
      relation: "Father",
      firstName: "Daniel",
      lastName: "Bennett",
      email: "dan@example.com",
      phone: "0423456789",
      sameAddress: false,
      address: "Unit 5, 32 Wattle Street, Bendigo",
    },
    {
      relation: "Mother",
      firstName: "Sarah",
      lastName: "Bennett",
      email: "",
      phone: "0434567890",
      sameAddress: null,
      address: "",
    },
  ],
  bank: { name: "", branch: "", account: "", proof: "" },
  adjustments: null,
  cursor: { rel: 0, field: "phone" },
  fixing: false,
  changed: [],
};

const SECTIONS = [
  { label: "Address & contact", icon: MapPin },
  { label: "Emergency contacts", icon: Users },
  { label: "Bank account", icon: Landmark },
  { label: "Study adjustments", icon: UserRound },
  { label: "Summary & signature", icon: Signature },
] as const;

const BANKS = [
  "Southern Cross Bank",
  "Harbour Bank",
  "Eucalypt Bank",
  "Coastal Mutual",
  "Red Gum Credit Union",
];

const DECLARATION =
  "I declare that all the details I have provided are true and accurate, and I understand I must tell Harbourline University about any change to them.";

// ── Value formatting ────────────────────────────────────────────────────────

const digits = (v: string) => v.replace(/\D/g, "");

const fmtPhone = (p: string) =>
  p.length === 10 ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : p;

function fmtAddress(a: Address) {
  const parts: string[] = [];
  if (a.apt) parts.push(`Unit ${a.apt}`);
  parts.push(`${a.house} ${a.street}`);
  if (a.entrance) parts.push(`Entrance ${a.entrance}`);
  parts.push(a.city);
  return parts.join(", ");
}

const fullName = (r: Relative) => `${r.firstName} ${r.lastName}`;

function relativeAddress(r: Relative, d: Data) {
  if (r.sameAddress === null) return "";
  return r.sameAddress ? `${fmtAddress(d.address)} (same as yours)` : r.address;
}

/** A "found" postcode for the address - fixed per address, for the demo */
function lookupZip(a: Address) {
  if (a.city === "Bendigo" && a.street === "Wattle Street") return "3550";
  let h = 7;
  for (const ch of `${a.city}${a.street}${a.house}`)
    h = (h * 31 + ch.charCodeAt(0)) % 9_000;
  return String(1_000 + h);
}

const YES = /^(yes|yeah|yep|correct|right|sure|definitely|confirm|great|sounds good|okay|ok|👍)/i;
const NO = /^(no|nope|not really|wrong|incorrect)/i;

// ── Messages ───────────────────────────────────────────────────────────────

interface BotMsg {
  text?: string;
  card?: ReactNode;
  /** The question - shown after the card, so it's clear what is being answered */
  ask?: string;
}

interface Msg extends BotMsg {
  id: number;
  role: "bot" | "user";
  /** Signature - shown as an image in the user's bubble */
  image?: string;
  /** Name of an uploaded file */
  file?: string;
}

/** **Bold** inside the message text */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={j} className="font-bold text-[#122736]">
                {part.slice(2, -2)}
              </strong>
            ) : (
              <Fragment key={j}>{part}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </>
  );
}

// ── Data cards inside the chat ─────────────────────────────────────────────────

/** More opaque glass than the chips - the data has to read clearly on the background */
const GLASS_PANEL =
  "bg-white/50 backdrop-blur-2xl backdrop-saturate-150 border border-white/70 shadow-[0_8px_32px_rgba(18,39,54,0.12)]";

interface Row {
  label: string;
  value: string;
  /** Key for the "Updated" mark */
  key?: string;
  optional?: boolean;
}

function DataCard({
  icon: Icon,
  title,
  rows,
  changed = [],
}: {
  icon: typeof MapPin;
  title: string;
  rows: Row[];
  changed?: string[];
}) {
  return (
    <div className={`mt-3 rounded-[14px] ${GLASS_PANEL} p-3.5 sm:p-4`}>
      <div className="flex items-center gap-2 mb-2.5">
        <IconCircle size={28}>
          <Icon size={14} />
        </IconCircle>
        <span className="font-bold text-[#171c23] text-[14px]">
          {title}
        </span>
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
        {rows.map((row) => {
          const isChanged = row.key && changed.includes(row.key);
          return (
            <div key={row.label} className="min-w-0">
              <dt className="text-[12px] text-[#171c23] opacity-55">
                {row.label}
              </dt>
              <dd className="text-[14px] font-semibold text-[#171c23] flex items-center gap-1.5 flex-wrap">
                {row.value ? (
                  <span className="break-words min-w-0">
                    {row.value}
                  </span>
                ) : row.optional ? (
                  <span className="font-normal opacity-40">—</span>
                ) : (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(224,112,0,0.1)] text-[#e07000]">
                    Missing
                  </span>
                )}
                {isChanged && (
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-[rgba(105,198,0,0.12)] text-[#4e9400]">
                    <Check size={11} />
                    Updated
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

const addressCard = (d: Data) => (
  <DataCard
    icon={MapPin}
    title="Main address"
    changed={d.changed}
    rows={[
      { label: "Suburb/town", value: d.address.city, key: "city" },
      { label: "Street", value: d.address.street, key: "street" },
      { label: "Street no.", value: d.address.house, key: "house" },
      {
        label: "Entrance",
        value: d.address.entrance,
        key: "entrance",
        optional: true,
      },
      { label: "Floor", value: d.address.floor, key: "floor" },
      { label: "Unit", value: d.address.apt, key: "apt", optional: true },
      { label: "Postcode", value: d.address.zip, key: "zip" },
    ]}
  />
);

const relativeCard = (d: Data, i: 0 | 1) => {
  const r = d.relatives[i];
  const k = (f: string) => `rel${i}.${f}`;
  return (
    <DataCard
      icon={Users}
      title={`Emergency contact ${i + 1}`}
      changed={d.changed}
      rows={[
        { label: "Relationship", value: r.relation },
        { label: "Full name", value: fullName(r), key: k("name") },
        { label: "Phone", value: fmtPhone(r.phone), key: k("phone") },
        { label: "Email", value: r.email, key: k("email") },
        {
          label: "Address",
          value: relativeAddress(r, d),
          key: k("address"),
        },
      ]}
    />
  );
};

const bankCard = (d: Data) => (
  <DataCard
    icon={Landmark}
    title="Bank account"
    rows={[
      { label: "Bank", value: d.bank.name },
      { label: "BSB", value: d.bank.branch },
      { label: "Account no.", value: d.bank.account },
      {
        label: "Proof",
        value: d.bank.proof || "Shown on enrolment day",
      },
    ]}
  />
);

function SummaryCard({ d }: { d: Data }) {
  const blocks = [
    {
      icon: MapPin,
      title: "Address & contact",
      lines: [
        `${fmtAddress(d.address)}${/^\d+$/.test(d.address.floor) ? `, floor ${d.address.floor}` : d.address.floor === "Ground floor" ? ", ground floor" : ""}`,
        `Postcode ${d.address.zip}`,
        `Mobile ${fmtPhone(d.phone)}`,
      ],
    },
    {
      icon: Users,
      title: "Emergency contacts",
      lines: d.relatives.map(
        (r) =>
          `${fullName(r)} (${r.relation}) · ${fmtPhone(r.phone)}`,
      ),
    },
    {
      icon: Landmark,
      title: "Bank account",
      lines: [
        `${d.bank.name} · BSB ${d.bank.branch} · Acc ${d.bank.account}`,
        d.bank.proof ? `Proof: ${d.bank.proof}` : "Proof shown on enrolment day",
      ],
    },
    {
      icon: UserRound,
      title: "Study adjustments",
      lines: [d.adjustments ? "Would like adjustments" : "Not needed"],
    },
  ];
  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {blocks.map(({ icon: Icon, title, lines }) => (
        <div
          key={title}
          className={`rounded-[14px] ${GLASS_PANEL} p-3.5 flex flex-col gap-1`}
        >
          <span className="flex items-center gap-2 font-bold text-[#171c23] text-[14px] mb-1">
            <Icon size={15} className="text-[#008ff0] shrink-0" />
            {title}
          </span>
          {lines.map((line) => (
            <span
              key={line}
              className="text-[13px] text-[#171c23] opacity-75 leading-snug"
            >
              {line}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── The script ─────────────────────────────────────────────────────────────

interface Option {
  label: string;
  value: string;
}

interface Result {
  data?: Data;
  reply?: BotMsg[];
  next: StepId;
}

interface Step {
  section: number;
  enter: (d: Data) => BotMsg[];
  options?: (d: Data) => Option[];
  /** Free-text field - without it, a choice from the options is expected */
  text?: {
    placeholder: string;
    numeric?: boolean;
    /** Error message, or null when the value is valid */
    validate?: (v: string) => string | null;
  };
  /** Special input instead of the field */
  special?: "file" | "signature" | "done";
  answer: (value: string, d: Data) => Result;
}

type StepId =
  | "addr"
  | "addrCity"
  | "addrStreet"
  | "addrApt"
  | "addrFloor"
  | "addrZip"
  | "phone"
  | "phoneNew"
  | "rel1"
  | "rel2Email"
  | "rel2Addr"
  | "rel2AddrText"
  | "rel2"
  | "relFixPick"
  | "relFixValue"
  | "bankName"
  | "bankBranch"
  | "bankAccount"
  | "bankProof"
  | "bankConfirm"
  | "adjust"
  | "summary"
  | "fixPick"
  | "sign"
  | "done";

const YES_NO: Option[] = [
  { label: "Yes, correct", value: "yes" },
  { label: "No, needs updating", value: "no" },
];

const mark = (d: Data, ...keys: string[]): Data => ({
  ...d,
  changed: [...new Set([...d.changed, ...keys])],
});

const setAddress = (d: Data, patch: Partial<Address>): Data =>
  mark(
    { ...d, address: { ...d.address, ...patch } },
    ...Object.keys(patch),
  );

const setRelative = (
  d: Data,
  i: 0 | 1,
  patch: Partial<Relative>,
  ...keys: string[]
): Data => {
  const relatives = [...d.relatives] as [Relative, Relative];
  relatives[i] = { ...relatives[i], ...patch };
  return mark(
    { ...d, relatives },
    ...keys.map((k) => `rel${i}.${k}`),
  );
};

/** End of a topic - move on to the next one, or back to the summary if we came from a fix */
const after = (d: Data, next: StepId): StepId =>
  d.fixing ? "summary" : next;

const validPhone = (v: string) =>
  /^04\d{8}$/.test(digits(v))
    ? null
    : "A mobile number needs 10 digits starting with 04, e.g. 0412 345 678.";

const validEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
    ? null
    : "That doesn't look like an email address - e.g. name@example.com.";

const RELATIVE_FIELDS: Record<RelativeField, string> = {
  phone: "Phone",
  email: "Email",
  name: "Name",
  address: "Address",
};

const STEPS: Record<StepId, Step> = {
  // ── Address & contact ──
  addr: {
    section: 0,
    enter: (d) => [
      {
        text: `Let's start with your address. I can see your main address is **${fmtAddress(d.address)}**.`,
        card: addressCard(d),
        ask: "Is that right?",
      },
    ],
    options: () => YES_NO,
    answer: (v, d) =>
      v === "yes"
        ? { next: "addrFloor", reply: [{ text: "Great." }] }
        : {
            next: "addrCity",
            reply: [{ text: "No problem, let's update it together." }],
          },
  },
  addrCity: {
    section: 0,
    enter: () => [{ text: "Which suburb or town do you live in now?" }],
    text: { placeholder: "e.g. Ballarat" },
    answer: (v, d) => ({
      data: setAddress(d, { city: v.trim() }),
      next: "addrStreet",
    }),
  },
  addrStreet: {
    section: 0,
    enter: () => [{ text: "What's the street name and number?" }],
    text: {
      placeholder: "e.g. 12 Smith Street",
      validate: (v) =>
        /\d/.test(v) && /[^\d\s]/.test(v)
          ? null
          : "I'm missing a street name or number. You could write, e.g.: 12 Smith Street",
    },
    answer: (v, d) => {
      const house = v.match(/\d+[a-z]?/i)?.[0] ?? "";
      const street = v
        .replace(house, "")
        .replace(/[,]/g, "")
        .trim();
      return {
        data: setAddress(d, { street, house, zip: "", floor: "" }),
        next: "addrApt",
      };
    },
  },
  addrApt: {
    section: 0,
    enter: () => [{ text: "And the unit number?" }],
    options: () => [{ label: "A house, no unit", value: "none" }],
    text: { placeholder: "Unit number", numeric: true },
    answer: (v, d) => ({
      data: setAddress(d, { apt: v === "none" ? "" : digits(v) }),
      next: "addrFloor",
    }),
  },
  addrFloor: {
    section: 0,
    enter: () => [{ text: "I'm missing the floor. Which floor do you live on?" }],
    options: () => [
      { label: "Ground floor", value: "0" },
      { label: "A house", value: "private" },
    ],
    text: { placeholder: "Floor number", numeric: true },
    answer: (v, d) => ({
      data: setAddress(d, {
        floor: v === "private" ? "House" : v === "0" ? "Ground floor" : digits(v),
      }),
      next: "addrZip",
    }),
  },
  addrZip: {
    section: 0,
    enter: () => [
      {
        text: "And the postcode? If you don't remember, I can find it from the address.",
      },
    ],
    options: () => [{ label: "Find it for me", value: "lookup" }],
    text: {
      placeholder: "4-digit postcode",
      numeric: true,
      validate: (v) =>
        digits(v).length === 4 ? null : "A postcode needs 4 digits.",
    },
    answer: (v, d) => {
      const zip = v === "lookup" ? lookupZip(d.address) : digits(v);
      const next = setAddress(d, { zip });
      return {
        data: next,
        reply: [
          {
            text:
              v === "lookup"
                ? `Found it - the postcode is **${zip}**. Here's the updated address:`
                : "Thanks! Here's the updated address:",
            card: addressCard(next),
          },
        ],
        next: "phone",
      };
    },
  },
  phone: {
    section: 0,
    enter: (d) => [
      {
        text: `The mobile number we have on file is **${fmtPhone(d.phone)}**. Is it still your number?`,
      },
    ],
    options: () => YES_NO,
    answer: (v, d) =>
      v === "yes"
        ? {
            next: after(d, "rel1"),
            reply: [{ text: "Address and phone are done ✓" }],
          }
        : { next: "phoneNew" },
  },
  phoneNew: {
    section: 0,
    enter: () => [{ text: "What's your current mobile number?" }],
    text: {
      placeholder: "04XX XXX XXX",
      numeric: true,
      validate: validPhone,
    },
    answer: (v, d) => ({
      data: mark({ ...d, phone: digits(v) }, "phone"),
      reply: [
        {
          text: `I've updated the number to **${fmtPhone(digits(v))}**. Address and phone are done ✓`,
        },
      ],
      next: after(d, "rel1"),
    }),
  },

  // ── Emergency contacts ──
  rel1: {
    section: 1,
    enter: (d) => [
      {
        text: "Now let's go through your emergency contacts - the people the university will contact if anything ever happens. We need two.",
      },
      {
        text: `Your first contact on file is **${fullName(d.relatives[0])} (${d.relatives[0].relation})**.`,
        card: relativeCard(d, 0),
        ask: "Are the details correct?",
      },
    ],
    options: () => YES_NO,
    answer: (v, d) =>
      v === "yes"
        ? {
            data: { ...d, cursor: { ...d.cursor, rel: 1 } },
            next: d.relatives[1].email ? "rel2" : "rel2Email",
          }
        : {
            data: { ...d, cursor: { ...d.cursor, rel: 0 } },
            next: "relFixPick",
          },
  },
  rel2Email: {
    section: 1,
    enter: (d) => [
      {
        text: `I've already found your second contact, **${fullName(d.relatives[1])} (${d.relatives[1].relation})** - but I'm missing her email address.`,
        card: relativeCard(d, 1),
        ask: "What's her email address?",
      },
    ],
    text: { placeholder: "name@example.com", validate: validEmail },
    answer: (v, d) => ({
      data: setRelative(d, 1, { email: v.trim() }, "email"),
      next: "rel2Addr",
    }),
  },
  rel2Addr: {
    section: 1,
    enter: (d) => [
      {
        text: `Thanks! Does ${d.relatives[1].firstName} live with you, at ${fmtAddress(d.address)}?`,
      },
    ],
    options: () => [
      { label: "Yes, same address", value: "yes" },
      { label: "No, another address", value: "no" },
    ],
    answer: (v, d) =>
      v === "yes"
        ? {
            data: setRelative(d, 1, { sameAddress: true }, "address"),
            next: "rel2",
          }
        : { next: "rel2AddrText" },
  },
  rel2AddrText: {
    section: 1,
    enter: (d) => [
      { text: `What's ${d.relatives[1].firstName}'s address?` },
    ],
    text: { placeholder: "Unit, street no., street and suburb" },
    answer: (v, d) => ({
      data: setRelative(
        d,
        1,
        { sameAddress: false, address: v.trim() },
        "address",
      ),
      next: "rel2",
    }),
  },
  rel2: {
    section: 1,
    enter: (d) => [
      {
        text: `Here are **${fullName(d.relatives[1])}**'s details:`,
        card: relativeCard(d, 1),
        ask: "All correct?",
      },
    ],
    options: () => YES_NO,
    answer: (v, d) =>
      v === "yes"
        ? {
            next: after(d, "bankName"),
            reply: [{ text: "Both emergency contacts are up to date ✓" }],
          }
        : {
            data: { ...d, cursor: { ...d.cursor, rel: 1 } },
            next: "relFixPick",
          },
  },
  relFixPick: {
    section: 1,
    enter: () => [{ text: "What needs fixing?" }],
    options: () =>
      (Object.keys(RELATIVE_FIELDS) as RelativeField[]).map((f) => ({
        label: RELATIVE_FIELDS[f],
        value: f,
      })),
    answer: (v, d) => ({
      data: { ...d, cursor: { ...d.cursor, field: v as RelativeField } },
      next: "relFixValue",
    }),
  },
  relFixValue: {
    section: 1,
    enter: (d) => {
      const r = d.relatives[d.cursor.rel];
      const prompts: Record<RelativeField, string> = {
        phone: `What's ${r.firstName}'s phone number?`,
        email: `What's ${r.firstName}'s email address?`,
        name: "What's the full name (first and last)?",
        address: `What's ${r.firstName}'s address?`,
      };
      return [{ text: prompts[d.cursor.field] }];
    },
    text: { placeholder: "Type the updated value" },
    answer: (v, d) => {
      const { rel, field } = d.cursor;
      const value = v.trim();
      const error =
        field === "phone"
          ? validPhone(value)
          : field === "email"
            ? validEmail(value)
            : field === "name" && value.split(/\s+/).length < 2
              ? "I need a first name and a last name."
              : null;
      if (error) return { reply: [{ text: error }], next: "relFixValue" };
      const [firstName, ...rest] = value.split(/\s+/);
      const patch: Partial<Relative> =
        field === "phone"
          ? { phone: digits(value) }
          : field === "email"
            ? { email: value }
            : field === "name"
              ? { firstName, lastName: rest.join(" ") }
              : { sameAddress: false, address: value };
      return {
        data: setRelative(d, rel, patch, field),
        reply: [{ text: "Updated." }],
        next:
          rel === 0
            ? "rel1"
            : d.relatives[1].email || field === "email"
              ? "rel2"
              : "rel2Email",
      };
    },
  },

  // ── Bank account ──
  bankName: {
    section: 2,
    enter: () => [
      {
        text: "So we can pay your scholarship, we need a bank account in your name. We don't have the details yet - so let's fill them in.",
      },
      { text: "Which bank is the account with?" },
    ],
    options: () => BANKS.map((b) => ({ label: b, value: b })),
    text: { placeholder: "Or type another bank's name" },
    answer: (v, d) => ({
      data: {
        ...d,
        bank: { ...d.bank, name: v.trim() },
      },
      next: "bankBranch",
    }),
  },
  bankBranch: {
    section: 2,
    enter: () => [
      {
        text: "What's the BSB? You'll find it on a bank statement or in your banking app.",
      },
    ],
    text: {
      placeholder: "6 digits",
      numeric: true,
      validate: (v) =>
        /^\d{6}$/.test(digits(v)) && /^[\d\s-]+$/.test(v.trim())
          ? null
          : "A BSB has 6 digits.",
    },
    answer: (v, d) => ({
      data: {
        ...d,
        bank: {
          ...d.bank,
          branch: `${digits(v).slice(0, 3)}-${digits(v).slice(3)}`,
        },
      },
      next: "bankAccount",
    }),
  },
  bankAccount: {
    section: 2,
    enter: () => [{ text: "And the account number?" }],
    text: {
      placeholder: "Account number",
      numeric: true,
      validate: (v) =>
        /^\d{6,10}$/.test(digits(v))
          ? null
          : "An account number has 6 to 10 digits.",
    },
    answer: (v, d) => ({
      data: { ...d, bank: { ...d.bank, account: digits(v) } },
      next: "bankProof",
    }),
  },
  bankProof: {
    section: 2,
    enter: () => [
      {
        text: "To verify the details we also need proof - a **bank statement** or an **account letter** from your bank.",
      },
    ],
    special: "file",
    options: () => [{ label: "I'll bring it on enrolment day", value: "later" }],
    answer: (v, d) =>
      v === "later"
        ? {
            data: { ...d, bank: { ...d.bank, proof: "" } },
            reply: [
              {
                text: "OK. Just don't forget to bring the proof on enrolment day.",
              },
            ],
            next: "bankConfirm",
          }
        : {
            data: { ...d, bank: { ...d.bank, proof: v } },
            reply: [{ text: "Got the file, thanks." }],
            next: "bankConfirm",
          },
  },
  bankConfirm: {
    section: 2,
    enter: (d) => [
      {
        text: "Here are the account details I've recorded:",
        card: bankCard(d),
        ask: "All correct?",
      },
    ],
    options: () => [
      { label: "Yes, correct", value: "yes" },
      { label: "No, start again", value: "no" },
    ],
    answer: (v, d) =>
      v === "yes"
        ? {
            next: after(d, "adjust"),
            reply: [{ text: "Bank details saved ✓" }],
          }
        : { next: "bankName" },
  },

  // ── Study adjustments ──
  adjust: {
    section: 3,
    enter: () => [
      {
        text: "Last question: would you like study adjustments? They're for students who need flexibility for health, disability or religious reasons.",
      },
    ],
    options: () => [
      { label: "No, not relevant", value: "no" },
      { label: "Yes, please", value: "yes" },
    ],
    answer: (v, d) => ({
      data: { ...d, adjustments: v === "yes" },
      reply:
        v === "yes"
          ? [
              {
                text: "Noted. The Admissions Centre will guide you on next steps and which documents to bring.",
              },
            ]
          : undefined,
      next: "summary",
    }),
  },

  // ── Summary & signature ──
  summary: {
    section: 4,
    enter: (d) => [
      {
        text: d.fixing
          ? "Updated. Here's the updated summary:"
          : "That's it, we've covered everything! Here's a summary of your details:",
        card: <SummaryCard d={d} />,
        ask: "All correct?",
      },
    ],
    options: () => [
      { label: "All correct, sign", value: "yes" },
      { label: "I want to fix something", value: "no" },
    ],
    answer: (v, d) =>
      v === "yes"
        ? { data: { ...d, fixing: false }, next: "sign" }
        : { next: "fixPick" },
  },
  fixPick: {
    section: 4,
    enter: () => [{ text: "What should we fix?" }],
    options: () => SECTIONS.slice(0, 4).map((s, i) => ({
      label: s.label,
      value: String(i),
    })),
    answer: (v, d) => ({
      data: { ...d, fixing: true, cursor: { ...d.cursor, rel: 0 } },
      next: (["addr", "rel1", "bankName", "adjust"] as StepId[])[
        Number(v)
      ],
    }),
  },
  sign: {
    section: 4,
    enter: () => [
      {
        text: `All that's left is to sign the declaration that your details are correct:\n**"${DECLARATION}"**`,
      },
    ],
    special: "signature",
    answer: () => ({
      reply: [
        {
          text: "Thanks Olivia! Your details have been checked and saved. On enrolment day you can skip the details check step.",
        },
      ],
      next: "done",
    }),
  },
  done: {
    section: 5,
    enter: () => [],
    special: "done",
    answer: () => ({ next: "done" }),
  },
};

// ── Draft - leaving and coming back picks up where you left off ──────────────────────────────

const draftStore: {
  started: boolean;
  msgs: Msg[];
  step: StepId;
  data: Data;
} = { started: false, msgs: [], step: "addr", data: INITIAL_DATA };

// ── Intro screen ───────────────────────────────────────────────────────────

/**
 * Glass - like the assessment results chips on the home page: the input and
 * quick replies float above the chat and the background gradient. On hover -
 * solid white with a blue glow.
 */
const GLASS = `${GLASS_CARD} hover:bg-white hover:shadow-[0_0_20px_0_rgba(0,143,240,0.25)]`;

const BRAND_GRADIENT =
  "linear-gradient(315deg, #008ff0 0%, #20aaf5 55%, #00d0ff 100%)";

function BotMark({ size = 40 }: { size?: number }) {
  return (
    <span
      className="rounded-full flex items-center justify-center shrink-0 text-white shadow-[0_6px_18px_-6px_rgba(0,143,240,0.6)]"
      style={{ width: size, height: size, background: BRAND_GRADIENT }}
    >
      <Sparkles size={size * 0.48} />
    </span>
  );
}

/** A small preview of the chat - beside the explanation on desktop */
function ChatPreview() {
  return (
    <div className="rounded-[20px] bg-[#f5f5f7] p-4 flex flex-col gap-2.5 text-[13px] select-none">
      <div className="px-1 text-[#171c23] leading-relaxed">
        I can see your main address is{" "}
        <strong className="text-[#122736]">
          32 Wattle Street, Bendigo
        </strong>
        . Is that right?
      </div>
      <div className="self-end bg-[#008ff0] text-white rounded-[16px] rounded-ee-[6px] px-3.5 py-2">
        No, we've moved
      </div>
      <div className="px-1 text-[#171c23] leading-relaxed">
        No problem, let's update it together. Which suburb or town do you live in now?
      </div>
      <div className="flex gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#008ff0] opacity-40" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#008ff0] opacity-60" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#008ff0] opacity-80" />
      </div>
    </div>
  );
}

const HOW_IT_WORKS = [
  {
    icon: Eye,
    title: "We show you what's on file",
    text: "The assistant goes through the details we already have for you.",
  },
  {
    icon: CheckCheck,
    title: "Confirm or correct",
    text: "Correct? Confirm with a tap. Something changed? Just type it.",
  },
  {
    icon: PenLine,
    title: "Fill in what's missing",
    text: "We fill in missing details together, then you sign digitally.",
  },
];

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex-1 w-full max-w-[960px] mx-auto py-8 md:py-12 grid md:grid-cols-[1fr_340px] gap-10 items-center">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-start gap-4">
          <span className="flex items-center gap-1.5 text-[12px] font-bold px-3 py-1 rounded-full bg-[rgba(105,198,0,0.14)] text-[#4e9400]">
            <Sparkles size={13} />
            New on the applicant portal
          </span>
          <div className="flex items-center gap-3">
            <BotMark size={48} />
            <h3 className="font-bold text-[#122736] text-[26px] sm:text-[30px] tracking-tight leading-tight">
              Details check in chat
              <span className="text-[#69c600]">.</span>
            </h3>
          </div>
          <p className="text-[#171c23] text-[16px] leading-relaxed text-left">
            Hi Olivia! Instead of filling in a long form on enrolment day,
            you can check your details now - in a short chat with the
            admissions assistant. When you reach the Admissions Centre, the
            details check step will already be done.
          </p>
        </div>

        <ol className="flex flex-col gap-3">
          {HOW_IT_WORKS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <IconCircle size={36}>
                <Icon size={17} />
              </IconCircle>
              <span className="flex flex-col text-left">
                <span className="font-semibold text-[#171c23] text-[15px]">
                  {title}
                </span>
                <span className="text-[#171c23] text-[13px] opacity-60 leading-snug">
                  {text}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-[#171c23] opacity-60">
            What we'll cover
          </span>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-[#171c23] bg-[#f5f5f7] rounded-full px-3 py-1.5"
              >
                <Icon size={14} className="text-[#008ff0]" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Button onClick={onStart} className="!px-6 !py-2.5 !text-[15px]">
            <MessageCircle size={16} className="shrink-0" />
            Let's start
          </Button>
          <span className="flex items-center gap-1.5 text-[13px] text-[#171c23] opacity-60">
            <Clock size={14} className="shrink-0" />
            About 5 minutes · you can stop and continue later
          </span>
        </div>

        <span className="flex items-center gap-1.5 text-[12px] text-[#171c23] opacity-50">
          <ShieldCheck size={13} className="shrink-0" />
          Your details are stored securely and used only by Harbourline Admissions.
        </span>
      </div>

      <div className="hidden md:block">
        <ChatPreview />
      </div>
    </div>
  );
}

// ── Signature ───────────────────────────────────────────────────────────────

function SignaturePad({ onSign }: { onSign: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  // The canvas uses the real pixel size, so the line stays sharp on retina screens
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#122736";
  }, []);

  const point = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top] as const;
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setEmpty(true);
  };

  return (
    <div className={`${GLASS_CARD} rounded-[20px] p-3 flex flex-col gap-2.5`}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-[#171c23]">
          Signature <span className="text-[#c43c3c]">*</span>
        </span>
        <Button variant="link" onClick={clear} disabled={empty}>
          Clear signature
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        aria-label="Signature area"
        className="w-full h-[120px] rounded-[12px] bg-white touch-none cursor-crosshair"
        onPointerDown={(e) => {
          drawing.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          const ctx = canvasRef.current!.getContext("2d")!;
          ctx.beginPath();
          ctx.moveTo(...point(e));
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = canvasRef.current!.getContext("2d")!;
          ctx.lineTo(...point(e));
          ctx.stroke();
          setEmpty(false);
        }}
        onPointerUp={() => (drawing.current = false)}
        onPointerLeave={() => (drawing.current = false)}
      />
      <Button
        onClick={() => onSign(canvasRef.current!.toDataURL("image/png"))}
        disabled={empty}
        className="self-end"
      >
        <Signature size={15} className="shrink-0" />
        Sign and send
      </Button>
    </div>
  );
}

// ── The chat ─────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function TypingIndicator() {
  return (
    <div
      className="flex gap-1.5 items-center px-1 py-2 self-start w-fit"
      role="status"
      aria-label="The assistant is typing"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[7px] h-[7px] rounded-full bg-[#008ff0] animate-[chat-bounce_1.1s_infinite]"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
  );
}

function MessageView({ msg }: { msg: Msg }) {
  if (msg.role === "user") {
    return (
      <div className="self-end max-w-[80%] animate-[chat-rise_.26s_ease-out_both]">
        <div className="bg-[#008ff0] text-white rounded-[20px] rounded-ee-[6px] px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
          {msg.image ? (
            <img
              src={msg.image}
              alt="Your signature"
              className="w-[220px] max-w-full h-auto bg-white rounded-[10px]"
            />
          ) : msg.file ? (
            <span className="flex items-center gap-2">
              <FileCheck size={16} className="shrink-0" />
              {msg.file}
            </span>
          ) : (
            msg.text
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="w-full animate-[chat-rise_.26s_ease-out_both]">
      {/* The assistant writes straight onto the screen - only the user's replies are in a bubble */}
      <div className="px-1 text-[16px] text-[#171c23] leading-relaxed">
        {msg.text && <Rich text={msg.text} />}
        {msg.card}
        {msg.ask && (
          <p className={msg.card ? "mt-3" : "mt-1"}>
            <Rich text={msg.ask} />
          </p>
        )}
      </div>
    </div>
  );
}

function Chat({
  onExit,
  onGoHome,
}: {
  onExit: () => void;
  onGoHome: () => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>(draftStore.msgs);
  const [stepId, setStepId] = useState<StepId>(draftStore.step);
  const [data, setData] = useState<Data>(draftStore.data);
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [exitOpen, setExitOpen] = useState(false);

  const streamRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const nextId = useRef(msgs.length);

  const step = STEPS[stepId];
  const section = Math.min(step.section, SECTIONS.length - 1);
  const done = stepId === "done";

  useEffect(() => {
    draftStore.msgs = msgs;
    draftStore.step = stepId;
    draftStore.data = data;
  }, [msgs, stepId, data]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // The chat sticks to the bottom on every change (new message, card, growing
  // reply area), unless the user has scrolled up - as in the admissions assistant
  const pinned = useRef(true);
  useEffect(() => {
    const el = streamRef.current!;
    const toBottom = () => {
      if (pinned.current) el.scrollTop = el.scrollHeight;
    };
    const onScroll = () => {
      pinned.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const mutations = new MutationObserver(toBottom);
    mutations.observe(el, { childList: true, subtree: true });
    const resize = new ResizeObserver(toBottom);
    resize.observe(el);
    toBottom();
    return () => {
      el.removeEventListener("scroll", onScroll);
      mutations.disconnect();
      resize.disconnect();
    };
  }, []);

  // The reply area floats above the chat, so the chat is padded by its height (varies by step)
  useEffect(() => {
    const composer = composerRef.current;
    const el = streamRef.current;
    if (!composer || !el) return;
    const sync = () => {
      el.style.setProperty("--composer-h", `${composer.offsetHeight}px`);
      if (pinned.current) el.scrollTop = el.scrollHeight;
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(composer);
    return () => observer.disconnect();
  }, [done]);

  // Every user message brings the chat back to the bottom
  useEffect(() => {
    pinned.current = true;
    const el = streamRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length]);

  // The reply area changes height (quick replies, file upload, signature) - pin
  // again before paint, so the last message isn't hidden underneath it
  useLayoutEffect(() => {
    const el = streamRef.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [busy, stepId, typing]);

  // Focus returns to the input when the assistant finishes typing
  useEffect(() => {
    if (!busy && step.text) inputRef.current?.focus();
  }, [busy, step.text]);

  const push = (msg: Omit<Msg, "id">) =>
    setMsgs((m) => [...m, { ...msg, id: nextId.current++ }]);

  /** The assistant "types" before each message - a short time that grows with its length */
  const say = async (list: BotMsg[]) => {
    for (const m of list) {
      if (!alive.current) return;
      setTyping(true);
      await delay(
        Math.min(450 + (m.text?.length ?? 0) * 7 + (m.card ? 250 : 0), 1300),
      );
      if (!alive.current) return;
      setTyping(false);
      push({ role: "bot", ...m });
      await delay(120);
    }
  };

  const go = async (reply: BotMsg[] | undefined, next: StepId, d: Data) => {
    setBusy(true);
    if (reply) await say(reply);
    if (!alive.current) return;
    setStepId(next);
    await say(STEPS[next].enter(d));
    setBusy(false);
  };

  // Opening the chat for the first time
  useEffect(() => {
    if (draftStore.started) return;
    draftStore.started = true;
    go(
      [
        { text: "Hi Olivia 👋 I'm the Harbourline admissions assistant." },
        {
          text: "I'll show you the details we have on file for you - all you need to do is confirm, correct or fill in what's missing.",
        },
      ],
      "addr",
      data,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const options = step.options?.(data) ?? [];

  const respond = (value: string, label: string, extra?: Partial<Msg>) => {
    if (busy || done) return;
    push({ role: "user", text: label, ...extra });
    setDraft("");
    const result = step.answer(value, data);
    const d = result.data ?? data;
    setData(d);
    if (result.next === stepId) {
      // Staying on the same step (e.g. an invalid value) - just the reply, without asking again
      setBusy(true);
      say(result.reply ?? []).then(() => setBusy(false));
      return;
    }
    go(result.reply, result.next, d);
  };

  /** Free text - matched to one of the quick replies, or checked as a value */
  const submitText = (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;

    const byLabel = options.find((o) => o.label === text);
    if (byLabel) return respond(byLabel.value, byLabel.label);

    const hasYesNo = options.some((o) => o.value === "yes");
    if (hasYesNo && YES.test(text)) return respond("yes", text);
    if (hasYesNo && NO.test(text)) return respond("no", text);

    if (!step.text) {
      push({ role: "user", text });
      setDraft("");
      setBusy(true);
      say([
        {
          text: "I'm not sure I understood. You can pick one of the answers above the typing bar.",
        },
      ]).then(() => setBusy(false));
      return;
    }

    const error = step.text.validate?.(text);
    if (error) {
      push({ role: "user", text });
      setDraft("");
      setBusy(true);
      say([{ text: error }]).then(() => setBusy(false));
      return;
    }
    respond(text, text);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitText(draft);
  };

  const leave = () => {
    setExitOpen(false);
    onExit();
  };

  const finish = (goHome: boolean) => {
    draftStore.started = false;
    draftStore.msgs = [];
    draftStore.step = "addr";
    draftStore.data = INITIAL_DATA;
    if (goHome) onGoHome();
    else onExit();
  };

  const placeholder = busy
    ? "The assistant is typing…"
    : step.text?.placeholder ?? "Pick an answer or type…";

  return (
    <section className="relative flex flex-col h-[calc(100dvh-64px)] md:h-[calc(100dvh-98px)]">
      {/* Header: task name, exit and chat steps */}
      <div className="bg-white/90 backdrop-blur-md border-b border-[rgba(23,28,35,0.06)] px-4 sm:px-6 md:px-10 py-3 shrink-0">
        <div className="max-w-[760px] mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 min-w-0">
              <BotMark size={30} />
              <span className="flex flex-col leading-tight min-w-0">
                <span className="font-semibold text-[#171c23] text-[14px]">
                  Details check
                </span>
                <span className="text-[12px] text-[#171c23] opacity-55 truncate">
                  {done
                    ? "Completed"
                    : `Step ${section + 1} of ${SECTIONS.length} · ${SECTIONS[section].label}`}
                </span>
              </span>
            </span>
            {!done && (
              <button
                type="button"
                onClick={() => setExitOpen(true)}
                className="flex items-center gap-1.5 text-[#171c23] text-[13px] font-semibold opacity-60 hover:opacity-100 shrink-0"
              >
                <LogOut size={14} className="shrink-0" />
                Exit
              </button>
            )}
          </div>
          <ProgressBar
            value={done ? 100 : (section / SECTIONS.length) * 100 + 4}
          />
        </div>
      </div>

      {/* The chat */}
      <div
        ref={streamRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 md:px-10 pt-6 pb-[calc(var(--composer-h,140px)+16px)]"
        role="log"
        aria-live="polite"
      >
        <div className="max-w-[760px] mx-auto flex flex-col gap-4">
          {msgs.map((m) => (
            <MessageView key={m.id} msg={m} />
          ))}
          {typing && <TypingIndicator />}
          {done && !typing && (
            <div className="flex flex-col items-center gap-3 py-6 text-center animate-[chat-rise_.26s_ease-out_both]">
              <IconCircle size={64} bg="rgba(105,198,0,0.12)" color="#69c600">
                <Check size={30} />
              </IconCircle>
              <span className="font-bold text-[#122736] text-[22px] tracking-tight">
                Details checked successfully
                <span className="text-[#69c600]">.</span>
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={() => finish(false)}>
                  Back to tasks
                </Button>
                <Button onClick={() => finish(true)}>
                  Go to home
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reply area: quick replies + input / file upload / signature */}
      {!done && (
        <div
          ref={composerRef}
          className="absolute inset-x-0 bottom-0 z-10 px-4 sm:px-6 md:px-10 pb-4 pt-8 pointer-events-none"
        >
          <div className="max-w-[760px] mx-auto flex flex-col gap-2 pointer-events-auto">
            {step.special === "signature" ? (
              !busy && (
                <SignaturePad
                  onSign={(url) =>
                    respond("signed", "", { image: url })
                  }
                />
              )
            ) : (
              <>
                {options.length > 0 && !busy && (
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label="Quick replies"
                  >
                    {options.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => respond(o.value, o.label)}
                        className={`shrink-0 rounded-full ${GLASS} text-[#171c23] text-[14px] font-semibold px-4 py-2 transition-all active:scale-[.97] animate-[chat-rise_.26s_ease-out_both]`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}

                {step.special === "file" && !busy && (
                  <>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) respond(f.name, "", { file: f.name });
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className={`flex items-center justify-center gap-2 rounded-[20px] ${GLASS} text-[#008ff0] text-[14px] font-semibold px-4 py-4 transition-all`}
                    >
                      <Paperclip size={16} className="shrink-0" />
                      Upload a bank statement or account letter
                    </button>
                  </>
                )}

                {step.special !== "file" && (
                  <form
                    onSubmit={onSubmit}
                    className={`flex items-center gap-2 ${GLASS} rounded-full ps-5 pe-1.5 py-1.5 transition-all focus-within:bg-white focus-within:border-[rgba(0,143,240,0.4)] focus-within:shadow-[0_0_20px_0_rgba(0,143,240,0.25)]`}
                  >
                    <input
                      ref={inputRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      disabled={busy}
                      placeholder={placeholder}
                      inputMode={step.text?.numeric ? "numeric" : "text"}
                      aria-label="Answer"
                      className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-[#171c23] placeholder:text-[rgba(23,28,35,0.4)] py-1.5"
                    />
                    <button
                      type="submit"
                      disabled={busy || !draft.trim()}
                      aria-label="Send"
                      className="w-10 h-10 rounded-full bg-[#008ff0] text-white flex items-center justify-center shrink-0 transition-all hover:bg-[#0080d6] active:scale-95 disabled:opacity-40"
                    >
                      <Send size={17} />
                    </button>
                  </form>
                )}
              </>
            )}
            {/* The note is hidden on mobile - saves space above the keyboard */}
            <p className="hidden sm:block text-center text-[11.5px] text-[#171c23] opacity-45">
              The assistant shows the details on file. Changes are only
              saved once you sign at the end of the chat.
            </p>
          </div>
        </div>
      )}

      {exitOpen && (
        <Dialog
          onClose={() => setExitOpen(false)}
          width={420}
          title="Leave the details check?"
          footer={
            <>
              <Button variant="outline" onClick={() => setExitOpen(false)}>
                Keep chatting
              </Button>
              <Button variant="primary" onClick={leave}>
                Exit
              </Button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <BotMark size={40} />
            <p className="text-[#171c23] text-[14px] leading-relaxed text-left">
              Your chat will be saved, and next time we'll pick up exactly
              where you left off.
            </p>
          </div>
        </Dialog>
      )}
    </section>
  );
}

// ── The page ────────────────────────────────────────────────────────────────

export default function DataVerificationChatPage({
  onExit,
  onGoHome,
}: {
  onExit: () => void;
  onGoHome: () => void;
}) {
  // Anyone who already started a chat goes straight back to it
  const [started, setStarted] = useState(draftStore.started);

  if (started) return <Chat onExit={onExit} onGoHome={onGoHome} />;

  return (
    <div className="flex flex-col flex-1 bg-white">
      <div className="px-4 sm:px-6 md:px-10 pt-6">
        <nav className="flex items-center gap-1.5 text-[14px]">
          <button
            type="button"
            onClick={onExit}
            className="text-[#008ff0] font-semibold hover:underline underline-offset-4"
          >
            Tasks
          </button>
          <ChevronRight size={14} className="text-[#171c23] opacity-40 shrink-0" />
          <span className="text-[#171c23] opacity-70">Details check</span>
        </nav>
      </div>
      <section className="px-4 sm:px-6 md:px-10 flex flex-col flex-1">
        <IntroScreen onStart={() => setStarted(true)} />
      </section>
    </div>
  );
}
