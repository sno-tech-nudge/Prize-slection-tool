/* @ds-bundle: {"format":4,"namespace":"TheDeltaDesignSystem_88b8ab","components":[{"name":"AngularBanner","sourcePath":"components/brand/AngularBanner.jsx"},{"name":"Logo","sourcePath":"components/brand/Logo.jsx"},{"name":"Quote","sourcePath":"components/content/Quote.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/brand/AngularBanner.jsx":"64e20e22673f","components/brand/Logo.jsx":"fd97921dfae5","components/content/Quote.jsx":"f28ed9843072","components/core/Badge.jsx":"03a8ad22e06d","components/core/Button.jsx":"d82a4c62786a","components/core/Card.jsx":"94a9b6311eb5","components/core/IconButton.jsx":"af029b2984d5","components/core/Tag.jsx":"37367ea3fedf","components/feedback/Dialog.jsx":"b1e9155b072a","components/feedback/Toast.jsx":"c4ee3604a2f2","components/feedback/Tooltip.jsx":"df0f9dc64cab","components/forms/Checkbox.jsx":"8ca109d2a32f","components/forms/Input.jsx":"e8c8f2438e09","components/forms/Radio.jsx":"177086408ffa","components/forms/Select.jsx":"3644c968dfca","components/forms/Switch.jsx":"8250157279e8","components/forms/Textarea.jsx":"bfcf5e63f65e","components/navigation/Tabs.jsx":"802d8cf34a85","ui_kits/collateral/Collateral.jsx":"f764d5765aea","ui_kits/collateral/image-slot.js":"4cffaf8e50f6","ui_kits/website/Apply.jsx":"3fd53afab430","ui_kits/website/Home.jsx":"f33c83badf4e","ui_kits/website/Programs.jsx":"1bedf5df280a","ui_kits/website/Site.jsx":"469f9a48b568"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.TheDeltaDesignSystem_88b8ab = window.TheDeltaDesignSystem_88b8ab || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/AngularBanner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Signature the^delta banner: a blank canvas framed by sharp red diagonal
 * cuts (top-left + bottom-right). Used for hero units and program headers.
 */
function AngularBanner({
  eyebrow,
  title,
  subtitle,
  action,
  // ReactNode, e.g. <Button>apply now</Button>
  tone = 'light',
  // 'light' (white canvas) | 'ink' (charcoal canvas)
  media,
  // optional ReactNode pinned bottom-right (e.g. B&W image)
  style,
  children,
  ...rest
}) {
  const dark = tone === 'ink';
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: dark ? 'var(--surface-ink)' : 'var(--surface-card)',
      color: dark ? 'var(--text-inverse)' : 'var(--text-primary)',
      padding: 'var(--space-16) var(--space-12)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      borderTop: '96px solid var(--delta-red)',
      borderRight: '96px solid transparent'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 0,
      height: 0,
      borderBottom: '160px solid var(--delta-red)',
      borderLeft: '220px solid transparent'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 640
    }
  }, eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-overline)',
      fontWeight: 'var(--fw-bold)',
      letterSpacing: 'var(--ls-wide)',
      textTransform: 'uppercase',
      color: 'var(--delta-red)',
      marginBottom: 'var(--space-3)'
    }
  }, eyebrow), title && /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-h1)',
      lineHeight: 'var(--lh-tight)',
      letterSpacing: 'var(--ls-tight)',
      textTransform: 'lowercase'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 'var(--space-4) 0 0',
      fontWeight: 'var(--fw-light)',
      fontSize: 'var(--fs-body-lg)',
      lineHeight: 'var(--lh-relaxed)',
      color: dark ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'
    }
  }, subtitle), children, action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'var(--space-8)'
    }
  }, action)), media && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      zIndex: 1
    }
  }, media));
}
Object.assign(__ds_scope, { AngularBanner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/AngularBanner.jsx", error: String((e && e.message) || e) }); }

// components/brand/Logo.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * the^delta wordmark + caret mark.
 * The name is ALWAYS written "the^delta" with the red caret between the words.
 */
function Logo({
  variant = 'wordmark',
  // 'wordmark' | 'mark'
  tone = 'dark',
  // 'dark' | 'light' | 'red' — colour of "the"/"delta"
  program,
  // optional: 'incubator' | 'accelerator' | 'prize' | string
  size = 32,
  // font-size (wordmark) / height in px (mark)
  style,
  ...rest
}) {
  const wordColor = tone === 'light' ? 'var(--text-inverse)' : tone === 'red' ? 'var(--delta-red)' : 'var(--text-primary)';
  if (variant === 'mark') {
    const fill = tone === 'light' ? '#ffffff' : tone === 'dark' ? '#363d3f' : '#b21010';
    return /*#__PURE__*/React.createElement("svg", _extends({
      viewBox: "0 0 114 82",
      role: "img",
      "aria-label": "the^delta",
      style: {
        height: size,
        width: 'auto',
        display: 'block',
        ...style
      }
    }, rest), /*#__PURE__*/React.createElement("path", {
      d: "M47.5 0 L66.5 0 L114 82 L90 82 L57 26 L24 82 L0 82 Z",
      fill: fill
    }));
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'baseline',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-bold)',
      fontSize: size,
      lineHeight: 1,
      textTransform: 'lowercase',
      letterSpacing: 'var(--ls-tight)',
      color: wordColor,
      ...style
    }
  }, rest), "the", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--delta-red)',
      margin: '0 0.02em'
    }
  }, "^"), "delta", program && /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--fw-light)',
      color: tone === 'light' ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)',
      marginLeft: '0.35em'
    }
  }, program));
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Logo.jsx", error: String((e && e.message) || e) }); }

// components/content/Quote.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Testimonial / pull-quote block, matching the^delta collateral:
 * yellow quotation mark, red lowercase name, Argent-italic role,
 * Avenir-light body, optional B&W portrait.
 */
function Quote({
  quote,
  name,
  role,
  portrait,
  // image URL — rendered black & white
  layout = 'row',
  // 'row' | 'stacked'
  style,
  ...rest
}) {
  const stacked = layout === 'stacked';
  return /*#__PURE__*/React.createElement("figure", _extends({
    style: {
      display: 'flex',
      gap: 'var(--space-8)',
      margin: 0,
      flexDirection: stacked ? 'column' : 'row',
      alignItems: stacked ? 'flex-start' : 'center',
      background: 'var(--surface-canvas)',
      padding: 'var(--space-10)',
      borderRadius: 0,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    style: {
      fontFamily: 'var(--font-serif)',
      fontWeight: 700,
      color: 'var(--delta-yellow)',
      fontSize: 72,
      lineHeight: 0.6,
      height: 40,
      marginBottom: 'var(--space-4)'
    }
  }, "\u201C"), /*#__PURE__*/React.createElement("blockquote", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-light)',
      fontSize: 'var(--fs-body-lg)',
      lineHeight: 'var(--lh-relaxed)',
      color: 'var(--text-primary)'
    }
  }, quote), /*#__PURE__*/React.createElement("figcaption", {
    style: {
      marginTop: 'var(--space-5)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-h3)',
      textTransform: 'lowercase',
      color: 'var(--delta-red)'
    }
  }, name), role && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 'var(--fs-body-lg)',
      color: 'var(--text-secondary)'
    }
  }, role))), portrait && /*#__PURE__*/React.createElement("img", {
    src: portrait,
    alt: name,
    style: {
      width: stacked ? '100%' : 240,
      height: stacked ? 'auto' : 300,
      objectFit: 'cover',
      filter: 'grayscale(1) contrast(1.05)',
      borderRadius: 0
    }
  }));
}
Object.assign(__ds_scope, { Quote });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Quote.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Small status/label chip. Square edges, uppercase, tracked.
 */
