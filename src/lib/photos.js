export const MAX_PHOTO_BYTES = 25 * 1024 * 1024;
export async function preparePhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', ''].includes(file.type)) throw new Error(`「${file.name}」不支持，请选择 JPEG、PNG 或 WebP 图片。`);
  if (file.size > MAX_PHOTO_BYTES) throw new Error(`「${file.name}」超过 25 MB，请缩小后重试。`);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode().catch(() => { throw new Error(`「${file.name}」无法读取，请转换成 JPEG 后重试。`); });
    const scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('当前浏览器无法处理照片。');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .86));
    if (!blob) throw new Error('照片处理失败，请重试。');
    // Canvas export drops original EXIF/location metadata; originals stay on the device.
    return { id: crypto.randomUUID(), blob, name: file.name, type: blob.type, width: canvas.width, height: canvas.height, size: blob.size };
  } finally { URL.revokeObjectURL(url); }
}
