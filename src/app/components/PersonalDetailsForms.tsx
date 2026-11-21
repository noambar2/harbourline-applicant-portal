import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eraser,
  ShieldCheck,
  ShieldOff,
  UserPlus,
} from "lucide-react";
import {
  Button,
  Dialog,
  StatusBadge,
  TextField,
  SelectField,
} from "./primitives";

// ── Types ───────────────────────────────────────────────────────────────────

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  mailingAddress: string;
}

export interface Parent {
  id: string;
  relation: string;
  name: string;
  nationalId: string;
  phone: string;
  email: string;
  address: string;
  authorized: boolean;
}

export interface Companion {
  id: string;
  type: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  email: string;
  authorized: boolean;
}

/** Available support person types */
export const COMPANION_TYPES = [
  "Family member",
  "Social worker",
  "Careers adviser",
  "Lawyer",
  "Teacher",
  "School or college",
  "Local council representative",
  "Community organisation",
  "Family friend",
];

export const MAX_COMPANIONS = 2;

// ── Contact info edit ───────────────────────────────────────────────────────

export function ContactEditDialog({
  contact,
  onSave,
  onClose,
}: {
  contact: ContactInfo;
  onSave: (c: ContactInfo) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ContactInfo>(contact);
  const set = (k: keyof ContactInfo) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const valid =
    form.phone.trim() !== "" && form.email.trim() !== "";

  return (
    <Dialog
      title="Edit contact details"
      subtitle="We'll use these details to contact you about your application"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onSave(form);
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField
            label="Phone"
            value={form.phone}
            onChange={set("phone")}
            type="tel"
            dir="ltr"
          />
          <TextField
            label="Email"
            value={form.email}
            onChange={set("email")}
            type="email"
            dir="ltr"
          />
        </div>
        <TextField
          label="Address"
          value={form.address}
          onChange={set("address")}
          placeholder="Street, suburb, state, postcode"
        />
        <TextField
          label="Postal address"
          value={form.mailingAddress}
          onChange={set("mailingAddress")}
          placeholder="Street, suburb, state, postcode"
        />
      </div>
    </Dialog>
  );
}

// ── Parent edit ─────────────────────────────────────────────────────────────

export function ParentEditDialog({
  parent,
  onSave,
  onClose,
}: {
  parent: Parent;
  onSave: (p: Parent) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Parent>(parent);
  const set = (k: keyof Parent) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const valid =
    form.name.trim() !== "" && form.nationalId.trim() !== "";

  return (
    <Dialog
      title={`Edit ${parent.relation.toLowerCase()}'s details`}
      subtitle="Update the parent details shown in My profile"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onSave(form);
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField
            label="Full name"
            value={form.name}
            onChange={set("name")}
          />
          <TextField
            label="Licence no."
            value={form.nationalId}
            onChange={set("nationalId")}
            dir="ltr"
          />
          <TextField
            label="Phone"
            value={form.phone}
            onChange={set("phone")}
            type="tel"
            dir="ltr"
          />
          <TextField
            label="Email"
            value={form.email}
            onChange={set("email")}
            type="email"
            dir="ltr"
          />
        </div>
        <TextField
          label="Residential address"
          value={form.address}
          onChange={set("address")}
          placeholder="Street, suburb, state, postcode"
        />
      </div>
    </Dialog>
  );
}

// ── Signature pad ───────────────────────────────────────────────────────────

function SignaturePad({
  signed,
  onSignedChange,
}: {
  signed: boolean;
  onSignedChange: (v: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // In dark mode, sign with light ink
    ctx.strokeStyle = canvas.closest(".dark")
      ? "#eaf0f5"
      : "#171c23";
  }, []);

  const point = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleDown = (e: React.PointerEvent) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = point(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!signed) onSignedChange(true);
  };

  const handleUp = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSignedChange(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[#171c23] text-[13px] opacity-50">
          Signature
        </span>
        <button
          onClick={clear}
          className="flex items-center gap-1 text-[#008ff0] text-[13px] font-semibold hover:underline"
        >
          <Eraser size={13} />
          Clear
        </button>
      </div>
      <div className="relative bg-[#f5f5f7] border border-[rgba(23,28,35,0.1)] rounded-[8px] overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerLeave={handleUp}
          className="w-full h-[130px] block cursor-crosshair touch-none"
        />
        {!signed && (
          <span className="absolute inset-0 flex items-center justify-center text-[#171c23] text-[14px] opacity-35 pointer-events-none">
            Sign here with your mouse or finger
          </span>
        )}
      </div>
    </div>
  );
}

// ── Companion create / edit wizard ──────────────────────────────────────────

const TERMS_TEXT = `I declare and confirm that:

1. I wish to give the support person named above access to My profile on the Harbourline University applicant portal.
2. This access lets the support person view my personal details, assessment results, bookings and open tasks, and help me through my application with Harbourline University.
3. I understand the support person cannot act on my behalf where personal verification is needed, including confirming attendance at a booking or signing forms.
4. I give this access of my own free will, and I can withdraw it at any time through My profile, without giving a reason.
5. I confirm the details I have provided about the support person are correct, and that the support person has agreed to me sharing them.
6. I understand that providing false information may be an offence under the law.

My signature below confirms all of the above.`;

export function CompanionWizard({
  companion,
  onSave,
  onClose,
}: {
  companion?: Companion;
  onSave: (c: Companion) => void;
  onClose: () => void;
}) {
  const isEdit = !!companion;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Companion>(
    companion ?? {
      id: `companion-${Date.now()}`,
      type: "",
      firstName: "",
      lastName: "",
      nationalId: "",
      phone: "",
      email: "",
      authorized: true,
    },
  );
  const [agreed, setAgreed] = useState(false);
  const [signed, setSigned] = useState(false);

  const set = (k: keyof Companion) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const detailsValid =
    form.type !== "" &&
    form.firstName.trim() !== "" &&
    form.lastName.trim() !== "" &&
    form.nationalId.trim() !== "" &&
    form.phone.trim() !== "" &&
    form.email.trim() !== "";

  const stepTitles = [
    "Support person details",
    "Terms and signature",
    "",
  ];

  // ── Step 3: success ──
  if (step === 3) {
    return (
      <Dialog
        title=""
        onClose={onClose}
        footer={
          <Button onClick={onClose}>Close</Button>
        }
      >
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <div className="w-16 h-16 rounded-full bg-[rgba(105,198,0,0.12)] flex items-center justify-center">
            <Check size={30} className="text-[#4e9400]" />
          </div>
          <p className="font-bold text-[#171c23] text-[20px]">
            {isEdit
              ? "Support person updated"
              : "Support person added"}
          </p>
          <p className="text-[#171c23] text-[14px] opacity-60 max-w-[320px] leading-relaxed">
            {form.firstName} {form.lastName} ({form.type})
            {isEdit
              ? " — the details have been updated in My profile."
              : " has been added to your support people and portal access is on."}
          </p>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      title={
        isEdit ? "Edit support person" : "Add support person"
      }
      subtitle={`Step ${step} of 2 · ${stepTitles[step - 1]}`}
      width={step === 2 ? 560 : 480}
      onClose={onClose}
      footer={
        step === 1 ? (
          <>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              disabled={!detailsValid}
              onClick={() => setStep(2)}
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ChevronLeft size={16} />
              Back
            </Button>
            <Button
              disabled={!agreed || !signed}
              onClick={() => {
                onSave(form);
                setStep(3);
              }}
            >
              Finish
            </Button>
          </>
        )
      }
    >
      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <SelectField
            label="Support person type"
            value={form.type}
            onChange={set("type")}
            options={COMPANION_TYPES}
            placeholder="Choose a type"
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField
              label="First name"
              value={form.firstName}
              onChange={set("firstName")}
            />
            <TextField
              label="Last name"
              value={form.lastName}
              onChange={set("lastName")}
            />
            <TextField
              label="ID number"
              value={form.nationalId}
              onChange={set("nationalId")}
              dir="ltr"
            />
            <TextField
              label="Mobile"
              value={form.phone}
              onChange={set("phone")}
              type="tel"
              dir="ltr"
            />
          </div>
          <TextField
            label="Email"
            value={form.email}
            onChange={set("email")}
            type="email"
            dir="ltr"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Terms */}
          <div>
            <span className="text-[#171c23] text-[13px] opacity-50">
              Support person access terms
            </span>
            <div className="mt-1.5 bg-[#f5f5f7] border border-[rgba(23,28,35,0.1)] rounded-[8px] p-4 max-h-[190px] overflow-y-auto">
              <p className="text-[#171c23] text-[14px] leading-relaxed whitespace-pre-line">
                {TERMS_TEXT}
              </p>
            </div>
          </div>

          {/* Read confirmation */}
          <button
            onClick={() => setAgreed(!agreed)}
            className="flex items-start gap-2.5 text-left"
          >
            <span
              className={`w-5 h-5 rounded-[8px] flex items-center justify-center shrink-0 border transition-colors mt-0.5 ${
                agreed
                  ? "bg-[#69c600] border-[#69c600]"
                  : "bg-white border-[rgba(23,28,35,0.25)]"
              }`}
            >
              {agreed && <Check size={13} className="text-white" />}
            </span>
            <span className="text-[#171c23] text-[14px] leading-relaxed">
              I've read the terms and agree to them
            </span>
          </button>

          {/* Signature */}
          <SignaturePad
            signed={signed}
            onSignedChange={setSigned}
          />
        </div>
      )}
    </Dialog>
  );
}

// ── Site permissions block (bottom of each parent / companion) ──────────────

export function AuthPermissionsBlock({
  authorized,
  onToggle,
}: {
  authorized: boolean;
  onToggle: () => void;
}) {
  return (
    // Built like a field: label on top, with the chip below and the action button to its right
    <div className="flex flex-col items-start gap-1">
      <span className="text-[#171c23] text-[13px] opacity-50 whitespace-nowrap">
        Portal access
      </span>
      <div className="flex items-center gap-2">
        <StatusBadge
          variant={authorized ? "success" : "neutral"}
          dot
        >
          {authorized ? "Access granted" : "Access removed"}
        </StatusBadge>
        <Button
          variant={authorized ? "linkDanger" : "link"}
          onClick={onToggle}
        >
          {authorized ? (
            <>
              <ShieldOff size={13} className="shrink-0" />
              Remove access
            </>
          ) : (
            <>
              <ShieldCheck size={13} className="shrink-0" />
              Grant access
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ── "Add support person" button ──────────────────────────────────────────────────

export function AddCompanionBtn({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      title={
        disabled ? `You can add up to ${MAX_COMPANIONS} support people` : undefined
      }
    >
      <UserPlus size={14} className="shrink-0" />
      Add support person
    </Button>
  );
}
