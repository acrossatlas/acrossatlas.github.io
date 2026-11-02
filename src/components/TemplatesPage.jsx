import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { CarFront, Download, House, Plus, Search, X } from 'lucide-react';
import { archiveDateRange } from '../data/archive';
import journey from '../../public/templates/journey.json';
import EventCard from './EventCard';
import DayTabs from './DayTabs';
import ChecklistGroup from './ChecklistGroup';
import NotebookDialog from './NotebookDialog';
import { AddBar, Button, ConfirmButton, Field, FormDivider, FormFooter, Segmented, TagSelect, TimeRange } from './form/Form';
import { useUnsavedGuard } from '../lib/use-unsaved-guard.js';
import './journal-editor.css';

// The trip-page template, laid out like the current trip page (title + tools,
// Itinerary, Checklist, Travel zine) and filled with the sample journey.json.
// Shown as the 模板 tab of /components.

const TemplateRouteMap = lazy(() => import('./TemplateRouteMap'));
const templateDates = journey.days.map(day => ({ key: day.id, label: day.dateLabel, tabLabel: `${day.dateLabel} · ${day.label}` }));
// The sample has month.day labels only; a placeholder year gives the trip page's full date range.
const TEMPLATE_YEAR = 2027;
const templateRange = archiveDateRange(...[journey.days[0], journey.days[journey.days.length - 1]].map(day => `${TEMPLATE_YEAR}-${day.dateLabel.replace('.', '-')}`));
const templateGroups = Object.fromEntries(journey.days.filter((day, index) => index === 0 || day.group !== journey.days[index - 1].group).map(day => [day.id, day.group]));

