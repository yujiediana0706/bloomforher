// Server-only resume parsing.
// Supports PDF (unpdf), DOCX (mammoth) and plain-text formats.
// Parsed text is capped so it can be stored on the user profile and safely
// injected into AI prompts.

/** Hard limit on how much resume text we keep (characters). */
export const MAX_RESUME_CHARS = 6000;

/** Maximum accepted upload size (bytes). */
export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

const TEXT_EXTENSIONS = ['.txt', '.md', '.markdown', '.csv', '.rtf'];

function normalize(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    // collapse runs of blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Extract readable text from an uploaded resume file. */
export async function parseResume(fileName: string, data: Buffer): Promise<string> {
  const lower = fileName.toLowerCase();
  let raw = '';

  if (lower.endsWith('.pdf')) {
    const { extractText } = await import('unpdf');
    const result = await extractText(new Uint8Array(data), { mergePages: true });
    raw = Array.isArray(result.text) ? result.text.join('\n') : result.text;
  } else if (lower.endsWith('.docx')) {
    const mod = await import('mammoth');
    const mammoth = (mod as { default?: unknown }).default ?? mod;
    const result = await (
      mammoth as { extractRawText: (o: { buffer: Buffer }) => Promise<{ value: string }> }
    ).extractRawText({ buffer: data });
    raw = result.value;
  } else if (TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    raw = data.toString('utf8');
  } else {
    throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
  }

  const text = normalize(raw);
  if (!text) {
    throw new Error(
      'No readable text was found in this file. If it is a scanned PDF, please upload a text-based PDF or a DOCX/TXT file.'
    );
  }
  return text.slice(0, MAX_RESUME_CHARS);
}

/** File extensions accepted by the resume uploader (used by the UI). */
export const ACCEPTED_RESUME_EXTENSIONS = '.pdf,.docx,.txt,.md';
