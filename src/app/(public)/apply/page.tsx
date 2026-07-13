import { AngularBanner, Card, Input, Select, Textarea, Checkbox, Radio, Button } from '@/design-system';
import { submitApplicationAction } from '@/lib/applications/apply-action';
import {
  TEAM_SIZES,
  TEAM_SIZE_LABEL,
  LEGAL_REGISTRATION_TYPES,
  LEGAL_REGISTRATION_TYPE_LABEL,
  YES_NO_INPROGRESS,
  YES_NO_INPROGRESS_LABEL,
  YES_NO,
  ANNUAL_BUDGET_BANDS,
  ANNUAL_BUDGET_BAND_LABEL,
  OPERATING_MODEL_ARCHETYPES,
  OPERATING_MODEL_ARCHETYPE_LABEL,
  CROP_TYPES,
  CROP_TYPE_LABEL,
  REGEN_PRACTICES,
  REGEN_PRACTICE_LABEL,
  TECH_TOOLS,
  TECH_TOOL_LABEL,
  MEL_HANDLING_OPTIONS,
  MEL_HANDLING_LABEL,
  INDIAN_STATES,
} from '@/lib/constants';

export default function ApplyPage() {
  return (
    <div>
      <AngularBanner
        eyebrow="the^delta prize · rapid re.gen challenge"
        title="apply to the challenge"
        subtitle="tell us about your organisation, your model and your track record. every field here mirrors the official application form."
      />

      <form action={submitApplicationAction} style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-10)', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Card accent>
          <h2 style={{ fontSize: 'var(--fs-h4)', marginBottom: 'var(--space-5)' }}>organisation profile</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input name="orgName" label="organisation name" required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Input name="pocFirstName" label="point of contact: first name" required />
              <Input name="pocLastName" label="point of contact: last name" required />
            </div>
            <Input name="designation" label="designation" required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Input name="email" type="email" label="email ID" required />
              <Input name="phone" label="contact number" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Input name="website" label="organisation website" placeholder="https://" />
              <Input name="linkedinUrl" label="organisation linkedin profile" placeholder="https://linkedin.com/company/…" />
            </div>
            <Input name="incorporationDate" type="date" label="when was your organisation formally registered?" required />
            <Input name="location" label="organisation location" placeholder="city, state" />
          </div>
        </Card>

        <Card accent>
          <h2 style={{ fontSize: 'var(--fs-h4)', marginBottom: 'var(--space-5)' }}>founder details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
              <Input name="f1FullName" label="founder 1: full name" required />
              <Input name="f1Designation" label="founder 1: designation" required />
              <Input name="f1Email" type="email" label="founder 1: email ID" required />
            </div>
            <Input name="f1Linkedin" label="founder 1: linkedin profile" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
              <Input name="f2FullName" label="founder 2: full name (optional)" />
              <Input name="f2Designation" label="founder 2: designation" />
              <Input name="f2Email" type="email" label="founder 2: email ID" />
            </div>
            <Input name="f2Linkedin" label="founder 2: linkedin profile" />
          </div>
        </Card>

        <Card accent>
          <h2 style={{ fontSize: 'var(--fs-h4)', marginBottom: 'var(--space-5)' }}>registrations and governance</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Select name="legalRegistrationType" label="what is your legal registration type?" required>
              {LEGAL_REGISTRATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {LEGAL_REGISTRATION_TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
            <YesNoInProgressField name="fcraStatus" label="do you (or your partner organisation) have FCRA registration?" />
            <YesNoInProgressField name="cert12A" label="do you have a 12A certificate (Section 12AA / 12AB)?" />
            <YesNoInProgressField name="cert80G" label="do you have an 80G certificate?" />
            <YesNoInProgressField name="csr1Registration" label="do you have a CSR-1 registration?" />
            <div>
              <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semibold)' as unknown as number, marginBottom: 'var(--space-2)' }}>
                do you have a NITI Aayog DARPAN ID?
              </div>
              <Radio name="darpanRegistered" options={YES_NO.map((v) => ({ value: v, label: v.toLowerCase() }))} defaultValue="NO" />
            </div>
            <Select name="annualOperatingBudget" label="what is your annual operating budget? (INR)" required>
              {ANNUAL_BUDGET_BANDS.map((b) => (
                <option key={b} value={b}>
                  {ANNUAL_BUDGET_BAND_LABEL[b]}
                </option>
              ))}
            </Select>
            <Select name="teamSize" label="how many full-time employees does your organisation have?" required>
              {TEAM_SIZES.map((t) => (
                <option key={t} value={t}>
                  {TEAM_SIZE_LABEL[t]}
                </option>
              ))}
            </Select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
              <Input name="funder1" label="funder 1" required />
              <Input name="funder2" label="funder 2 (optional)" />
              <Input name="funder3" label="funder 3 (optional)" />
            </div>
          </div>
        </Card>

        <Card accent>
          <h2 style={{ fontSize: 'var(--fs-h4)', marginBottom: 'var(--space-5)' }}>model</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Select name="operatingModelArchetype" label="which best describes your operating model?" required>
              {OPERATING_MODEL_ARCHETYPES.map((a) => (
                <option key={a} value={a}>
                  {OPERATING_MODEL_ARCHETYPE_LABEL[a]}
                </option>
              ))}
            </Select>
            <Textarea name="operatingModelDescription" label="describe how it works in practice" rows={4} required />
            <div>
              <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semibold)' as unknown as number, marginBottom: 'var(--space-2)' }}>
                which crops do you primarily work with?
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {CROP_TYPES.map((c) => (
                  <Checkbox key={c} name="primaryCrops" value={c} label={CROP_TYPE_LABEL[c]} />
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semibold)' as unknown as number, marginBottom: 'var(--space-2)' }}>
                which regenerative practices does your work cover?
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {REGEN_PRACTICES.map((p) => (
                  <Checkbox key={p} name="regenerativePractices" value={p} label={REGEN_PRACTICE_LABEL[p]} />
                ))}
              </div>
            </div>
            <Textarea
              name="adoptionHurdle"
              label="where do you see the biggest hurdle to widespread adoption of regenerative farming in India today? share real work examples"
              rows={4}
              required
            />
          </div>
        </Card>

        <Card accent>
          <h2 style={{ fontSize: 'var(--fs-h4)', marginBottom: 'var(--space-5)' }}>tech and tools</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semibold)' as unknown as number, marginBottom: 'var(--space-2)' }}>
                what tools do you use internally to manage data, transparency, history of work, and program delivery?
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {TECH_TOOLS.map((t) => (
                  <Checkbox key={t} name="techTools" value={t} label={TECH_TOOL_LABEL[t]} />
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semibold)' as unknown as number, marginBottom: 'var(--space-2)' }}>
                are the tech tools developed internally?
              </div>
              <Radio name="techToolsInternal" options={YES_NO.map((v) => ({ value: v, label: v.toLowerCase() }))} defaultValue="NO" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
              <Input name="techUseCase1" label="top tech use case 1" required />
              <Input name="techUseCase2" label="top tech use case 2 (optional)" />
              <Input name="techUseCase3" label="top tech use case 3 (optional)" />
            </div>
          </div>
        </Card>

        <Card accent>
          <h2 style={{ fontSize: 'var(--fs-h4)', marginBottom: 'var(--space-5)' }}>experience &amp; impact</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input
              name="yearsExperience"
              type="number"
              min={0}
              label="how many years of experience do you have in regenerative / sustainable agricultural practices?"
              required
            />
            <Textarea
              name="verifiedImpacts"
              label="describe your two or three most significant verified impacts to date. include baseline, endline, sample size, and how the impact was verified."
              rows={5}
            />
            <div>
              <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semibold)' as unknown as number, marginBottom: 'var(--space-2)' }}>
                where do you operate? select states / UTs
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', maxHeight: 200, overflowY: 'auto', padding: 'var(--space-3)', border: '1px solid var(--border-subtle)' }}>
                {INDIAN_STATES.map((s) => (
                  <Checkbox key={s} name="statesOperating" value={s} label={s} />
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Input name="farmersCount" type="number" min={0} label="how many farmers does your organisation currently work with?" required />
              <Input name="smallholderFarmersCount" type="number" min={0} label="how many are smallholder farmers (≤ 2 ha)" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Input name="avgLandHolding" type="number" step="0.1" min={0} label="average size of land holding (ha)" required />
              <Input
                name="areaUnderRegenPractice"
                type="number"
                step="0.1"
                min={0}
                label="total area currently under regenerative or sustainable practice (ha)"
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Input name="villagesCount" type="number" min={0} label="in how many villages or clusters is your work currently active?" />
              <Input name="districtsCount" type="number" min={0} label="in how many districts?" />
            </div>
            <div>
              <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semibold)' as unknown as number, marginBottom: 'var(--space-2)' }}>
                does your work in the community extend beyond regenerative or sustainable agriculture?
              </div>
              <Radio name="worksBeyondAg" options={YES_NO.map((v) => ({ value: v, label: v.toLowerCase() }))} defaultValue="NO" />
            </div>
            <div>
              <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semibold)' as unknown as number, marginBottom: 'var(--space-2)' }}>
                do your materials and training exist in local languages?
              </div>
              <Radio name="materialsInLocalLanguages" options={YES_NO.map((v) => ({ value: v, label: v.toLowerCase() }))} defaultValue="NO" />
            </div>
            <div>
              <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semibold)' as unknown as number, marginBottom: 'var(--space-2)' }}>
                have any of your team members received formal training, workshops, or courses in regenerative or agroecological practice in the past three years?
              </div>
              <Radio name="teamFormalTraining" options={YES_NO.map((v) => ({ value: v, label: v.toLowerCase() }))} defaultValue="NO" />
            </div>
            <Select name="melHandling" label="how is your Monitoring, Evaluation & Learning handled?" required>
              {MEL_HANDLING_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {MEL_HANDLING_LABEL[m]}
                </option>
              ))}
            </Select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Input name="reportLink1" label="reference URL 1 (published report / case study)" />
              <Input name="reportLink2" label="reference URL 2 (optional)" />
            </div>
            <Textarea
              name="fundUsagePlan"
              label="if your organisation were to receive the prize fund, how would you use it? list activities and intended outcomes."
              rows={4}
              required
            />
            <Input name="pitchDeckUrl" label="pitch deck link (google drive)" placeholder="https://drive.google.com/…" />
          </div>
        </Card>

        <Button type="submit" variant="cta" size="lg">
          submit application
        </Button>
      </form>
    </div>
  );
}

function YesNoInProgressField({ name, label }: { name: string; label: string }) {
  return (
    <div>
      <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-semibold)' as unknown as number, marginBottom: 'var(--space-2)' }}>{label}</div>
      <Radio
        name={name}
        options={['YES', 'NO', 'IN_PROGRESS'].map((v) => ({
          value: v,
          label: YES_NO_INPROGRESS_LABEL[v as (typeof YES_NO_INPROGRESS)[number]],
        }))}
        defaultValue="NO"
      />
    </div>
  );
}
