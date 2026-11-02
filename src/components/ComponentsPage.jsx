import { Fragment, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Component, Ellipsis, MapPin, Paperclip, Plus, Ticket } from 'lucide-react';
import NotebookDialog from './NotebookDialog';
import SiteBar from './SiteBar';
import { TemplatePreview } from './TemplatesPage';
import {
  AddBar, Button, ConfirmButton, DateRange, Field, FieldGroup, FormDivider, FormError, FormFooter, FormHint,
  FormSection, Segmented, Split, SplitSelect, TagSelect, TimeInput, TimeRange,
} from './form/Form';
import { useUnsavedGuard } from '../lib/use-unsaved-guard.js';
import './form/components-page.css';

// /components: the design system in two tabs. 组件 is a living reference: every demo
// renders the real control from src/components/form. 模板 is the trip page filled with sample data.

const TOKENS = [
  ['--ink', '正文、主按钮'], ['--text-muted', '标签、图标、次要文字'], ['--text-faint', '占位符'],
  ['--white', '页面与弹窗底色'], ['--surface', '输入框底色'], ['--fill', '按钮、标签页、标签、灰底卡片'],
  ['--fill-hover', '悬停'], ['--line', '输入框描边、分割线'], ['--line-strong', '描边悬停、空心按钮'],
  ['--accent', '键盘焦点环'], ['--accent-ink', '错误、有值的状态标签'], ['--accent-soft', '状态标签底色、提示条'],
];

const SECTIONS = [['tokens', '颜色'], ['buttons', '按钮'], ['inputs', '输入框'], ['select', '选择与标签'], ['groups', '分组'], ['messages', '提示'], ['dialog', '弹窗']];
const TABS = ['组件', '模板'];

function Section({ id, title, intro, specs, code, children }) {
  return <section className="ds-section" id={id} aria-labelledby={`${id}-title`}>
    <header className="ds-section__head"><h2 id={`${id}-title`}>{title}</h2>{intro && <p>{intro}</p>}</header>
    {children && <div className="ds-demo">{children}</div>}
    {specs && <dl className="ds-specs">{specs.map(([term, text]) => <div key={term}><dt>{term}</dt><dd>{text}</dd></div>)}</dl>}
    {code && <details className="ds-code-toggle"><summary>代码</summary><pre className="ds-code"><code>{code.trim()}</code></pre></details>}
  </section>;
}

function DemoDialog({ onClose }) {
  const [draft, setDraft] = useState({ type: '行程', title: '九街附近咖啡', startsAt: '11:00', endsAt: '11:30', detail: '' });
  const [checked, setChecked] = useState(false), [saved, setSaved] = useState('');
  const dirty = useUnsavedGuard(draft);
  const set = key => event => setDraft(value => ({ ...value, [key]: event.target.value }));
  return <NotebookDialog className="notebook-editor--compact" title="编辑行程" dirty={dirty} onClose={onClose}
    header={<Segmented label="行程类型" options={['行程', '交通', '住宿', '用餐']} value={draft.type} onChange={type => setDraft(value => ({ ...value, type }))} />}
    actions={<><TagSelect aria-label="预订状态" placeholder="预订" options={['未预定', '已预定']} value="" onChange={() => {}} /><TagSelect aria-label="付款状态" placeholder="付款" options={['未付款', '已付款']} value="" onChange={() => {}} /></>}>
    <form className="notebook-editor__form" noValidate onSubmit={event => {
      event.preventDefault(); setChecked(true);
      if (draft.title.trim()) setSaved('示例不会写入旅行本。真实编辑器在这里保存并关闭。');
    }}>
      <div className="journey-modal__body"><fieldset className="form-fields">
        <Field label="名称" error={checked && !draft.title.trim() ? '请填写名称' : ''}><input value={draft.title} onChange={set('title')} /></Field>
        <TimeRange startsAt={draft.startsAt} endsAt={draft.endsAt} onChange={time => setDraft(value => ({ ...value, ...time }))} />
        <FormDivider />
        <Field label="说明"><textarea rows={3} value={draft.detail} onChange={set('detail')} placeholder="改动后点 ×，它会变成「放弃修改」" /></Field>
        <AddBar onClick={() => {}}><Plus />添加预订信息</AddBar>
      </fieldset><FormHint status>{saved}</FormHint></div>
      <FormFooter><ConfirmButton confirmLabel="确认删除" onConfirm={onClose}>删除</ConfirmButton><Button variant="primary" type="submit">完成</Button></FormFooter>
    </form>
  </NotebookDialog>;
}

