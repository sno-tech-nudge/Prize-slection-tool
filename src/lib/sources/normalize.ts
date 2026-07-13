import type {
  FocusLevelValue,
  NormalizedStageValue,
  OrgTypeValue,
  SolutionCategoryValue,
  TeamSizeValue,
} from '@/lib/constants';

export function orgKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizeOrgType(raw: unknown): OrgTypeValue {
  const s = String(raw ?? '').toLowerCase();
  if (s.includes('non')) return 'NON_PROFIT';
  return 'FOR_PROFIT';
}

export function normalizeStage(raw: unknown): NormalizedStageValue {
  const s = String(raw ?? '').toLowerCase();
  if (!s || s === 'na' || s === 'n/a') return 'OTHER';
  if (s.includes('idea')) return 'IDEA';
  if (s.includes('prototype') && !s.includes('market')) return 'PROTOTYPE';
  if (s.includes('market ready') || s.includes('deployed') || s.includes('in market') || s.includes('revenue')) {
    return 'MARKET_READY';
  }
  if (s.includes('growth')) return 'GROWTH';
  if (s.includes('scale') || s.includes('commercializ')) return 'SCALE';
  if (s.includes('pilot')) return 'PROTOTYPE';
  return 'OTHER';
}

export function normalizeSolutionCategory(raw: unknown): SolutionCategoryValue {
  const s = String(raw ?? '').toLowerCase();
  if (s.includes('precision')) return 'PRECISION_FARMING';
  if (s.includes('advisory')) return 'ADVISORY';
  if (s.includes('irrigation')) return 'IRRIGATION';
  if (s.includes('package of practices')) return 'PACKAGE_OF_PRACTICES';
  if (s.includes('science')) return 'SCIENCE_BASED';
  if (s.includes('traditional')) return 'TRADITIONAL_PRACTICES';
  return 'OTHERS';
}

export function normalizeFocusLevel(raw: unknown): FocusLevelValue | undefined {
  const s = String(raw ?? '').toLowerCase();
  if (s === 'yes') return 'YES';
  if (s.startsWith('partial')) return 'PARTIALLY';
  if (s === 'no') return 'NO';
  return undefined;
}

export function normalizeTeamSize(raw: unknown): TeamSizeValue | undefined {
  const s = String(raw ?? '').trim();
  if (s === '0-10') return 'S_0_10';
  if (s === '10-50') return 'S_10_50';
  if (s === '50-150') return 'S_50_150';
  if (s === '150' || s.includes('150+') || s.toLowerCase().includes('150 plus')) return 'S_150_PLUS';
  const n = Number(s);
  if (!Number.isNaN(n)) {
    if (n <= 10) return 'S_0_10';
    if (n <= 50) return 'S_10_50';
    if (n <= 150) return 'S_50_150';
    return 'S_150_PLUS';
  }
  return undefined;
}

export function parseHectares(raw: unknown): number | undefined {
  const s = String(raw ?? '');
  const match = s.match(/[\d,]+(\.\d+)?/);
  if (!match) return undefined;
  const n = Number(match[0].replace(/,/g, ''));
  return Number.isNaN(n) ? undefined : n;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function domainFromWebsite(website?: string | null): string | undefined {
  if (!website) return undefined;
  try {
    const url = website.startsWith('http') ? website : `https://${website}`;
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

export function excelDateToJs(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    // Excel serial date (days since 1899-12-30)
    const epoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(epoch.getTime() + value * 86400000);
  }
  if (typeof value === 'string' && value.trim()) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return undefined;
}
