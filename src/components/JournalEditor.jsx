import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, Check, ChevronLeft, ChevronRight, Copy, Download, Expand, FileDown, ImageOff, ImagePlus, Layers2, LoaderCircle, Minus, Plus, Redo2, Replace, RotateCcw, Save, Scissors, Sparkles, Trash2, Type, Undo2, Upload, X } from 'lucide-react';
import { findJourney, tripUrl } from '../data/archive';
import { useNotebookCatalog } from '../lib/use-notebook-catalog';
import { applyTemplate, clamp, composePageFrames, createFrame, createJournal, createPage, createSpread, createText, fitFrame, JOURNAL_SPREADS, JOURNAL_TEMPLATES, packPrintSheets, PAPER_COLORS, photoCrop, printItems, roundMm, uid } from '../lib/journal';
import { loadJournal, readPhotoFile, saveJournal } from '../lib/journal-storage';
import { exportJournalPdf, exportSizeList } from '../lib/journal-print';
import './journal-editor.css';

const pad = number => String(number).padStart(2, '0');

function PhotoContent({ asset, frame, number, miniature = false }) {
  if (asset?.src) {
    const crop = photoCrop(asset, frame);
    return <img alt={asset.name} draggable="false" src={asset.src} style={{ width: `${asset.width / crop.width * 100}%`, height: `${asset.height / crop.height * 100}%`, left: `${-crop.x / crop.width * 100}%`, top: `${-crop.y / crop.height * 100}%` }} />;
  }
  return <div className={`zine-placeholder tone-${asset?.tone ?? number % 5}${asset ? '' : ' is-empty'}`}>
    {!miniature && <>{!asset && <ImagePlus className="zine-placeholder__icon" size={18} strokeWidth={1.5} />}<span className="zine-placeholder__number">{pad(number)}</span><span className="zine-placeholder__hint">{asset ? asset.name : '拖入或点选照片'}</span></>}
  </div>;
}

function MiniPage({ page, template }) {
  const frames = template ? template.frames.map(([x, y, width, height, rotation = 0]) => ({ x, y, width, height, rotation })) : page.frames;
  return <span className="zine-mini-page" style={{ background: page?.paper ?? PAPER_COLORS[0] }}>
    {frames.map((frame, index) => <span key={frame.id ?? index} style={{ left: `${frame.x / 1.1}%`, top: `${frame.y / 2.1}%`, width: `${frame.width / 1.1}%`, height: `${frame.height / 2.1}%`, transform: `rotate(${frame.rotation}deg)` }} />)}
    {(template?.texts?.map(([x, y, width, height, content, fontSize, fontFamily, fontWeight]) => ({ x, y, width, height, content, fontSize, fontFamily, fontWeight })) ?? page?.texts ?? []).map((text, index) => <i key={index} style={{ left: `${text.x / 1.1}%`, top: `${text.y / 2.1}%`, width: `${text.width / 1.1}%`, height: `${text.height / 2.1}%`, fontSize: text.fontSize * .39, fontWeight: text.fontWeight, fontFamily: text.fontFamily === 'mono' ? 'monospace' : 'Arial' }}>{text.content}</i>)}
  </span>;
}

function MiniSpread({ template }) {
  const pages = createSpread(template.id);
  return <span className="zine-mini-spread">{pages.map(page => <MiniPage key={page.id} page={page} />)}{pages.flatMap((page, index) => page.frames.filter(frame => frame.span).map(frame => <span key={frame.id} className="zine-mini-spread__photo" style={{ left: `${(frame.x + index * 110) / 2.2}%`, top: `${frame.y / 2.1}%`, width: `${frame.width / 2.2}%`, height: `${frame.height / 2.1}%` }} />))}</span>;
}

const textStyle = (text, scale) => ({ left: text.x * scale, top: text.y * scale, width: text.width * scale, height: text.height * scale, transform: `rotate(${text.rotation || 0}deg)`, fontSize: text.fontSize * scale, fontFamily: text.fontFamily === 'mono' ? '"Courier New", "PingFang SC", monospace' : '"Helvetica Neue", "PingFang SC", Arial, sans-serif', fontWeight: text.fontWeight, color: text.color });

function PreviewText({ text }) {
  return <div className="zine-print-text" style={{ left: `${text.x / 1.1}%`, top: `${text.y / 2.1}%`, width: `${text.width / 1.1}%`, height: `${text.height / 2.1}%`, fontSize: `${text.fontSize / 1.1}cqw`, fontWeight: text.fontWeight, fontFamily: text.fontFamily === 'mono' ? 'monospace' : 'Arial', color: text.color }}>{text.content}</div>;
}

function NumberField({ label, value, onCommit, unit = 'mm', min, max }) {
  const [draft, setDraft] = useState(null);
  const cancel = useRef(false);
  return <label className="zine-number-field"><span>{label}</span><div><input aria-label={label} type="number" step="0.1" min={min} max={max} value={draft ?? String(value)}
    onFocus={event => { setDraft(String(value)); event.target.select(); }} onChange={event => setDraft(event.target.value)}
    onBlur={() => { const next = Number(draft); if (!cancel.current && draft !== null && draft !== '' && Number.isFinite(next) && next !== value) onCommit(next); cancel.current = false; setDraft(null); }}
    onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') { cancel.current = true; event.currentTarget.blur(); } }} /><small>{unit}</small></div></label>;
}

function useJournal(tripId) {
  const [project, setProject] = useState(null);
  const projectRef = useRef(null);
  const history = useRef({ past: [], future: [] });
  const revision = useRef(0);
  const savedRevision = useRef(-1);
  const saveQueue = useRef(Promise.resolve());
  const [, refreshHistory] = useState(0);
  const [saveStatus, setSaveStatus] = useState('loading');
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadJournal(tripId).then(saved => {
      if (cancelled) return;
      const next = saved ?? createJournal(tripId);
      projectRef.current = next;
      savedRevision.current = saved ? 0 : -1;
      setProject(next);
      setSaveStatus(saved ? 'saved' : 'pending');
    }).catch(() => {
      if (cancelled) return;
      const next = createJournal(tripId);
      projectRef.current = next;
      setProject(next);
      setSaveStatus('error');
      setStorageError('无法读取浏览器里的手帐。你可以继续排版，并导出手帐文件备份。');
    });
    return () => { cancelled = true; };
  }, [tripId]);

  const remember = useCallback(previous => {
    history.current.past = [...history.current.past.slice(-39), previous];
    history.current.future = [];
    refreshHistory(value => value + 1);
  }, []);

  const update = useCallback((updater, record = true) => {
    const previous = projectRef.current;
    if (!previous) return;
    const next = updater(previous);
    if (next === previous) return;
    if (record) remember(previous);
    revision.current++;
    projectRef.current = next;
    setProject(next);
    setSaveStatus('pending');
  }, [remember]);

  const undo = useCallback((redo = false) => {
    const source = redo ? history.current.future : history.current.past;
    if (!source.length) return;
    const previous = source.pop();
    (redo ? history.current.past : history.current.future).push(projectRef.current);
    update(() => previous, false);
  }, [update]);

  const persist = useCallback(async () => {
    const snapshot = projectRef.current;
    if (!snapshot) return false;
    const currentRevision = revision.current;
    setSaveStatus('saving');
    try {
      const pending = saveQueue.current.catch(() => {}).then(() => saveJournal(snapshot));
      saveQueue.current = pending;
      await pending;
      savedRevision.current = currentRevision;
      if (revision.current === currentRevision) setSaveStatus('saved');
      setStorageError('');
      return true;
    } catch {
      setSaveStatus('error');
      setStorageError('保存未完成，请再试一次，或导出手帐文件保留这次排版。');
      return false;
    }
  }, []);

  useEffect(() => {
    if (!project || revision.current === savedRevision.current) return;
    const timer = setTimeout(persist, 650);
    return () => clearTimeout(timer);
  }, [project, persist]);

  useEffect(() => {
    const flush = () => { if (projectRef.current && revision.current !== savedRevision.current) persist(); };
    window.addEventListener('pagehide', flush);
    return () => { window.removeEventListener('pagehide', flush); flush(); };
  }, [persist]);

  return { project, projectRef, update, remember, undo, history, persist, saveStatus, storageError };
}

