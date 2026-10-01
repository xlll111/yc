// src/constants/fileIcons.js

/** 取小写扩展名 */
export const getExt = (filename) => {
  if (!filename) return ''
  const idx = filename.lastIndexOf('.')
  return idx > -1 ? filename.slice(idx + 1).toLowerCase() : ''
}

/** 默认图标 */
export const DEFAULT_ICON = {
  cls: 'icon-file',
  paths: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5'],
}

/** 扩展名 -> { cls, paths } */
export const FILE_ICON_MAP = {
  // 文档
  doc: {
    cls: 'icon-word',
    paths: [
      'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
      'M14 3v5h5',
      'M9 13h6M9 17h6',
    ],
  },
  docx: {
    cls: 'icon-word',
    paths: [
      'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
      'M14 3v5h5',
      'M9 13h6M9 17h6',
    ],
  },
  // 表格
  xls: {
    cls: 'icon-excel',
    paths: [
      'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
      'M14 3v5h5',
      'M9 12h6M9 12v6M12 12v6M15 12v6',
    ],
  },
  xlsx: {
    cls: 'icon-excel',
    paths: [
      'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
      'M14 3v5h5',
      'M9 12h6M9 12v6M12 12v6M15 12v6',
    ],
  },
  csv: {
    cls: 'icon-excel',
    paths: [
      'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
      'M14 3v5h5',
      'M9 12h6M9 12v6M12 12v6M15 12v6',
    ],
  },
  // 演示
  ppt: {
    cls: 'icon-ppt',
    paths: [
      'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
      'M14 3v5h5',
      'M9 17v-6h2.5a1.5 1.5 0 0 1 0 3H9',
    ],
  },
  pptx: {
    cls: 'icon-ppt',
    paths: [
      'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
      'M14 3v5h5',
      'M9 17v-6h2.5a1.5 1.5 0 0 1 0 3H9',
    ],
  },
  // PDF
  pdf: {
    cls: 'icon-pdf',
    paths: [
      'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z',
      'M14 3v5h5',
      'M8 17v-6h2a1.5 1.5 0 0 1 0 3H8M13 17v-6h1.5a3 3 0 0 1 0 6H13',
    ],
  },
  // 图片
  jpg: {
    cls: 'icon-image',
    paths: [
      'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      'M8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
      'm21 15-5-5L5 21',
    ],
  },
  jpeg: {
    cls: 'icon-image',
    paths: [
      'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      'M8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
      'm21 15-5-5L5 21',
    ],
  },
  png: {
    cls: 'icon-image',
    paths: [
      'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      'M8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
      'm21 15-5-5L5 21',
    ],
  },
  gif: {
    cls: 'icon-image',
    paths: [
      'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      'M8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
      'm21 15-5-5L5 21',
    ],
  },
  // 压缩包
  zip: {
    cls: 'icon-zip',
    paths: [
      'M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      'M12 9v2M12 13v2',
    ],
  },
  rar: {
    cls: 'icon-zip',
    paths: [
      'M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      'M12 9v2M12 13v2',
    ],
  },
  '7z': {
    cls: 'icon-zip',
    paths: [
      'M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
      'M12 9v2M12 13v2',
    ],
  },
  // 音视频
  mp4: {
    cls: 'icon-video',
    paths: [
      'm10 8 6 4-6 4z',
      'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    ],
  },
  mov: {
    cls: 'icon-video',
    paths: [
      'm10 8 6 4-6 4z',
      'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    ],
  },
  mp3: {
    cls: 'icon-audio',
    paths: [
      'M9 18V5l10-2v13',
      'M6 18a3 3 0 1 0 6 0 3 3 0 0 0-6 0z',
      'M16 16a3 3 0 1 0 6 0 3 3 0 0 0-6 0z',
    ],
  },
  wav: {
    cls: 'icon-audio',
    paths: [
      'M9 18V5l10-2v13',
      'M6 18a3 3 0 1 0 6 0 3 3 0 0 0-6 0z',
      'M16 16a3 3 0 1 0 6 0 3 3 0 0 0-6 0z',
    ],
  },
  // 代码
  js: { cls: 'icon-code', paths: ['m8 6-5 6 5 6', 'm16 6 5 6-5 6'] },
  ts: { cls: 'icon-code', paths: ['m8 6-5 6 5 6', 'm16 6 5 6-5 6'] },
  vue: { cls: 'icon-code', paths: ['m8 6-5 6 5 6', 'm16 6 5 6-5 6'] },
  py: { cls: 'icon-code', paths: ['m8 6-5 6 5 6', 'm16 6 5 6-5 6'] },
  json: { cls: 'icon-code', paths: ['m8 6-5 6 5 6', 'm16 6 5 6-5 6'] },
}

/** 根据文件名取图标配置 */
export const getFileIcon = (filename) => {
  const ext = getExt(filename)
  return FILE_ICON_MAP[ext] || DEFAULT_ICON
}
