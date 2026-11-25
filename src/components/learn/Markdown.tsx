import type { ReactNode } from "react";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.85em] text-fg">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-fg">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

/**
 * Renderer markdown ringan (heading, list, code block, tabel, bold, inline code).
 * Sengaja tanpa dependency agar bundle tetap kecil.
 */
export function Markdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  let key = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    // Fenced code block
    if (line.trim().startsWith("```")) {
      const language = line.trim().replace(/`/g, "") || "python";
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(
        <div key={`code-${key++}`} className="my-4 overflow-hidden rounded-md border border-border bg-[#111110]">
          <div className="border-b border-white/10 px-3 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">{language}</span>
          </div>
          <pre className="overflow-x-auto px-3 py-3 font-mono text-[12.5px] leading-6 text-neutral-200">
            <code>{code.join("\n")}</code>
          </pre>
        </div>,
      );
      continue;
    }

    // Heading
    const heading = /^(#{2,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      const className =
        level === 2
          ? "mb-2 mt-6 text-[15px] font-semibold tracking-tight text-fg first:mt-0"
          : level === 3
            ? "mb-1.5 mt-5 text-sm font-semibold text-fg"
            : "mb-1 mt-4 text-[13px] font-semibold text-fg";
      blocks.push(
        <p key={`h-${key++}`} className={className}>
          {renderInline(text, `h${key}`)}
        </p>,
      );
      index += 1;
      continue;
    }

    // Tabel
    if (line.trim().startsWith("|")) {
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        const cells = lines[index]
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((cell) => cell.trim());
        if (!cells.every((cell) => /^-{2,}$/.test(cell))) rows.push(cells);
        index += 1;
      }
      const [head, ...body] = rows;
      blocks.push(
        <div key={`table-${key++}`} className="my-4 overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-border bg-surface-2 text-[11px] uppercase tracking-wide text-muted">
              <tr>
                {head?.map((cell, cellIndex) => (
                  <th key={cellIndex} className="px-3 py-2 font-medium">
                    {renderInline(cell, `th${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {body.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-3 py-2 text-muted">
                      {renderInline(cell, `td${rowIndex}-${cellIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // List
    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*-\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*-\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul key={`ul-${key++}`} className="my-3 space-y-1.5 pl-1">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-2.5 text-[14px] leading-7 text-muted">
              <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-muted" />
              <span>{renderInline(item, `li${itemIndex}`)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Paragraf
    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith("```") &&
      !/^(#{2,4})\s+/.test(lines[index]) &&
      !lines[index].trim().startsWith("|") &&
      !/^\s*-\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(
      <p key={`p-${key++}`} className="my-3 text-[14px] leading-7 text-muted first:mt-0 sm:text-[14.5px]">
        {renderInline(paragraph.join(" "), `p${key}`)}
      </p>,
    );
  }

  return <div className="prose-lecode">{blocks}</div>;
}