function Badge({
  tone = 'neutral',
  // 'neutral' | 'red' | 'ink' | 'yellow' | 'outline'
  style,
  children,
  ...rest
}) {
  const tones = {
    neutral: {
      background: 'var(--grey-100)',
      color: 'var(--text-secondary)'
    },
    red: {
      background: 'var(--delta-red)',
      color: '#fff'
    },
    ink: {
      background: 'var(--delta-charcoal)',
      color: '#fff'
    },
    yellow: {
      background: 'var(--delta-yellow)',
      color: 'var(--delta-charcoal)'
    },
    outline: {
      background: 'transparent',
      color: 'var(--text-primary)',
      boxShadow: 'inset 0 0 0 1px var(--border-strong)'
    }
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 8px',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-caption)',
      lineHeight: 1.4,
      letterSpacing: 'var(--ls-wide)',
      textTransform: 'uppercase',
      borderRadius: 0,
      ...tones[tone],
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * the^delta button. Square edges, forward momentum.
 * Primary = delta red; secondary = charcoal outline; ghost = quiet.
 * Label copy is typically lowercase; the "cta" variant is uppercase + tracked
 * (matches the "APPLY NOW" collateral treatment).
 */
function Button({
  variant = 'primary',
  // 'primary' | 'secondary' | 'ghost' | 'cta'
  size = 'md',
  // 'sm' | 'md' | 'lg'
  disabled = false,
  iconLeft,
  iconRight,
  style,
  children,
  ...rest
}) {
  const pads = {
    sm: '8px 14px',
    md: '12px 22px',
    lg: '16px 30px'
  };
  const fontSizes = {
    sm: 13,
    md: 15,
    lg: 17
  };
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--fw-bold)',
    fontSize: fontSizes[size],
    lineHeight: 1,
    padding: pads[size],
    border: '2px solid transparent',
    borderRadius: 0,
    // always square
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
    textTransform: 'lowercase',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    opacity: disabled ? 0.45 : 1,
    ...style
  };
  const variants = {
    primary: {
      background: 'var(--action)',
      color: 'var(--action-text)',
      borderColor: 'var(--action)'
    },
    secondary: {
      background: 'transparent',
      color: 'var(--text-primary)',
      borderColor: 'var(--border-strong)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--delta-red)',
      borderColor: 'transparent'
    },
    cta: {
      background: 'var(--action)',
      color: 'var(--action-text)',
      borderColor: 'var(--action)',
      textTransform: 'uppercase',
      letterSpacing: 'var(--ls-wide)'
    }
  };
  const [hover, setHover] = React.useState(false);
  const hoverStyle = !disabled && hover ? {
    primary: {
      background: 'var(--action-hover)',
      borderColor: 'var(--action-hover)'
    },
    cta: {
      background: 'var(--action-hover)',
      borderColor: 'var(--action-hover)'
    },
    secondary: {
      background: 'var(--delta-charcoal)',
      color: 'var(--text-inverse)'
    },
    ghost: {
      color: 'var(--action-hover)'
    }
  }[variant] : null;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      ...base,
      ...variants[variant],
      ...hoverStyle
    }
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Flat, square-edged surface. Optional red accent bar along one edge
 * (top by default) — the closest the brand comes to a rounded card.
 */
function Card({
  accent = false,
  // draw the red edge bar
  accentSide = 'top',
  // 'top' | 'left'
  elevated = false,
  // subtle shadow vs flat border
  padding = 'var(--space-6)',
  style,
  children,
  ...rest
}) {
  const accentBorder = accent ? accentSide === 'left' ? {
    borderLeft: '4px solid var(--delta-red)'
  } : {
    borderTop: '4px solid var(--delta-red)'
  } : null;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: 'var(--surface-card)',
      border: elevated ? 'none' : '1px solid var(--border-subtle)',
      boxShadow: elevated ? 'var(--shadow-md)' : 'none',
      borderRadius: 0,
      padding,
      ...accentBorder,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Square icon button. Pass a single icon (e.g. a Lucide element) as children.
 */
function IconButton({
  variant = 'secondary',
  // 'primary' | 'secondary' | 'ghost'
  size = 'md',
  // 'sm' | 'md' | 'lg'
  label,
  // accessible label (required for a11y)
  disabled = false,
  style,
  children,
  ...rest
}) {
  const dims = {
    sm: 32,
    md: 40,
    lg: 48
  };
  const d = dims[size];
  const variants = {
    primary: {
      background: 'var(--action)',
      color: 'var(--action-text)',
      borderColor: 'var(--action)'
    },
    secondary: {
      background: 'transparent',
      color: 'var(--text-primary)',
      borderColor: 'var(--border-strong)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      borderColor: 'transparent'
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    style: {
      width: d,
      height: d,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid transparent',
      borderRadius: 0,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)',
      ...variants[variant],
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Interactive category tag / filter chip. Square edges; supports selected
 * and removable states. Lowercase by default.
 */
function Tag({
  selected = false,
  onRemove,
  // if provided, shows an × affordance
  style,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      padding: '5px 10px',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--fs-small)',
      lineHeight: 1.2,
      textTransform: 'lowercase',
      border: '1px solid',
      borderColor: selected ? 'var(--delta-red)' : 'var(--border-subtle)',
      color: selected ? 'var(--delta-red)' : 'var(--text-secondary)',
      background: selected ? 'var(--red-050)' : 'transparent',
      borderRadius: 0,
      cursor: 'pointer',
      ...style
    }
  }, rest), children, onRemove && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "remove",
    onClick: e => {
      e.stopPropagation();
      onRemove(e);
    },
    style: {
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      color: 'inherit',
      fontSize: 14,
      lineHeight: 1,
      padding: 0
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Modal dialog. Square edges, red top accent, dimmed charcoal backdrop. */
function Dialog({
  open,
  onClose,
  title,
  footer,
  width = 480,
  children,
  style,
  ...rest
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 'var(--z-modal)',
      background: 'rgba(24,29,30,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)'
    }
  }, /*#__PURE__*/React.createElement("div", _extends({
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation(),
    style: {
      width,
      maxWidth: '100%',
      background: 'var(--surface-card)',
      borderTop: '4px solid var(--delta-red)',
      borderRadius: 0,
      boxShadow: 'var(--shadow-lg)',
      ...style
    }
  }, rest), title && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--space-5) var(--space-6)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-h4)',
      textTransform: 'lowercase'
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "close",
    onClick: onClose,
    style: {
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      fontSize: 20,
      lineHeight: 1,
      color: 'var(--text-secondary)'
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 'var(--space-6)',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-light)',
      fontSize: 'var(--fs-body)',
      color: 'var(--text-secondary)',
      lineHeight: 'var(--lh-normal)'
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 'var(--space-3)',
      padding: 'var(--space-5) var(--space-6)',
      borderTop: '1px solid var(--border-subtle)'
    }
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Inline toast/notification. Square, left accent by status. */
function Toast({
  status = 'info',
  title,
  children,
  onClose,
  style,
  ...rest
}) {
  const accents = {
    info: 'var(--delta-charcoal)',
    success: 'var(--delta-red)',
    // brand leans red for affirmative action
    warning: 'var(--delta-yellow)',
    error: 'var(--delta-red)'
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-3)',
      background: 'var(--surface-card)',
      borderRadius: 0,
      borderLeft: `4px solid ${accents[status]}`,
      boxShadow: 'var(--shadow-md)',
      padding: 'var(--space-4) var(--space-5)',
      minWidth: 280,
      maxWidth: 420,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-bold)',
      fontSize: 'var(--fs-small)',
      color: 'var(--text-primary)',
      textTransform: 'lowercase',
      marginBottom: children ? 2 : 0
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-light)',
      fontSize: 'var(--fs-small)',
      color: 'var(--text-secondary)'
    }
  }, children)), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "dismiss",
    onClick: onClose,
    style: {
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      fontSize: 16,
      lineHeight: 1,
      color: 'var(--text-muted)'
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Hover tooltip. Charcoal ground, square, no arrow curve. */
function Tooltip({
  content,
  placement = 'top',
  children,
  style,
  ...rest
}) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginBottom: 8
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: 8
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginRight: 8
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      marginLeft: 8
    }
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: 'relative',
      display: 'inline-flex'
    },
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false)
  }, rest), children, show && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      zIndex: 'var(--z-overlay)',
      whiteSpace: 'nowrap',
      background: 'var(--delta-charcoal)',
      color: '#fff',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-light)',
      fontSize: 'var(--fs-caption)',
      padding: '6px 10px',
      borderRadius: 0,
      ...pos[placement],
      ...style
    }
  }, content));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Square checkbox with a red checked state. */
function Checkbox({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled,
  id,
  style,
  ...rest
}) {
  const inputId = id || React.useId();
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = isControlled ? checked : internal;
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-light)',
      fontSize: 'var(--fs-body)',
      color: 'var(--text-primary)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    type: "checkbox",
    checked: on,
    disabled: disabled,
    onChange: e => {
      if (!isControlled) setInternal(e.target.checked);
      onChange?.(e);
    },
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }, rest)), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 18,
      height: 18,
      flexShrink: 0,
      border: '2px solid',
      borderColor: on ? 'var(--delta-red)' : 'var(--border-strong)',
      background: on ? 'var(--delta-red)' : 'transparent',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: 12,
      lineHeight: 1,
      borderRadius: 0,
      transition: 'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)'
    }
  }, on ? '✓' : ''), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Text input with optional label + helper/error. Square edges; red focus.
 */
