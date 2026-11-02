# Form components

The notebook editors (itinerary, checklist, trip dates, new trip, date dividers,
photo upload) are built from one small set of components in
`src/components/form/`. The site's live reference is `/components`, the only
icon link at the top right of the home page besides 新建 and the theme toggle.
It has two tabs: **组件** (colours, buttons, inputs, selects and tags, groups,
messages, dialog — each with a live demo, a few spec rows and folded code) and
**模板** (`?tab=templates`; the trip page filled with `public/templates/journey.json`,
built from `TemplatePreview` in `TemplatesPage.jsx`). `/templates` redirects there.

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
5. **Label left, control right.** Paired values share one field split into two
   equal halves joined by 「—」, so halves line up from row to row.
6. **One control shape, two fills.** Every control is an 8px rounded rectangle.
   Fields (inputs, search) are hollow: `--surface` with a `--line` hairline that
   darkens on hover. Tabs and tags are solid. Buttons follow the Button kinds below
   (primary / secondary / outline / ghost, sizes lg 36px and sm 30px). Large
   containers use 12–16px corners.
7. **Focus rings for the keyboard only.** Pointer focus darkens the outline to `--ink`.
8. **Autofocus new entries only.** Editing an existing entry focuses the dialog,
   so phones don't open the keyboard.
9. **Tokens only.** Colours come from `styles.css`; both themes switch through them.

## Tokens

| Token | Use |
| --- | --- |
| `--ink` | Text, primary button |
| `--muted`, `--text-muted` | Secondary text, labels, icons |
| `--text-faint` | Placeholders |
| `--white` | Dialog background (dark in dark mode) |
| `--surface` | Fields (inputs, search) |
| `--fill`, `--fill-hover` | Buttons, tabs, tags, filled sections; hover |
| `--line`, `--line-strong` | Field outlines, dividers; hover |
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

One field: icon · left — right, halves of equal width.

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

Native date inputs inside the same field; clicking opens the system picker.
`DateRange` keeps the end date on or after the start date.

```jsx
<DateRange startsOn={…} endsOn={…} min={…} max={…} onChange={setDates} />
<DateField label="日期" value={…} min={…} max={…} onChange={…} />
```

### Segmented

Rounded tabs on a grey track for 2–5 short exclusive options (the itinerary type). Width follows content.

```jsx
<Segmented label="行程类型" options={EVENT_TYPES} value={type} onChange={setType} />
```

### TagSelect

Tag-sized select for whole-entry states (booking, payment). Grey when empty, blue
when set. Placed at the dialog's top right, beside close (`NotebookDialog actions`).

### FormDivider

A hairline between the required fields and the optional ones (the itinerary
editor puts it above 说明).

### FormSection and AddBar

`AddBar` is the empty state of an optional group: a grey bar in the control
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

One button system for the site and the Travel zine (`.btn` in `styles.css`):
four kinds × two sizes.

| Kind | Look | Use |
| --- | --- | --- |
| `primary` | Solid ink | The one main action in an area: 完成, 导出打印 PDF, 上传照片 |
| `secondary` (default) | Solid grey | Ordinary actions: 交通, 住宿, 添加照片, 继续编辑手帐, 删除, 回到最新 |
| `outline` | Hollow, hairline | Structural actions that add or arrange: + 分隔, 自动填满, 照片框, 文字 |
| `ghost` (`text`) | No frame | Quiet extras: 保存, 添加一段, 上传凭证 |
| `icon` | Square, usually ghost | Icon-only actions: muted icon, ink + grey fill on hover. The top-bar icons (返回, 新建旅行, 模板, 组件, theme) are ghost · icon · lg, 4px apart; 「…」 is secondary · icon |

| Size | Height | Text / icon | Where |
| --- | --- | --- | --- |
| `lg` (default) | 36px, 0 16px | 13px / 15px (icon-only 16px) | The day-tab row (tabs and + 分隔), the top bar, dialog footers |
| `sm` (default for ghost) | 30px, 0 11px | 12px / 14px (icon-only 15px) | The trip title toolbar (交通, 住宿, …; search is 30px too), sidebars, the photo tray, extras inside dialogs |

On a grey container a secondary button takes the colour of the cards beside it
(添加行程, 继续编辑手帐). Elements that are not `<button>`
(a `Link`) use the classes directly: `btn btn--secondary btn--lg`.
`buttonClass({ variant, size, icon })` returns the class string.
`ConfirmButton` is a secondary `lg` button for two-press actions; armed, it shows
`confirmLabel` outlined. `.form-icon-button` is a small icon-only action inside forms.

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
