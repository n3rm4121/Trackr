/**
 * How a stored CV can be shown inside the app. Browsers render PDFs and plain
 * text natively; Word and RTF have no native renderer, so those fall back to
 * download. Anything the server would refuse (e.g. images) also lands there.
 */
export type CvPreviewKind = "pdf" | "text" | "download";

export function cvPreviewKind(mime: string): CvPreviewKind {
  if (mime === "application/pdf") {
    return "pdf";
  }
  if (mime === "text/plain") {
    return "text";
  }
  return "download";
}

/** True for the document formats the API accepts on upload. */
export function isUploadableCv(mime: string): boolean {
  return (
    mime === "application/pdf" ||
    mime === "application/msword" ||
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "text/plain" ||
    mime === "text/rtf" ||
    mime === "application/rtf"
  );
}

/** File picker filter + client cap, mirroring the server's 5MB multer limit. */
export const CV_ACCEPT =
  ".pdf,.doc,.docx,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/rtf,application/rtf";
export const CV_MAX_BYTES = 5 * 1024 * 1024;
