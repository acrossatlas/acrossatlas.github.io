import { useState } from 'react';
import { ChevronDown, History, MoreHorizontal, Trash2, Undo2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotebookDialog from './NotebookDialog';
import { Button, FormError, FormHint } from './form/Form';
import { listVersions } from '../lib/notebook-versions.js';

const SOURCE_LABELS = { human: '手动', ai: 'AI', backup: '备份', seed: '初始' };
const pad = number => String(number).padStart(2, '0');
export function versionTime(at) {
  if (!at) return '—';
  const date = new Date(at);
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
/** How a version is named in sentences: its time, or its label when it has none (the initial version). */
export function versionName(version) { return version.at ? ` ${versionTime(version.at)} 的版本` : `「${version.label}」`; }

// 更多: undo, version history and deleting the trip.
// 版本记录 expands to every saved version with its time and source. Choosing a version
// switches the trip to it; choosing the latest again switches back. Nothing is downloaded.
export default function NotebookOptions({ notebook }) {
  const [open, setOpen] = useState(false), [expanded, setExpanded] = useState(false), [armed, setArmed] = useState(false);
  const [working, setWorking] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { record, busy } = notebook;
  async function action(operation) {
    setWorking(true); setError(''); setMessage('');
    try { const done = await operation(); if (done) setMessage(done); } catch (error) { setError(error.message); } finally { setWorking(false); }
  }
  const versions = record ? listVersions(record) : [];
  const viewingIndex = versions.findIndex(version => version.isViewing), viewing = versions[viewingIndex], latest = versions[0];
  const previous = versions[viewingIndex + 1];
  const disabled = busy || working;
  const show = (version, done) => action(async () => { await notebook.switchVersion(version.id); return done; });
  function openDialog() { setOpen(true); setExpanded(Boolean(record?.checkout)); setArmed(false); setError(''); setMessage(''); }
  return <>
    <button className="journey-tool-button notebook-more-button" type="button" aria-label="更多" title="更多" aria-haspopup="dialog" aria-expanded={open} disabled={!record} onClick={openDialog}><MoreHorizontal /></button>
    {open && <NotebookDialog className="reservation-modal" title="更多" busy={working} onClose={() => setOpen(false)}>
      <div className="journey-modal__body">
        <p className="form-message notebook-options__hint">内容保存在当前浏览器，保留最近 20 个版本，点击版本即可切换。跨设备同步尚未开通，清除网站数据会删除这些内容。</p>
        <div className="journey-modal__list">
          <button className="info-card notebook-option" type="button" disabled={disabled || !previous}
            onClick={() => show(previous, `已撤销，正在查看${versionName(previous)}`)}>
            <Undo2 /><span><strong>撤销上次修改</strong><small>{previous ? viewing.label : '暂无可撤销的修改'}</small></span>
          </button>

          <section className={`info-card notebook-history${expanded ? ' is-expanded' : ''}`}>
            <button className="notebook-option notebook-history__toggle" type="button" aria-expanded={expanded} aria-controls="notebook-history-panel" onClick={() => setExpanded(value => !value)}>
              <History /><span><strong>版本记录</strong><small>{viewing && !viewing.isLatest ? `正在查看${versionName(viewing)}` : `最新：${versionTime(latest?.at)} · ${SOURCE_LABELS[latest?.source] ?? '手动'}`}</small></span>
              <ChevronDown className="notebook-history__chevron" />
            </button>
            {expanded && <div className="notebook-history__panel" id="notebook-history-panel">
              {viewing && !viewing.isLatest && <div className="notebook-version-notice">
                <span>正在查看{versionName(viewing)}。继续编辑会从这里开始，最新版本仍会保留。</span>
                <Button disabled={disabled} onClick={() => show(latest, '已回到最新版本')}>回到最新</Button>
              </div>}
              <ol className="notebook-versions" aria-label="版本">
                {versions.map(version => <li key={version.id}>
                  <button type="button" className={`notebook-version${version.isViewing ? ' is-viewing' : ''}`} aria-current={version.isViewing ? 'true' : undefined} disabled={disabled || version.isViewing}
                    onClick={() => show(version, version.isLatest ? '已回到最新版本' : '')}>
                    <time dateTime={version.at ?? undefined}>{versionTime(version.at)}</time>
                    <span className="notebook-version__label">{version.label}</span>
                    <span className={`notebook-version__source is-${version.source}`}>{SOURCE_LABELS[version.source] ?? '手动'}</span>
                    {version.isLatest && <span className="notebook-version__mark">最新</span>}
                  </button>
                </li>)}
              </ol>
            </div>}
          </section>

          <button className={`info-card notebook-option${armed ? ' is-armed' : ''}`} type="button" disabled={disabled} onBlur={() => setArmed(false)}
            onClick={() => { if (!armed) { setArmed(true); return; } action(async () => { await notebook.remove(notebook.current.current.localRevision); navigate('/?log=trip', { replace: true }); }); }}>
            <Trash2 /><span><strong>{armed ? '确认删除整趟行程' : '删除行程'}</strong><small>{armed ? '行程、照片和预订附件都会删除，无法恢复。再点一次删除。' : record?.document.title}</small></span>
          </button>
        </div>
        <FormHint status>{working ? '正在处理…' : message}</FormHint>
        <FormError>{error}</FormError>
      </div>
    </NotebookDialog>}
  </>;
}
