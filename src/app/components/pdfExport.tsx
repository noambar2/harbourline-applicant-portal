import { Download } from "lucide-react";
import { Button, type ButtonVariant } from "./primitives";

/**
 * Exports a survey's answers to a PDF, with no external dependency.
 * A clean print document (English, left to right) is built in a hidden
 * iframe, and the browser saves it as a PDF from there. The document title
 * is the suggested file name.
 */

export type PdfCell = string | number | null | undefined;

/** One table in the document - a title, column headings and rows */
export interface PdfTable {
  title?: string;
  columns: string[];
  rows: PdfCell[][];
}

const esc = (value: PdfCell) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** The signed-in applicant - fixed details in the demo */
export const CANDIDATE = { name: "Olivia Bennett" };

const pad = (n: number) => String(n).padStart(2, "0");

const today = () => {
  const d = new Date();
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** A readable file name, without characters that aren't allowed in file names */
export const answersFileName = (questionnaire: string) =>
  `${questionnaire} - applicant answers - ${today().replace(/\//g, "-")}`.replace(
    /[/\\:*?"<>|]/g,
    "-",
  );

const tableHtml = (table: PdfTable) => `
  ${table.title ? `<h2>${esc(table.title)}</h2>` : ""}
  <table>
    <thead>
      <tr>${table.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${table.rows
        .map(
          (row) =>
            `<tr>${table.columns
              .map(
                (_, i) =>
                  `<td${typeof row[i] === "number" ? ' class="num"' : ""}>${esc(
                    row[i],
                  )}</td>`,
              )
              .join("")}</tr>`,
        )
        .join("")}
    </tbody>
  </table>`;

function documentHtml({
  title,
  questionnaire,
  meta,
  tables,
}: {
  title: string;
  questionnaire: string;
  meta: [string, PdfCell][];
  tables: PdfTable[];
}) {
  return `<!doctype html>
<html lang="en-AU" dir="ltr">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
    color: #171c23;
    font-size: 11pt;
    line-height: 1.5;
  }
  header {
    border-bottom: 2px solid #008ff0;
    padding-bottom: 10px;
    margin-bottom: 14px;
  }
  h1 { font-size: 18pt; margin: 0 0 8px; }
  h2 { font-size: 13pt; margin: 18px 0 6px; }
  dl {
    display: grid;
    grid-template-columns: max-content max-content;
    justify-content: start;
    gap: 2px 14px;
    margin: 0;
    font-size: 10pt;
  }
  dt { font-weight: bold; }
  dd { margin: 0; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
    font-size: 10pt;
  }
  th, td {
    border: 1px solid rgba(23, 28, 35, 0.25);
    padding: 5px 7px;
    text-align: left;
    vertical-align: top;
  }
  th { background: #f0f4f8; font-weight: bold; }
  /* striped rows - a long row is easier to follow */
  tbody tr:nth-child(even) td { background: #fafbfc; }
  td.num { text-align: center; white-space: nowrap; }
  tr { page-break-inside: avoid; }
  thead { display: table-header-group; }
  footer {
    margin-top: 16px;
    padding-top: 8px;
    border-top: 1px solid rgba(23, 28, 35, 0.15);
    font-size: 9pt;
    color: rgba(23, 28, 35, 0.6);
  }
</style>
</head>
<body>
  <header>
    <h1>${esc(questionnaire)}</h1>
    <dl>
      <dt>Applicant</dt><dd>${esc(CANDIDATE.name)}</dd>
      <dt>Created</dt><dd>${today()} ${nowTime()}</dd>
      ${meta
        .map(
          ([label, value]) =>
            `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`,
        )
        .join("")}
    </dl>
  </header>
  ${tables.map(tableHtml).join("")}
  <footer>Created from My profile on the Harbourline University applicant portal. It lists the answers saved in the survey.</footer>
</body>
</html>`;
}

/** Opens the document in a hidden print frame - it is saved as a PDF from there */
export function printPdf(html: string) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText =
    "position:fixed;left:-9999px;top:0;width:0;height:0;border:0";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  const print = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    // Remove it only after the print dialog closes, or its content disappears
    setTimeout(() => frame.remove(), 1000);
  };

  if (doc.readyState === "complete") setTimeout(print, 60);
  else frame.onload = print;
}

export interface AnswersExport {
  /** The survey name - for the document heading and the file name */
  questionnaire: string;
  /** Column headings of the answers table */
  columns: string[];
  /** The answer rows, in column order */
  rows: PdfCell[][];
  /** Extra details at the top of the document (label + value) */
  meta?: [string, PdfCell][];
  /** Label for the row count at the top of the document */
  countLabel?: string;
  /** More tables after the answers table */
  extraTables?: PdfTable[];
}

/** Creates the PDF document of the applicant's answers */
export function exportAnswersPdf({
  questionnaire,
  columns,
  rows,
  meta = [],
  countLabel = "Answers",
  extraTables = [],
}: AnswersExport) {
  printPdf(
    documentHtml({
      title: answersFileName(questionnaire),
      questionnaire,
      meta: [[countLabel, rows.length], ...meta],
      tables: [
        { title: "Applicant's answers", columns, rows },
        ...extraTables,
      ],
    }),
  );
}

// ── The button ──────────────────────────────────────────────────────────────

/**
 * "Export to PDF" button - takes the applicant's answers and creates a document
 * to download. Shown on survey summaries and on task completion screens.
 */
export function ExportPdfButton({
  variant = "outline",
  label = "Export to PDF",
  className,
  disabled,
  ...data
}: AnswersExport & {
  variant?: ButtonVariant;
  label?: string;
  className?: string;
  disabled?: boolean;
}) {
  const empty = data.rows.length === 0;
  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      disabled={disabled || empty}
      title={
        empty
          ? "No answers to export yet"
          : "Export all your answers to a PDF"
      }
      onClick={() => exportAnswersPdf(data)}
    >
      <Download size={15} className="shrink-0" />
      {label}
    </Button>
  );
}
