import type { ApplicationSource, ApplicationInput, RawApplication } from './types';
import { normalizeOrgType, normalizeSolutionCategory, normalizeTeamSize } from './normalize';

/**
 * SWAP POINT — once the team shares the live Google Form id (GOOGLE_FORM_ID),
 * wire up a Google Apps Script `onFormSubmit` trigger that POSTs the response
 * to `/api/ingest` with header `x-ingest-secret: GOOGLE_INGEST_SECRET`. This
 * class exists so /api/ingest has a typed mapper to call; `pull()` is unused
 * for this source since ingestion is push-based (webhook), not polled.
 */
export class GoogleFormSource implements ApplicationSource {
  name = 'google_form' as const;

  async pull(): Promise<RawApplication[]> {
    return [];
  }

  toApplication(raw: RawApplication): ApplicationInput {
    const r = raw.raw as Record<string, unknown>;
    return {
      orgName: String(r['What is the name of your organization?'] ?? ''),
      pocFirstName: String(r['First Name'] ?? ''),
      pocLastName: String(r['Last Name'] ?? ''),
      email: String(r['Email'] ?? ''),
      orgType: normalizeOrgType(r['How would you describe your organization?']),
      stageNormalized: 'OTHER',
      solutionCategory: normalizeSolutionCategory(r['Solution Category']),
      teamSize: normalizeTeamSize(r['What is the size of your team/ organization?']),
      founders: [],
      historicallyShortlisted: false,
    };
  }
}
