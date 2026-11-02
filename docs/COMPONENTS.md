# Form components

The notebook editors (itinerary, checklist, trip dates, new trip, date dividers,
photo upload) are built from one small set of components in
`src/components/form/`. The site has a live version of this reference at
`/components`, linked from the component icon at the top right of the home page;
every demo there renders the real components.

| File | Contents |
| --- | --- |
| `src/components/form/Form.jsx` | All form components below |
| `src/components/form/form.css` | Their styles (imported by `notebook-editor.css`) |
| `src/components/NotebookDialog.jsx` | The editor dialog shell, close/discard behaviour |
| `src/lib/use-unsaved-guard.js` | `dirty` flag + leave-page warning |
| `src/lib/input-modality.js` | Marks keyboard vs pointer use on `<html data-input>` |
| `src/components/ComponentsPage.jsx` | The `/components` page |

## Rules

1. **Save on 完成, never on close.** Closing (×, Escape, backdrop) does not save.
2. **Confirm discards in place.** With any change (including switching type), the
   first close turns × into 「放弃修改」; pressing it again discards. Escape or further
   editing returns to ×. Without changes the dialog closes directly.
3. **Confirm deletes in place.** 「删除」 turns into an outlined 「确认删除」; a second
   press deletes. Moving focus away resets it.
4. **Validate on 完成.** Required fields show their message under the row; focus
   moves to the first invalid control. Nothing is saved until valid.
5. **Label left, control right.** Paired values share one capsule split into two
   equal halves joined by 「—」, so halves line up from row to row.
6. **Focus rings for the keyboard only.** Pointer focus only darkens a field slightly.
7. **Autofocus new entries only.** Editing an existing entry focuses the dialog,
   so phones don't open the keyboard.
8. **Tokens only.** Colours come from `styles.css`; both themes switch through them.

## Tokens

| Token | Use |
| --- | --- |
| `--ink` | Text, primary button |
| `--muted`, `--text-muted` | Secondary text, labels, icons |
| `--text-faint` | Placeholders |
| `--white` | Dialog background (dark in dark mode) |
| `--surface` | Inputs inside a filled section |
| `--fill`, `--fill-hover` | Inputs, tags, grey bars; hover |
| `--line` | Dividers |
| `--accent` | Keyboard focus ring |
| `--accent-ink`, `--accent-soft` | Errors, selected status tags, notices |

Light mode leaves `--fill`, `--surface`, `--line` and similar undefined, so every
rule carries its light fallback, e.g. `var(--fill, #f5f5f7)`.

## Components

### Field

One row: label (56px; 48px on phones; 40px inside a section) and one control.
The child may be `input`, `textarea` (auto-grows, three lines minimum) or `select`
(gets a chevron). The label is wired to the control.

```jsx
<Field label="名称" error={checked && !name.trim() ? '请填写名称' : ''}>
  <input value={name} onChange={e => setName(e.target.value)} />
</Field>
```

`error` outlines the control and renders the message under it with `role="alert"`.

### FieldGroup

Same row layout for several controls that each carry their own `aria-label`
(used around `Split`). Accepts `error`.

### Split and SplitSelect

One capsule: icon · left — right, halves of equal width.

```jsx
<FieldGroup label="路线" error={error}>
  <Split icon={MapPin}
    left={<input aria-label="出发地" placeholder="出发地" … />}
    right={<input aria-label="目的地" placeholder="目的地" … />} />
</FieldGroup>
<FieldGroup label="班次">
  <Split icon={Ticket}
    left={<SplitSelect aria-label="交通方式" placeholder="交通方式" options={TRANSPORT_MODES} … />}
    right={<input aria-label="班次" placeholder="航班号、车次" … />} />
</FieldGroup>
```

Mark the invalid half with `aria-invalid`; its text takes the error colour.

### TimeInput and TimeRange

24-hour text input, independent of the system's AM/PM display.

- Accepts `930`, `9:30`, `0930`, `2130`, `9：30`; settles to `09:30` on blur or Enter.
- A complete `HH:MM` applies while typing; unreadable text is flagged and the
  previous value is kept.
