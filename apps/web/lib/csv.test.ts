import { describe, it, expect } from "vitest";

import { boardApplications, csvFileName, toCsv } from "./csv";
import type { Application, BoardState } from "./applications";

const applied: Application = {
  id: "1",
  company: "Stripe",
  role: "Frontend Engineer",
  jobUrl: "https://stripe.com/jobs/frontend-engineer",
  location: "Dublin, IE · Hybrid",
  salary: "€95k – €115k",
  status: "applied",
  appliedAt: "2026-09-30T09:15:00.000Z",
  lastActivityAt: "2026-10-02T11:00:00.000Z",
  notes: [],
};

const interviewing: Application = {
  ...applied,
  id: "2",
  company: "Datadog",
  role: "Senior Frontend",
  status: "interview",
  notes: [
    // Newest first, the way the detail panel reads them.
    {
      id: "22",
      body: 'Second round booked, they asked about "rendering".',
      createdAt: "2026-10-01T08:30:00.000Z",
    },
    { id: "21", body: "Referred by Dana.", createdAt: "2026-09-28T17:00:00.000Z" },
  ],
};

function boardOf(...applications: Application[]): BoardState {
  const columns: BoardState["columns"] = {
    applied: [],
    interview: [],
    offer: [],
    rejected: [],
  };

  for (const application of applications) {
    columns[application.status].push(application.id);
  }

  return {
    columns,
    applications: Object.fromEntries(applications.map((a) => [a.id, a])),
  };
}

/** The board as the file holds it: rows in board order, without the BOM or the
 *  final newline that only matter to the download. */
function rowsOf(board: BoardState): string[] {
  return toCsv(boardApplications(board)).trimEnd().split("\r\n").slice(1);
}

/** The file split into lines, so a row can be read without counting commas. */
function lines(csv: string): string[] {
  return csv.trimEnd().split("\r\n");
}

/** A row's fields, quoting ignored — only valid while no field holds a quote. */
function fieldsOf(row: string): string[] {
  return row.split(",").map((value) => value.replace(/^"|"$/g, ""));
}

describe("toCsv", () => {
  it("leads with the headings a spreadsheet shows", () => {
    expect(lines(toCsv([]))).toEqual([
      '"Company","Role","Status","Location","Salary","Job URL","Applied","Last activity","Notes"',
    ]);
  });

  it("writes one row per application with the status spelled out", () => {
    const [, row] = lines(toCsv([applied]));

    expect(row.startsWith('"Stripe","Frontend Engineer","Applied",')).toBe(true);
  });

  it("uses the column title the board shows, not the status value", () => {
    const [, row] = lines(toCsv([interviewing]));

    expect(row).toContain('"Interview Scheduled"');
    expect(row).not.toContain('"interview"');
  });

  it("writes dates as plain days so a spreadsheet sorts them as dates", () => {
    const [, row] = lines(toCsv([applied]));

    expect(fieldsOf(row).slice(-3, -1)).toEqual(["2026-09-30", "2026-10-02"]);
  });

  it("keeps a comma inside a value from splitting the row", () => {
    const [, row] = lines(toCsv([applied]));
    const fields = row.match(/"[^"]*"/g) ?? [];

    expect(fields.at(3)).toBe('"Dublin, IE · Hybrid"');
  });

  it("carries the euro sign and en dash through untouched", () => {
    expect(toCsv([applied])).toContain('"€95k – €115k"');
  });

  it("doubles a quote inside a note rather than ending the field early", () => {
    const [, row] = lines(toCsv([interviewing]));

    expect(row).toContain('""rendering""');
  });

  it("joins an application's notes into one cell, oldest first", () => {
    const [, row] = lines(toCsv([interviewing]));
    const notes = row.slice(row.indexOf("28 Sept 2026") - 1);

    expect(notes).toBe(
      '"28 Sept 2026: Referred by Dana.\n1 Oct 2026: Second round booked, they asked about ""rendering""."',
    );
  });

  it("leaves the notes cell empty for an application with none", () => {
    const [, row] = lines(toCsv([applied]));

    expect(row.endsWith('""')).toBe(true);
  });

  it("ends the file with a newline so the last row is not left dangling", () => {
    expect(toCsv([applied]).endsWith("\r\n")).toBe(true);
  });
});

describe("boardApplications", () => {
  it("orders rows the way the board does, column by column", () => {
    const rejected = { ...applied, id: "3", company: "Shopify", status: "rejected" as const };

    const companies = rowsOf(boardOf(rejected, interviewing, applied)).map(
      (row) => row.slice(1).split('","')[0],
    );

    expect(companies).toEqual(["Stripe", "Datadog", "Shopify"]);
  });

  it("keeps a card where it was dragged to within its own column", () => {
    const second = { ...applied, id: "2", company: "Monzo" };
    const board = boardOf(applied, second);
    board.columns.applied.reverse();

    const companies = rowsOf(board).map((row) => row.slice(1).split('","')[0]);

    expect(companies).toEqual(["Monzo", "Stripe"]);
  });

  it("skips an id whose application is missing rather than writing a blank row", () => {
    const board = boardOf(applied);
    board.columns.applied.push("404");

    expect(boardApplications(board)).toEqual([applied]);
  });

  it("has nothing to export on an empty board", () => {
    const board: BoardState = {
      columns: { applied: [], interview: [], offer: [], rejected: [] },
      applications: {},
    };

    expect(boardApplications(board)).toEqual([]);
    expect(toCsv(boardApplications(board))).toBe(
      '"Company","Role","Status","Location","Salary","Job URL","Applied","Last activity","Notes"\r\n',
    );
  });
});

describe("csvFileName", () => {
  it("is dated with the day the export was asked for", () => {
    expect(csvFileName(new Date(2026, 9, 3, 12))).toBe(
      "applications-2026-10-03.csv",
    );
  });
});
