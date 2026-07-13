Renders the^delta wordmark or caret mark; the name is always written with the caret.

```jsx
<Logo />                                   // the^delta, dark
<Logo tone="light" program="incubator" />  // on a dark surface
<Logo variant="mark" tone="red" size={48} /> // caret glyph only
```

Variants: `variant` (wordmark | mark), `tone` (dark | light | red), `program` (incubator | accelerator | prize).
