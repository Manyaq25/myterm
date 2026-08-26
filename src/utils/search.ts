function normalize(text: string): string {
  return text.toLocaleLowerCase('tr');
}

/** Türkçe büyük/küçük harf kurallarına (İ/I, ı/i) duyarlı, boşluk-toleranslı arama eşleşmesi. */
export function matchesQuery(query: string, ...fields: (string | null | undefined)[]): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;
  const normalizedQuery = normalize(trimmed);
  return fields.some((field) => field && normalize(field).includes(normalizedQuery));
}