function Input({
  label,
  helper,
  error,
  id,
  style,
  containerStyle,
  ...rest
}) {
  const inputId = id || React.useId();
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      ...containerStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--fs-small)',
      color: 'var(--text-primary)'
    }
  }, label), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    onFocus: e => {
      setFocus(true);
      rest.onFocus?.(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur?.(e);
    },
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-light)',
      fontSize: 'var(--fs-body)',
      color: 'var(--text-primary)',
      padding: '10px 12px',
      background: 'var(--surface-card)',
      border: '1px solid',
      borderColor: error ? 'var(--delta-red)' : focus ? 'var(--delta-charcoal)' : 'var(--border-subtle)',
      outline: focus ? '2px solid var(--delta-red)' : 'none',
      outlineOffset: '1px',
      borderRadius: 0,
      transition: 'border-color var(--dur-fast) var(--ease-out)',
      ...style
    }
  }, rest)), (helper || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-caption)',
      color: error ? 'var(--delta-red)' : 'var(--text-secondary)'
    }
  }, error || helper));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Radio group. Square indicators (no circles — brand rule).
 * options: [{ value, label }]
 */
function Radio({
  name,
  options = [],
  value,
  defaultValue,
  onChange,
  disabled,
  style,
  ...rest
}) {
  const groupName = name || React.useId();
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue);
  const current = isControlled ? value : internal;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "radiogroup",
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      ...style
    }
  }, rest), options.map(opt => {
    const on = current === opt.value;
    return /*#__PURE__*/React.createElement("label", {
      key: opt.value,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--fw-light)',
        fontSize: 'var(--fs-body)',
        color: 'var(--text-primary)'
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: groupName,
      value: opt.value,
      checked: on,
      disabled: disabled,
      onChange: () => {
        if (!isControlled) setInternal(opt.value);
        onChange?.(opt.value);
      },
      style: {
        position: 'absolute',
        opacity: 0,
        width: 0,
        height: 0
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 18,
        height: 18,
        flexShrink: 0,
        border: '2px solid',
        borderColor: on ? 'var(--delta-red)' : 'var(--border-strong)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        background: on ? 'var(--delta-red)' : 'transparent'
      }
    })), opt.label);
  }));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Native select styled to the brand. Square edges, red focus. */
function Select({
  label,
  helper,
  id,
  children,
  style,
  containerStyle,
  ...rest
}) {
  const inputId = id || React.useId();
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      ...containerStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--fs-small)',
      color: 'var(--text-primary)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: inputId,
    onFocus: e => {
      setFocus(true);
      rest.onFocus?.(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur?.(e);
    },
    style: {
      appearance: 'none',
      width: '100%',
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-light)',
      fontSize: 'var(--fs-body)',
      color: 'var(--text-primary)',
      padding: '10px 36px 10px 12px',
      background: 'var(--surface-card)',
      border: '1px solid',
      borderColor: focus ? 'var(--delta-charcoal)' : 'var(--border-subtle)',
      outline: focus ? '2px solid var(--delta-red)' : 'none',
      outlineOffset: '1px',
      borderRadius: 0,
      cursor: 'pointer',
      ...style
    }
  }, rest), children), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      color: 'var(--text-secondary)',
      fontSize: 12
    }
  }, "\u25BE")), helper && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-caption)',
      color: 'var(--text-secondary)'
    }
  }, helper));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Square toggle switch. On = delta red. */
function Switch({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled,
  id,
  style,
  ...rest
}) {
  const inputId = id || React.useId();
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = isControlled ? checked : internal;
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-light)',
      fontSize: 'var(--fs-body)',
      color: 'var(--text-primary)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    type: "checkbox",
    checked: on,
    disabled: disabled,
    onChange: e => {
      if (!isControlled) setInternal(e.target.checked);
      onChange?.(e);
    },
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }, rest)), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 42,
      height: 22,
      flexShrink: 0,
      padding: 2,
      background: on ? 'var(--delta-red)' : 'var(--grey-300)',
      borderRadius: 0,
      position: 'relative',
      transition: 'background var(--dur-base) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      left: on ? 22 : 2,
      width: 18,
      height: 18,
      background: '#fff',
      borderRadius: 0,
      transition: 'left var(--dur-base) var(--ease-out)'
    }
  })), label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Multi-line text input. Shares Input styling. */
function Textarea({
  label,
  helper,
  error,
  id,
  rows = 4,
  style,
  containerStyle,
  ...rest
}) {
  const inputId = id || React.useId();
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      ...containerStyle
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-semibold)',
      fontSize: 'var(--fs-small)',
      color: 'var(--text-primary)'
    }
  }, label), /*#__PURE__*/React.createElement("textarea", _extends({
    id: inputId,
    rows: rows,
    onFocus: e => {
      setFocus(true);
      rest.onFocus?.(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur?.(e);
    },
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 'var(--fw-light)',
      fontSize: 'var(--fs-body)',
      color: 'var(--text-primary)',
      padding: '10px 12px',
      resize: 'vertical',
      background: 'var(--surface-card)',
      border: '1px solid',
      borderColor: error ? 'var(--delta-red)' : focus ? 'var(--delta-charcoal)' : 'var(--border-subtle)',
      outline: focus ? '2px solid var(--delta-red)' : 'none',
      outlineOffset: '1px',
      borderRadius: 0,
      ...style
    }
  }, rest)), (helper || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-caption)',
      color: error ? 'var(--delta-red)' : 'var(--text-secondary)'
    }
  }, error || helper));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Underlined tab bar. Active tab carries a red underline (square).
 * items: [{ id, label }]
 */
function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  style,
  ...rest
}) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? items[0]?.id);
  const current = isControlled ? value : internal;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: 'flex',
      gap: 'var(--space-6)',
      borderBottom: '1px solid var(--border-subtle)',
      ...style
    }
  }, rest), items.map(it => {
    const on = current === it.id;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      role: "tab",
      "aria-selected": on,
      type: "button",
      onClick: () => {
        if (!isControlled) setInternal(it.id);
        onChange?.(it.id);
      },
      style: {
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        padding: '0 0 var(--space-3)',
        fontFamily: 'var(--font-sans)',
        fontWeight: on ? 'var(--fw-bold)' : 'var(--fw-semibold)',
        fontSize: 'var(--fs-body)',
        textTransform: 'lowercase',
        color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
        borderBottom: on ? '3px solid var(--delta-red)' : '3px solid transparent',
        marginBottom: -1,
        transition: 'color var(--dur-fast) var(--ease-out)'
      }
    }, it.label);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/collateral/Collateral.jsx
try { (() => {
/* the^delta collateral kit — reusable creative templates.
   Text is live (edit freely); photos are drop-in <image-slot>s. */
const {
  Logo,
  Button
} = window.TheDeltaDesignSystem_88b8ab;

/* 1 — Impact social post (square). White caret top-right, B&W photo,
   headline with an Argent-italic emphasis word. */
function ImpactPost() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: 480,
      height: 480,
      background: 'var(--delta-charcoal)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("image-slot", {
    id: "post-impact",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%'
    },
    shape: "rect",
    fit: "cover",
    placeholder: "drop a B&W photo"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(90deg, rgba(26,29,30,0.75) 0%, rgba(26,29,30,0.15) 60%, rgba(26,29,30,0) 100%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 22,
      right: 22
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    variant: "mark",
    tone: "light",
    size: 40
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 32,
      bottom: 40,
      color: '#fff',
      maxWidth: 300
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 300,
      fontSize: 22,
      lineHeight: 1.2
    }
  }, "transform your ideas into"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontWeight: 600,
      fontSize: 68,
      lineHeight: 1
    }
  }, "impact")));
}

/* 2 — Testimonial card (square). */
function TestimonialCard() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 480,
      height: 480,
      background: 'var(--surface-canvas)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '22px 0 16px'
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    size: 22,
    program: "incubator"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      gap: 18,
      padding: '0 26px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1.2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontWeight: 700,
      color: 'var(--delta-yellow)',
      fontSize: 56,
      lineHeight: 0.5,
      height: 26
    }
  }, "\u201C"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 30,
      textTransform: 'lowercase',
      color: 'var(--delta-red)',
      marginTop: 10
    }
  }, "sonali saini"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 16,
      color: 'var(--text-secondary)'
    }
  }, "Founder, Sol's ARC"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 12,
      fontWeight: 300,
      fontSize: 13.5,
      lineHeight: 1.55,
      color: 'var(--text-primary)'
    }
  }, "the^delta incubator was a game-changer \u2014 strategic guidance, mentorship and ecosystem support to scale our impact and strengthen our model.")), /*#__PURE__*/React.createElement("image-slot", {
    id: "post-portrait",
    style: {
      width: 150,
      alignSelf: 'flex-end',
      height: 300
    },
    shape: "rect",
    fit: "cover",
    src: "../../assets/imagery/portrait-sonali-bw.png"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 26px',
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 17,
      color: 'var(--text-primary)'
    }
  }, "transform your ideas into impact"), /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'var(--delta-red)',
      color: '#fff',
      fontWeight: 700,
      fontSize: 12,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: '8px 14px'
    }
  }, "apply now")));
}