function TemplateModal({ panel, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    function onKey(event) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') { event.preventDefault(); ref.current?.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [onClose]);
  const transport = panel === 'transport';
  return <div className="template-modal-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="template-modal" role="dialog" aria-modal="true" aria-labelledby="template-modal-title">
      <header className="journey-modal__header"><h2 id="template-modal-title">{transport ? '交通信息' : '住宿信息'}</h2><button ref={ref} type="button" className="btn btn--secondary btn--sm btn--icon" onClick={onClose} aria-label="关闭详情"><X /></button></header>
      <div className="info-card"><p className="template-muted">{transport ? '交通方式 / 班次待填写' : '入住 / 退房日期待填写'}</p><h3>{transport ? '出发地 → 到达地' : '住宿名称待填写'}</h3><p>{transport ? '出发与抵达时间、当地时区、行李和接驳安排。' : '导航地址、入住时间、停车和行李安排。'}</p></div>
    </section>
  </div>;
}

// Same editor shell and fields as the trip page's itinerary editor, filled from the sample
// event. The template has no notebook behind it, so 完成 just closes.
function TemplateEventDialog({ event, onClose }) {
  const [draft, setDraft] = useState({ type: event?.type ?? '行程', title: event?.title ?? '', startsAt: event?.startsAt ?? '', endsAt: event?.endsAt ?? '', navigation: event?.navigation ?? '', detail: event?.detail ?? '', booking: '', payment: '' });
  const [checked, setChecked] = useState(false);
  const dirty = useUnsavedGuard(draft);
  const set = key => change => setDraft(value => ({ ...value, [key]: change.target.value }));
  return <NotebookDialog title={event ? '编辑行程' : '添加行程'} dirty={dirty} onClose={onClose}
    header={<Segmented label="行程类型" options={['行程', '交通', '住宿', '用餐']} value={draft.type} onChange={type => setDraft(value => ({ ...value, type }))} />}
    actions={<><TagSelect aria-label="预订状态" placeholder="预订" options={['未预定', '已预定']} value={draft.booking} onChange={set('booking')} /><TagSelect aria-label="付款状态" placeholder="付款" options={['未付款', '已付款']} value={draft.payment} onChange={set('payment')} /></>}>
    <form className="notebook-editor__form" noValidate onSubmit={submit => { submit.preventDefault(); setChecked(true); if (draft.title.trim()) onClose(); }}>
      <div className="journey-modal__body"><fieldset className="form-fields">
        <Field label="名称" error={checked && !draft.title.trim() ? '请填写名称' : ''}><input data-autofocus={event ? undefined : ''} maxLength={500} value={draft.title} onChange={set('title')} /></Field>
        <TimeRange startsAt={draft.startsAt} endsAt={draft.endsAt} onChange={time => setDraft(value => ({ ...value, ...time }))} />
        <Field label="地址"><input placeholder="用于导航和地图定位" value={draft.navigation} onChange={set('navigation')} /></Field>
        <FormDivider />
        <Field label="说明"><textarea rows={3} value={draft.detail} onChange={set('detail')} /></Field>
        <AddBar onClick={() => {}}><Plus />添加预订信息</AddBar>
      </fieldset></div>
      <FormFooter>{event && <ConfirmButton confirmLabel="确认删除" onConfirm={onClose}>删除</ConfirmButton>}<Button variant="primary" type="submit">完成</Button></FormFooter>
    </form>
  </NotebookDialog>;
}

export function TemplatePreview() {
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState(null);
  const [panel, setPanel] = useState(null);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(undefined); // undefined: closed · null: new · event: editing
  const day = journey.days[active];
  const events = day.events.filter(event => `${event.title} ${event.type} ${event.detail}`.toLowerCase().includes(query.trim().toLowerCase()));
  function selectDay(index) { setActive(index); setSelected(null); }
  function selectStop(id) {
    setSelected(id);
    if (id) { setQuery(''); requestAnimationFrame(() => document.getElementById(`event-${id}`)?.scrollIntoView({ behavior: 'instant', block: 'nearest' })); }
  }
  return <div className="template-page">
    <div className="template-bar">
      <p>行程页模板 · 示例数据，和真实行程页同一套布局与组件</p>
      <a className="btn btn--ghost btn--sm" href={`${import.meta.env.BASE_URL}templates/journey.json`} download="across-journey-template.json"><Download />下载行程底稿</a>
    </div>

    <header className="journey-overview template-overview">
      <div className="journey-heading">
        <div className="journey-heading__title"><h2 className="template-title">下一趟旅行</h2></div>
        <p className="journey-archive-meta">{templateRange}</p>
      </div>
      <div className="journey-tools" aria-label="行程工具">
        <button className="btn btn--secondary btn--sm" type="button" aria-label="交通" aria-haspopup="dialog" aria-expanded={panel === 'transport'} onClick={() => setPanel('transport')}><CarFront /><span>交通</span></button>
        <button className="btn btn--secondary btn--sm" type="button" aria-label="住宿" aria-haspopup="dialog" aria-expanded={panel === 'stay'} onClick={() => setPanel('stay')}><House /><span>住宿</span></button>
        <div className="journey-search"><Search /><input aria-label="搜索当日行程" placeholder="搜索当日行程" type="search" value={query} onChange={event => setQuery(event.target.value)} />{query && <button className="journey-search__clear" type="button" aria-label="清空搜索" onClick={() => setQuery('')}><X /></button>}</div>
      </div>
    </header>

    <div className="notebook-content">
      <section className="notebook-section" aria-labelledby="template-itinerary-title">
        <header className="notebook-section__heading"><h2 id="template-itinerary-title">Itinerary</h2></header>
        <div className="notebook-day-nav"><DayTabs days={templateDates} activeIndex={active} onSelect={selectDay} sectionLabels={templateGroups} idPrefix="template" label="单日模板" /></div>
        <div role="tabpanel" id={`template-${active + 1}-panel`} aria-labelledby={`template-${active + 1}-tab`}>
          <div className="day-detail"><Suspense fallback={<div className="day-map daily-map__loading">正在加载地图…</div>}><TemplateRouteMap key={day.id} day={day} selected={selected} onSelect={selectStop} /></Suspense>
            <section className="day-events" aria-label="当日行程"><ol className="day-event-list">{events.map(event => <EventCard key={event.id} event={event} selected={selected === event.id} onEdit={() => setEditing(event)} />)}</ol>{!events.length && <p className="template-muted">当天没有匹配的行程。</p>}<div className="itinerary-add"><button className="btn btn--secondary btn--lg" type="button" onClick={() => setEditing(null)}><Plus />添加行程</button></div></section>
          </div>
        </div>
      </section>

      <section className="notebook-section" aria-labelledby="template-checklist-title">
        <header className="notebook-section__heading"><h2 id="template-checklist-title">Checklist</h2></header>
        <div className="checklist-surface">{journey.checklist.map(group => <ChecklistGroup key={group.variant} {...group} storageId="template" persist={false} />)}</div>
      </section>

      <section className="notebook-section" aria-labelledby="template-zine-title">
        <header className="notebook-section__heading"><h2 id="template-zine-title">Travel zine</h2></header>
        <div className="journal-entry">
          <div className="journal-entry__book" aria-hidden="true"><span /><span /></div>
          <div className="journal-entry__copy"><h3>把旅途，排成一本小刊物。</h3><p>TN 标准本 · 自由排版 · 原尺寸打印</p></div>
          <span className="btn btn--secondary btn--lg journal-entry__action" aria-disabled="true">打开手帐画布</span>
        </div>
      </section>
    </div>
    {panel && <TemplateModal panel={panel} onClose={() => setPanel(null)} />}
    {editing !== undefined && <TemplateEventDialog key={editing?.id ?? 'new'} event={editing} onClose={() => setEditing(undefined)} />}
  </div>;
}
