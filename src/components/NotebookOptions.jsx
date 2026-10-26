import { useRef, useState } from 'react';
import { Download, MoreHorizontal, Trash2, Undo2, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotebookDialog from './NotebookDialog';
import { Button, FormError, FormFooter, FormHint } from './form/Form';
import { downloadBackup, readBackup } from '../lib/notebook-backup.js';
import { applyEditablePacket, downloadEditablePacket, summarizeEditableChanges } from '../lib/notebook-exchange.js';

export default function NotebookOptions({ notebook }) {
  const [open, setOpen] = useState(false), [working, setWorking] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(''), [restore, setRestore] = useState(null);
  const input = useRef(null), dataInput = useRef(null);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();
  const { record, busy } = notebook;
  async function action(operation, success = '') {
    setWorking(true); setError(''); setMessage('');
    try { await operation(); setMessage(success); } catch (error) { setError(error.message); } finally { setWorking(false); }
  }
  return <>
    <button className="journey-tool-button notebook-more-button" type="button" aria-label="更多" title="更多" aria-haspopup="dialog" aria-expanded={open} disabled={!record} onClick={() => setOpen(true)}><MoreHorizontal /></button>
    {open && <NotebookDialog className="reservation-modal" title={deleting ? '删除行程？' : restore ? restore.isData ? '确认行程修改' : '恢复备份' : '更多'} eyebrow="Notebook" busy={working} onClose={() => { setOpen(false); setRestore(null); setDeleting(null); }}>
      <div className="journey-modal__body">
        {deleting ? <div className="reservation-state"><strong>{deleting.title}</strong><p>将删除整趟行程、照片和预订附件，无法撤销。</p></div> : restore ? <div className="reservation-state"><strong>{restore.document.title}</strong>{restore.isData ? <><p>{restore.changes.length} 处修改，当前版本会保留在撤销记录中。</p><ul className="notebook-upload-files">{restore.changes.map((change, index) => <li key={index}>{change.action} · {change.title}</li>)}</ul></> : <p>{restore.document.days.length} 天行程 · {restore.document.days.reduce((sum, day) => sum + day.photos.length, 0)} 张照片 · {restore.files.length} 个文件。当前内容会保留在撤销记录中。</p>}</div> : <>
          <p className="notebook-editor__hint">{record.updatedAt ? '修改已保存在当前浏览器。' : '可以直接修改这本旅行本，内容保存在当前浏览器。'}<br />跨设备同步尚未开通。清除网站数据前，请下载备份。</p>
          <div className="journey-modal__list">
            <button className="info-card notebook-option" type="button" disabled={busy || working || !record.history.length} onClick={() => action(notebook.undo, '已撤销上次修改')}><Undo2 size={17} /><span><strong>撤销上次修改</strong><small>{record.history.at(-1)?.label ?? '暂无可撤销的修改'}</small></span></button>
            <button className="info-card notebook-option" type="button" disabled={busy || working} onClick={() => action(() => downloadBackup(record.document), '备份已下载，包含当前行程和照片')}><Download size={17} /><span><strong>下载备份</strong><small>包含行程、清单、照片和预订附件</small></span></button>
            <button className="info-card notebook-option" type="button" disabled={busy || working} onClick={() => input.current.click()}><Upload size={17} /><span><strong>从备份恢复</strong><small>选择之前下载的 Across 备份</small></span></button>
            <button className="info-card notebook-option" type="button" disabled={busy || working} onClick={() => action(() => downloadEditablePacket(record), '行程 JSON 已导出，可交给自己的 AI 修改')}><Download size={17} /><span><strong>导出给 AI 修改</strong><small>可编辑的行程 JSON，保留版本和编号</small></span></button>
            <button className="info-card notebook-option" type="button" disabled={busy || working} onClick={() => dataInput.current.click()}><Upload size={17} /><span><strong>应用 AI 修改</strong><small>先检查变更，再应用到旅行本</small></span></button>
            <button className="info-card notebook-option" type="button" disabled={busy || working} onClick={() => { setError(''); setMessage(''); setDeleting({ title: record.document.title, revision: record.localRevision }); }}><Trash2 size={17} /><span><strong>删除行程</strong></span></button>
          </div>
          <input ref={dataInput} className="sr-only" type="file" accept=".json,application/json" aria-label="选择 AI 修改的行程" onChange={e => { const file = e.target.files[0]; e.target.value = ''; if (file) action(async () => { if (file.size > 5 * 1024 * 1024) throw new Error('行程 JSON 超过 5 MB。'); const packet = JSON.parse(await file.text()); const current = notebook.current.current; const document = applyEditablePacket(current.document, packet, current.localRevision); setRestore({ document, files: [], revision: packet.baseRevision, isData: true, changes: summarizeEditableChanges(current.document, document) }); }); }} />
          <input className="sr-only" type="file" accept=".across,application/json" ref={input} aria-label="选择备份" onChange={e => { const file = e.target.files[0]; e.target.value = ''; if (file) action(async () => { const backup = await readBackup(file, record.id); setRestore({ ...backup, revision: notebook.current.current.localRevision }); }); }} />
        </>}
        <FormHint status>{working ? '正在处理…' : message}</FormHint>
        <FormError>{error}</FormError>
      </div>
      {deleting && <FormFooter><Button disabled={working} onClick={() => { setDeleting(null); setError(''); }}>取消</Button><Button variant="primary" disabled={busy || working} onClick={() => action(async () => { await notebook.remove(deleting.revision); navigate('/?log=trip', { replace: true }); })}>确认删除</Button></FormFooter>}
      {restore && <FormFooter><Button disabled={working} onClick={() => setRestore(null)}>取消</Button><Button variant="primary" disabled={busy || working} onClick={() => action(async () => {
        if (notebook.current.current.localRevision !== restore.revision) throw new Error('旅行本已变化，请重新打开备份后恢复。');
        await notebook.commit(() => restore.document, restore.isData ? '应用 AI 修改' : '从备份恢复', restore.files); setRestore(null);
      }, restore.isData ? '已应用行程修改' : '已从备份恢复')}>{restore.isData ? '确认应用' : '确认恢复'}</Button></FormFooter>}
    </NotebookDialog>}
  </>;
}
