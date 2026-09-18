import { Fragment, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CarFront, House, Search, X } from 'lucide-react';
import journey from '../../public/templates/journey.json';
import EventCard from './EventCard';
import ChecklistGroup from './ChecklistGroup';
const TemplateRouteMap = lazy(() => import('./TemplateRouteMap'));

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
      <header className="journey-modal__header"><h2 id="template-modal-title">{transport ? '交通信息' : '住宿信息'}</h2><button ref={ref} type="button" className="journey-tool-button" onClick={onClose} aria-label="关闭详情"><X size={18}/></button></header>
      <div className="info-card"><p className="template-muted">{transport ? '交通方式 / 班次待填写' : '入住 / 退房日期待填写'}</p><h3>{transport ? '出发地 → 到达地' : '住宿名称待填写'}</h3><p>{transport ? '出发与抵达时间、当地时区、行李和接驳安排。' : '导航地址、入住时间、停车和行李安排。'}</p></div>
    </section>
  </div>;
}

export default function TemplatesPage() {
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState(null);
  const [panel, setPanel] = useState(null);
  const [query, setQuery] = useState('');
  const tabsRef = useRef(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });
  useEffect(() => {
    const tabs = tabsRef.current;
    const update = () => setOverflow({ left: tabs.scrollLeft > 2, right: tabs.scrollLeft + tabs.clientWidth < tabs.scrollWidth - 2 });
    update();
    tabs.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update); observer.observe(tabs);
    return () => { tabs.removeEventListener('scroll', update); observer.disconnect(); };
  }, []);
  useEffect(() => {
    const tabs = tabsRef.current;
    const tab = document.getElementById(`template-tab-${active}`);
    if (tabs && tab) tabs.scrollTo({ left: tab.offsetLeft - (tabs.clientWidth - tab.offsetWidth) / 2, behavior: 'instant' });
  }, [active]);
  const day = journey.days[active];
  const focus = day.events.find(event => event.id === day.focusEventId) ?? day.events[0];
  const events = day.events.filter(event => `${event.title} ${event.type} ${event.detail}`.toLowerCase().includes(query.trim().toLowerCase()));
  function selectDay(index) { setActive(index); setSelected(null); }
  function selectStop(id) {
    setSelected(id);
    if (id) { setQuery(''); requestAnimationFrame(() => document.getElementById(`event-${id}`)?.scrollIntoView({ behavior: 'instant', block: 'nearest' })); }
  }
  return <div className="page ongoing-page template-page"><main className="ongoing-shell">
    <header className="notebook-header">
      <header className="title-row"><Link to="/" aria-label="across home"><span>across</span></Link></header>
      <div className="journey-overview">
        <div className="journey-heading"><div className="journey-heading__title"><h1>下一趟旅行</h1></div></div>
        <div className="journey-tools" aria-label="行程工具">
          <button className="journey-tool-button" type="button" aria-label="交通" aria-haspopup="dialog" aria-expanded={panel==='transport'} onClick={() => setPanel('transport')}><CarFront/><span>交通</span></button>
          <button className="journey-tool-button" type="button" aria-label="住宿" aria-haspopup="dialog" aria-expanded={panel==='stay'} onClick={() => setPanel('stay')}><House/><span>住宿</span></button>
          <div className="journey-search"><Search/><input aria-label="搜索行程" placeholder="搜索行程" type="search" value={query} onChange={event=>setQuery(event.target.value)}/>{query && <button className="journey-search__clear" type="button" aria-label="清空搜索" onClick={()=>setQuery('')}><X/></button>}</div>
        </div>
      </div>
    </header>
    <div className="notebook-content">
      <section className="notebook-section" aria-label="当日重点"><article className="today-focus">
        <div className="today-focus__meta"><div className="today-focus__schedule"><span>Day {active+1}</span><span>时间待定</span></div><span className="today-focus__type">{focus.type}</span></div>
        <div className="today-focus__title-row"><h3>{focus.title}</h3></div><p>{focus.detail}</p>
      </article></section>
      <section className="notebook-section" aria-label="每日模板">
        <div ref={tabsRef} className={`day-tabs${overflow.left ? " has-left-overflow" : ""}${overflow.right ? " has-right-overflow" : ""}`} role="tablist" aria-label="单日模板">{journey.days.map((item,i)=><Fragment key={item.id}>{(i===0 || item.group!==journey.days[i-1].group) && <span className="day-tabs__country" role="presentation">{item.group}</span>}<button type="button" key={item.id} id={`template-tab-${i}`} role="tab" tabIndex={active===i?0:-1} aria-selected={active===i} aria-controls={`template-panel-${i}`} className={active===i?'is-active':''} onClick={()=>selectDay(i)} onKeyDown={event=>{let next;if(event.key==='ArrowRight')next=(i+1)%4;if(event.key==='ArrowLeft')next=(i+3)%4;if(event.key==='Home')next=0;if(event.key==='End')next=3;if(next!==undefined){event.preventDefault();selectDay(next);document.getElementById(`template-tab-${next}`).focus();}}} aria-label={`${item.dateLabel} · ${item.label}`}>{item.dateLabel}</button></Fragment>)}</div>
        <div role="tabpanel" id={`template-panel-${active}`} aria-labelledby={`template-tab-${active}`}>
          <div className="day-detail"><Suspense fallback={<div className="day-map daily-map__loading">正在加载纽约地图…</div>}><TemplateRouteMap key={day.id} day={day} selected={selected} onSelect={selectStop}/></Suspense>
            <section className="day-events" aria-label="事件卡片"><ol className="day-event-list">{events.map(event=><EventCard key={event.id} event={event} selected={selected===event.id}/>)}</ol>{!events.length && <p className="template-muted">当天没有匹配的事件。</p>}</section>
          </div>
        </div>
      </section>
      <section className="notebook-section"><div className="notebook-section__heading"><h2>Checklist</h2></div><div className="checklist-surface">{journey.checklist.map(group => <ChecklistGroup key={group.variant} {...group} storageId="template" persist={false}/>)}</div></section>
      <section className="notebook-section"><div className="notebook-section__heading"><h2>Album</h2></div><div className="album-empty"><div><h3>尚未添加相册链接</h3><p>之后可以在这里关联网盘或其他存储地址。</p></div></div></section>
      <footer className="template-footer"><span>多地点游览 / 单项活动 / 转场 · 交通方式可组合</span><a href={`${import.meta.env.BASE_URL}templates/journey.json`} download="across-journey-template.json">下载行程底稿 ↓</a></footer>
    </div>
    {panel && <TemplateModal panel={panel} onClose={()=>setPanel(null)}/>}
  </main></div>;
}
