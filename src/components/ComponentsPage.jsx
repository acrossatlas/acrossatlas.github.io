import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Paperclip, Plus, Ticket, Trash2 } from 'lucide-react';
import NotebookDialog from './NotebookDialog';
import {
  AddBar, Button, ConfirmButton, DateField, DateRange, Field, FieldGroup, FormError, FormFooter, FormHint,
  FormSection, Segmented, Split, SplitSelect, TagSelect, TimeInput, TimeRange,
} from './form/Form';
import { useUnsavedGuard } from '../lib/use-unsaved-guard.js';
import './form/components-page.css';

// Living reference for the notebook form components: every demo below renders the real
// component from src/components/form, so this page changes when they do.

const TOKENS = [
  ['--ink', '正文、主按钮底色'], ['--muted', '次要文字'], ['--text-muted', '标签、图标、占位说明'], ['--text-faint', '输入框占位符'],
  ['--white', '弹窗底色（深色模式下为深色）'], ['--surface', '卡片内输入框底色'], ['--fill', '输入框、标签、灰色条底色'], ['--fill-hover', '悬停底色'],
  ['--line', '分割线'], ['--accent', '键盘焦点环'], ['--accent-ink', '错误文字、有值的状态标签'], ['--accent-soft', '有值的状态标签底色、提示条'],
];

const SECTIONS = [
  ['principles', '规则'], ['tokens', '颜色'], ['field', '字段'], ['split', '成对字段'], ['time', '时间'], ['select', '选择'],
  ['section', '分组与空状态'], ['buttons', '按钮'], ['messages', '提示'], ['dialog', '编辑弹窗'],
];

function Code({ children }) {
  return <pre className="ds-code"><code>{children.trim()}</code></pre>;
}

function Example({ id, title, intro, rules, code, children }) {
  return <section className="ds-section" id={id} aria-labelledby={`${id}-title`}>
    <header className="ds-section__head"><h2 id={`${id}-title`}>{title}</h2>{intro && <p>{intro}</p>}</header>
    {children && <div className="ds-demo">{children}</div>}
    {rules && <ul className="ds-rules">{rules.map(rule => <li key={rule}>{rule}</li>)}</ul>}
    {code && <Code>{code}</Code>}
  </section>;
}

function DemoDialog({ onClose }) {
  const [draft, setDraft] = useState({ type: '行程', title: '九街附近咖啡', startsAt: '11:00', endsAt: '11:30', detail: '' });
  const [checked, setChecked] = useState(false), [saved, setSaved] = useState('');
  const dirty = useUnsavedGuard(draft);
  const titleError = checked && !draft.title.trim() ? '请填写名称' : '';
  const set = key => event => setDraft(value => ({ ...value, [key]: event.target.value }));
  return <NotebookDialog className="notebook-editor--compact" title="编辑行程" dirty={dirty} onClose={onClose}
    header={<Segmented label="行程类型" options={['行程', '交通', '住宿', '用餐']} value={draft.type} onChange={type => setDraft(value => ({ ...value, type }))} />}
    actions={<><TagSelect aria-label="预订状态" placeholder="预订" options={['未预定', '已预定']} value="" onChange={() => {}} /><TagSelect aria-label="付款状态" placeholder="付款" options={['未付款', '已付款']} value="" onChange={() => {}} /></>}>
    <form className="notebook-editor__form" noValidate onSubmit={event => {
      event.preventDefault(); setChecked(true);
      if (!draft.title.trim()) return;
      setSaved('示例不会写入旅行本。真实编辑器在这里保存并关闭。');
    }}>
      <div className="journey-modal__body"><fieldset className="form-fields">
        <Field label="名称" error={titleError}><input value={draft.title} onChange={set('title')} /></Field>
        <TimeRange startsAt={draft.startsAt} endsAt={draft.endsAt} onChange={time => setDraft(value => ({ ...value, ...time }))} />
        <Field label="说明"><textarea rows={3} value={draft.detail} onChange={set('detail')} placeholder="改动任意内容后点 ×，叉叉会变成「放弃修改」" /></Field>
        <AddBar onClick={() => {}}><Plus />添加预订信息</AddBar>
      </fieldset><FormHint status>{saved}</FormHint></div>
      <FormFooter><ConfirmButton confirmLabel="确认删除" onConfirm={onClose}>删除</ConfirmButton><Button variant="primary" type="submit">完成</Button></FormFooter>
    </form>
  </NotebookDialog>;
}

