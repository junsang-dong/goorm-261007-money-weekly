import type { ReactNode } from "react";

type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] };

function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isRule(line: string): boolean {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function blocksOf(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) {
      index += 1;
      continue;
    }
    if (/^#{1,3}\s+/.test(trimmed)) {
      blocks.push({ type: "h2", text: trimmed.replace(/^#{1,3}\s+/, "") });
      index += 1;
      continue;
    }
    if (trimmed.startsWith("|")) {
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        if (!isRule(lines[index])) tableLines.push(lines[index]);
        index += 1;
      }
      const [header, ...rows] = tableLines.map(cells);
      if (header) blocks.push({ type: "table", headers: header, rows });
      continue;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }
    if (trimmed.startsWith(">")) {
      const parts: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        parts.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", text: parts.join(" ") });
      continue;
    }
    const parts: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^#{1,3}\s+/.test(lines[index].trim()) &&
      !lines[index].trim().startsWith("|") &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+\.\s+/.test(lines[index].trim()) &&
      !lines[index].trim().startsWith(">")
    ) {
      parts.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "p", text: parts.join(" ") });
  }
  return blocks;
}

function inline(text: string, citations: string[]): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\[\d+\])/g;
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else {
      const number = Number(token.slice(1, -1));
      const url = citations[number - 1];
      nodes.push(
        url ? (
          <a key={key} href={url} target="_blank" rel="noreferrer" className="text-blue hover:underline">
            {token}
          </a>
        ) : (
          <span key={key}>{token}</span>
        ),
      );
    }
    key += 1;
    last = start + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function tone(value: string): string {
  const match = value.trim().match(/^([+-])\d+(?:\.\d+)?%$/);
  if (!match) return "";
  return match[1] === "+" ? "text-up" : "text-down";
}

export function ReportView({ markdown, citations }: { markdown: string; citations: string[] }) {
  return (
    <div className="mt-4 space-y-4 text-sm leading-relaxed">
      {blocksOf(markdown).map((block, index) => {
        if (block.type === "h2") {
          return (
            <h3 key={index} className="border-b border-line pt-2 pb-1 font-serif text-xl text-navy">
              {inline(block.text, citations)}
            </h3>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote key={index} className="border-l-2 border-navy/30 pl-3 text-muted">
              {inline(block.text, citations)}
            </blockquote>
          );
        }
        if (block.type === "ul" || block.type === "ol") {
          const List = block.type === "ul" ? "ul" : "ol";
          return (
            <List key={index} className={block.type === "ul" ? "list-disc space-y-1 pl-5" : "list-decimal space-y-1 pl-5"}>
              {block.items.map((item) => (
                <li key={item}>{inline(item, citations)}</li>
              ))}
            </List>
          );
        }
        if (block.type === "table") {
          return (
            <div key={index} className="overflow-x-auto rounded-md border border-line">
              <table className="w-full min-w-[640px] text-left">
                <thead className="border-b border-line bg-tint text-xs text-muted">
                  <tr>
                    {block.headers.map((header) => (
                      <th key={header} className="px-3 py-2 font-medium">
                        {inline(header, citations)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row) => (
                    <tr key={row.join("|")} className="border-b border-line last:border-0">
                      {row.map((cell, cellIndex) => (
                        <td key={`${cell}-${cellIndex}`} className={`num px-3 py-2 ${tone(cell)}`}>
                          {inline(cell, citations)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return <p key={index}>{inline(block.text, citations)}</p>;
      })}
    </div>
  );
}
