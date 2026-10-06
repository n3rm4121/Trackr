import { describe, it, expect } from "vitest";

import { cvPreviewKind, isUploadableCv } from "./cv";

describe("cvPreviewKind", () => {
  it("renders PDFs inline", () => {
    expect(cvPreviewKind("application/pdf")).toBe("pdf");
  });

  it("renders plain text inline", () => {
    expect(cvPreviewKind("text/plain")).toBe("text");
  });

  it("falls back to download for Word and RTF", () => {
    expect(cvPreviewKind("application/msword")).toBe("download");
    expect(
      cvPreviewKind(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe("download");
    expect(cvPreviewKind("application/rtf")).toBe("download");
  });

  it("falls back to download for anything else", () => {
    expect(cvPreviewKind("image/png")).toBe("download");
    expect(cvPreviewKind("")).toBe("download");
  });
});

describe("isUploadableCv", () => {
  it("accepts document formats only", () => {
    expect(isUploadableCv("application/pdf")).toBe(true);
    expect(isUploadableCv("text/plain")).toBe(true);
  });

  it("rejects images — CVs are text documents", () => {
    expect(isUploadableCv("image/png")).toBe(false);
    expect(isUploadableCv("image/jpeg")).toBe(false);
  });
});
