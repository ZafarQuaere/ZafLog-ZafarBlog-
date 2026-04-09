export function truncateText(text: string, maxLen: number): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

export function excerptFromContent(content: string, maxLen = 150): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return truncateText(plain, maxLen);
}
