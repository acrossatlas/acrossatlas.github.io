import { ATTACHMENT_TYPES } from './notebook.js';

export function prepareAttachment(file) {
  const types = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const type = file.type || types[file.name.split('.').at(-1).toLowerCase()];
  if (!ATTACHMENT_TYPES.includes(type)) throw new Error('预订附件支持 PDF、JPEG、PNG 和 WebP。');
  if (!file.size) throw new Error('附件为空，请重新选择文件。');
  if (file.size > 20 * 1024 * 1024) throw new Error(`「${file.name}」超过 20 MB，请缩小后重试。`);
  return { id: crypto.randomUUID(), name: file.name, type, size: file.size, blob: file.slice(0, file.size, type) };
}
