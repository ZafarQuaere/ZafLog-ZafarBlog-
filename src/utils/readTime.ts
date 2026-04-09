const WORDS_PER_MINUTE = 200;

export function estimateReadTimeMinutes(markdown: string): number {
  const text = markdown.replace(/```[\s\S]*?```/g, "").replace(/[#>*_`[\]()]/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
