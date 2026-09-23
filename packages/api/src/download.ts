import { API } from "./api";

export function parseContentDispositionFilename(
  header: string | null | undefined,
): string | undefined {
  if (!header) {
    return undefined;
  }

  const quotedMatch = header.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const unquotedMatch = header.match(/filename=([^;]+)/i);
  if (unquotedMatch?.[1]) {
    return unquotedMatch[1].trim();
  }

  return undefined;
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
}

export async function downloadCourseStatsCsv(
  userId: string,
  fallbackFilename: string,
): Promise<void> {
  const { data, contentDisposition } = await API.download(
    `/users/${userId}/course-stats/download`,
  );

  const filename =
    parseContentDispositionFilename(contentDisposition) ?? fallbackFilename;

  triggerBlobDownload(data, filename);
}