export default function ComponentsPage() {
  const [name, setName] = useState(''), [nameChecked, setNameChecked] = useState(false);
  const [route, setRoute] = useState({ from: 'HKG', to: '' }), [mode, setMode] = useState({ mode: '航班', code: 'CI916' });
  const [time, setTime] = useState({ startsAt: '17:35', endsAt: '' }), [single, setSingle] = useState('09:30');
  const [dates, setDates] = useState({ startsOn: '2026-09-24', endsOn: '2026-10-07' }), [day, setDay] = useState('2026-09-25');
  const [type, setType] = useState('交通'), [booking, setBooking] = useState('已预定'), [payment, setPayment] = useState(''), [mealType, setMealType] = useState('');
  const [bookingOpen, setBookingOpen] = useState(false), [deleted, setDeleted] = useState(0), [dialog, setDialog] = useState(false);
  return <div className="page ongoing-page ds-page"><main className="ongoing-shell">
    <header className="notebook-header">
      <header className="title-row"><Link to="/" aria-label="across home"><span>across</span></Link></header>
      <div className="journey-overview"><div className="journey-heading"><div className="journey-heading__title"><h1>组件</h1></div>
        <p className="journey-archive-meta">编辑表单的组件、颜色和交互规则 · 代码在 <code>src/components/form/</code></p></div></div>
    </header>
    <nav className="ds-index" aria-label="目录">{SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`} onClick={event => { event.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{label}</a>)}</nav>

    <div className="ds-body">
      <Example id="principles" title="规则" intro="所有编辑弹窗都遵守这几条，新加表单时照做。" rules={[
        '点「完成」才保存；关闭（×、Esc、点弹窗外）从不保存。',
        '打开后有任何改动（包括切换类型），× 会在原地变成「放弃修改」，再按一次才关闭；Esc 或继续编辑会退回 ×。没有改动时直接关闭。',
        '删除在原地确认：「删除」按一次变成带描边的「确认删除」，再按才删除；焦点移开会恢复。',
        '必填项在点「完成」时检查，错误写在对应行下方，光标跳到第一处错误。',
        '标签在左、控件在右；成对的值（起止时间、出发地和目的地、方式和班次）放在一条胶囊里，左右两半对齐，中间统一用「—」。',
        '焦点环只在键盘操作时出现；鼠标点击只让输入框底色稍深。',
        '新建条目才自动聚焦第一个输入框；编辑已有条目时焦点停在弹窗上，手机不会弹出键盘。',
        '颜色只用下方变量，深浅两套主题都由变量切换，不写死颜色。',
      ]} />

      <Example id="tokens" title="颜色" intro="来自 styles.css。浅色模式下部分变量不定义，组件里都写了浅色回退值。">
        <div className="ds-tokens">{TOKENS.map(([token, use]) => <div key={token} className="ds-token"><span className="ds-token__swatch" style={{ background: `var(${token})` }} /><code>{token}</code><small>{use}</small></div>)}</div>
      </Example>

      <Example id="field" title="字段 Field" intro="一行一个字段：标签在左（56px，手机 48px），控件在右。子元素可以是 input、textarea 或 select，标签会自动关联。"
        rules={['error 有值时，控件加描边，提示写在控件下方并以 role="alert" 播报。', 'textarea 随内容自动增高，最少三行，不显示拖拽手柄。', 'select 自动加右侧箭头。']}
        code={`
<Field label="名称" error={checked && !name.trim() ? '请填写名称' : ''}>
  <input value={name} onChange={e => setName(e.target.value)} />
</Field>
<Field label="说明"><textarea rows={3} /></Field>
<Field label="类型"><select>…</select></Field>`}>
        <div className="form-fields ds-narrow">
          <Field label="名称" error={nameChecked && !name.trim() ? '请填写名称' : ''}><input value={name} placeholder="留空后点「检查」看错误样式" onChange={e => setName(e.target.value)} /></Field>
          <Field label="说明"><textarea rows={3} placeholder="多行输入，随内容增高" /></Field>
          <Field label="餐别"><select value={mealType} onChange={e => setMealType(e.target.value)}><option value="">未选择</option><option>早餐</option><option>午餐</option><option>晚餐</option></select></Field>
          <div className="ds-inline-actions"><Button onClick={() => setNameChecked(true)}>检查</Button><Button variant="text" onClick={() => { setNameChecked(false); setName(''); }}>重置</Button></div>
        </div>
      </Example>

      <Example id="split" title="成对字段 Split" intro="一条胶囊分成左右两半：图标 · 左值 — 右值。每一行的分隔符都在正中，上下行的左右两半对齐。"
        rules={['左右各放一个控件，每个控件自带 aria-label。', '外面套 FieldGroup 提供左侧标签和错误提示。', '出错的那一半文字变成提示色。', '日期使用系统日期选择器，点击即打开。']}
        code={`
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
<DateRange startsOn={…} endsOn={…} onChange={setDates} />
<DateField label="日期" value={…} min={…} max={…} onChange={…} />`}>
        <div className="form-fields ds-narrow">
          <FieldGroup label="路线" error={route.to ? '' : '请填写目的地'}><Split icon={MapPin}
            left={<input aria-label="出发地" placeholder="出发地" value={route.from} onChange={e => setRoute(value => ({ ...value, from: e.target.value }))} />}
            right={<input aria-label="目的地" placeholder="目的地" aria-invalid={!route.to || undefined} value={route.to} onChange={e => setRoute(value => ({ ...value, to: e.target.value }))} />} /></FieldGroup>
          <TimeRange startsAt={time.startsAt} endsAt={time.endsAt} onChange={setTime} />
          <FieldGroup label="班次"><Split icon={Ticket}
            left={<SplitSelect aria-label="交通方式" placeholder="交通方式" options={['航班', '铁路', '自驾', '公交', '渡轮', '步行', '其他']} value={mode.mode} onChange={e => setMode(value => ({ ...value, mode: e.target.value }))} />}
            right={<input aria-label="班次" placeholder="航班号、车次" value={mode.code} onChange={e => setMode(value => ({ ...value, code: e.target.value }))} />} /></FieldGroup>
          <DateRange startsOn={dates.startsOn} endsOn={dates.endsOn} onChange={setDates} />
          <DateField label="照片日期" value={day} min={dates.startsOn} max={dates.endsOn} onChange={e => setDay(e.target.value)} />
        </div>
      </Example>

      <Example id="time" title="时间 TimeInput / TimeRange" intro="24 小时制文本输入，不依赖系统的上午/下午显示。"
        rules={['可直接输入 930、9:30、0930、2130、9：30，失焦或回车时整理成 09:30。', '输入完整的 HH:MM 时立即生效；无法识别时文字变成提示色，原值不变。', '↑ ↓ 每次调 5 分钟，按住 Shift 每次 1 小时，跨零点循环。', '留空表示时间未定。']}
        code={`
<TimeRange startsAt={startsAt} endsAt={endsAt} onChange={({ startsAt, endsAt }) => …} />
<TimeRange prefix="第2段" … />   // aria-label 变成「第2段开始时间」
<TimeInput value={value} onChange={setValue} aria-label="开始时间" />   // 只在 Split 里单独使用`}>
        <div className="form-fields ds-narrow">
          <FieldGroup label="单个"><span className="form-control form-split form-split--single"><Clock aria-hidden="true" className="form-split__icon" /><span className="form-split__half"><TimeInput aria-label="示例时间" value={single} onChange={setSingle} /></span></span></FieldGroup>
          <p className="form-message">当前值：<code>{single || '（空）'}</code></p>
        </div>
      </Example>

      <Example id="select" title="选择 Segmented / TagSelect" intro="Segmented 用于少量互斥选项（行程类型）；TagSelect 是标签大小的下拉，用于弹窗右上角的预订、付款状态。"
        rules={['Segmented 只放 2–5 个短选项，宽度随内容。', 'TagSelect 未选时为灰色，选中后变成蓝色标签。', '状态属于整条行程，放在弹窗右上角，紧挨关闭按钮。']}
        code={`
<Segmented label="行程类型" options={EVENT_TYPES} value={type} onChange={setType} />
<TagSelect aria-label="预订状态" placeholder="预订" options={RESERVATION_STATES} value={value} onChange={…} />`}>
        <div className="ds-row">
          <Segmented label="行程类型" options={['行程', '交通', '住宿', '用餐']} value={type} onChange={setType} />
          <TagSelect aria-label="预订状态" placeholder="预订" options={['未预定', '已预定']} value={booking} onChange={e => setBooking(e.target.value)} />
          <TagSelect aria-label="付款状态" placeholder="付款" options={['未付款', '已付款']} value={payment} onChange={e => setPayment(e.target.value)} />
        </div>
      </Example>

      <Example id="section" title="分组 FormSection 与空状态 AddBar" intro="可选的一组信息为空时只显示一条灰色胶囊；点开后变成带标题的灰底卡片，卡片里的输入框用白底。多段交通不包卡片，段与段之间用一条很浅的分割线。"
        rules={['AddBar 和输入框在同一列，左边不超出。', '卡片内的标签列更窄（40px）。', '「添加一段」放在弹窗左下角，和「删除」「完成」同一排。']}
        code={`
{open
  ? <FormSection title="预订信息">
      <Field label="链接"><input type="url" … /></Field>
    </FormSection>
  : <AddBar onClick={() => setOpen(true)}><Plus />添加预订信息</AddBar>}`}>
        <div className="form-fields ds-narrow">
          {bookingOpen
            ? <FormSection title="预订信息" actions={<Button variant="text" onClick={() => setBookingOpen(false)}>收起</Button>}>
                <Field label="链接"><input type="url" placeholder="https://…" /></Field>
                <FieldGroup label="凭证"><div className="notebook-booking__files"><Button variant="text"><Paperclip />上传凭证</Button></div></FieldGroup>
              </FormSection>
            : <AddBar onClick={() => setBookingOpen(true)}><Plus />添加预订信息</AddBar>}
        </div>
      </Example>

      <Example id="buttons" title="按钮 Button / ConfirmButton" intro="弹窗底部按钮靠右：次要在前，主要在后。"
        rules={['primary：每个弹窗只有一个，通常是「完成」。', 'secondary：灰底胶囊，如「删除」「回到最新」。', 'text：无底色文字按钮，用于「添加一段」「上传凭证」等附带操作。', 'ConfirmButton：需要二次确认的操作，第一次按下变成带描边的确认文字。']}
        code={`
<Button variant="primary" type="submit">完成</Button>
<Button>回到最新</Button>
<Button variant="text"><Plus />添加一段</Button>
<ConfirmButton confirmLabel="确认删除" onConfirm={remove}>删除</ConfirmButton>
<button className="form-icon-button" aria-label="删除第 2 段"><Trash2 /></button>`}>
        <div className="ds-row">
          <Button variant="primary">完成</Button>
          <Button>回到最新</Button>
          <Button variant="text"><Plus />添加一段</Button>
          <ConfirmButton confirmLabel="确认删除" onConfirm={() => setDeleted(count => count + 1)}>删除</ConfirmButton>
          <button type="button" className="form-icon-button" aria-label="删除示例"><Trash2 /></button>
          {deleted > 0 && <span className="form-message">已确认删除 {deleted} 次</span>}
        </div>
      </Example>

      <Example id="messages" title="提示 FormHint / FormError" intro="FormHint 是一行说明文字；FormError 用于保存失败等整体错误，单个字段的错误用 Field 的 error。"
        code={`
<FormHint status>{working ? '正在处理…' : message}</FormHint>
<FormError>{error}</FormError>`}>
        <div className="form-fields ds-narrow">
          <FormHint>内容保存在当前浏览器，保留最近 20 个版本。</FormHint>
          <FormError>另一页面已修改这本旅行本。请关闭编辑框并刷新，再重新修改；本次输入尚未保存。</FormError>
        </div>
      </Example>

      <Example id="dialog" title="编辑弹窗 NotebookDialog" intro="所有编辑器的外壳：顶部一行（标题或类型标签、右侧操作、关闭），中间可滚动，底部按钮。手机上从底部弹出。"
        rules={['dirty 为 true 时，关闭会先变成「放弃修改」。用 useUnsavedGuard(draft) 得到 dirty，它同时在离开页面前提醒。', 'header 替换标题（编辑行程放类型标签）；actions 放在关闭按钮左侧。', '需要自动聚焦的输入框加 data-autofocus。', 'busy 为 true 时不能关闭。']}
        code={`
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
</NotebookDialog>`}>
        <div className="ds-row"><Button variant="primary" onClick={() => setDialog(true)}>打开示例弹窗</Button><span className="form-message">改动内容后点 ×，或清空名称后点「完成」。</span></div>
      </Example>
    </div>
    {dialog && <DemoDialog onClose={() => setDialog(false)} />}
  </main></div>;
}
