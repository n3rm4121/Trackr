import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { cvDownloadUrl } from "@/lib/applications-api";
import { cvPreviewKind } from "@/lib/cv";

/**
 * In-app preview of the CV attached to a card. The bytes are fetched with the
 * session cookies (so the endpoint's auth still applies), then shown with
 * whatever the browser can render natively: an iframe for PDFs, plain text
 * for .txt, and a download prompt for Word/RTF.
 */
export function CvViewerDialog({
  applicationId,
  fileName,
  mime,
  open,
  onOpenChange,
}: {
  applicationId: string;
  fileName: string;
  mime: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  function handleOpenChange(next: boolean) {
    // Collapse again on close, so the next open starts at the normal size.
    if (!next) {
      setExpanded(false);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={
          expanded
            ? "flex h-[90vh] max-w-[95vw] flex-col sm:max-w-[95vw]"
            : "max-w-3xl sm:max-w-3xl"
        }
      >
        <DialogHeader>
          <DialogTitle className="truncate">{fileName}</DialogTitle>
          <DialogDescription>
            The CV submitted for this job.
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <ViewerBody
            key={applicationId}
            applicationId={applicationId}
            fileName={fileName}
            mime={mime}
            expanded={expanded}
          />
        ) : null}

        <DialogFooter className="flex-row justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Shrink" : "Expand"}
          </Button>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Mounted fresh on every open (keyed by application above), so loading state
// starts empty without resetting state inside an effect.
function ViewerBody({
  applicationId,
  fileName,
  mime,
  expanded,
}: {
  applicationId: string;
  fileName: string;
  mime: string;
  expanded: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const kind = cvPreviewKind(mime);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    (async () => {
      try {
        const response = await apiClient.get(
          `/applications/${applicationId}/cv`,
          { responseType: "blob" },
        );
        const blob = response.data as Blob;
        if (kind === "text") {
          const content = await blob.text();
          if (!cancelled) {
            setText(content);
          }
        } else if (kind === "pdf") {
          objectUrl = URL.createObjectURL(blob);
          if (!cancelled) {
            setUrl(objectUrl);
          } else {
            URL.revokeObjectURL(objectUrl);
          }
        }
      } catch {
        if (!cancelled) {
          setError("Could not load the CV. Check your connection and try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [applicationId, kind]);

  const loading =
    (kind === "pdf" && url === null) || (kind === "text" && text === null);

  return (
    <>
      {error ? (
        <p className="text-destructive py-8 text-center text-sm">{error}</p>
      ) : kind === "download" ? (
        <div className="grid gap-3 py-6 text-center">
          <p className="text-muted-foreground text-sm">
            Preview is not available for this format. Download it to read it.
          </p>
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(cvDownloadUrl(applicationId), "_blank")}
            >
              Download {fileName}
            </Button>
          </div>
        </div>
      ) : loading ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Loading CV…
        </p>
      ) : kind === "text" ? (
        <pre
          className={
            expanded
              ? "bg-muted min-h-0 flex-1 overflow-auto rounded-lg p-3 text-xs whitespace-pre-wrap"
              : "bg-muted max-h-[60vh] overflow-auto rounded-lg p-3 text-xs whitespace-pre-wrap"
          }
        >
          {text}
        </pre>
      ) : (
        <iframe
          title={fileName}
          src={url ?? undefined}
          className={
            expanded
              ? "min-h-0 w-full flex-1 rounded-lg border"
              : "h-[60vh] w-full rounded-lg border"
          }
        />
      )}
    </>
  );
}
