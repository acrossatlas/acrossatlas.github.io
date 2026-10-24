import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';
import NotebookDialog, { EditorField, EditorFooter } from './NotebookDialog';
import { preparePhoto } from '../lib/photos.js';
import { readPhoto } from '../lib/notebook-store.js';

function AlbumPhoto({ bookId, photo, onOpen }) {
  const [src, setSrc] = useState(''), [error, setError] = useState('');
  useEffect(() => {
    let live = true, url;
    readPhoto(bookId, photo.id).then(blob => {
      if (!blob) throw new Error('照片未能读取，请从备份恢复。');
      if (live) { url = URL.createObjectURL(blob); setSrc(url); }
    }).catch(error => { if (live) setError(error.message); });
    return () => { live = false; if (url) URL.revokeObjectURL(url); };
  }, [bookId, photo.id]);
  return <button className="notebook-album__photo" type="button" onClick={() => src && onOpen({ photo, src })} aria-label={`查看照片 ${photo.name}`}>
    {src ? <img src={src} alt={photo.name} loading="lazy" /> : <span>{error || '正在加载照片'}</span>}
  </button>;
}

export default function NotebookAlbum({ book, activeDate, busy, onCommit }) {
  const [upload, setUpload] = useState(false), [date, setDate] = useState(activeDate), [files, setFiles] = useState([]);
  const [working, setWorking] = useState(false), [error, setError] = useState(''), [opened, setOpened] = useState(null), [deleting, setDeleting] = useState(false);
  const input = useRef(null);
  const photoDays = book.days.filter(day => day.photos.length);
  async function addPhotos(e) {
    e.preventDefault(); setWorking(true); setError('');
    try {
      if (!book.days.some(day => day.id === date)) throw new Error('请选择这趟旅行内的日期。');
      if (!files.length) throw new Error('请先选择照片。');
      if (files.length > 20) throw new Error('每次最多添加 20 张照片。');
      const prepared = [];
      for (const file of files) prepared.push(await preparePhoto(file));
      await onCommit(book => {
        const next = structuredClone(book);
        next.days.find(day => day.id === date).photos.push(...prepared.map(({ blob, ...photo }) => photo));
        return next;
      }, `添加 ${prepared.length} 张照片`, prepared);
      setUpload(false); setFiles([]);
    } catch (error) { setError(error.message); } finally { setWorking(false); }
  }
  async function removePhoto() {
    setWorking(true); setError('');
    try {
      await onCommit(book => {
        const next = structuredClone(book);
        next.days.forEach(day => { day.photos = day.photos.filter(photo => photo.id !== opened.photo.id); });
        return next;
      }, '删除照片');
      setOpened(null); setDeleting(false);
    } catch (error) { setError(error.message); } finally { setWorking(false); }
  }
  function openUpload() { setDate(activeDate); setFiles([]); setError(''); setUpload(true); }
  return <section className="notebook-section" aria-labelledby="album-title">
    <header className="notebook-section__heading notebook-section__heading--actions"><h2 id="album-title">Album</h2>
      {<button className="journey-tool-button" type="button" disabled={busy || working} onClick={openUpload}><Plus size={16} /><span>添加照片</span></button>}
    </header>
    {!photoDays.length ? <div className="album-empty"><span className="album-empty__icon"><ImagePlus /></span><div><h3>尚未添加照片</h3><p>添加照片，按旅行日期保存在这里。</p></div></div>
      : <div className="notebook-album">{photoDays.map(day => <section key={day.id} className="notebook-album__day" aria-label={`${day.date} 的照片`}><h3 className="info-card__date">{day.date.replaceAll('-', '.')}<span>{day.photos.length} 张</span></h3><div className="notebook-album__grid">{day.photos.map(photo => <AlbumPhoto key={photo.id} bookId={book.id} photo={photo} onOpen={value => { setOpened(value); setDeleting(false); setError(''); }} />)}</div></section>)}</div>}
    {upload && <NotebookDialog className="reservation-modal" title="添加照片" eyebrow="Album" busy={working} onClose={() => setUpload(false)}>
      <form className="notebook-editor__form" onSubmit={addPhotos}>
        <div className="journey-modal__body">
          <EditorField label="日期"><input type="date" value={date} min={book.days[0].date} max={book.days.at(-1).date} disabled={working} onChange={e => setDate(e.target.value)} /></EditorField>
          <button className="album-empty notebook-upload-picker" type="button" disabled={working} onClick={() => input.current.click()}><span className="album-empty__icon"><ImagePlus /></span><span><strong>{files.length ? `已选择 ${files.length} 张照片` : '选择照片'}</strong><small>JPEG、PNG、WebP · 每次最多 20 张</small></span></button>
          <input className="sr-only" ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple aria-label="选择照片" disabled={working} onChange={e => { setFiles([...e.target.files]); setError(''); }} />
          {files.length > 0 && <ul className="notebook-upload-files">{files.map((file, index) => <li key={index}>{file.name}</li>)}</ul>}
          <p className="notebook-editor__hint">保存适合网页查看的照片副本，原片仍保留在你的设备里。</p>
          {error && <p className="notebook-editor__error" role="alert">{error}</p>}
        </div>
        <EditorFooter><button className="journey-tool-button" type="button" disabled={working} onClick={() => setUpload(false)}>取消</button><button className="journey-tool-button is-primary" type="submit" disabled={working || !files.length}>{working ? '正在添加' : '添加照片'}</button></EditorFooter>
      </form>
    </NotebookDialog>}
    {opened && <NotebookDialog title={deleting ? '删除照片？' : '照片'} eyebrow={opened.photo.name} className="notebook-photo-viewer" busy={working} onClose={() => setOpened(null)}>
      <div className="journey-modal__body"><img className="notebook-album__full" src={opened.src} alt={opened.photo.name} />{deleting && <p className="notebook-editor__hint">删除后可在编辑菜单中撤销恢复。</p>}{error && <p className="notebook-editor__error" role="alert">{error}</p>}</div>
      {<EditorFooter>{deleting ? <><button type="button" className="journey-tool-button" disabled={working} onClick={() => setDeleting(false)}>保留照片</button><button type="button" className="journey-tool-button is-primary" disabled={working} onClick={removePhoto}>确认删除照片</button></> : <button className="notebook-text-action" type="button" disabled={working} onClick={() => setDeleting(true)}><Trash2 size={13} />删除照片</button>}</EditorFooter>}
    </NotebookDialog>}
  </section>;
}
