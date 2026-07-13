import React from 'react';

/**
 * Testimonial / pull-quote block, matching the^delta collateral:
 * yellow quotation mark, red lowercase name, Argent-italic role,
 * Avenir-light body, optional B&W portrait.
 */
export function Quote({
  quote,
  name,
  role,
  portrait,            // image URL — rendered black & white
  layout = 'row',      // 'row' | 'stacked'
  style,
  ...rest
}) {
  const stacked = layout === 'stacked';
  return (
    <figure
      style={{
        display: 'flex', gap: 'var(--space-8)', margin: 0,
        flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'flex-start' : 'center',
        background: 'var(--surface-canvas)', padding: 'var(--space-10)', borderRadius: 0,
        ...style,
      }}
      {...rest}
    >
      <div style={{ flex: 1 }}>
        <div aria-hidden="true" style={{
          fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--delta-yellow)',
          fontSize: 72, lineHeight: 0.6, height: 40, marginBottom: 'var(--space-4)',
        }}>&ldquo;</div>
        <blockquote style={{
          margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-light)',
          fontSize: 'var(--fs-body-lg)', lineHeight: 'var(--lh-relaxed)', color: 'var(--text-primary)',
        }}>{quote}</blockquote>
        <figcaption style={{ marginTop: 'var(--space-5)' }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-bold)',
            fontSize: 'var(--fs-h3)', textTransform: 'lowercase', color: 'var(--delta-red)',
          }}>{name}</div>
          {role && (
            <div style={{
              fontFamily: 'var(--font-serif)', fontStyle: 'italic',
              fontSize: 'var(--fs-body-lg)', color: 'var(--text-secondary)',
            }}>{role}</div>
          )}
        </figcaption>
      </div>
      {portrait && (
        <img
          src={portrait} alt={name}
          style={{
            width: stacked ? '100%' : 240, height: stacked ? 'auto' : 300,
            objectFit: 'cover', filter: 'grayscale(1) contrast(1.05)', borderRadius: 0,
          }}
        />
      )}
    </figure>
  );
}
