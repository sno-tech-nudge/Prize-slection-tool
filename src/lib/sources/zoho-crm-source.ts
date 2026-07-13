import type { ApplicationSource, ApplicationInput, RawApplication, WriteBack } from './types';
import { normalizeOrgType, normalizeSolutionCategory, normalizeStage, normalizeTeamSize } from './normalize';

/**
 * SWAP POINT — this year's applications live in Zoho CRM, not this repo.
 * When Zoho access is available, replace `pull()`'s stub body with a real
 * fetch against the Zoho CRM v2 REST API and delete the seed-shaped fixture.
 *
 * Real integration sketch:
 *   1. OAuth: exchange ZOHO_REFRESH_TOKEN for an access token
 *      (POST https://accounts.zoho.com/oauth/v2/token, grant_type=refresh_token).
 *   2. Fetch changed records via COQL (POST /crm/v6/coql) or the records
 *      endpoint (GET /crm/v6/{module}/search) filtered by Modified_Time,
 *      paginating with `page_token`.
 *   3. Map Zoho fields -> ApplicationInput using the table below (field API
 *      names are placeholders — confirm exact names once the module/layout
 *      is shared by the Zoho admin):
 *
 *   Zoho field (guess)              -> ApplicationInput
 *   -------------------------------------------------------------------
 *   Account_Name / Company           -> orgName
 *   First_Name / Last_Name           -> pocFirstName / pocLastName
 *   Email                            -> email
 *   Phone                            -> phone
 *   Designation                      -> designation
 *   Website                          -> website
 *   Incorporation_Date               -> incorporationDate
 *   City / State (combined)          -> location
 *   Organization_Type                -> orgType (normalizeOrgType)
 *   Current_Stage                    -> stageRaw / stageNormalized
 *   Problem_Statement                -> problemAddressing
 *   Value_Chain_Focus (multiselect)  -> valueChainFocus
 *   Beneficiaries (multiselect)      -> beneficiaries
 *   Small_Farmer_Percentage          -> smallMarginalFarmerPct
 *   Area_Hectares                    -> areaHectaresRaw / areaHectaresParsed
 *   Solution_Description             -> aboutSolution
 *   Solution_Category                -> solutionCategory (normalizeSolutionCategory)
 *   TRL                              -> trl
 *   Water_Efficiency_Focus           -> waterEfficiencyFocus
 *   Crop_Production_Focus            -> cropProductionFocus
 *   Team_Size                        -> teamSize (normalizeTeamSize)
 *   Founders (subform)               -> founders[]
 *   Pitch_Deck_Link                  -> pitchDeckUrl
 *   Zoho record id                   -> externalId
 *
 *   4. `writeBack()` should PUT the stage + composite score onto the Zoho
 *      record (custom fields e.g. Delta_Stage, Delta_AI_Composite) so the
 *      team also sees status where their data already lives.
 */
export class ZohoCrmSource implements ApplicationSource {
  name = 'zoho_crm' as const;

  async pull(): Promise<RawApplication[]> {
    // eslint-disable-next-line no-console
    console.warn(
      '[ZohoCrmSource] Not wired to a live Zoho org yet — returning zero records. ' +
        'Set ZOHO_CLIENT_ID/SECRET/REFRESH_TOKEN and replace this stub per the field-mapping comment above.',
    );
    return [];
  }

  toApplication(raw: RawApplication): ApplicationInput {
    const r = raw.raw as Record<string, unknown>;
    return {
      externalId: String(r.id ?? ''),
      orgName: String(r.Account_Name ?? ''),
      pocFirstName: String(r.First_Name ?? ''),
      pocLastName: String(r.Last_Name ?? ''),
      email: String(r.Email ?? ''),
      phone: r.Phone ? String(r.Phone) : undefined,
      designation: r.Designation ? String(r.Designation) : undefined,
      website: r.Website ? String(r.Website) : undefined,
      orgType: normalizeOrgType(r.Organization_Type),
      stageNormalized: normalizeStage(r.Current_Stage),
      solutionCategory: normalizeSolutionCategory(r.Solution_Category),
      teamSize: normalizeTeamSize(r.Team_Size),
      founders: [],
      historicallyShortlisted: false,
    };
  }

  async writeBack(appId: string, patch: WriteBack): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[ZohoCrmSource] SWAP: would PUT stage/score back to Zoho for ${appId}`, patch);
  }
}