function ComponentsGuide() {
  const [route, setRoute] = useState({ from: 'HKG', to: '' }), [mode, setMode] = useState({ mode: '航班', code: 'CI916' });
  const [time, setTime] = useState({ startsAt: '17:35', endsAt: '' }), [single, setSingle] = useState('09:30');
  const [dates, setDates] = useState({ startsOn: '2026-09-24', endsOn: '2026-10-07' });
  const [type, setType] = useState('交通'), [booking, setBooking] = useState('已预定'), [payment, setPayment] = useState('');
  const [bookingOpen, setBookingOpen] = useState(false), [dialog, setDialog] = useState(false);
  return <>
    <nav className="ds-index" aria-label="目录">{SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`} onClick={event => { event.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{label}</a>)}</nav>
    <div className="ds-body">
      <Section id="tokens" title="颜色" intro="只用这些变量，深浅两套主题由变量切换。">
        <div className="ds-tokens">{TOKENS.map(([token, use]) => <div key={token} className="ds-token"><span className="ds-token__swatch" style={{ background: `var(${token})` }} /><code>{token}</code><small>{use}</small></div>)}</div>
      </Section>

      <Section id="buttons" title="按钮 Button" intro="四种样式 × 两种尺寸，外加只有图标的方形按钮。全站和 Travel zine 共用。"
        specs={[
          ['样式', '实心主：区域里唯一的主操作 · 实心次：普通操作 · 空心：添加或调整结构 · 无框：附带操作'],
          ['尺寸', 'lg 36px：日期标签行、顶栏、弹窗底部 · sm 30px：标题工具栏、侧栏、素材栏、弹窗内操作'],
          ['图标', '文字按钮 15 / 14px，图标按钮 16 / 15px · 顶栏图标用无框 lg，间距 4px'],
          ['灰底容器', '次按钮改用旁边卡片的底色（添加行程、继续编辑手帐）'],
        ]}
        code={`
<Button variant="primary">完成</Button>
<Button size="sm"><Plus />添加照片</Button>          // 默认 secondary · lg
<Button variant="outline"><Plus />分隔</Button>
<Button variant="ghost"><Plus />添加一段</Button>     // ghost 默认 sm
<Button variant="ghost" icon aria-label="新建"><Plus /></Button>
<Link className="btn btn--secondary btn--lg" to="…">继续编辑手帐</Link>`}>
        <div className="ds-button-grid">
          <span />{['实心主 primary', '实心次 secondary', '空心 outline', '无框 ghost', '图标 icon'].map(label => <small key={label}>{label}</small>)}
          {['lg', 'sm'].map(size => <Fragment key={size}>
            <small>{size === 'lg' ? 'lg · 36' : 'sm · 30'}</small>
            <div><Button variant="primary" size={size}>完成</Button></div>
            <div><Button size={size}><Plus />添加照片</Button></div>
            <div><Button variant="outline" size={size}><Plus />分隔</Button></div>
            <div><Button variant="ghost" size={size}><Plus />添加一段</Button></div>
            <div><Button variant="ghost" size={size} icon aria-label="新建"><Plus /></Button><Button variant="ghost" size={size} icon aria-label="组件"><Component /></Button><Button size={size} icon aria-label="更多"><Ellipsis /></Button></div>
          </Fragment>)}
        </div>
      </Section>

      <Section id="inputs" title="输入框 Field / Split" intro="空心：白底细描边。标签在左，控件在右；成对的值放进同一个框，用「—」分开。"
        specs={[
          ['外观', '高 40px · 圆角 8px · 悬停描边加深 · 聚焦描边变墨色（键盘操作才有蓝色焦点环）'],
          ['错误', '点「完成」时检查，提示写在框下方；成对字段只标红出错的那一半'],
          ['时间', '24 小时制：可输入 930、9:30、2130 · ↑↓ 调 5 分钟，Shift 调 1 小时 · 留空表示未定'],
          ['日期', '点击打开系统日期选择器；结束日期不早于开始日期'],
        ]}
        code={`
<Field label="名称" error={error}><input … /></Field>
<FieldGroup label="路线"><Split icon={MapPin} left={<input aria-label="出发地" … />} right={<input aria-label="目的地" … />} /></FieldGroup>
<TimeRange startsAt={…} endsAt={…} onChange={…} />
<DateRange startsOn={…} endsOn={…} onChange={…} />`}>
        <div className="form-fields ds-narrow">
          <Field label="名称"><input placeholder="一行文字" /></Field>
          <Field label="说明"><textarea rows={3} placeholder="多行，随内容增高" /></Field>
          <FieldGroup label="路线" error={route.to ? '' : '请填写目的地'}><Split icon={MapPin}
            left={<input aria-label="出发地" placeholder="出发地" value={route.from} onChange={e => setRoute(value => ({ ...value, from: e.target.value }))} />}
            right={<input aria-label="目的地" placeholder="目的地" aria-invalid={!route.to || undefined} value={route.to} onChange={e => setRoute(value => ({ ...value, to: e.target.value }))} />} /></FieldGroup>
          <FieldGroup label="班次"><Split icon={Ticket}
            left={<SplitSelect aria-label="交通方式" placeholder="交通方式" options={['航班', '铁路', '自驾', '公交', '渡轮', '步行', '其他']} value={mode.mode} onChange={e => setMode(value => ({ ...value, mode: e.target.value }))} />}
            right={<input aria-label="班次" placeholder="航班号、车次" value={mode.code} onChange={e => setMode(value => ({ ...value, code: e.target.value }))} />} /></FieldGroup>
          <TimeRange startsAt={time.startsAt} endsAt={time.endsAt} onChange={setTime} />
          <FieldGroup label="单个"><span className="form-control form-split form-split--single"><Clock aria-hidden="true" className="form-split__icon" /><span className="form-split__half"><TimeInput aria-label="示例时间" value={single} onChange={setSingle} /></span></span></FieldGroup>
          <DateRange startsOn={dates.startsOn} endsOn={dates.endsOn} onChange={setDates} />
        </div>
      </Section>

      <Section id="select" title="选择与标签 Segmented / TagSelect" intro="实心：灰底，无描边。"
        specs={[
          ['Segmented', '2–5 个互斥的短选项，灰色轨道里选中为墨色块；页面上的日期标签同一套样式'],
          ['TagSelect', '弹窗右上角的预订、付款状态 · 未选为灰色，选中为蓝色 · 和左侧分段居中对齐'],
        ]}
        code={`
<Segmented label="行程类型" options={EVENT_TYPES} value={type} onChange={setType} />
<TagSelect aria-label="预订状态" placeholder="预订" options={STATES} value={value} onChange={…} />`}>
        <div className="ds-row">
          <Segmented label="行程类型" options={['行程', '交通', '住宿', '用餐']} value={type} onChange={setType} />
          <TagSelect aria-label="预订状态" placeholder="预订" options={['未预定', '已预定']} value={booking} onChange={e => setBooking(e.target.value)} />
          <TagSelect aria-label="付款状态" placeholder="付款" options={['未付款', '已付款']} value={payment} onChange={e => setPayment(e.target.value)} />
          <span className="reservation-info-trigger">预定信息</span>
        </div>
      </Section>

      <Section id="groups" title="分组 FormSection / AddBar / FormDivider" intro="必填项在上，选填项在下，中间一条分割线；可选的一组信息为空时只是一条灰色按钮条。"
        specs={[
          ['AddBar', '和输入框在同一列 · 点开后变成带标题的灰底卡片，卡片里的输入框用白底'],
          ['多段交通', '不包卡片，段与段之间一条浅分割线；「添加一段」在弹窗左下角'],
        ]}
        code={`
<FormDivider />
{open ? <FormSection title="预订信息">…</FormSection> : <AddBar onClick={() => setOpen(true)}><Plus />添加预订信息</AddBar>}`}>
        <div className="form-fields ds-narrow">
          <Field label="名称"><input placeholder="必填" /></Field>
          <FormDivider />
          {bookingOpen
            ? <FormSection title="预订信息" actions={<Button variant="ghost" onClick={() => setBookingOpen(false)}>收起</Button>}>
                <Field label="链接"><input type="url" placeholder="https://…" /></Field>
                <FieldGroup label="凭证"><div className="notebook-booking__files"><Button variant="ghost"><Paperclip />上传凭证</Button></div></FieldGroup>
              </FormSection>
            : <AddBar onClick={() => setBookingOpen(true)}><Plus />添加预订信息</AddBar>}
        </div>
      </Section>

      <Section id="messages" title="提示 FormHint / FormError" intro="FormHint 是一行说明；FormError 用于保存失败这类整体错误。">
        <div className="form-fields ds-narrow">
          <FormHint>内容保存在当前浏览器，保留最近 20 个版本。</FormHint>
          <FormError>另一页面已修改这本旅行本。请刷新后再修改；本次输入尚未保存。</FormError>
        </div>
      </Section>

      <Section id="dialog" title="弹窗 NotebookDialog" intro="所有编辑器的外壳：顶部一行（类型或标题、状态、关闭），中间滚动，底部按钮靠右。手机上从底部弹出。"
        specs={[
          ['保存', '只在点「完成」时保存；×、Esc、点弹窗外都不保存'],
          ['放弃', '有改动时 × 先变成「放弃修改」，再按一次才关闭'],
          ['删除', '「删除」按一次变成「确认删除」，再按才删除'],
          ['聚焦', '新建时聚焦第一个输入框；编辑已有内容时不聚焦，手机不弹键盘'],
        ]}
        code={`
const dirty = useUnsavedGuard(draft);
<NotebookDialog title="编辑行程" dirty={dirty} busy={working} onClose={onClose} header={<Segmented … />} actions={<TagSelect … />}>
  …<FormFooter><ConfirmButton confirmLabel="确认删除" onConfirm={remove}>删除</ConfirmButton><Button variant="primary" type="submit">完成</Button></FormFooter>
</NotebookDialog>`}>
        <div className="ds-row"><Button variant="primary" onClick={() => setDialog(true)}>打开示例弹窗</Button></div>
      </Section>
    </div>
    {dialog && <DemoDialog onClose={() => setDialog(false)} />}
  </>;
}

export default function ComponentsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'templates' ? '模板' : '组件';
  return <div className="page ongoing-page ds-page"><main className="ongoing-shell">
    <header className="notebook-header">
      <SiteBar />
      <div className="ds-head">
        <div><h1>组件与模板</h1><p className="journey-archive-meta">控件、颜色和行程页模板 · 代码在 <code>src/components/form/</code></p></div>
        <Segmented label="页面" options={TABS} value={tab} onChange={next => setParams(next === '模板' ? { tab: 'templates' } : {}, { replace: true })} />
      </div>
    </header>
    {tab === '组件' ? <ComponentsGuide /> : <TemplatePreview />}
  </main></div>;
}
