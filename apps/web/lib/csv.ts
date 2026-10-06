/**
 * The board as a spreadsheet.
 *
 * Deliberately in pieces: `boardApplications` puts the cards in board order and
 * `toCsv` turns applications into the text a file holds, neither needing a
 * browser, so what the user ends up with can be checked without one.
 * `downloadApplicationsCsv` is the thin wrapper that hands that text over.
 *
 * Nothing here reads the store or holds state. The board already holds every
 * application, so an export is a read of what is on screen rather than a second
 * source of truth that could drift from it.
 */

import {
  STATUSES,
  STATUS_META,
  type Application,
  type BoardState,
} from "./applications";
import { shortDate, toDateInputValue } from "./date";

const COLUMNS = [
  "Company",
  "Role",
  "Status",
  "Location",
  "Salary",
  "Job URL",
  "Job description",
  "CV file",
  "Applied",
  "Last activity",
  "Notes",
] as const;

// Excel reads a file without a byte order mark as the system codepage, which
// turns "€95k" and "·" into mojibake. The mark is invisible and costs three bytes.
const BYTE_ORDER_MARK = "\uFEFF";

// One application as a row, in the order the columns are declared.
function row(
  application: Application,
  titles: Record<Application["status"], string>,
): string[] {
  return [
    application.company,
    application.role,
    titles[application.status],
    application.location,
    application.salary,
    application.jobUrl,
    application.jobDescription,
    application.cvFileName,
    toDateInputValue(application.appliedAt),
    toDateInputValue(application.lastActivityAt),
    noteLines(application),
  ];
}

// oldest first notes
function noteLines(application: Application): string {
  return application.notes
    .map((note) => `${shortDate(note.createdAt)}: ${note.body}`)
    .reverse()
    .join("\n");
}

/**
 * Every field is quoted, which is what makes the rest of the format fall out:
 * a location with a comma, a salary with a euro sign and a note with a quote in
 * it all need no case of their own beyond doubling the quote.
 */
function field(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function line(values: string[]): string {
  return values.map(field).join(",");
}

/**
 * The board's own order: column by column, top to bottom. The API already
 * returns applications in that order, so walking the columns rather than the map
 * keeps a card that was dragged to the top of its column at the top of its
 * section in the file too.
 */
export function boardApplications(board: BoardState): Application[] {
  const ordered: Application[] = [];

  for (const status of STATUSES) {
    for (const id of board.columns[status]) {
      const application = board.applications[id];
      if (application) {
        ordered.push(application);
      }
    }
  }

  return ordered;
}

/// Applications as CSV text, headings included. No applications is still a valid file.
export function toCsv(
  applications: Application[],
  titles?: Record<Application["status"], string>,
): string {
  const resolved: Record<Application["status"], string> =
    titles ??
    Object.fromEntries(
      STATUSES.map((status) => [status, STATUS_META[status].title]),
    ) as Record<Application["status"], string>;
  const lines = [
    line([...COLUMNS]),
    ...applications.map((application) => row(application, resolved)).map(line),
  ];
  // CRLF because that is what Excel writes, and the one reader that guesses
  // otherwise is the one this file is most likely to be opened in.
  return `${lines.join("\r\n")}\r\n`;
}

export function csvFileName(now = new Date()): string {
  return `applications-${toDateInputValue(now)}.csv`;
}

export function downloadApplicationsCsv(
  board: BoardState,
  now = new Date(),
  titles?: Record<Application["status"], string>,
): number {
  const applications = boardApplications(board);
  const file = new Blob(
    [`${BYTE_ORDER_MARK}${toCsv(applications, titles)}`],
    {
      type: "text/csv;charset=utf-8",
    },
  );
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = csvFileName(now);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return applications.length;
}
