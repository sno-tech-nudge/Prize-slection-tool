Modal dialog with red top accent and charcoal backdrop.

```jsx
<Dialog open={open} onClose={close} title="confirm application"
  footer={<><Button variant="secondary" onClick={close}>cancel</Button><Button onClick={submit}>submit</Button></>}>
  are you ready to submit your application?
</Dialog>
```
