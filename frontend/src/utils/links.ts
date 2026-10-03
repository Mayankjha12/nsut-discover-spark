/** Turn Google Drive share links into direct PDF preview URLs so notices open straight to the document. */
export function directUrl(url: string) {
  const m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  return url;
}
