/**
 * Server-only document text extraction for the web upload route.
 *
 * Lives in the web app (not @kg/core) so the heavy parser deps stay out of the
 * shared core. PDF via pdf-parse, DOCX via mammoth, txt/md passthrough.
 */
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export const ACCEPTED = ".pdf,.docx,.txt,.md,text/plain,text/markdown,application/pdf";

export async function extractText(filename: string, buffer: Buffer): Promise<string> {
  const ext = (filename.toLowerCase().split(".").pop() || "").trim();
  switch (ext) {
    case "pdf": {
      const data = await pdfParse(buffer);
      return data.text;
    }
    case "docx": {
      const { value } = await mammoth.extractRawText({ buffer });
      return value;
    }
    case "doc":
      throw new Error("Legacy .doc isn't supported — save it as .docx or PDF.");
    default:
      // txt, md, and unknown text: best-effort UTF-8
      return buffer.toString("utf-8");
  }
}