/* 3 — Program web banner (wide). */
function ProgramBanner() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: 900,
      height: 320,
      background: '#fff',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      borderTop: '90px solid var(--delta-red)',
      borderRight: '90px solid transparent'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 0,
      height: 0,
      borderBottom: '320px solid var(--delta-red)',
      borderLeft: '150px solid transparent'
    }
  }), /*#__PURE__*/React.createElement("image-slot", {
    id: "banner-group",
    style: {
      position: 'absolute',
      right: 40,
      bottom: 0,
      width: 360,
      height: 250
    },
    shape: "rect",
    fit: "cover",
    placeholder: "drop a B&W group photo"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 44,
      top: 54
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 44,
      textTransform: 'lowercase',
      letterSpacing: '-0.01em'
    }
  }, "the", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--delta-red)'
    }
  }, "^"), "delta", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)',
      fontWeight: 300
    }
  }, " incubator")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontWeight: 300,
      fontSize: 18,
      color: 'var(--text-secondary)'
    }
  }, "registration now open for 2025 cohort"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 44,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontWeight: 600,
      fontSize: 30,
      color: 'var(--delta-red)'
    }
  }, "apply now"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 0,
      height: 0,
      borderLeft: '14px solid var(--delta-red)',
      borderTop: '9px solid transparent',
      borderBottom: '9px solid transparent'
    }
  }))));
}
function Gallery() {
  const label = t => /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginBottom: 12
    }
  }, t);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1080,
      margin: '0 auto',
      padding: '40px 32px 80px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontWeight: 700,
      fontSize: 34,
      textTransform: 'lowercase',
      margin: '0 0 4px'
    }
  }, "collateral templates"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontWeight: 300,
      color: 'var(--text-secondary)',
      margin: '0 0 36px',
      fontSize: 16
    }
  }, "editable text \xB7 drop your own black-and-white photography."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 40,
      flexWrap: 'wrap',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", null, label('social post · square'), /*#__PURE__*/React.createElement(ImpactPost, null)), /*#__PURE__*/React.createElement("div", null, label('testimonial · square'), /*#__PURE__*/React.createElement(TestimonialCard, null))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 44
    }
  }, label('program banner · wide'), /*#__PURE__*/React.createElement(ProgramBanner, null)));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(Gallery, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/collateral/Collateral.jsx", error: String((e && e.message) || e) }); }

// ui_kits/collateral/image-slot.js
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
/* BEGIN USAGE */
/**
 * <image-slot> — user-fillable image placeholder.
 *
 * Drop this into a deck, mockup, or page wherever you want the user to
 * supply an image. You control the slot's shape and size; the user fills it
 * by dragging an image file onto it (or clicking to browse). The dropped
 * image persists across reloads via a .image-slots.state.json sidecar —
 * same read-via-fetch / write-via-window.omelette pattern as
 * design_canvas.jsx, so the filled slot shows on share links, downloaded
 * zips, and PPTX export. Outside the omelette runtime the slot is read-only.
 *
 * The host bridge only allows sidecar writes at the project root, so the
 * HTML that uses this component is assumed to live at the project root too
 * (same constraint as design_canvas.jsx).
 *
 * Attributes:
 *   id           Persistence key. REQUIRED for the drop to survive reload —
 *                every slot on the page needs a distinct id.
 *   shape        'rect' | 'rounded' | 'circle' | 'pill'   (default 'rounded')
 *                'circle' applies 50% border-radius; on a non-square slot
 *                that's an ellipse — set equal width and height for a true
 *                circle.
 *   radius       Corner radius in px for 'rounded'.       (default 12)
 *   mask         Any CSS clip-path value. Overrides `shape` — use this for
 *                hexagons, blobs, arbitrary polygons.
 *   fit          object-fit: cover | contain | fill.       (default 'cover')
 *                With cover (the default) double-clicking the filled slot
 *                enters a reframe mode: the whole image spills past the mask
 *                (translucent outside, opaque inside), drag to reposition,
 *                corner-drag to scale. The crop persists alongside the image
 *                in the sidecar. contain/fill stay static.
 *   position     object-position for fit=contain|fill.     (default '50% 50%')
 *   placeholder  Empty-state caption.                      (default 'Drop an image')
 *   src          Optional initial/fallback image URL. A user drop overrides
 *                it; clearing the drop reveals src again.
 *   credit       Optional attribution text (e.g. 'Photo by Jane Doe on
 *                Unsplash') shown as a small overlay at the bottom-left of
 *                the filled slot. It belongs to the src image, so it only
 *                shows while src is what's displayed — a user-dropped
 *                image hides it.
 *   credit-href  Optional link for the credit overlay (e.g. the
 *                photographer's profile). http(s) URLs only — anything
 *                else renders the credit as plain text.
 *
 * Size and layout come from ordinary CSS on the element — width/height
 * inline or from a parent grid — so it composes with any layout.
 *
 * Usage:
 *   <image-slot id="hero"   style="width:800px;height:450px" shape="rounded" radius="20"
 *               placeholder="Drop a hero image"></image-slot>
 *   <image-slot id="avatar" style="width:120px;height:120px" shape="circle"></image-slot>
 *   <image-slot id="kite"   style="width:300px;height:300px"
 *               mask="polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"></image-slot>
 */
/* END USAGE */

(() => {
  const STATE_FILE = '.image-slots.state.json';
  // 2× a ~600px slot in a 1920-wide deck — retina-sharp without making the
  // sidecar enormous. A 1200px WebP at q=0.85 is ~150-300KB.
  const MAX_DIM = 1200;
  // Raster formats only. SVG is excluded (can carry script; createImageBitmap
  // on SVG blobs is inconsistent). GIF is excluded because the canvas
  // re-encode keeps only the first frame, so an animated GIF would silently
  // go still — better to reject than surprise.
  const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

  // ── Shared sidecar store ────────────────────────────────────────────────
  // One fetch + immediate write-on-change for every <image-slot> on the
  // page. Reads via fetch() so viewing works anywhere the HTML and sidecar
  // are served together; writes go through window.omelette.writeFile, which
  // the host allowlists to *.state.json basenames only.
  const subs = new Set();
  let slots = {};
  // ids explicitly cleared before the sidecar fetch resolved — otherwise
  // the merge below can't tell "never set" from "just deleted" and would
  // resurrect the sidecar's stale value.
  const tombstones = new Set();
  let loaded = false;
  let loadP = null;
  function load() {
    if (loadP) return loadP;
    loadP = fetch(STATE_FILE).then(r => r.ok ? r.json() : null).then(j => {
      // Merge: sidecar loses to any in-memory change that raced ahead of
      // the fetch (drop or clear) so neither is clobbered by hydration.
      if (j && typeof j === 'object') {
        const merged = Object.assign({}, j, slots);
        // A framing-only write that raced ahead of hydration must not
        // drop a user image that's only on disk — inherit u from the
        // sidecar for any in-memory entry that lacks one.
        for (const k in slots) {
          if (merged[k] && !merged[k].u && j[k]) {
            merged[k].u = typeof j[k] === 'string' ? j[k] : j[k].u;
          }
        }
        for (const id of tombstones) delete merged[id];
        slots = merged;
      }
      tombstones.clear();
    }).catch(() => {}).then(() => {
      loaded = true;
      subs.forEach(fn => fn());
    });
    return loadP;
  }

  // Serialize writes so two near-simultaneous drops on different slots
  // can't reorder at the backend and leave the sidecar with only the
  // first. A save requested mid-flight just marks dirty and re-fires on
  // completion with the then-current slots.
  let saving = false;
  let saveDirty = false;
  function save() {
    if (saving) {
      saveDirty = true;
      return;
    }
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    saving = true;
    Promise.resolve(w(STATE_FILE, JSON.stringify(slots))).catch(() => {}).then(() => {
      saving = false;
      if (saveDirty) {
        saveDirty = false;
        save();
      }
    });
  }
  const S_MAX = 5;
  const clampS = s => Math.max(1, Math.min(S_MAX, s));

  // Normalize a stored slot value. Pre-reframe sidecars stored a bare
  // data-URL string; newer ones store {u, s, x, y}. Either shape is valid.
  function getSlot(id) {
    const v = slots[id];
    if (!v) return null;
    return typeof v === 'string' ? {
      u: v,
      s: 1,
      x: 0,
      y: 0
    } : v;
  }
  function setSlot(id, val) {
    if (!id) return;
    if (val) {
      slots[id] = val;
      tombstones.delete(id);
    } else {
      delete slots[id];
      if (!loaded) tombstones.add(id);
    }
    subs.forEach(fn => fn());
    // A drop is rare + high-value — write immediately so nav-away can't lose
    // it. Gate on the initial read so we don't overwrite a sidecar we haven't
    // merged yet; the merge in load() keeps this change once the read lands.
    if (loaded) save();else load().then(save);
  }

  // ── Image downscale ─────────────────────────────────────────────────────
  // Encode through a canvas so the sidecar carries resized bytes, not the
  // raw upload. Longest side is capped at 2× the slot's rendered width
  // (retina) and at MAX_DIM. WebP keeps alpha and is ~10× smaller than PNG
  // for photos, so there's no need for per-image format picking.
  async function toDataUrl(file, targetW) {
    const bitmap = await createImageBitmap(file);
    try {
      const cap = Math.min(MAX_DIM, Math.max(1, Math.round(targetW * 2)) || MAX_DIM);
      const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL('image/webp', 0.85);
    } finally {
      bitmap.close && bitmap.close();
    }
  }

  // ── Custom element ──────────────────────────────────────────────────────
  const stylesheet = ':host{display:inline-block;position:relative;vertical-align:top;' + '  font:13px/1.3 system-ui,-apple-system,sans-serif;color:rgba(0,0,0,.55);width:240px;height:160px}' + '.frame{position:absolute;inset:0;overflow:hidden;background:rgba(0,0,0,.04)}' +
  // .frame img (clipped) and .spill (unclipped ghost + handles) share the
  // same left/top/width/height in frame-%, computed by _applyView(), so the
  // inside-mask crop and the outside-mask spill stay pixel-aligned.
  '.frame img{position:absolute;max-width:none;transform:translate(-50%,-50%);' + '  -webkit-user-drag:none;user-select:none;touch-action:none}' +
  // Reframe mode (double-click): the full image spills past the mask. The
  // spill layer is sized to the IMAGE bounds so its corners are where the
  // resize handles belong. The ghost <img> inside is translucent; the real
  // clipped <img> underneath shows the opaque in-mask crop.
  '.spill{position:absolute;transform:translate(-50%,-50%);display:none;z-index:1;' + '  cursor:grab;touch-action:none}' + ':host([data-panning]) .spill{cursor:grabbing}' + '.spill .ghost{position:absolute;inset:0;width:100%;height:100%;opacity:.35;' + '  pointer-events:none;-webkit-user-drag:none;user-select:none;' + '  box-shadow:0 0 0 1px rgba(0,0,0,.2),0 12px 32px rgba(0,0,0,.2)}' + '.spill .handle{position:absolute;width:12px;height:12px;border-radius:50%;' + '  background:#fff;box-shadow:0 0 0 1.5px #c96442,0 1px 3px rgba(0,0,0,.3);' + '  transform:translate(-50%,-50%)}' + '.spill .handle[data-c=nw]{left:0;top:0;cursor:nwse-resize}' + '.spill .handle[data-c=ne]{left:100%;top:0;cursor:nesw-resize}' + '.spill .handle[data-c=sw]{left:0;top:100%;cursor:nesw-resize}' + '.spill .handle[data-c=se]{left:100%;top:100%;cursor:nwse-resize}' + ':host([data-reframe]){z-index:10}' + ':host([data-reframe]) .spill{display:block}' + ':host([data-reframe]) .frame{box-shadow:0 0 0 2px #c96442}' + '.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' + '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' + '  cursor:pointer;user-select:none}' + '.empty svg{opacity:.45}' + '.empty .cap{max-width:90%;font-weight:500;letter-spacing:.01em}' + '.empty .sub{font-size:11px}' + '.empty .sub u{text-underline-offset:2px;text-decoration-color:rgba(0,0,0,.25)}' + '.empty:hover .sub u{color:rgba(0,0,0,.75);text-decoration-color:currentColor}' + ':host([data-over]) .frame{outline:2px solid #c96442;outline-offset:-2px;' + '  background:rgba(201,100,66,.10)}' + '.ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed rgba(0,0,0,.25);' + '  transition:border-color .12s}' + ':host([data-over]) .ring{border-color:#c96442}' + ':host([data-filled]) .ring{display:none}' +
  // Controls sit BELOW the mask (top:100%), absolutely positioned so the
  // author-declared slot height is unaffected. The gap is padding, not a
  // top offset, so the hover target stays contiguous with the frame.
  '.ctl{position:absolute;top:100%;left:50%;transform:translateX(-50%);padding-top:8px;' + '  display:flex;gap:6px;opacity:0;pointer-events:none;transition:opacity .12s;z-index:2;' + '  white-space:nowrap}' + ':host([data-filled][data-editable]:hover) .ctl,:host([data-reframe]) .ctl' + '  {opacity:1;pointer-events:auto}' + '.ctl button{appearance:none;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;' + '  background:rgba(0,0,0,.65);color:#fff;font:11px/1 system-ui,-apple-system,sans-serif;' + '  backdrop-filter:blur(6px)}' + '.ctl button:hover{background:rgba(0,0,0,.8)}' + '.err{position:absolute;left:8px;bottom:8px;right:8px;color:#b3261e;font-size:11px;' + '  background:rgba(255,255,255,.85);padding:4px 6px;border-radius:5px;pointer-events:none}' + '.credit{position:absolute;left:6px;bottom:6px;max-width:calc(100% - 12px);display:none;' + '  padding:3px 7px;border-radius:5px;background:rgba(0,0,0,.55);color:#fff;' + '  font:10px/1.2 system-ui,-apple-system,sans-serif;text-decoration:none;' + '  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;backdrop-filter:blur(6px)}' + '.credit[href]:hover{background:rgba(0,0,0,.8);text-decoration:underline}' + ':host([data-filled][data-credit]) .credit{display:block}';
  const icon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' + 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' + '<path d="m21 15-5-5L5 21"/></svg>';
  class ImageSlot extends HTMLElement {
    static get observedAttributes() {
      return ['shape', 'radius', 'mask', 'fit', 'position', 'placeholder', 'src', 'id', 'credit', 'credit-href'];
    }
    constructor() {
      super();
      const root = this.attachShadow({
        mode: 'open'
      });
      // .spill and .ctl sit OUTSIDE .frame so overflow:hidden + border-radius
      // on the frame (circle, pill, rounded) can't clip them.
      root.innerHTML = '<style>' + stylesheet + '</style>' + '<div class="frame" part="frame">' + '  <img part="image" alt="" draggable="false" style="display:none">' + '  <div class="empty" part="empty">' + icon + '    <div class="cap"></div>' + '    <div class="sub">or <u>browse files</u></div></div>' + '  <div class="ring" part="ring"></div>' + '</div>' +
      // Outside .frame, like .spill/.ctl — the frame's overflow:hidden +
      // border-radius/clip-path would cut the credit off on circle/pill/mask.
      '<a class="credit" part="credit" target="_blank" rel="noopener noreferrer"></a>' + '<div class="spill">' + '  <img class="ghost" alt="" draggable="false">' + '  <div class="handle" data-c="nw"></div><div class="handle" data-c="ne"></div>' + '  <div class="handle" data-c="sw"></div><div class="handle" data-c="se"></div>' + '</div>' + '<div class="ctl"><button data-act="replace" title="Replace image">Replace</button>' + '  <button data-act="clear" title="Remove image">Remove</button></div>' + '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';
      this._frame = root.querySelector('.frame');
      this._ring = root.querySelector('.ring');
      this._img = root.querySelector('.frame img');
      this._empty = root.querySelector('.empty');
      this._cap = root.querySelector('.cap');
      this._sub = root.querySelector('.sub');
      this._spill = root.querySelector('.spill');
      this._credit = root.querySelector('.credit');
      // Credit clicks open the link, not browse/reframe.
      this._credit.addEventListener('click', e => e.stopPropagation());
      this._credit.addEventListener('dblclick', e => e.stopPropagation());
      this._ghost = root.querySelector('.ghost');
      this._err = null;
      this._input = root.querySelector('input');
      this._depth = 0;
      this._gen = 0;
      this._view = {
        s: 1,
        x: 0,
        y: 0
      };
      this._subFn = () => this._render();
      // Shadow-DOM listeners live with the shadow DOM — bound once here so
      // disconnect/reconnect (e.g. React remount) doesn't stack handlers.
      this._empty.addEventListener('click', () => this._input.click());
      root.addEventListener('click', e => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (act === 'replace') {
          this._exitReframe(true);
          this._input.click();
        }
        if (act === 'clear') {
          this._exitReframe(false);
          this._gen++;
          this._local = null;
          if (this.id) setSlot(this.id, null);else this._render();
        }
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
      // naturalWidth/Height aren't known until load — re-apply so the cover
      // baseline is computed from real dimensions, not the 100%×100% fallback.
      this._img.addEventListener('load', () => this._applyView());
      // Gated on editable + fit=cover so share links and contain/fill slots
      // stay static.
      this.addEventListener('dblclick', e => {
        if (!this.hasAttribute('data-editable') || !this._reframes()) return;
        e.preventDefault();
        if (this.hasAttribute('data-reframe')) this._exitReframe(true);else this._enterReframe();
      });
      // Pan + resize both originate on the spill layer. A handle pointerdown
      // drives an aspect-locked resize anchored at the opposite corner; any
      // other pointerdown on the spill pans. Offsets are frame-% so a
      // reframed slot survives responsive resize / PPTX export.
      this._spill.addEventListener('pointerdown', e => {
        if (e.button !== 0 || !this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        e.stopPropagation();
        this._spill.setPointerCapture(e.pointerId);
        const rect = this.getBoundingClientRect();
        const fw = rect.width || 1,
          fh = rect.height || 1;
        const corner = e.target.getAttribute && e.target.getAttribute('data-c');
        let move;
        if (corner) {
          // Resize about the OPPOSITE corner. Viewport-px throughout (rect
          // fw/fh, not clientWidth) so the math survives a transform:scale()
          // ancestor — deck_stage renders slides scaled-to-fit.
          const iw = this._img.naturalWidth || 1,
            ih = this._img.naturalHeight || 1;
          const base = Math.max(fw / iw, fh / ih);
          const sx = corner.includes('e') ? 1 : -1;
          const sy = corner.includes('s') ? 1 : -1;
          const s0 = this._view.s;
          const w0 = iw * base * s0,
            h0 = ih * base * s0;
          const cx0 = (50 + this._view.x) / 100 * fw;
          const cy0 = (50 + this._view.y) / 100 * fh;
          const ox = cx0 - sx * w0 / 2,
            oy = cy0 - sy * h0 / 2;
          const diag0 = Math.hypot(w0, h0);
          const ux = sx * w0 / diag0,
            uy = sy * h0 / diag0;
          move = ev => {
            const proj = (ev.clientX - rect.left - ox) * ux + (ev.clientY - rect.top - oy) * uy;
            const s = clampS(s0 * proj / diag0);
            const d = diag0 * s / s0;
            this._view.s = s;
            this._view.x = (ox + ux * d / 2) / fw * 100 - 50;
            this._view.y = (oy + uy * d / 2) / fh * 100 - 50;
            this._clampView();
            this._applyView();
          };
        } else {
          this.setAttribute('data-panning', '');
          const start = {
            px: e.clientX,
            py: e.clientY,
            x: this._view.x,
            y: this._view.y
          };
          move = ev => {
            this._view.x = start.x + (ev.clientX - start.px) / fw * 100;
            this._view.y = start.y + (ev.clientY - start.py) / fh * 100;
            this._clampView();
            this._applyView();
          };
        }
        const up = () => {
          try {
            this._spill.releasePointerCapture(e.pointerId);
          } catch {}
          this._spill.removeEventListener('pointermove', move);
          this._spill.removeEventListener('pointerup', up);
          this._spill.removeEventListener('pointercancel', up);
          this.removeAttribute('data-panning');
          this._dragUp = null;
        };
        // Stashed so _exitReframe (Escape / outside-click mid-drag) can
        // tear the capture + listeners down synchronously.
        this._dragUp = up;
        this._spill.addEventListener('pointermove', move);
        this._spill.addEventListener('pointerup', up);
        this._spill.addEventListener('pointercancel', up);
      });
      // Wheel zoom stays available inside reframe mode as a trackpad nicety —
      // zooms toward the cursor (offset' = cursor·(1-k) + offset·k).
      this.addEventListener('wheel', e => {
        if (!this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        const r = this.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width * 100 - 50;
        const cy = (e.clientY - r.top) / r.height * 100 - 50;
        const prev = this._view.s;
        const next = clampS(prev * Math.pow(1.0015, -e.deltaY));
        if (next === prev) return;
        const k = next / prev;
        this._view.s = next;
        this._view.x = cx * (1 - k) + this._view.x * k;
        this._view.y = cy * (1 - k) + this._view.y * k;
        this._clampView();
        this._applyView();
      }, {
        passive: false
      });
    }
    connectedCallback() {
      // Warn once per page — an id-less slot works for the session but
      // cannot persist, and two id-less slots would share nothing.
      if (!this.id && !ImageSlot._warned) {
        ImageSlot._warned = true;
        console.warn('<image-slot> without an id will not persist its dropped image.');
      }
      this.addEventListener('dragenter', this);
      this.addEventListener('dragover', this);
      this.addEventListener('dragleave', this);
      this.addEventListener('drop', this);
      subs.add(this._subFn);
      // width%/height% in _applyView encode the frame aspect at call time —
      // a host resize (responsive grid, pane divider) would stretch the
      // image until the next _render. Re-render on size change: _render()
      // re-seeds _view from stored before clamp/apply, so a shrink→grow
      // cycle round-trips instead of ratcheting x/y toward the narrower
      // frame's clamp range.
      this._ro = new ResizeObserver(() => this._render());
      this._ro.observe(this);
      load();
      this._render();
    }
    disconnectedCallback() {
      subs.delete(this._subFn);
      this.removeEventListener('dragenter', this);
      this.removeEventListener('dragover', this);
      this.removeEventListener('dragleave', this);
      this.removeEventListener('drop', this);
      if (this._ro) {
        this._ro.disconnect();
        this._ro = null;
      }
      this._exitReframe(false);
    }
    _enterReframe() {
      if (this.hasAttribute('data-reframe')) return;
      this.setAttribute('data-reframe', '');
      this._applyView();
      // Close on click outside (the spill handler stopPropagation()s so
      // in-image drags don't reach this) and on Escape. Listeners are held
      // on the instance so _exitReframe / disconnectedCallback can detach
      // exactly what was attached.
      this._outside = e => {
        if (e.composedPath && e.composedPath().includes(this)) return;
        this._exitReframe(true);
      };
      this._esc = e => {
        if (e.key === 'Escape') this._exitReframe(true);
      };
      document.addEventListener('pointerdown', this._outside, true);
      document.addEventListener('keydown', this._esc, true);
    }
    _exitReframe(commit) {
      if (!this.hasAttribute('data-reframe')) return;
      if (this._dragUp) this._dragUp();
      this.removeAttribute('data-reframe');
      this.removeAttribute('data-panning');
      if (this._outside) document.removeEventListener('pointerdown', this._outside, true);
      if (this._esc) document.removeEventListener('keydown', this._esc, true);
      this._outside = this._esc = null;
      if (commit) this._commitView();
    }
    attributeChangedCallback() {
      if (this.shadowRoot) this._render();
    }

    // handleEvent — one listener object for all four drag events keeps the
    // add/remove symmetric and the depth counter correct.
    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        // Without preventDefault the browser never fires 'drop'.
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        // dragenter/leave fire for every descendant crossing — count depth
        // so hovering the icon inside the empty state doesn't flicker.
        if (--this._depth <= 0) {
          this._depth = 0;
          this.removeAttribute('data-over');
        }
      } else if (e.type === 'drop') {
        e.preventDefault();
        e.stopPropagation();
        this._depth = 0;
        this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }
    async _ingest(file) {
      this._setError(null);
      if (!file || ACCEPT.indexOf(file.type) < 0) {
        this._setError('Drop a PNG, JPEG, WebP, or AVIF image.');
        return;
      }
      // toDataUrl can take hundreds of ms on a large photo. A Clear or a
      // newer drop during that window would be clobbered when this await
      // resumes — bump + capture a generation so stale encodes bail.
      const gen = ++this._gen;
      try {
        const w = this.clientWidth || this.offsetWidth || MAX_DIM;
        const url = await toDataUrl(file, w);
        if (gen !== this._gen) return;
        // Only exit reframe once the new image is in hand — a rejected type
        // or decode failure leaves the in-progress crop untouched.
        this._exitReframe(false);
        const val = {
          u: url,
          s: 1,
          x: 0,
          y: 0
        };
        setSlot(this.id || '', val);
        // Keep a session-local copy for id-less slots so the drop still
        // shows, even though it cannot persist.
        if (!this.id) {
          this._local = val;
          this._render();
        }
      } catch (err) {
        if (gen !== this._gen) return;
        this._setError('Could not read that image.');
        console.warn('<image-slot> ingest failed:', err);
      }
    }
    _setError(msg) {
      if (this._err) {
        this._err.remove();
        this._err = null;
      }
      if (!msg) return;
      const d = document.createElement('div');
      d.className = 'err';
      d.textContent = msg;
      this.shadowRoot.appendChild(d);
      this._err = d;
      setTimeout(() => {
        if (this._err === d) {
          d.remove();
          this._err = null;
        }
      }, 3000);
    }

    // Reframing (pan/resize) is only meaningful for fit=cover — contain/fill
    // keep the old object-fit path and double-click is a no-op.
    _reframes() {
      return this.hasAttribute('data-filled') && (this.getAttribute('fit') || 'cover') === 'cover';
    }

    // Cover-baseline geometry, shared by clamp/apply/resize. Null until the
    // img has loaded (naturalWidth is 0 before that) or when the slot has no
    // layout box — ResizeObserver fires with a 0×0 rect under display:none,
    // and clamping against a degenerate 1×1 frame would silently pull the
    // stored pan toward zero.
    _geom() {
      const iw = this._img.naturalWidth,
        ih = this._img.naturalHeight;
      const fw = this.clientWidth,
        fh = this.clientHeight;
      if (!iw || !ih || !fw || !fh) return null;
      return {
        iw,
        ih,
        fw,
        fh,
        base: Math.max(fw / iw, fh / ih)
      };
    }
    _clampView() {
      // Pan range on each axis is half the overflow past the frame edge.
      const g = this._geom();
      if (!g) return;
      const mx = Math.max(0, (g.iw * g.base * this._view.s / g.fw - 1) * 50);
      const my = Math.max(0, (g.ih * g.base * this._view.s / g.fh - 1) * 50);
      this._view.x = Math.max(-mx, Math.min(mx, this._view.x));
      this._view.y = Math.max(-my, Math.min(my, this._view.y));
    }
    _applyView() {
      const g = this._geom();
      const fit = this.getAttribute('fit') || 'cover';
      if (fit !== 'cover' || !g) {
        // Non-cover, or dimensions not known yet (before img load).
        this._img.style.width = '100%';
        this._img.style.height = '100%';
        this._img.style.left = '50%';
        this._img.style.top = '50%';
        this._img.style.objectFit = fit;
        this._img.style.objectPosition = this.getAttribute('position') || '50% 50%';
        return;
      }
      // Cover baseline: img fills the frame on its tighter axis at s=1, so
      // pan works immediately on the overflowing axis without zooming first.
      // Width/height and left/top are all frame-% — depends only on the
      // frame aspect ratio, so a responsive resize keeps the same crop. The
      // spill layer mirrors the same box so its corners = image corners.
      const k = g.base * this._view.s;
      const w = g.iw * k / g.fw * 100 + '%';
      const h = g.ih * k / g.fh * 100 + '%';
      const l = 50 + this._view.x + '%';
      const t = 50 + this._view.y + '%';
      this._img.style.width = w;
      this._img.style.height = h;
      this._img.style.left = l;
      this._img.style.top = t;
      this._img.style.objectFit = '';
      this._spill.style.width = w;
      this._spill.style.height = h;
      this._spill.style.left = l;
      this._spill.style.top = t;
    }
    _commitView() {
      const v = {
        s: this._view.s,
        x: this._view.x,
        y: this._view.y
      };
      if (this._userUrl) v.u = this._userUrl;
      // Framing-only (no u) persists too so an author-src slot remembers its
      // crop; clearing the sidecar still falls through to src=.
      if (this.id) setSlot(this.id, v);else {
        this._local = v;
      }
    }
    _render() {
      // Shape / mask. Presets use border-radius so the dashed ring can
      // follow the rounded outline; clip-path is only applied for an
      // explicit `mask` (the ring is hidden there since a rectangle
      // dashed border chopped by an arbitrary polygon looks broken).
      const mask = this.getAttribute('mask');
      const shape = (this.getAttribute('shape') || 'rounded').toLowerCase();
      let radius = '';
      if (shape === 'circle') radius = '50%';else if (shape === 'pill') radius = '9999px';else if (shape === 'rounded') {
        const n = parseFloat(this.getAttribute('radius'));
        radius = (Number.isFinite(n) ? n : 12) + 'px';
      }
      this._frame.style.borderRadius = mask ? '' : radius;
      this._frame.style.clipPath = mask || '';
      this._ring.style.borderRadius = mask ? '' : radius;
      this._ring.style.display = mask ? 'none' : '';

      // Controls and reframe entry gate on this so share links stay read-only.
      const editable = !!(window.omelette && window.omelette.writeFile);
      this.toggleAttribute('data-editable', editable);
      this._sub.style.display = editable ? '' : 'none';

      // Content. The sidecar is also writable by the agent's write_file
      // tool, so its value isn't guaranteed canvas-originated — only accept
      // data:image/ URLs from it. The `src` attribute is author-controlled
      // (Claude wrote it into the HTML) so it passes through unchanged.
      let stored = this.id ? getSlot(this.id) : this._local;
      if (stored && stored.u && !/^data:image\//i.test(stored.u)) stored = null;
      const srcAttr = this.getAttribute('src') || '';
      this._userUrl = stored && stored.u || null;
      const url = this._userUrl || srcAttr;
      // Don't clobber an in-flight reframe with a store-triggered re-render.
      if (!this.hasAttribute('data-reframe')) {
        this._view = {
          s: stored && Number.isFinite(stored.s) ? clampS(stored.s) : 1,
          x: stored && Number.isFinite(stored.x) ? stored.x : 0,
          y: stored && Number.isFinite(stored.y) ? stored.y : 0
        };
      }
      this._cap.textContent = this.getAttribute('placeholder') || 'Drop an image';
      // Toggle via style.display — the [hidden] attribute alone loses to
      // the display:flex / display:block rules in the stylesheet above.
      if (url) {
        if (this._img.getAttribute('src') !== url) {
          this._img.src = url;
          this._ghost.src = url;
        }
        this._img.style.display = 'block';
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
        this._clampView();
        this._applyView();
      } else {
        this._img.style.display = 'none';
        this._img.removeAttribute('src');
        this._ghost.removeAttribute('src');
        this._empty.style.display = 'flex';
        this.removeAttribute('data-filled');
      }

      // Credit belongs to the author src, so a user drop hides it.
      // textContent + http(s)-only href keep external strings inert.
      const credit = this.getAttribute('credit');
      const showCredit = !!(url && credit && !this._userUrl);
      if (showCredit) {
        this._credit.textContent = credit;
        let href = '';
        const rawHref = this.getAttribute('credit-href') || '';
        if (rawHref) {
          try {
            const u = new URL(rawHref, document.baseURI);
            if (u.protocol === 'http:' || u.protocol === 'https:') href = u.href;
          } catch {}
        }
        if (href) this._credit.setAttribute('href', href);else this._credit.removeAttribute('href');
      } else {
        this._credit.textContent = '';
        this._credit.removeAttribute('href');
      }
      this.toggleAttribute('data-credit', showCredit);
    }
  }
  if (!customElements.get('image-slot')) {
    customElements.define('image-slot', ImageSlot);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/collateral/image-slot.js", error: String((e && e.message) || e) }); }

// ui_kits/website/Apply.jsx
try { (() => {
/* the^delta website — Application form screen. */
const {
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Button,
  Card,
  Toast
} = window.TheDeltaDesignSystem_88b8ab;
function Apply({
  onNav
}) {
  const [sent, setSent] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 760,
      margin: '0 auto',
      padding: '56px 32px 96px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--delta-red)'
    }
  }, "2025 cohort \xB7 incubator"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: '10px 0 0',
      fontWeight: 700,
      fontSize: 40,
      textTransform: 'lowercase'
    }
  }, "tell us about your venture"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 10,
      fontWeight: 300,
      fontSize: 17,
      color: 'var(--text-secondary)'
    }
  }, "it takes about ten minutes. we read every application."), sent && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    status: "success",
    title: "application received",
    onClose: () => setSent(false)
  }, "thank you \u2014 we'll be in touch within two weeks.")), /*#__PURE__*/React.createElement(Card, {
    style: {
      marginTop: 28,
      display: 'flex',
      flexDirection: 'column',
      gap: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "your name",
    placeholder: "e.g. asha mehta"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "email",
    placeholder: "you@venture.in"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "venture name",
    placeholder: "what are you building?"
  }), /*#__PURE__*/React.createElement(Select, {
    label: "sector"
  }, /*#__PURE__*/React.createElement("option", null, "livelihoods"), /*#__PURE__*/React.createElement("option", null, "education"), /*#__PURE__*/React.createElement("option", null, "health"), /*#__PURE__*/React.createElement("option", null, "climate"), /*#__PURE__*/React.createElement("option", null, "financial inclusion"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      fontSize: 14,
      marginBottom: 12
    }
  }, "what stage are you at?"), /*#__PURE__*/React.createElement(Radio, {
    name: "stage",
    defaultValue: "idea",
    options: [{
      value: 'idea',
      label: 'just an idea'
    }, {
      value: 'early',
      label: 'early stage — first users'
    }, {
      value: 'scaling',
      label: 'scaling — proven model'
    }]
  })), /*#__PURE__*/React.createElement(Textarea, {
    label: "the change you want to make",
    rows: 4,
    placeholder: "describe the problem and your solution in a few sentences\u2026"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "I agree to the^delta's terms and privacy policy"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "cta",
    onClick: () => setSent(true)
  }, "submit application"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: () => onNav('home')
  }, "save & exit"))));
}
window.Apply = Apply;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Apply.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Home.jsx
try { (() => {
/* the^delta website — Home screen. */
const {
  AngularBanner,
  Button,
  Card,
  Badge,
  Quote,
  Tag
} = window.TheDeltaDesignSystem_88b8ab;
function Stat({
  value,
  label
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 800,
      fontSize: 48,
      lineHeight: 1,
      color: 'var(--delta-red)'
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontWeight: 300,
      fontSize: 15,
      color: 'var(--text-secondary)'
    }
  }, label));
}
function ProgramCard({
  name,
  blurb,
  tag
}) {
  return /*#__PURE__*/React.createElement(Card, {
    accent: true,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "outline"
  }, tag), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-sans)',
      fontWeight: 700,
      fontSize: 22,
      textTransform: 'lowercase'
    }
  }, "the", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--delta-red)'
    }
  }, "^"), "delta ", name), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontWeight: 300,
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--text-secondary)'
    }
  }, blurb), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => e.preventDefault(),
    style: {
      marginTop: 'auto',
      textDecoration: 'none',
      color: 'var(--delta-red)',
      fontWeight: 700,
      fontSize: 14,
      textTransform: 'lowercase'
    }
  }, "learn more \u2192"));
}
function Home({
  onNav
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(AngularBanner, {
    eyebrow: "registration now open \xB7 2025 cohort",
    title: "transform your ideas into impact",
    subtitle: "the^delta is the platform and social ecosystem where changemakers learn, collaborate and build the networks that turn passion into purpose.",
    action: /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "cta",
      onClick: () => onNav('apply')
    }, "apply now"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => onNav('programs')
    }, "explore programs")),
    style: {
      padding: '96px 32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 640
    }
  })), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '72px 32px',
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    value: "480+",
    label: "ventures supported"
  }), /*#__PURE__*/React.createElement(Stat, {
    value: "\u20B9120cr",
    label: "capital unlocked"
  }), /*#__PURE__*/React.createElement(Stat, {
    value: "26",
    label: "states reached"
  }), /*#__PURE__*/React.createElement(Stat, {
    value: "9M",
    label: "lives touched"
  })), /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-canvas)',
      padding: '72px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '0 32px'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontWeight: 700,
      fontSize: 32,
      textTransform: 'lowercase',
      letterSpacing: '-0.01em'
    }
  }, "three ways we accelerate change"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 8,
      fontWeight: 300,
      fontSize: 18,
      color: 'var(--text-secondary)'
    }
  }, "pick the stage that meets your venture where it is."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40,
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement(ProgramCard, {
    name: "incubator",
    tag: "idea \u2192 early stage",
    blurb: "structured guidance, mentorship and ecosystem support to shape an idea into a fundable, scalable venture."
  }), /*#__PURE__*/React.createElement(ProgramCard, {
    name: "accelerator",
    tag: "early \u2192 scaling",
    blurb: "intensive, cohort-based support to sharpen your model and unlock the capital and partnerships to grow."
  }), /*#__PURE__*/React.createElement(ProgramCard, {
    name: "prize",
    tag: "recognition",
    blurb: "catalytic, unrestricted funding that celebrates and amplifies the boldest solutions to social problems."
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1100,
      margin: '0 auto',
      padding: '80px 32px'
    }
  }, /*#__PURE__*/React.createElement(Quote, {
    quote: "the^delta incubator was a game-changer \u2014 it gave us the strategic guidance, mentorship and ecosystem support to scale our impact and strengthen our model for young people with disabilities.",
    name: "sonali saini",
    role: "Founder, Sol's ARC",
    portrait: "../../assets/imagery/portrait-sonali-bw.png"
  })), /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-ink)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1100,
      margin: '0 auto',
      padding: '64px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 32,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontWeight: 700,
      fontSize: 30,
      textTransform: 'lowercase'
    }
  }, "ready to build the delta?"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '8px 0 0',
      fontWeight: 300,
      fontSize: 17,
      color: 'rgba(255,255,255,0.75)'
    }
  }, "applications for the 2025 cohort close 31 march.")), /*#__PURE__*/React.createElement(Button, {
    variant: "cta",
    onClick: () => onNav('apply')
  }, "apply now"))));
}
window.Home = Home;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Programs.jsx
try { (() => {
/* the^delta website — Programs listing screen. */
const {
  Tabs,
  Card,
  Badge,
  Button
} = window.TheDeltaDesignSystem_88b8ab;
function Programs({
  onNav
}) {
  const [tab, setTab] = React.useState('all');
  const rows = [{
    name: 'incubator',
    stage: 'idea → early stage',
    dur: '6 months',
    mode: 'hybrid',
    tag: 'applications open'
  }, {
    name: 'accelerator',
    stage: 'early → scaling',
    dur: '4 months',
    mode: 'in-person',
    tag: 'applications open'
  }, {
    name: 'prize',
    stage: 'recognition',
    dur: 'annual',
    mode: 'remote',
    tag: 'nominations soon'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1100,
      margin: '0 auto',
      padding: '56px 32px 96px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--delta-red)'
    }
  }, "our programs"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: '10px 0 0',
      fontWeight: 700,
      fontSize: 44,
      textTransform: 'lowercase',
      letterSpacing: '-0.01em'
    }
  }, "find the programme that fits your stage"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 12,
      fontWeight: 300,
      fontSize: 18,
      color: 'var(--text-secondary)',
      maxWidth: 620
    }
  }, "every the^delta programme pairs deep, practical support with an ecosystem of mentors, partners and funders."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      id: 'all',
      label: 'all'
    }, {
      id: 'open',
      label: 'open now'
    }, {
      id: 'upcoming',
      label: 'upcoming'
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28,
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, rows.map(r => /*#__PURE__*/React.createElement(Card, {
    key: r.name,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      fontSize: 24,
      textTransform: 'lowercase'
    }
  }, "the", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--delta-red)'
    }
  }, "^"), "delta ", r.name), /*#__PURE__*/React.createElement(Badge, {
    tone: r.tag === 'applications open' ? 'red' : 'neutral'
  }, r.tag)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontWeight: 300,
      color: 'var(--text-secondary)',
      fontSize: 15
    }
  }, r.stage, " \xB7 ", r.dur, " \xB7 ", r.mode)), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    onClick: () => onNav('apply')
  }, "apply")))));
}
window.Programs = Programs;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Programs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Site.jsx
try { (() => {
/* the^delta website — shared chrome: top nav + footer.
   Exposes Nav, Footer on window for the other kit scripts. */
const {
  Logo,
  Button
} = window.TheDeltaDesignSystem_88b8ab;
function Nav({
  route,
  onNav
}) {
  const items = [{
    id: 'home',
    label: 'home'
  }, {
    id: 'programs',
    label: 'programs'
  }, {
    id: 'stories',
    label: 'stories'
  }, {
    id: 'apply',
    label: 'apply'
  }];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--surface-card)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '18px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNav('home');
    },
    style: {
      textDecoration: 'none'
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    size: 26
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 28,
      alignItems: 'center'
    }
  }, items.slice(0, 3).map(it => /*#__PURE__*/React.createElement("a", {
    key: it.id,
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNav(it.id);
    },
    style: {
      textDecoration: 'none',
      textTransform: 'lowercase',
      fontFamily: 'var(--font-sans)',
      fontWeight: route === it.id ? 700 : 600,
      fontSize: 15,
      color: route === it.id ? 'var(--delta-red)' : 'var(--text-secondary)'
    }
  }, it.label)), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => onNav('apply')
  }, "apply now"))));
}
function Footer() {
  const cols = [{
    h: 'programs',
    links: ['incubator', 'accelerator', 'prize']
  }, {
    h: 'ecosystem',
    links: ['mentors', 'partners', 'funders']
  }, {
    h: 'about',
    links: ['our mission', 'team', 'contact']
  }];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--surface-ink)',
      color: 'var(--text-inverse)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '64px 32px 40px',
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Logo, {
    size: 28,
    tone: "light"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 16,
      maxWidth: 300,
      fontWeight: 300,
      lineHeight: 1.6,
      color: 'rgba(255,255,255,0.7)',
      fontSize: 15
    }
  }, "a platform and social ecosystem to turn passion into purpose \u2014 and ideas into lasting impact.")), cols.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.h
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      fontSize: 12,
      fontWeight: 700,
      color: 'var(--delta-yellow)',
      marginBottom: 14
    }
  }, c.h), c.links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: "#",
    onClick: e => e.preventDefault(),
    style: {
      display: 'block',
      textDecoration: 'none',
      color: 'rgba(255,255,255,0.75)',
      fontSize: 14,
      fontWeight: 300,
      padding: '5px 0',
      textTransform: 'lowercase'
    }
  }, l))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid rgba(255,255,255,0.12)',
      padding: '20px 32px',
      maxWidth: 1200,
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 13,
      color: 'rgba(255,255,255,0.5)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2025 the^delta \xB7 a the/nudge initiative"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic'
    }
  }, "transform your ideas into impact")));
}
window.Nav = Nav;
window.Footer = Footer;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Site.jsx", error: String((e && e.message) || e) }); }

__ds_ns.AngularBanner = __ds_scope.AngularBanner;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.Quote = __ds_scope.Quote;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
