import { useRef, useState } from 'react';
import { Download, MoreHorizontal, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotebookDialog from './NotebookDialog';
import { Button, ConfirmButton, FormError, FormFooter, FormHint } from './form/Form';
import { downloadBackup, readBackup } from '../lib/notebook-backup.js';
import { applyEditablePacket, downloadEditablePacket, summarizeEditableChanges } from '../lib/notebook-exchange.js';
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

// 更多 → version history. Every change is a version labelled with its time and whether a
// person, an AI file or a backup made it. Choosing a version shows it; choosing the latest
// again switches back. AI files and backups apply directly as new versions.
export default function NotebookOptions({ notebook }) {
  const [open, setOpen] = useState(false), [working, setWorking] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const input = useRef(null), dataInput = useRef(null);
  const navigate = useNavigate();
  const { record, busy } = notebook;
  async function action(operation) {
    setWorking(true); setError(''); setMessage('');
    try { const done = await operation(); if (done) setMessage(done); } catch (error) { setError(error.message); } finally { setWorking(false); }
  }
  const versions = record ? listVersions(record) : [];
  const viewing = versions.find(version => version.isViewing), latest = versions[0];
  const disabled = busy || working;
  return <>
    <button className="journey-tool-button notebook-more-button" type="button" aria-label="更多" title="更多" aria-haspopup="dialog" aria-expanded={open} disabled={!record} onClick={() => setOpen(true)}><MoreHorizontal /></button>
    {open && <NotebookDialog className="reservation-modal notebook-versions-dialog" title="版本记录" busy={working} onClose={() => { setOpen(false); setError(''); setMessage(''); }}>
      <div className="journey-modal__body">
        {viewing && !viewing.isLatest && <div className="notebook-version-notice">
          <span>正在查看{versionName(viewing)}。继续编辑会从这里开始，最新版本仍会保留。</span>
          <Button disabled={disabled} onClick={() => action(async () => { await notebook.switchVersion(latest.id); return '已回到最新版本'; })}>回到最新</Button>
        </div>}
        <ol className="notebook-versions" aria-label="版本">
          {versions.map(version => <li key={version.id}>
            <button type="button" className={`notebook-version${version.isViewing ? ' is-viewing' : ''}`} aria-current={version.isViewing ? 'true' : undefined} disabled={disabled || version.isViewing}
              onClick={() => action(async () => { await notebook.switchVersion(version.id); return version.isLatest ? '已回到最新版本' : ''; })}>
              <time dateTime={version.at ?? undefined}>{versionTime(version.at)}</time>
              <span className="notebook-version__label">{version.label}</span>
              <span className={`notebook-version__source is-${version.source}`}>{SOURCE_LABELS[version.source] ?? '手动'}</span>
              {version.isLatest && <span className="notebook-version__mark">最新</span>}
            </button>
          </li>)}
        </ol>
        <div className="notebook-transfer" aria-label="导入与导出">
          <Button variant="text" disabled={disabled} onClick={() => action(async () => { await downloadEditablePacket(record); return '行程 JSON 已导出，可交给自己的 AI 修改'; })}><Download />导出给 AI 修改</Button>
          <Button variant="text" disabled={disabled} onClick={() => dataInput.current.click()}><Upload />应用 AI 修改</Button>
          <Button variant="text" disabled={disabled} onClick={() => action(async () => { await downloadBackup(record.document); return '备份已下载，包含行程、清单、照片和预订附件'; })}><Download />下载备份</Button>
          <Button variant="text" disabled={disabled} onClick={() => input.current.click()}><Upload />从备份恢复</Button>
        </div>
        <p className="form-message">内容保存在当前浏览器，保留最近 20 个版本。跨设备同步尚未开通，清除网站数据前请下载备份。</p>
        <input ref={dataInput} className="sr-only" type="file" accept=".json,application/json" aria-label="选择 AI 修改的行程" onChange={e => { const file = e.target.files[0]; e.target.value = ''; if (file) action(async () => {
          if (file.size > 5 * 1024 * 1024) throw new Error('行程 JSON 超过 5 MB。');
          const packet = JSON.parse(await file.text()), current = notebook.current.current;
          const document = applyEditablePacket(current.document, packet, current.localRevision), changes = summarizeEditableChanges(current.document, document);
          await notebook.commit(() => document, '应用 AI 修改', [], { source: 'ai' });
          return `已应用 AI 修改：${changes.length} 处变更。需要时可切换回之前的版本。`;
        }); }} />
        <input className="sr-only" type="file" accept=".across,application/json" ref={input} aria-label="选择备份" onChange={e => { const file = e.target.files[0]; e.target.value = ''; if (file) action(async () => {
          const backup = await readBackup(file, record.id);
          await notebook.commit(() => backup.document, '从备份恢复', backup.files, { source: 'backup' });
          return '已从备份恢复。需要时可切换回之前的版本。';
        }); }} />
        <FormHint status>{working ? '正在处理…' : message}</FormHint>
        <FormError>{error}</FormError>
      </div>
      <FormFooter>
        <ConfirmButton confirmLabel="确认删除整趟行程" disabled={disabled} onConfirm={() => action(async () => { await notebook.remove(notebook.current.current.localRevision); navigate('/?log=trip', { replace: true }); })}>删除行程</ConfirmButton>
      </FormFooter>
    </NotebookDialog>}
  </>;
}
