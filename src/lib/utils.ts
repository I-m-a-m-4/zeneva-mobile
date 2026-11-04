export function cn(...inputs: any[]): string {
  return inputs.flat().filter(Boolean).join(' ');
}

export function safeToDate(timestamp: any): Date {
  if (!timestamp) return new Date(0);

  let date: Date;
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (timestamp && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp && typeof timestamp === 'object' && timestamp.seconds !== undefined) {
    date = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === 'number' || typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else {
    date = new Date(timestamp);
  }

  return isNaN(date.getTime()) ? new Date(0) : date;
}

let cachedCountry: string | null = null;

export async function getCountryFromIP(): Promise<string> {
  if (cachedCountry) return cachedCountry;

  let country = 'Unknown';
  const providers: Array<{ url: string; read: (data: any) => string | undefined }> = [
    { url: 'https://ipwho.is/', read: (d) => (d?.success ? d.country : undefined) },
    { url: 'https://ipapi.co/json/', read: (d) => d?.country_name },
    { url: 'https://api.db-ip.com/v2/free/self', read: (d) => d?.countryName },
    { url: 'https://api.country.is/', read: (d) => d?.country },
  ];

  for (const provider of providers) {
    if (country !== 'Unknown') break;
    try {
      const res = await fetch(provider.url);
      if (!res.ok) continue;
      const value = provider.read(await res.json());
      if (value) country = value;
    } catch {
      // Fall through
    }
  }

  if (country !== 'Unknown') {
    cachedCountry = country;
  }

  return country;
}

/**
 * Smart search matching that ignores hyphens, spaces, punctuation, case, and token order.
 */
export function smartSearchMatch(target: string | undefined | null, query: string): boolean {
  if (!target || !query) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const rawTarget = String(target).toLowerCase();

  // 1. Direct sub-string match
  if (rawTarget.includes(q)) return true;

  // 2. Normalized match
  const normTarget = rawTarget.replace(/[-_/\s.]+/g, ' ');
  const normQuery = q.replace(/[-_/\s.]+/g, ' ');
  if (normTarget.includes(normQuery)) return true;

  // 3. Compact stripped match
  const stripTarget = rawTarget.replace(/[^a-z0-9]/g, '');
  const stripQuery = q.replace(/[^a-z0-9]/g, '');
  if (stripQuery.length > 0 && stripTarget.includes(stripQuery)) return true;

  // 4. Tokenized word-boundary matching
  const queryTokens = normQuery.split(' ').filter(Boolean);
  const targetTokens = normTarget.split(' ').filter(Boolean);

  return queryTokens.every((qToken) => {
    const qStrip = qToken.replace(/[^a-z0-9]/g, '');
    return (
      targetTokens.some((tToken) => tToken.includes(qToken)) ||
      (qStrip.length > 0 && stripTarget.includes(qStrip))
    );
  });
}