function JournalWorkspace({ journey }) {
  const { project, projectRef, update, remember, undo, history, persist, saveStatus, storageError } = useJournal(journey.id);
  const [activePageId, setActivePageId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [dragAssetId, setDragAssetId] = useState(null);
  const [templateFilter, setTemplateFilter] = useState('all');
  const [lockRatio, setLockRatio] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [fitScale, setFitScale] = useState(2);
  const [preview, setPreview] = useState(false);
  const [printMode, setPrintMode] = useState('photos');
  const [marks, setMarks] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const [dragPageId, setDragPageId] = useState(null);
  const [dragFrameId, setDragFrameId] = useState(null);
  const [assetFilter, setAssetFilter] = useState('all');
  const trayRef = useRef(null);
  const stageRef = useRef(null);
  const pageRefs = useRef(new Map());
  const gesture = useRef(null);
  const uploadRef = useRef(null);
  const importRef = useRef(null);

  const activeIndex = Math.max(0, project?.pages.findIndex(page => page.id === activePageId) ?? 0);
  const activePage = project?.pages[activeIndex];
  const selected = activePage?.frames.find(frame => frame.id === selectedId);
  const selectedText = activePage?.texts?.find(text => text.id === selectedTextId);
  const assets = useMemo(() => new Map(project?.assets.map(asset => [asset.id, asset]) ?? []), [project?.assets]);
  const items = useMemo(() => project ? printItems(project) : [], [project]);
  const sheets = useMemo(() => packPrintSheets(items), [items]);
  const numbers = useMemo(() => new Map(items.map(item => [item.id, item.number])), [items]);
  const used = useMemo(() => {
    const counts = new Map();
    for (const item of items) if (item.assetId) counts.set(item.assetId, (counts.get(item.assetId) ?? 0) + 1);
    return counts;
  }, [items]);
  const spreadStart = Math.floor(activeIndex / 2) * 2;
  const scale = fitScale * zoom;
  const spreadFrames = useMemo(() => (project?.pages.slice(spreadStart, spreadStart + 2) ?? []).flatMap(page => page.frames.map(frame => ({ frame, page }))), [project, spreadStart]);
  const emptyCount = spreadFrames.filter(({ frame }) => !frame.assetId).length;
  const visibleAssets = project ? (assetFilter === 'unused' ? project.assets.filter(asset => !used.has(asset.id)) : project.assets) : [];
  const unusedCount = project ? project.assets.filter(asset => !used.has(asset.id)).length : 0;

  useEffect(() => {
    if (!stageRef.current || !project) return;
    const observer = new ResizeObserver(([entry]) => {
      setFitScale(Math.max(0.6, Math.min((entry.contentRect.width - 112) / 220, (entry.contentRect.height - 96) / 210, 3.4)));
    });
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, [!!project]);

  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 4200); return () => clearTimeout(timer); }, [notice]);

  const editPage = (id, action, record = true) => update(current => ({ ...current, pages: current.pages.map(page => page.id === id ? action(page) : page) }), record);
  const editFrame = (id, patch) => editPage(activePage.id, page => ({ ...page, templateId: 'custom', frames: page.frames.map(frame => frame.id === id ? fitFrame({ ...frame, ...patch }) : frame) }));
  const editText = (id, patch) => editPage(activePage.id, page => ({ ...page, texts: (page.texts ?? []).map(text => text.id === id ? fitFrame({ ...text, ...patch }) : text) }));
  const selectPage = page => { setActivePageId(page.id); setSelectedId(null); setSelectedTextId(null); };
  const addText = () => { const text = createText(); editPage(activePage.id, page => ({ ...page, texts: [...(page.texts ?? []), text] })); setSelectedTextId(text.id); setSelectedId(null); };

  const addFrame = (assetId = null, pageId = activePage.id, position) => {
    const asset = assets.get(assetId);
    const width = asset?.width > asset?.height ? 62 : 45;
    const height = asset ? clamp(width / (asset.width / asset.height), 25, 90) : 60;
    const frame = createFrame({ assetId, width, height, x: position ? position.x - width / 2 : (110 - width) / 2, y: position ? position.y - height / 2 : (210 - height) / 2 });
    editPage(pageId, page => ({ ...page, frames: [...page.frames, frame] }));
    setActivePageId(pageId);
    setSelectedId(frame.id);
    setSelectedTextId(null);
    setSelectedAssetId(null);
  };

  const deleteFrame = useCallback(() => {
    if (!selectedId && !selectedTextId) return;
    update(current => ({ ...current, pages: current.pages.map(page => ({ ...page, frames: page.frames.filter(frame => frame.id !== selectedId), texts: (page.texts ?? []).filter(text => text.id !== selectedTextId) })) }));
    setSelectedId(null);
    setSelectedTextId(null);
  }, [selectedId, selectedTextId, update]);

  const duplicateFrame = () => {
    if (!selected) return;
    const frame = fitFrame({ ...selected, id: uid(), x: selected.x + 6, y: selected.y + 6 });
    editPage(activePage.id, page => ({ ...page, frames: [...page.frames, frame] }));
    setSelectedId(frame.id);
  };

  useEffect(() => {
    const keydown = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); persist(); return; }
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(event.shiftKey); return; }
      if (event.key === 'Escape') { setSelectedId(null); setSelectedTextId(null); setSelectedAssetId(null); return; }
      if (preview || (!selectedId && !selectedTextId)) return;
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); deleteFrame(); }
      const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (arrows[event.key]) {
        event.preventDefault();
        const [x, y] = arrows[event.key];
        const step = event.shiftKey ? 5 : 0.5;
        const collection = selectedTextId ? 'texts' : 'frames';
        const id = selectedTextId ?? selectedId;
        update(current => ({ ...current, pages: current.pages.map(page => ({ ...page, [collection]: (page[collection] ?? []).map(frame => frame.id === id ? fitFrame({ ...frame, x: frame.x + x * step, y: frame.y + y * step }) : frame) })) }));
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [selectedId, selectedTextId, preview, undo, persist, update, deleteFrame]);

  useEffect(() => {
    const pointerMove = event => {
      const action = gesture.current;
      if (!action) return;
      if (Math.hypot(event.clientX - action.clientX, event.clientY - action.clientY) < 2 && !action.moved) return;
      action.moved = true;
      const dx = (event.clientX - action.clientX) / action.scale;
      const dy = (event.clientY - action.clientY) / action.scale;
      const frame = action.frame;
      let next;
      if (action.corner) {
        const angle = frame.rotation * Math.PI / 180;
        const localX = dx * Math.cos(angle) + dy * Math.sin(angle);
        const localY = -dx * Math.sin(angle) + dy * Math.cos(angle);
        const [signX, signY] = action.corner;
        let width = Math.max(5, frame.width + localX * signX);
        let height = Math.max(5, frame.height + localY * signY);
        if (action.lockRatio) {
          const ratio = frame.width / frame.height;
          if (Math.abs(localX) > Math.abs(localY * ratio)) height = width / ratio;
          else width = height * ratio;
        }
        const centerX = signX * (width - frame.width) / 2;
        const centerY = signY * (height - frame.height) / 2;
        next = fitFrame({ ...frame, width, height, x: frame.x + frame.width / 2 + centerX * Math.cos(angle) - centerY * Math.sin(angle) - width / 2, y: frame.y + frame.height / 2 + centerX * Math.sin(angle) + centerY * Math.cos(angle) - height / 2 });
      } else {
        let x = frame.x + dx;
        let y = frame.y + dy;
        if (!event.altKey) {
          for (const target of [8, 55 - frame.width / 2, 102 - frame.width]) if (Math.abs(x - target) < 1) x = target;
          for (const target of [8, 105 - frame.height / 2, 202 - frame.height]) if (Math.abs(y - target) < 1) y = target;
        }
        next = fitFrame({ ...frame, x, y });
      }
      const collection = action.kind === 'text' ? 'texts' : 'frames';
      update(current => ({ ...current, pages: current.pages.map(page => page.id === action.pageId ? { ...page, [collection]: page[collection].map(item => item.id === frame.id ? next : item) } : page) }), false);
    };
    const pointerUp = event => {
      const action = gesture.current;
      if (action?.moved) {
        if (event.type === 'pointercancel') update(() => action.before, false);
        else remember(action.before);
      }
      gesture.current = null;
    };
    window.addEventListener('pointermove', pointerMove);
    window.addEventListener('pointerup', pointerUp);
    window.addEventListener('pointercancel', pointerUp);
    return () => { window.removeEventListener('pointermove', pointerMove); window.removeEventListener('pointerup', pointerUp); window.removeEventListener('pointercancel', pointerUp); };
  }, [update, remember]);

  const beginGesture = (event, frame, page, corner = null, kind = 'photo') => {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    setActivePageId(page.id);
    setSelectedId(kind === 'photo' ? frame.id : null);
    setSelectedTextId(kind === 'text' ? frame.id : null);
    if (selectedAssetId && !corner && kind === 'photo') {
      editPage(page.id, current => ({ ...current, frames: current.frames.map(item => item.id === frame.id ? { ...item, assetId: selectedAssetId, zoom: 1, offsetX: 0, offsetY: 0 } : item) }));
      setSelectedAssetId(null);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { frame, kind, pageId: page.id, before: projectRef.current, clientX: event.clientX, clientY: event.clientY, scale: pageRefs.current.get(page.id).getBoundingClientRect().width / 110, corner, lockRatio: kind === 'text' ? false : lockRatio, moved: false };
  };

  const dropAsset = (event, page) => {
    event.preventDefault();
    setDragPageId(null);
    setDragFrameId(null);
    const assetId = event.dataTransfer.getData('application/x-across-photo');
    if (!assets.has(assetId)) return;
    const frameId = event.target.closest('[data-frame-id]')?.dataset.frameId;
    if (frameId) {
      editPage(page.id, current => ({ ...current, frames: current.frames.map(frame => frame.id === frameId ? { ...frame, assetId, zoom: 1, offsetX: 0, offsetY: 0 } : frame) }));
      setActivePageId(page.id);
      setSelectedId(frameId);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      addFrame(assetId, page.id, { x: (event.clientX - rect.left) / rect.width * 110, y: (event.clientY - rect.top) / rect.height * 210 });
    }
    setSelectedAssetId(null);
    setSelectedTextId(null);
  };

  const upload = async files => {
    if (!files?.length) return;
    setUploading(true);
    const added = [];
    const errors = [];
    for (const file of files) {
      try { added.push(await readPhotoFile(file)); }
      catch (error) { errors.push(error.message); }
    }
    if (added.length) update(current => ({ ...current, assets: [...added, ...current.assets] }));
    setNotice(errors.length ? errors.join('；') : `已加入 ${added.length} 张照片，拖入页面即可`);
    setUploading(false);
    if (uploadRef.current) uploadRef.current.value = '';
  };

  const useTemplate = template => {
    const oldCount = activePage.frames.filter(frame => frame.assetId).length;
    editPage(activePage.id, page => applyTemplate(page, template.id));
    setSelectedId(null);
    setSelectedTextId(null);
    setNotice(oldCount > template.frames.length ? '版式已更换，多余的照片仍保留在底部素材栏' : `已将「${template.name}」应用到第 ${activeIndex + 1} 页`);
  };

  const useSpread = template => {
    const replacement = createSpread(template.id);
    const photos = project.pages.slice(spreadStart, spreadStart + 2).flatMap(page => page.frames.filter(frame => frame.assetId));
    let photoIndex = 0;
    for (const page of replacement) for (const frame of page.frames) frame.assetId = photos[photoIndex++]?.assetId ?? null;
    update(current => ({ ...current, pages: [...current.pages.slice(0, spreadStart), ...replacement, ...current.pages.slice(spreadStart + 2)] }));
    selectPage(replacement[0]);
    setNotice(`已应用跨页组合「${template.name}」，两页都可以继续单独编辑`);
  };

  const addPage = () => {
    const page = createPage();
    update(current => ({ ...current, pages: [...current.pages, page] }));
    selectPage(page);
  };

  const download = async () => {
    setExporting(true);
    try { await exportJournalPdf(projectRef.current, { mode: printMode, marks }); setNotice('打印 PDF 已导出，请按「实际大小 / 100%」打印'); }
    catch (error) { setNotice(`导出未完成：${error.message || '请重试'}`); }
    finally { setExporting(false); }
  };

  const backup = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(projectRef.current)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `${project.title || 'across'}.across.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('手帐文件已导出，包含照片与可编辑排版');
  };

  const restore = async file => {
    if (!file) return;
    try {
      const restored = JSON.parse(await file.text());
      const hasGeometry = item => item && ['x', 'y', 'width', 'height'].every(key => Number.isFinite(item[key]));
      if (restored.version !== 1 || !Array.isArray(restored.pages) || !restored.pages.length || !Array.isArray(restored.assets) || restored.pages.some(page => !page || !Array.isArray(page.frames) || page.frames.some(frame => !hasGeometry(frame)) || (page.texts !== undefined && (!Array.isArray(page.texts) || page.texts.some(text => !hasGeometry(text) || typeof text.content !== 'string'))))) throw new Error();
      update(() => ({ ...restored, tripId: journey.id, pages: restored.pages.map(page => ({ ...page, paper: /^#[0-9a-f]{6}$/i.test(page.paper) ? page.paper : PAPER_COLORS[0], frames: page.frames.map(frame => createFrame(frame)), texts: (page.texts ?? []).map(text => fitFrame(createText({ ...text, fontSize: clamp(Number(text.fontSize) || 4, 1, 24) }))) })) }));
      setActivePageId(restored.pages[0].id); setSelectedId(null); setSelectedTextId(null); setSelectedAssetId(null); setNotice('手帐文件已导入，可以继续编辑');
    } catch { setNotice('无法打开这个手帐文件，请选择从 Across 导出的 .across.json 文件'); }
    if (importRef.current) importRef.current.value = '';
  };

  const fillFrame = (pageId, frameId, assetId) => editPage(pageId, page => ({ ...page, frames: page.frames.map(frame => frame.id === frameId ? { ...frame, assetId, zoom: 1, offsetX: 0, offsetY: 0 } : frame) }));

  const pickAsset = asset => {
    if (!selected) { setSelectedAssetId(current => current === asset.id ? null : asset.id); return; }
    const wasEmpty = !selected.assetId;
    fillFrame(activePage.id, selected.id, asset.id);
    setSelectedAssetId(null);
    if (wasEmpty) {
      const next = spreadFrames.find(({ frame }) => !frame.assetId && frame.id !== selected.id);
      if (next) { setActivePageId(next.page.id); setSelectedId(next.frame.id); }
    }
  };

  const clearPhoto = () => { if (selected) fillFrame(activePage.id, selected.id, null); };

  const autoFill = () => {
    const empty = spreadFrames.filter(({ frame }) => !frame.assetId);
    if (!empty.length) { setNotice('这个跨页的照片框都已经有照片了'); return; }
    const pool = [...project.assets.filter(asset => !used.has(asset.id)), ...project.assets.filter(asset => used.has(asset.id))];
    if (!pool.length) { setNotice('先上传照片，再自动填入'); return; }
    const fills = new Map(empty.slice(0, pool.length).map(({ frame }, index) => [frame.id, pool[index].id]));
    update(current => ({ ...current, pages: current.pages.map(page => ({ ...page, frames: page.frames.map(frame => fills.has(frame.id) ? { ...frame, assetId: fills.get(frame.id), zoom: 1, offsetX: 0, offsetY: 0 } : frame) })) }));
    setNotice(`已为 ${fills.size} 个空照片框填入照片，⌘Z 可撤销`);
  };

  const pulseTray = () => { const node = trayRef.current; if (!node) return; node.classList.remove('is-pulsing'); void node.offsetWidth; node.classList.add('is-pulsing'); };

  const renderPhoto = (frame, page, offset = 0) => {
    const placing = !!(dragAssetId || selectedAssetId);
    const compact = Math.min(frame.width, frame.height) * scale < 96;
    return <div key={frame.id} className={`zine-photo${frame.span ? ' is-spanning' : ''}${selectedId === frame.id ? ' is-selected' : ''}${frame.assetId ? '' : ' is-empty'}${placing ? ' is-droppable' : ''}${dragFrameId === frame.id ? ' is-drop-target' : ''}${compact ? ' is-compact' : ''}`} data-frame-id={frame.id} role="button" tabIndex={0} aria-label={`照片 P${pad(numbers.get(frame.id))}，${frame.assetId ? '' : '空照片框，'}${frame.width} × ${frame.height} 毫米`} style={{ left: (frame.x + offset) * scale, top: frame.y * scale, width: frame.width * scale, height: frame.height * scale, transform: `rotate(${frame.rotation}deg)` }} onPointerDown={event => beginGesture(event, frame, page)} onFocus={() => { setActivePageId(page.id); setSelectedId(frame.id); setSelectedTextId(null); }} onDragOver={event => { if (!dragAssetId) return; event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = 'copy'; setDragFrameId(frame.id); setDragPageId(null); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragFrameId(current => current === frame.id ? null : current); }} onDrop={event => { event.stopPropagation(); dropAsset(event, page); }}>
      <div className="zine-photo-content"><PhotoContent asset={assets.get(frame.assetId)} frame={frame} number={numbers.get(frame.id)} /></div>
      {placing && <span className="zine-photo__drop"><ImagePlus size={14} />{frame.assetId ? '替换这张' : '放入这里'}</span>}
      {selectedId === frame.id && <><span className="zine-photo__measurement">P{pad(numbers.get(frame.id))} · {frame.width} × {frame.height} mm</span>{[[-1, -1, 'nw'], [1, -1, 'ne'], [-1, 1, 'sw'], [1, 1, 'se']].map(([x, y, corner]) => <span key={corner} className={`zine-resize zine-resize--${corner}`} onPointerDown={event => beginGesture(event, frame, page, [x, y])} />)}</>}
    </div>;
  };
  const renderText = (text, page) => <div key={text.id} className={`zine-text${selectedTextId === text.id ? ' is-selected' : ''}`} role="button" tabIndex={0} aria-label={`文字：${text.content.replaceAll('\n', ' ').slice(0, 35)}`} style={textStyle(text, scale)} onPointerDown={event => beginGesture(event, text, page, null, 'text')} onFocus={() => { setActivePageId(page.id); setSelectedTextId(text.id); setSelectedId(null); }}><span>{text.content}</span>{selectedTextId === text.id && <span className="zine-resize zine-resize--se" onPointerDown={event => beginGesture(event, text, page, [1, 1], 'text')} />}</div>;

  if (!project) return <div className="zine-loading"><LoaderCircle className="zine-spin" size={22} /><span>正在打开手帐…</span></div>;

  return <main className="zine" aria-label="旅行手帐编辑器">
    <header className="zine-header">
      <div className="zine-header__identity"><Link className="zine-back" to={`${tripUrl(journey)}#journal-title`} aria-label="返回旅行"><ArrowLeft size={17} /></Link><Link to="/" className="zine-brand">across</Link><span className="zine-header__kind">zine</span><span className="zine-header__sep" /><div className="zine-document"><input aria-label="手帐名称" value={project.title} maxLength={60} onChange={event => update(current => ({ ...current, title: event.target.value }))} /><span className={`zine-save-state is-${saveStatus}`}>{saveStatus === 'saved' ? <Check size={11} /> : saveStatus === 'saving' ? <LoaderCircle size={11} className="zine-spin" /> : <span className="zine-save-dot" />}{({ saved: '已保存到浏览器', saving: '保存中', pending: '等待保存', error: '保存未完成' })[saveStatus]}</span></div></div>
      <div className="zine-mode" aria-label="画布模式"><button aria-pressed={!preview} onClick={() => setPreview(false)}>编辑</button><button aria-pressed={preview} onClick={() => { setPreview(true); setSelectedAssetId(null); }}><Scissors size={13} />打印预览</button></div>
      <div className="zine-header__actions"><button className="zine-icon-button" aria-label="撤销" title="撤销（⌘Z）" disabled={!history.current.past.length} onClick={() => undo()}><Undo2 size={16} /></button><button className="zine-icon-button" aria-label="重做" title="重做（⌘⇧Z）" disabled={!history.current.future.length} onClick={() => undo(true)}><Redo2 size={16} /></button><span className="zine-header__divider" /><button className="zine-button zine-button--ghost zine-save-button" onClick={async () => { if (await persist()) setNotice('手帐已保存，可随时回来继续编辑'); }} title="保存手帐（⌘S）"><Save size={15} /><span>保存</span></button><button className="zine-button zine-button--primary" onClick={download} disabled={exporting || (printMode === 'photos' && !items.length)}>{exporting ? <LoaderCircle size={15} className="zine-spin" /> : <Download size={15} />}<span>{exporting ? '正在导出…' : '导出打印 PDF'}</span></button></div>
    </header>

    {storageError && <div className="zine-storage-error" role="alert">{storageError}<button onClick={backup}>导出手帐文件</button></div>}

    <div className="zine-workspace">
      <aside className="zine-templates" aria-label="页面模板">
        <div className="zine-sidebar-heading"><span>页面版式</span><small>第 {pad(activeIndex + 1)} 页</small></div>
        <p className="zine-sidebar-description">选一种排法，再慢慢调整。</p>
        <div className="zine-template-filters" aria-label="模板筛选">{[['all', '全部'], ['page', '单页'], ['spread', '跨页']].map(([id, label]) => <button key={id} aria-pressed={templateFilter === id} onClick={() => setTemplateFilter(id)}>{label}</button>)}</div>
        <div className="zine-template-grid">
          {templateFilter !== 'page' && <><div className="zine-template-group">跨页组合 <span>两页一起排</span></div>{JOURNAL_SPREADS.map(template => <button key={template.id} className="zine-template zine-template--spread" aria-label={`应用跨页：${template.name}`} disabled={preview} onClick={() => useSpread(template)} title={template.note}><span className="zine-template__preview"><MiniSpread template={template} /></span><span className="zine-template__name">{template.name}</span></button>)}</>}
          {templateFilter !== 'spread' && <><div className="zine-template-group">单页版式 <span>只改当前页</span></div>{JOURNAL_TEMPLATES.map(template => <button key={template.id} className={`zine-template${activePage.templateId === template.id ? ' is-active' : ''}`} aria-label={`应用模板：${template.name}`} aria-pressed={activePage.templateId === template.id} disabled={preview} onClick={() => useTemplate(template)} title={template.note}><span className="zine-template__preview"><MiniPage template={template} />{activePage.templateId === template.id && <span className="zine-template__check"><Check size={10} /></span>}</span><span className="zine-template__name">{template.name}</span><small>{template.frames.length ? `${template.frames.length} 张照片` : '自由放置'}</small></button>)}</>}
        </div>
        <div className="zine-sidebar-footer"><button onClick={backup}><FileDown size={13} />导出手帐文件</button><button onClick={() => importRef.current.click()}><Upload size={13} />导入手帐文件</button><input type="file" ref={importRef} hidden accept=".json" onChange={event => restore(event.target.files[0])} /></div>
      </aside>

      <section className={`zine-stage${preview ? ' is-print-preview' : ''}`} aria-label={preview ? '打印排版预览' : 'TN 手帐跨页画布'}>
        {preview && <div className="zine-stage-heading"><span>{printMode === 'photos' ? 'A4 照片拼版' : 'TN 整页预览'} · {printMode === 'photos' ? sheets.length : project.pages.length} 张纸</span><span>打印时选择「实际大小 / 100%」</span></div>}
        {!preview && (selectedAssetId || dragAssetId) && <div className="zine-stage-hint" role="status"><span className="zine-stage-hint__thumb">{assets.get(selectedAssetId ?? dragAssetId)?.src ? <img src={assets.get(selectedAssetId ?? dragAssetId).src} alt="" /> : <span className={`tone-${assets.get(selectedAssetId ?? dragAssetId)?.tone ?? 0}`} />}</span><span>{dragAssetId ? <>拖到<b>照片框</b>里填入，或放在页面空白处新建照片框</> : <>点击<b>照片框</b>填入「{assets.get(selectedAssetId)?.name}」，或点击页面空白处新建</>}</span>{selectedAssetId && <button onClick={() => setSelectedAssetId(null)}>取消<kbd>Esc</kbd></button>}</div>}
        <div className="zine-stage__viewport" ref={stageRef}>
          {preview ? <div className="zine-print-previews">
            {printMode === 'photos' ? sheets.length ? sheets.map((sheet, index) => <div className="zine-print-preview" key={index}><div className="zine-print-paper"><header><b>across / photo print sheets</b><span>A4 · {index + 1}/{sheets.length}</span></header>{sheet.items.map(item => <div key={item.id} className={`zine-print-photo${marks ? ' has-marks' : ''}`} style={{ left: `${item.printX / 2.1}%`, top: `${item.printY / 2.97}%`, width: `${item.width / 2.1}%`, height: `${item.height / 2.97}%` }}><div className="zine-photo-content"><PhotoContent asset={assets.get(item.assetId)} frame={item} number={item.number} miniature /></div><span>P{pad(item.number)} · {item.width} × {item.height} mm</span></div>)}<footer>ACTUAL SIZE / 100%</footer></div><p>A4 / {pad(index + 1)}</p></div>) : <p className="zine-preview-empty">先在手帐中加入照片框，再导出打印。</p> : project.pages.map((page, index) => <div className="zine-print-preview zine-print-preview--tn" key={page.id}><div className="zine-tn-preview" style={{ background: page.paper }}>{composePageFrames(project, index).map(frame => <div key={frame.id} className="zine-print-tn-photo" style={{ left: `${frame.x / 1.1}%`, top: `${frame.y / 2.1}%`, width: `${frame.width / 1.1}%`, height: `${frame.height / 2.1}%`, transform: `rotate(${frame.rotation}deg)` }}><PhotoContent asset={assets.get(frame.assetId)} frame={frame} number={numbers.get(frame.id)} miniature /></div>)}{(page.texts ?? []).map(text => <PreviewText key={text.id} text={text} />)}</div><p>第 {pad(index + 1)} 页 · 110 × 210 mm</p></div>)}
          </div> : <div className="zine-book-space" style={{ minWidth: 220 * scale + 112, minHeight: 210 * scale + 96 }}>
            <div className="zine-book-wrap">
              <div className="zine-book" style={{ width: 220 * scale, height: 210 * scale }}>
                {project.pages.slice(spreadStart, spreadStart + 2).map((page, localIndex) => <div key={page.id} className="zine-page-column" style={{ width: 110 * scale }}><div className={`zine-page-label${page.id === activePage.id ? ' is-active' : ''}`}><button onClick={() => selectPage(page)}><b>{pad(spreadStart + localIndex + 1)}</b>{JOURNAL_TEMPLATES.find(template => template.id === page.templateId)?.name ?? '自由排版'}</button></div><div ref={node => { if (node) pageRefs.current.set(page.id, node); else pageRefs.current.delete(page.id); }} className={`zine-notebook-page${page.id === activePage.id ? ' is-active' : ''}${dragPageId === page.id ? ' is-drop-target' : ''}${selectedAssetId ? ' is-placing' : ''}`} aria-label={`第 ${spreadStart + localIndex + 1} 页画布`} data-page-id={page.id} style={{ width: 110 * scale, height: 210 * scale, background: page.paper }}
                  onPointerDown={event => { if (event.button !== 0) return; setActivePageId(page.id); setSelectedId(null); setSelectedTextId(null); if (selectedAssetId) { const rect = event.currentTarget.getBoundingClientRect(); addFrame(selectedAssetId, page.id, { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale }); } }}
                  onDragOver={event => { if (dragAssetId) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; setDragPageId(page.id); setDragFrameId(null); } }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragPageId(null); }} onDrop={event => dropAsset(event, page)}>
                  <div className="zine-page-safe-area" />
                  {!page.frames.length && !page.texts?.length && <div className="zine-page-empty"><ImagePlus size={22} strokeWidth={1.3} /><span>把照片拖到这里</span><small>或在左侧选一个版式</small></div>}
                  {dragPageId === page.id && <span className="zine-page-drop-hint"><Plus size={12} />松手，在这里新建照片框</span>}
                  {page.frames.filter(frame => !frame.span).map(frame => renderPhoto(frame, page))}
                  {(page.texts ?? []).map(text => renderText(text, page))}
                  <span className="zine-page-number">{pad(spreadStart + localIndex + 1)}</span>
                </div></div>)}
                {project.pages.length === spreadStart + 1 && <button className="zine-add-facing-page" style={{ width: 110 * scale }} onClick={addPage}><Plus size={22} strokeWidth={1} /><span>添加下一页</span></button>}
                {project.pages.slice(spreadStart, spreadStart + 2).flatMap((page, index) => page.frames.filter(frame => frame.span).map(frame => renderPhoto(frame, page, index * 110)))}
              </div>
              <div className="zine-book-caption"><span>Traveler’s Notebook · Regular</span><span>单页 110 × 210 mm · 跨页 220 × 210 mm</span></div>
            </div>
          </div>}
        </div>
        {!preview && <div className="zine-stage-bar"><div className="zine-dock"><button className="zine-dock__button" onClick={() => addFrame()} title="在当前页添加空照片框"><ImagePlus size={15} /><span>照片框</span></button><button className="zine-dock__button" onClick={addText} title="在当前页添加文字"><Type size={15} /><span>文字</span></button></div><div className="zine-page-navigation"><button className="zine-icon-button" aria-label="上一跨页" disabled={spreadStart === 0} onClick={() => selectPage(project.pages[spreadStart - 2])}><ChevronLeft size={17} /></button><div className="zine-page-strip" aria-label="手帐页面">{project.pages.map((page, index) => <button key={page.id} className={`zine-page-tab${page.id === activePage.id ? ' is-active' : ''}`} aria-label={`选择第 ${index + 1} 页`} aria-pressed={page.id === activePage.id} onClick={() => selectPage(page)}><MiniPage page={page} /><span>{pad(index + 1)}</span></button>)}<button className="zine-page-add" aria-label="添加一页" onClick={addPage}><Plus size={15} /></button></div><button className="zine-icon-button" aria-label="下一跨页" disabled={spreadStart + 2 >= project.pages.length} onClick={() => selectPage(project.pages[spreadStart + 2])}><ChevronRight size={17} /></button></div><div className="zine-dock zine-zoom"><button className="zine-icon-button" aria-label="缩小画布" disabled={zoom <= 0.5} onClick={() => setZoom(value => Math.max(0.5, roundMm(value - 0.1)))}><Minus size={14} /></button><button className="zine-zoom__value" title="适合画布" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button><button className="zine-icon-button" aria-label="放大画布" disabled={zoom >= 2} onClick={() => setZoom(value => Math.min(2, roundMm(value + 0.1)))}><Plus size={14} /></button><button className="zine-icon-button" aria-label="适合画布" title="适合画布" onClick={() => setZoom(1)}><Expand size={14} /></button></div></div>}
      </section>

      <aside className="zine-inspector" aria-label={preview ? '打印设置' : '编辑属性'}>
        {preview ? <>
          <div className="zine-sidebar-heading"><span>打印设置</span><Scissors size={15} /></div><p className="zine-sidebar-description">在纸上，接着完成这次旅行。</p>
          <div className="zine-setting-section"><h3>导出内容</h3><label className={`zine-print-option${printMode === 'photos' ? ' is-active' : ''}`}><input type="radio" name="printMode" checked={printMode === 'photos'} onChange={() => setPrintMode('photos')} /><span><b>照片拼版</b><small>A4 · 剪下照片，手工粘贴</small></span></label><label className={`zine-print-option${printMode === 'pages' ? ' is-active' : ''}`}><input type="radio" name="printMode" checked={printMode === 'pages'} onChange={() => setPrintMode('pages')} /><span><b>手帐整页</b><small>110 × 210 mm · 保留页面排版</small></span></label></div>
          {printMode === 'photos' && <div className="zine-setting-section"><label className="zine-checkbox"><input type="checkbox" checked={marks} onChange={event => setMarks(event.target.checked)} />显示裁切标记</label><p className="zine-field-note">照片编号与尺寸标在图片外侧。叠放的照片会完整、分别输出。</p></div>}
          <div className="zine-print-summary"><span>{items.length}<small>个照片框</small></span><span>{printMode === 'photos' ? sheets.length : project.pages.length}<small>{printMode === 'photos' ? '张 A4 纸' : '张 TN 内页'}</small></span></div>
          <p className="zine-print-instruction">打印时选择<strong>实际大小 / 100%</strong>，让照片和本子里的尺寸一致。</p><button className="zine-button zine-button--outline zine-full-width" onClick={() => exportSizeList(project)} disabled={!items.length}><FileDown size={14} />下载照片尺寸清单</button>
        </> : selectedText ? <>
          <div className="zine-sidebar-heading"><span>编辑文字</span><Type size={15} /></div>
          <textarea className="zine-textarea" aria-label="文字内容" value={selectedText.content} onChange={event => editText(selectedText.id, { content: event.target.value })} />
          <div className="zine-setting-section"><h3>字体</h3><div className="zine-type-options"><button aria-pressed={selectedText.fontFamily === 'sans'} onClick={() => editText(selectedText.id, { fontFamily: 'sans' })}>无衬线</button><button aria-pressed={selectedText.fontFamily === 'mono'} onClick={() => editText(selectedText.id, { fontFamily: 'mono' })}>打字机</button><button aria-pressed={selectedText.fontWeight === 700} onClick={() => editText(selectedText.id, { fontWeight: selectedText.fontWeight === 700 ? 400 : 700 })}><b>B</b></button></div><div className="zine-field-grid"><NumberField key={`${selectedText.id}-font`} label="字号" value={selectedText.fontSize} unit="mm" min={1} max={24} onCommit={fontSize => editText(selectedText.id, { fontSize: clamp(fontSize, 1, 24) })} /></div></div>
          <div className="zine-setting-section"><h3>文字框</h3><div className="zine-field-grid">{[['width', '文字框宽度'], ['height', '文字框高度'], ['x', '文字 X 位置'], ['y', '文字 Y 位置']].map(([key, label]) => <NumberField key={`${selectedText.id}-${key}`} label={label} value={selectedText[key]} onCommit={value => editText(selectedText.id, { [key]: value })} />)}</div></div>
          <div className="zine-object-actions"><button onClick={() => { const text = { ...selectedText, id: uid(), y: Math.min(180, selectedText.y + 8) }; editPage(activePage.id, page => ({ ...page, texts: [...page.texts, text] })); setSelectedTextId(text.id); }}><Copy size={14} />复制文字</button><button onClick={deleteFrame}><Trash2 size={14} />删除</button></div><p className="zine-field-note">拖动文字调整位置。标题、图注和页边注记都可以修改，整页导出时保留。</p>
        </> : selected ? <>
          <div className="zine-sidebar-heading"><span>照片框 P{pad(numbers.get(selected.id))}</span><button className="zine-icon-button" aria-label="取消选择照片" onClick={() => setSelectedId(null)}><X size={14} /></button></div>
          <div className={`zine-photo-source${selected.assetId ? '' : ' is-empty'}`}><span className="zine-photo-source__thumb">{assets.get(selected.assetId)?.src ? <img src={assets.get(selected.assetId).src} alt="" /> : selected.assetId ? <span className={`tone-${assets.get(selected.assetId)?.tone ?? 0}`} /> : <ImagePlus size={18} strokeWidth={1.4} />}</span><div><b title={assets.get(selected.assetId)?.name}>{assets.get(selected.assetId)?.name ?? '还没有照片'}</b><small>{selected.assetId ? (assets.get(selected.assetId)?.src ? `${assets.get(selected.assetId).width} × ${assets.get(selected.assetId).height} px` : '示例占位图') : '点下方素材栏里的照片即可填入'}</small></div></div>
          <div className="zine-photo-source__actions"><button className="zine-button zine-button--outline" onClick={pulseTray}><Replace size={13} />{selected.assetId ? '更换照片' : '选择照片'}</button>{selected.assetId && <button className="zine-button zine-button--outline" onClick={clearPhoto}><ImageOff size={13} />移出</button>}</div>
          <div className="zine-setting-section"><h3>打印尺寸</h3><div className="zine-field-grid"><NumberField key={`${selected.id}-w`} label="宽度" value={selected.width} min={5} max={selected.span ? 190 : 110} onCommit={width => editFrame(selected.id, { width, ...(lockRatio ? { height: width * selected.height / selected.width } : {}) })} /><NumberField key={`${selected.id}-h`} label="高度" value={selected.height} min={5} max={210} onCommit={height => editFrame(selected.id, { height, ...(lockRatio ? { width: height * selected.width / selected.height } : {}) })} /></div><label className="zine-checkbox"><input type="checkbox" checked={lockRatio} onChange={event => setLockRatio(event.target.checked)} />锁定宽高比例</label>{activeIndex % 2 === 0 && <label className="zine-checkbox"><input type="checkbox" checked={!!selected.span} onChange={event => editFrame(selected.id, { span: event.target.checked })} />允许照片跨过书脊</label>}</div>
          <div className="zine-setting-section"><h3>在页面上的位置</h3><div className="zine-field-grid"><NumberField key={`${selected.id}-x`} label="X 位置" value={selected.x} onCommit={x => editFrame(selected.id, { x })} /><NumberField key={`${selected.id}-y`} label="Y 位置" value={selected.y} onCommit={y => editFrame(selected.id, { y })} /><NumberField key={`${selected.id}-r`} label="旋转" value={selected.rotation} unit="°" min={-180} max={180} onCommit={rotation => editFrame(selected.id, { rotation })} /><button className="zine-reset-rotation" onClick={() => editFrame(selected.id, { rotation: 0 })}><RotateCcw size={13} />摆正</button></div></div>
          {assets.get(selected.assetId)?.src && <div className="zine-setting-section"><h3>照片裁切 <button onClick={() => editFrame(selected.id, { zoom: 1, offsetX: 0, offsetY: 0 })}>重置</button></h3>{[['zoom', '放大', 1, 4, 0.05], ['offsetX', '左右', -1, 1, 0.02], ['offsetY', '上下', -1, 1, 0.02]].map(([key, label, min, max, step]) => <label key={key} className="zine-slider"><span>{label}</span><input aria-label={`照片${label}`} type="range" min={min} max={max} step={step} value={selected[key]} onPointerDown={() => remember(projectRef.current)} onChange={event => editPage(activePage.id, page => ({ ...page, frames: page.frames.map(frame => frame.id === selected.id ? { ...frame, [key]: Number(event.target.value) } : frame) }), false)} /><small>{key === 'zoom' ? `${Math.round(selected.zoom * 100)}%` : ''}</small></label>)}</div>}
          <div className="zine-setting-section"><h3>图层</h3><div className="zine-layer-buttons">{[[ArrowUp, '上移一层', 1], [ArrowDown, '下移一层', -1]].map(([Icon, label, direction]) => <button key={label} onClick={() => editPage(activePage.id, page => { const frames = [...page.frames]; const index = frames.findIndex(frame => frame.id === selected.id); const target = clamp(index + direction, 0, frames.length - 1); [frames[index], frames[target]] = [frames[target], frames[index]]; return { ...page, frames }; })}><Icon size={13} />{label}</button>)}</div></div>
          <div className="zine-object-actions"><button onClick={duplicateFrame}><Copy size={14} />复制照片框</button><button onClick={deleteFrame}><Trash2 size={14} />删除</button></div><p className="zine-field-note">拖动照片调整位置，拖拽四角调整大小。方向键微调，Shift 加速。</p>
        </> : <>
          <div className="zine-sidebar-heading"><span>第 {pad(activeIndex + 1)} 页</span><Layers2 size={15} /></div><p className="zine-sidebar-description">每一页，都可以有自己的排法。</p>
          <div className="zine-page-spec"><span>TN 标准本</span><strong>110 <i>×</i> 210 <small>mm</small></strong><p>展开跨页 220 × 210 mm</p></div>
          <div className="zine-setting-section"><h3>纸张颜色</h3><div className="zine-paper-swatches">{PAPER_COLORS.map((color, index) => <button key={color} aria-label={`纸张颜色：${['纯白', '米白', '浅灰', '柠檬黄'][index]}`} aria-pressed={activePage.paper === color} style={{ background: color }} onClick={() => editPage(activePage.id, page => ({ ...page, paper: color }))}>{activePage.paper === color && <Check size={15} />}</button>)}</div></div>
          <div className="zine-setting-section zine-edit-guide"><h3>放照片的两种方式</h3><ol><li><b>拖</b><span>从下方素材栏拖一张照片，放进照片框；放在空白处会新建一个框。</span></li><li><b>点</b><span>先点一个照片框，再点下方的照片，填好后会自动跳到下一个空框。</span></li></ol><button className="zine-button zine-button--outline zine-full-width" onClick={autoFill} disabled={!emptyCount}><Sparkles size={14} />{emptyCount ? `自动填满本跨页 ${emptyCount} 个空框` : '本跨页已全部填好'}</button></div>
          <button className="zine-button zine-button--ghost zine-full-width" onClick={() => addFrame()}><Plus size={14} />添加空照片框</button>
          {project.pages.length > 1 && <button className="zine-delete-page" onClick={() => { const remaining = project.pages.filter(page => page.id !== activePage.id); update(current => ({ ...current, pages: current.pages.filter(page => page.id !== activePage.id) })); selectPage(remaining[Math.max(0, activeIndex - 1)]); setNotice('页面已删除，可以撤销恢复'); }}><Trash2 size={13} />删除此页</button>}
        </>}
      </aside>
    </div>

    <section ref={trayRef} className={`zine-materials${selected && !preview ? ' is-filling' : ''}${selectedAssetId ? ' is-armed' : ''}`} aria-label="待选照片素材" onAnimationEnd={event => event.currentTarget.classList.remove('is-pulsing')}>
      <div className="zine-materials__heading">
        <div className="zine-materials__title">{selected && !preview ? <><span className="zine-fill-badge">P{pad(numbers.get(selected.id))}</span><h2>{selected.assetId ? '点一张照片替换' : '点一张照片填入'}</h2><span className="zine-materials__instruction">{selected.assetId ? '替换后保留照片框的尺寸与位置' : '填好后会自动选中下一个空框'}</span></> : <><h2>照片素材</h2><span className="zine-materials__count">{project.assets.length}</span><span className="zine-materials__instruction">{selectedAssetId ? '现在点击页面上的照片框，或页面空白处' : '拖到页面上；或先点一个照片框，再点这里的照片'}</span></>}</div>
        <div className="zine-materials__actions"><div className="zine-segment" aria-label="素材筛选">{[['all', '全部'], ['unused', `未使用 ${unusedCount}`]].map(([id, label]) => <button key={id} aria-pressed={assetFilter === id} onClick={() => setAssetFilter(id)}>{label}</button>)}</div><button className="zine-button zine-button--outline" onClick={autoFill} disabled={preview || !emptyCount || !project.assets.length} title="用未使用的照片填满当前跨页的空照片框"><Sparkles size={14} />自动填满</button><button className="zine-button zine-button--dark" disabled={uploading} onClick={() => uploadRef.current.click()}>{uploading ? <LoaderCircle size={14} className="zine-spin" /> : <ImagePlus size={14} />}{uploading ? '导入中…' : '上传照片'}</button><input aria-label="上传照片文件" hidden type="file" multiple accept="image/*" ref={uploadRef} onChange={event => upload(event.target.files)} /></div>
      </div>
      <div className="zine-materials__strip">{visibleAssets.map(asset => { const index = project.assets.indexOf(asset); const isCurrent = !preview && selected?.assetId === asset.id; return <button key={asset.id} draggable={!preview} className={`zine-asset${selectedAssetId === asset.id ? ' is-selected' : ''}${used.has(asset.id) ? ' is-used' : ''}${isCurrent ? ' is-current' : ''}`} style={{ '--asset-ratio': asset.width / asset.height }} aria-label={`${asset.name}${used.has(asset.id) ? `，已使用 ${used.get(asset.id)} 次` : '，未使用'}`} title={asset.name} disabled={preview} onDragStart={event => { event.dataTransfer.setData('application/x-across-photo', asset.id); event.dataTransfer.effectAllowed = 'copy'; setDragAssetId(asset.id); setSelectedAssetId(null); }} onDragEnd={() => { setDragAssetId(null); setDragPageId(null); setDragFrameId(null); }} onClick={() => pickAsset(asset)}><span className="zine-asset__image">{asset.src ? <img src={asset.src} alt="" draggable="false" /> : <span className={`zine-asset__gray tone-${asset.tone}`}><span>{pad(index + 1)}</span></span>}{used.has(asset.id) && !isCurrent && <span className="zine-asset__used"><Check size={10} />{used.get(asset.id) > 1 ? used.get(asset.id) : ''}</span>}{isCurrent && <span className="zine-asset__current">当前</span>}{selected && !preview && !isCurrent && <span className="zine-asset__action">{selected.assetId ? '替换' : '填入'}</span>}</span><span className="zine-asset__name">{asset.name}</span></button>; })}{assetFilter === 'unused' && !visibleAssets.length && <p className="zine-materials__empty">照片都已经用上了</p>}<button className="zine-upload-tile" onClick={() => uploadRef.current.click()} aria-label="添加更多照片" disabled={uploading}><Plus size={18} strokeWidth={1.4} /><span>添加</span></button></div>
    </section>
    {notice && <div className="zine-toast" role="status">{notice}<button aria-label="关闭提示" onClick={() => setNotice('')}><X size={12} /></button></div>}
  </main>;
}

export default function JournalEditor() {
  const { tripId } = useParams();
  const catalog = useNotebookCatalog();
  const deleted = catalog.deletedIds.includes(tripId);
  const journey = deleted ? null : findJourney(tripId) ?? catalog.journeys.find(item => item.id === tripId);
  if (!journey && !deleted && catalog.loading) return <div className="zine-loading">正在打开手帐…</div>;
  if (!journey) return <main className="zine-loading"><p>尚未收录这次旅行</p><Link to="/">返回 Across</Link></main>;
  return <JournalWorkspace key={journey.id} journey={journey} />;
}
