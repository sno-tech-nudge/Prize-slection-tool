export type StageEmailTemplate =
  | 'general_rejection'
  | 'strong_not_this_cycle'
  | 'encouraged_reapply'
  | 'shortlisted'
  | 'finalist'
  | 'winner';

/** @deprecated kept for existing call sites. StageEmailTemplate is the full set now. */
export type RejectionTemplate = 'general_rejection' | 'strong_not_this_cycle' | 'encouraged_reapply';

export interface StageEmailParams {
  pocFirstName: string;
  orgName: string;
  challengeName: string;
  personalNote?: string;
  /** only used by the query-outreach template — the link to the additional-information form. */
  formLink?: string;
}

function shell(bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f0f0f0;font-family:'Mulish','Avenir Next',sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;">
      <tr>
        <td style="padding:32px 40px;border-top:4px solid #b21010;">
          <div style="font-weight:700;font-size:20px;color:#363d3f;text-transform:lowercase;margin-bottom:24px;">
            the<span style="color:#b21010;">^</span>delta prize
          </div>
          ${bodyHtml}
          <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e4e4;font-size:12px;color:#6e7475;">
            the^delta prize · a the/nudge institute initiative
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function paragraph(text: string): string {
  return `<p style="font-weight:300;font-size:16px;line-height:1.65;color:#363d3f;margin:0 0 16px;">${text}</p>`;
}

export function renderStageEmail(template: StageEmailTemplate, params: StageEmailParams): { subject: string; body: string } {
  const { pocFirstName, orgName, challengeName, personalNote } = params;
  const note = personalNote ? paragraph(personalNote) : '';
  const signoff = paragraph(`with thanks,<br/>the^delta prize team`);
  const greeting = paragraph(`dear ${pocFirstName},`);

  if (template === 'shortlisted') {
    return {
      subject: `you're shortlisted for ${challengeName}`,
      body: shell(
        greeting +
          paragraph(
            `${orgName} has been shortlisted for ${challengeName}. your application met the review panel's threshold for fit against the challenge criteria.`,
          ) +
          paragraph(`your application now moves to jury review. we will be in touch with next steps shortly.`) +
          note +
          signoff,
      ),
    };
  }

  if (template === 'finalist') {
    return {
      subject: `${orgName} is a finalist for ${challengeName}`,
      body: shell(
        greeting +
          paragraph(
            `${orgName} has been selected as a finalist for ${challengeName}.`,
          ) +
          paragraph(`our jury will be in touch about the remaining steps toward a final decision.`) +
          note +
          signoff,
      ),
    };
  }

  if (template === 'winner') {
    return {
      subject: `${orgName} has won the^delta prize`,
      body: shell(
        greeting +
          paragraph(
            `${orgName} is a winner of ${challengeName}. we look forward to backing your work with results-based financing.`,
          ) +
          paragraph(`our team will reach out directly to walk through what happens next.`) +
          note +
          signoff,
      ),
    };
  }

  if (template === 'strong_not_this_cycle') {
    return {
      subject: `an update on ${orgName}'s application to ${challengeName}`,
      body: shell(
        greeting +
          paragraph(
            `thank you for the time and thought ${orgName} put into this application. your submission was one of the stronger ones we saw this cycle.`,
          ) +
          paragraph(
            `after careful deliberation, we will not be advancing ${orgName} to the next stage this cycle. this was a close decision, not a reflection of the strength of your work.`,
          ) +
          note +
          paragraph(
            `we would welcome an application from ${orgName} in a future cycle, and are glad to stay in touch in the meantime.`,
          ) +
          signoff,
      ),
    };
  }

  if (template === 'encouraged_reapply') {
    return {
      subject: `your application to ${challengeName}`,
      body: shell(
        greeting +
          paragraph(
            `thank you for applying to ${challengeName} on behalf of ${orgName}. our review panel read your application closely.`,
          ) +
          paragraph(
            `we will not be advancing your application this cycle. the panel felt the solution needs more evidence against the challenge thresholds before it is ready for review at this stage.`,
          ) +
          note +
          paragraph(
            `we would encourage ${orgName} to build on this and apply again in a future cycle. we would like to see how the work develops.`,
          ) +
          signoff,
      ),
    };
  }

  return {
    subject: `your application to ${challengeName}`,
    body: shell(
      greeting +
        paragraph(
          `thank you for taking the time to apply to ${challengeName} on behalf of ${orgName}, and for the work that went into your submission.`,
        ) +
        paragraph(
          `after careful review against our challenge thresholds, we will not be advancing your application this cycle.`,
        ) +
        note +
        paragraph(
          `we received a strong pool of applications this cycle. this decision reflects fit against this specific challenge, not the merit of your work.`,
        ) +
        signoff,
    ),
  };
}

/** @deprecated use renderStageEmail. Kept so existing imports keep working. */
export const renderRejectionEmail = renderStageEmail;

/** Renders an admin-customised template (see Settings.emailTemplateAcceptance/Rejection),
 *  substituting {{orgName}}, {{pocFirstName}} and {{challengeName}} tokens and wrapping the
 *  plain-text body in the same branded HTML shell as the built-in stage emails. */
export function renderCustomTemplate(template: { subject: string; body: string }, params: StageEmailParams): { subject: string; body: string } {
  const replace = (s: string) =>
    s
      .replaceAll('{{orgName}}', params.orgName)
      .replaceAll('{{pocFirstName}}', params.pocFirstName)
      .replaceAll('{{challengeName}}', params.challengeName)
      .replaceAll('{{formLink}}', params.formLink ?? '');

  const bodyHtml = replace(template.body)
    .split(/\n{2,}/)
    .map((line) => paragraph(line.replace(/\n/g, '<br/>')))
    .join('');

  return { subject: replace(template.subject), body: shell(bodyHtml) };
}