- ↑/↓ step 5 minutes, with Shift 1 hour, wrapping at midnight. Empty means unset.

```jsx
<TimeRange startsAt={startsAt} endsAt={endsAt} onChange={({ startsAt, endsAt }) => …} />
<TimeRange prefix="第2段" … />   // aria-labels become 第2段开始时间 / 第2段结束时间
```

`parseTime(text)` is exported: `''` for empty, `null` for unreadable.

### DateRange and DateField

Native date inputs inside the same capsule; clicking opens the system picker.
`DateRange` keeps the end date on or after the start date.

```jsx
<DateRange startsOn={…} endsOn={…} min={…} max={…} onChange={setDates} />
<DateField label="日期" value={…} min={…} max={…} onChange={…} />
```

### Segmented

Pill tabs for 2–5 short exclusive options (the itinerary type). Width follows content.

```jsx
<Segmented label="行程类型" options={EVENT_TYPES} value={type} onChange={setType} />
```

### TagSelect

Tag-sized select for whole-entry states (booking, payment). Grey when empty, blue
when set. Placed at the dialog's top right, beside close (`NotebookDialog actions`).

### FormSection and AddBar

`AddBar` is the empty state of an optional group: a grey capsule in the control
column with one centred action. Opened, the group becomes a `FormSection` — a
filled card with a title, whose inputs lift to `--surface`.

```jsx
{open
  ? <FormSection title="预订信息"><Field label="链接"><input type="url" … /></Field></FormSection>
  : <AddBar onClick={() => setOpen(true)}><Plus />添加预订信息</AddBar>}
```

Transport legs are not wrapped in cards: legs are separated by a faint hairline,
and 「添加一段」 sits at the footer's left.

### Button, ConfirmButton

| Variant | Use |
| --- | --- |
| `primary` | The one main action, usually 完成 |
| `secondary` (default) | Grey pill: 删除, 回到最新 |
| `text` | Quiet extras: 添加一段, 上传凭证 |
| `ConfirmButton` | Two-press actions; first press shows `confirmLabel` outlined |
| `.form-icon-button` | Small icon-only action, e.g. remove a leg |

### FormFooter

Buttons on the right (secondary first, primary last); `leading` holds one action
on the left.

### FormHint, FormError

`FormHint` is a line of explanation (`status` makes it a live region). `FormError`
is a whole-form error such as a failed save; field errors use `Field error`.

### NotebookDialog

The shell for every editor: one header row (title or `header`, `actions`, close),
a scrolling body, a footer. Bottom sheet on phones.

```jsx
const dirty = useUnsavedGuard(draft);
<NotebookDialog title="编辑行程" dirty={dirty && !working} busy={working} onClose={onClose}
  header={<Segmented … />} actions={<TagSelect … />}>
  <form className="notebook-editor__form" noValidate onSubmit={save}>
    <div className="journey-modal__body"><fieldset className="form-fields">…</fieldset></div>
    <FormFooter leading={…}>
      <ConfirmButton confirmLabel="确认删除" onConfirm={remove}>删除</ConfirmButton>
      <Button variant="primary" type="submit">完成</Button>
    </FormFooter>
  </form>
</NotebookDialog>
```

- `dirty`: closing first asks to discard. `useUnsavedGuard(draft)` compares the
  draft with what the editor opened with and warns before leaving the page.
- `busy`: closing is disabled while saving.
- Add `data-autofocus` to the control that should receive focus on open.

## Adding a new editor

1. Keep a `draft` in state and get `dirty` from `useUnsavedGuard(draft)`.
2. Lay the form out with `Field` / `FieldGroup` / `Split` inside `.form-fields`.
3. On submit: if nothing changed, close; otherwise validate, show errors, save,
   then close. Keep the dialog open with `FormError` if saving fails.
4. Use `ConfirmButton` for deletion and put it before the primary button.
5. Check `/components` and both themes on a phone width.
