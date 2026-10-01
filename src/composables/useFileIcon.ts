// 文件类型 -> kind / 颜色 映射，视图层（FileIcon.vue）只管渲染

export type FileKind =
  | 'folder'
  | 'word'
  | 'excel'
  | 'ppt'
  | 'pdf'
  | 'image'
  | 'archive'
  | 'video'
  | 'audio'
  | 'code'
  | 'file'

// 颜色沿用现有云盘镜像页
export const FILE_TYPE_COLORS: Record<FileKind, string> = {
  folder: '#1e40af',
  word: '#2b579a',
  excel: '#217346',
  ppt: '#d24726',
  pdf: '#e5252a',
  image: '#7c3aed',
  archive: '#b45309',
  video: '#0891b2',
  audio: '#db2777',
  code: '#0f766e',
  file: '#9ca3af',
}

// 文档类在 SVG 内以文字标识
export const FILE_TEXT_BADGE: Partial<Record<FileKind, string>> = {
  word: 'DOC',
  excel: 'XLS',
  ppt: 'PPT',
  pdf: 'PDF',
}

const EXT_MAP: Array<[FileKind, string[]]> = [
  ['word', ['doc', 'docx', 'dot', 'docm', 'odt']],
  ['excel', ['xls', 'xlsx', 'xlsm', 'csv', 'ods']],
  ['ppt', ['ppt', 'pptx', 'pps', 'odp']],
  ['pdf', ['pdf']],
  ['image', ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'heic']],
  ['archive', ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso']],
  ['video', ['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm']],
  ['audio', ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma']],
  [
    'code',
    [
      'js',
      'ts',
      'jsx',
      'tsx',
      'vue',
      'py',
      'java',
      'c',
      'cpp',
      'h',
      'cs',
      'go',
      'rs',
      'php',
      'rb',
      'html',
      'css',
      'scss',
      'json',
      'sh',
      'yml',
      'yaml',
      'xml',
      'sql',
    ],
  ],
]

export function getFileKind(name: string, isFolder = false): FileKind {
  if (isFolder) return 'folder'
  const ext = (name.split('.').pop() || '').toLowerCase()
  for (const [kind, exts] of EXT_MAP) if (exts.includes(ext)) return kind
  return 'file'
}

export function getFileColor(kind: FileKind): string {
  return FILE_TYPE_COLORS[kind] || FILE_TYPE_COLORS.file
}

export function useFileIcon() {
  return { getFileKind, getFileColor, FILE_TYPE_COLORS, FILE_TEXT_BADGE }
}
