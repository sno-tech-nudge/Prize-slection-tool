import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as XLSX from 'xlsx';
import type { ApplicationSource, ApplicationInput, RawApplication } from './types';
import {
  orgKey,
  normalizeOrgType,
  normalizeStage,
  normalizeSolutionCategory,
  normalizeFocusLevel,
  normalizeTeamSize,
  parseHectares,
  slugify,
  excelDateToJs,
} from './normalize';

const WORKBOOK_PATH = join(process.cwd(), 'data', 'Copy_of_Applicants_details_-_DCM_Shriram_AgWater_Challenge.xlsx');

function numToStr(v: unknown): string | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  if (typeof v === 'number') return String(Math.trunc(v));
  return String(v).trim();
}

/** Top78's founder columns pack "Full Name, Role" into a single cell. */
function splitNameRole(combined: unknown): { fullName: string; role?: string } | undefined {
  const s = numToStr(combined);
  if (!s) return undefined;
  const idx = s.lastIndexOf(',');
  if (idx === -1) return { fullName: s.trim() };
  return { fullName: s.slice(0, idx).trim(), role: s.slice(idx + 1).trim() };
}

interface Top78Row {
  orgName: string;
  pocFirstName: string;
  pocLastName: string;
  email: string;
  phone?: string;
  designation?: string;
  pitchDeckUrl?: string;
  website?: string;
  incorporationDate?: Date;
  location?: string;
  orgTypeRaw?: string;
  stageRaw?: string;
  problemAddressing?: string;
  valueChainFocus?: string;
  beneficiaries?: string;
  smallMarginalFarmerPct?: number;
  areaHectaresRaw?: string;
  aboutSolution?: string;
  solutionCategoryRaw?: string;
  trl?: number;
  waterEfficiencyFocusRaw?: string;
  waterEfficiencyEstimate?: string;
  cropProductionFocusRaw?: string;
  focusCrops?: string;
  teamSizeRaw?: string;
  f1?: { fullName: string; role?: string; linkedin?: string };
  f2?: { fullName: string; role?: string };
}

interface All134Row {
  orgName: string;
  pocFirstName: string;
  pocLastName: string;
  valueChainFocus?: string;
  orgTypeRaw?: string;
  trl?: number;
  aboutSolution?: string;
  f1?: { fullName: string; role?: string; linkedin?: string };
  teamSizeRaw?: string;
  pitchDeckUrl?: string;
}

function parseTop78(rows: unknown[][]): Top78Row[] {
  const out: Top78Row[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    const f1 = splitNameRole(r[25]);
    const f2 = splitNameRole(r[27]);
    out.push({
      orgName: String(r[0]).trim(),
      pocFirstName: String(r[1] ?? '').trim(),
      pocLastName: String(r[2] ?? '').trim(),
      email: String(r[3] ?? '').trim(),
      phone: numToStr(r[4]),
      designation: numToStr(r[5]),
      pitchDeckUrl: numToStr(r[6]),
      website: numToStr(r[7]),
      incorporationDate: excelDateToJs(r[8]),
      location: numToStr(r[9]),
      orgTypeRaw: numToStr(r[10]),
      stageRaw: numToStr(r[11]),
      problemAddressing: numToStr(r[12]),
      valueChainFocus: numToStr(r[13]),
      beneficiaries: numToStr(r[14]),
      smallMarginalFarmerPct: typeof r[15] === 'number' ? r[15] : undefined,
      areaHectaresRaw: numToStr(r[16]),
      aboutSolution: numToStr(r[17]),
      solutionCategoryRaw: numToStr(r[18]),
      trl: typeof r[19] === 'number' ? r[19] : undefined,
      waterEfficiencyFocusRaw: numToStr(r[20]),
      waterEfficiencyEstimate: numToStr(r[21]),
      cropProductionFocusRaw: numToStr(r[22]),
      focusCrops: numToStr(r[23]),
      teamSizeRaw: numToStr(r[24]),
      f1: f1 ? { ...f1, linkedin: numToStr(r[26]) } : undefined,
      f2,
    });
  }
  return out;
}

function parseAll134(rows: unknown[][]): All134Row[] {
  const out: All134Row[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    out.push({
      orgName: String(r[0]).trim(),
      pocFirstName: String(r[1] ?? '').trim(),
      pocLastName: String(r[2] ?? '').trim(),
      valueChainFocus: numToStr(r[3]),
      orgTypeRaw: numToStr(r[6]),
      trl: typeof r[7] === 'number' ? r[7] : undefined,
      aboutSolution: numToStr(r[8]),
      f1: numToStr(r[11]) ? { fullName: String(r[11]).trim(), role: numToStr(r[10]), linkedin: numToStr(r[9]) } : undefined,
      teamSizeRaw: numToStr(r[12]),
      pitchDeckUrl: numToStr(r[13]),
    });
  }
  return out;
}

