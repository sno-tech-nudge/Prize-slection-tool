import React from 'react';

export interface QuoteProps extends React.HTMLAttributes<HTMLElement> {
  quote: React.ReactNode;
  name: string;
  role?: string;
  portrait?: string;
  layout?: 'row' | 'stacked';
}

export function Quote({ quote, name, role, portrait, layout = 'row', style, ...rest }: QuoteProps) {
  const stacked = layout === 'stacked';
  return (
    <figure
      style={{
        display: 'flex',
        gap: 'var(--space-8)',
        margin: 0,
        flexDirection: stacked ? 'column' : 'row',
        alignItems: stacked ? 'flex-start' : 'center',
        background: 'var(--surface-canvas)',
        padding: 'var(--space-10)',
        borderRadius: 0,
        ...style,
      }}
      {...rest}
    >
      <div style={{ flex: 1 }}>
        <div
          aria-hidden="true"
          style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 700,
            color: 'var(--delta-yellow)',
            fontSize: 72,
            lineHeight: 0.6,
            height: 40,
            marginBottom: 'var(--space-4)',
          }}
        >
          &ldquo;
        </div>
        <blockquote
          style={{
            margin: 0,
            fontFamily: 'var(--font-sans)',
            fontWeight: 'var(--fw-light)' as unknown as number,
            fontSize: 'var(--fs-body-lg)',
            lineHeight: 'var(--lh-relaxed)',
            color: 'var(--text-primary)',
          }}
        >
          {quote}
        </blockquote>
        <figcaption style={{ marginTop: 'var(--space-5)' }}>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: 'var(--fw-bold)' as unknown as number,
              fontSize: 'var(--fs-h3)',
              textTransform: 'lowercase',
              color: 'var(--delta-red)',
            }}
          >
            {name}
          </div>
          {role && (
            <div
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 'var(--fs-body-lg)',
                color: 'var(--text-secondary)',
              }}
            >
              {role}
            </div>
          )}
        </figcaption>
      </div>
      {portrait && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={portrait}
          alt={name}
          style={{
            width: stacked ? '100%' : 240,
            height: stacked ? 'auto' : 300,
            objectFit: 'cover',
            filter: 'grayscale(1) contrast(1.05)',
            borderRadius: 0,
          }}
        />
      )}
    </figure>
  );
}
