import { Fragment, useEffect, useRef, useState } from 'react';

export default function DayTabs({ days, activeIndex, onSelect, sectionLabels = {}, dividers = [], idPrefix = 'day', label = '每日行程', onEditSection }) {
  const tabsRef = useRef(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });

  useEffect(() => {
    const tabs = tabsRef.current;
    const update = () => setOverflow(current => {
      const next = { left: tabs.scrollLeft > 2, right: tabs.scrollLeft + tabs.clientWidth < tabs.scrollWidth - 2 };
      return current.left === next.left && current.right === next.right ? current : next;
    });
    update();
    tabs.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(tabs);
    return () => { tabs.removeEventListener('scroll', update); observer.disconnect(); };
  }, [days.length]);

  useEffect(() => {
    const tabs = tabsRef.current;
    const button = tabs.querySelector('[aria-selected="true"]');
    if (!button) return;
    const offset = button.getBoundingClientRect().left - tabs.getBoundingClientRect().left + tabs.scrollLeft;
    tabs.scrollTo({ left: offset - (tabs.clientWidth - button.offsetWidth) / 2, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [activeIndex, days.length]);

  const handleKey = (event, index) => {
    const next = { ArrowRight: (index + 1) % days.length, ArrowLeft: (index + days.length - 1) % days.length, Home: 0, End: days.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onSelect(next);
    tabsRef.current.querySelectorAll('[role="tab"]')[next]?.focus({ preventScroll: true });
  };

  return <div className={`day-tabs${overflow.left ? ' has-left-overflow' : ''}${overflow.right ? ' has-right-overflow' : ''}`} ref={tabsRef} role="tablist" aria-label={label}>
    {days.map((day, index) => <Fragment key={day.id ?? day.key}>
      {sectionLabels[day.key] && <span className="day-tabs__country" role="presentation">{onEditSection ? <button type="button" className="notebook-inline-section" aria-label={`编辑分隔：${sectionLabels[day.key]}`} onClick={() => onEditSection(day)}>{sectionLabels[day.key]}</button> : sectionLabels[day.key]}</span>}
      {dividers.includes(day.key) && <span className="day-tabs__divider" aria-hidden="true" />}
      <button type="button" role="tab" id={`${idPrefix}-${index + 1}-tab`} aria-controls={`${idPrefix}-${index + 1}-panel`} aria-label={day.tabLabel ?? day.key} aria-selected={activeIndex === index} tabIndex={activeIndex === index ? 0 : -1} className={activeIndex === index ? 'is-active' : ''} onClick={() => onSelect(index)} onKeyDown={event => handleKey(event, index)}>{day.label}</button>
    </Fragment>)}
  </div>;
}