/**
 * Reads the historical AgWater workbook and produces the merged applicant
 * pool: the 78 "Top 78" rows (richer fields) matched back into the 134-row
 * "All applicants" pool by organisation name, plus the ~55 non-shortlisted
 * applicants who only appear in the lighter sheet. A couple of exact-name
 * repeats in "All applicants" are collapsed via `duplicateOfOrgKey`.
 */
export class SeedSource implements ApplicationSource {
  name = 'seed' as const;

  async pull(): Promise<RawApplication[]> {
    const buf = readFileSync(WORKBOOK_PATH);
    const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });

    const top78Sheet = wb.Sheets['Top 78'];
    const all134Sheet = wb.Sheets[' All applicants (134)'];
    const top78Rows = XLSX.utils.sheet_to_json<unknown[]>(top78Sheet, { header: 1, blankrows: false });
    const all134Rows = XLSX.utils.sheet_to_json<unknown[]>(all134Sheet, { header: 1, blankrows: false });

    const top78 = parseTop78(top78Rows);
    const all134 = parseAll134(all134Rows);

    const top78ByKey = new Map(top78.map((r) => [orgKey(r.orgName), r]));
    const seenKeys = new Set<string>();
    const raws: RawApplication[] = [];

    all134.forEach((row, idx) => {
      const key = orgKey(row.orgName);
      const isRepeat = seenKeys.has(key);
      seenKeys.add(key);
      const top78Row = top78ByKey.get(key);
      raws.push({
        sourceRowId: `all134-${idx}`,
        raw: { key, isRepeat, all134: row, top78: top78Row ?? null },
      });
    });

    return raws;
  }

  toApplication(raw: RawApplication): ApplicationInput {
    const { key, isRepeat, all134, top78 } = raw.raw as {
      key: string;
      isRepeat: boolean;
      all134: All134Row;
      top78: Top78Row | null;
    };

    const founders: { fullName: string; role?: string; linkedin?: string }[] = [];
    if (top78?.f1) founders.push(top78.f1);
    else if (all134.f1) founders.push(all134.f1);
    if (top78?.f2) founders.push(top78.f2);

    const orgName = top78?.orgName ?? all134.orgName;
    const email = top78?.email || `${slugify(orgName)}${isRepeat ? '-2' : ''}@applicant.thedeltaprize.example`;

    return {
      orgName,
      pocFirstName: top78?.pocFirstName || all134.pocFirstName,
      pocLastName: top78?.pocLastName || all134.pocLastName,
      email,
      phone: top78?.phone,
      designation: top78?.designation,
      website: top78?.website,
      incorporationDate: top78?.incorporationDate,
      location: top78?.location,
      orgType: normalizeOrgType(top78?.orgTypeRaw ?? all134.orgTypeRaw),
      stageRaw: top78?.stageRaw,
      stageNormalized: normalizeStage(top78?.stageRaw),
      problemAddressing: top78?.problemAddressing,
      valueChainFocus: top78?.valueChainFocus ?? all134.valueChainFocus,
      beneficiaries: top78?.beneficiaries,
      smallMarginalFarmerPct: top78?.smallMarginalFarmerPct,
      areaHectaresRaw: top78?.areaHectaresRaw,
      areaHectaresParsed: parseHectares(top78?.areaHectaresRaw),
      aboutSolution: top78?.aboutSolution ?? all134.aboutSolution,
      solutionCategory: normalizeSolutionCategory(top78?.solutionCategoryRaw),
      trl: top78?.trl ?? all134.trl,
      waterEfficiencyFocus: normalizeFocusLevel(top78?.waterEfficiencyFocusRaw),
      waterEfficiencyEstimate: top78?.waterEfficiencyEstimate,
      cropProductionFocus: normalizeFocusLevel(top78?.cropProductionFocusRaw),
      focusCrops: top78?.focusCrops,
      teamSize: normalizeTeamSize(top78?.teamSizeRaw ?? all134.teamSizeRaw),
      founders,
      pitchDeckUrl: top78?.pitchDeckUrl ?? all134.pitchDeckUrl,
      historicallyShortlisted: !!top78,
      duplicateOfOrgKey: isRepeat ? key : undefined,
    };
  }
}
