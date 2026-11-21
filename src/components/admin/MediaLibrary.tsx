'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  PhotoIcon,
  DocumentIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  PlusIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  TagIcon,
  AdjustmentsHorizontalIcon,
  CheckIcon,
  StarIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/Button';
import ImageResizeButton from './ImageResizeButton';

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
  folder?: string;
  alt?: string;
  description?: string;
  tags?: string[];
  starred?: boolean;
}

interface MediaFolder {
  id: string;
  name: string;
  parentId?: string;
  fileCount: number;
  createdAt: string;
}

interface BulkUploadProgress {
  total: number;
  completed: number;
  current?: string;
  errors: string[];
}

const MediaLibrary: React.FC = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'documents' | 'videos'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [bulkUploadProgress, setBulkUploadProgress] = useState<BulkUploadProgress | null>(null);
  const [tagFilter, setTagFilter] = useState('');
  const [starredOnly, setStarredOnly] = useState(false);
  // Result of the last action, from the server (W1c/W22: errors used to be swallowed)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [totalInFolder, setTotalInFolder] = useState<number | null>(null);
  const [moveTarget, setMoveTarget] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoize filtered files to avoid recalculation on every render
  const filteredFiles = useMemo(() => {
    // Safety check: ensure files is an array
    if (!Array.isArray(files)) {
      return [];
    }
    
    return files.filter(file => {
      const matchesSearch = file.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           file.alt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           file.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = filterType === 'all' || 
                         (filterType === 'images' && file.mimeType.startsWith('image/')) ||
                         (filterType === 'documents' && (file.mimeType.includes('pdf') || file.mimeType.includes('document'))) ||
                         (filterType === 'videos' && file.mimeType.startsWith('video/'));

      const matchesTag = !tagFilter || file.tags?.some(tag => 
        tag.toLowerCase().includes(tagFilter.toLowerCase())
      );

      const matchesStarred = !starredOnly || file.starred;

      return matchesSearch && matchesType && matchesTag && matchesStarred;
    }).sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.originalName.localeCompare(b.originalName);
          break;
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [files, searchQuery, filterType, tagFilter, starredOnly, sortBy, sortOrder]);

  useEffect(() => {
    fetchMediaFiles();
    fetchFolders();
  }, [currentFolder, sortBy, sortOrder]);

  useEffect(() => {
    setShowBulkActions(selectedFiles.size > 0);
  }, [selectedFiles]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'Delete':
          if (selectedFiles.size > 0) {
            handleDeleteFiles();
          }
          break;
        case 'Escape':
          setSelectedFiles(new Set());
          setSearchQuery('');
          setTagFilter('');
          setShowUploadModal(false);
          setShowPreview(false);
          setShowCreateFolder(false);
          break;
        case 'a':
        case 'A':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const allFileIds = filteredFiles.map(f => f.id);
            setSelectedFiles(new Set(allFileIds));
          }
          break;
        case 'u':
        case 'U':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowUploadModal(true);
          }
          break;
        case 'g':
        case 'G':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setViewMode(viewMode === 'grid' ? 'list' : 'grid');
          }
          break;
        case 'f':
        case 'F':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedFiles, filteredFiles, viewMode]);

  const fetchMediaFiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      // W1c: show the files in the current folder; the top level shows files not in a folder.
      params.append('folder', currentFolder ?? 'root');
      params.append('limit', '1000');
      
      // Add cache-busting parameter to ensure fresh data
      params.append('_t', Date.now().toString());
      
      const response = await fetch(`/api/admin/media?${params}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMessage({ ok: false, text: `Could not load media: ${data.error || `HTTP ${response.status}`}` });
      }
      if (response.ok) {
        const data = await response.json();
        setTotalInFolder(typeof data.total === 'number' ? data.total : null);
        // Extract the media array from the API response and map fields
        const mediaFiles = Array.isArray(data.media) ? data.media.map((file: any) => {
          // Ensure file_path is a proper URL path (starts with /)
          let fileUrl = file.file_path || '';
          if (fileUrl && !fileUrl.startsWith('/') && !fileUrl.startsWith('http')) {
            fileUrl = '/' + fileUrl;
          }
          
          // W43: uploads are served at /uploads/... (verified on live: 200). These used to be
          // rewritten to /api/uploads/..., a route that does not exist (404 on live), so every
          // uploaded image was broken in the library.
          const thumbnailUrl = fileUrl;
          
          return {
            id: file.id,
            filename: file.filename,
            originalName: file.original_name || file.filename,
            mimeType: file.mime_type,
            size: file.file_size,
            url: fileUrl,
            thumbnailUrl: thumbnailUrl,
            uploadedAt: file.created_at,
            uploadedBy: file.uploaded_by,
            folder: file.folder,
            alt: file.alt_text,
            description: file.description,
            tags: file.tags || [],
            starred: file.starred || false
          };
        }) : [];
        setFiles(mediaFiles);
      }
    } catch (error) {
      console.error('Failed to fetch media files:', error);
      // Set empty array on error to prevent filter issues
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/admin/media/folders');
      const data = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(data)) {
        setMessage({ ok: false, text: `Could not load folders: ${data?.error || `HTTP ${response.status}`}` });
        return;
      }
      setFolders(data.map((f: MediaFolder & { id: string | number; parentId?: string | number | null }) => ({
        ...f, id: String(f.id), parentId: f.parentId == null ? undefined : String(f.parentId),
      })));
    } catch (error) {
      setMessage({ ok: false, text: `Could not load folders: ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  /** "Top level / Parent / Child" for a folder id, for breadcrumbs and the move picker. */
  const folderPath = (id: string | null | undefined): MediaFolder[] => {
    const chain: MediaFolder[] = [];
    let f = folders.find((x) => x.id === id);
    while (f && chain.length < 20) { chain.unshift(f); f = folders.find((x) => x.id === f!.parentId); }
    return chain;
  };

  /** Read a JSON error/result body without throwing. */
  const body = async (res: Response) => res.json().catch(() => ({} as Record<string, any>));

  const handleBulkFileUpload = async (uploadedFiles: FileList) => {
    const fileArray = Array.from(uploadedFiles);
    setBulkUploadProgress({ total: fileArray.length, completed: 0, errors: [] });

    const formData = new FormData();
    fileArray.forEach(file => formData.append('files', file));
    if (currentFolder) formData.append('folder', currentFolder);

    try {
      const response = await fetch('/api/admin/media/bulk-upload', { method: 'POST', body: formData });
      const result = await body(response);
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
      setBulkUploadProgress(prev => prev ? { ...prev, completed: result.successful ?? 0, errors: result.errors || [] } : null);
      await fetchMediaFiles();
      await fetchFolders();
      setShowUploadModal(false);
      setTimeout(() => setBulkUploadProgress(null), 5000);
    } catch (error) {
      setBulkUploadProgress(prev => prev ? {
        ...prev,
        errors: [...prev.errors, `Upload failed: ${error instanceof Error ? error.message : String(error)}`]
      } : null);
    }
  };

  // W22: deletion is real; files in use need an explicit second confirmation.
  const handleDeleteFiles = async (fileIds?: string[]) => {
    const idsToDelete = fileIds || Array.from(selectedFiles);
    if (idsToDelete.length === 0) return;
    if (!window.confirm(`Delete ${idsToDelete.length} file(s)? This cannot be undone.`)) return;

    const send = async (force: boolean) => {
      const response = await fetch('/api/admin/media/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: idsToDelete, force })
      });
      return { response, data: await body(response) };
    };

    try {
      let { response, data } = await send(false);
      const inUse = (data.results || []).filter((r: any) => r.status === 'in_use');
      if (inUse.length > 0) {
        const where = inUse.map((r: any) => `- ${files.find((f) => f.id === r.id)?.originalName || r.id}: ${r.usedBy.join(', ')}`).join('\n');
        if (window.confirm(`${inUse.length} file(s) are in use and were not deleted:\n${where}\n\nDelete them anyway? Those pages will show a missing image.`)) {
          ({ response, data } = await send(true));
        }
      }
      const results: any[] = data.results || [];
      const deleted = results.filter((r) => r.status === 'deleted');
      const notOnDisk = deleted.filter((r) => r.disk === 'failed');
      const problems = results.filter((r) => r.status === 'error' || r.status === 'not_found').length;
      const kept = results.filter((r) => r.status === 'in_use').length;
      if (!response.ok && deleted.length === 0 && !kept) throw new Error(data.error || `HTTP ${response.status}`);
      const parts = [`Deleted ${deleted.length} of ${idsToDelete.length}`];
      if (kept) parts.push(`${kept} kept because in use`);
      if (problems) parts.push(`${problems} failed`);
      if (notOnDisk.length) parts.push(`${notOnDisk.length} removed from the library but the file could not be removed from disk (${notOnDisk[0].diskError})`);
      setMessage({ ok: problems === 0 && notOnDisk.length === 0, text: parts.join('; ') + '.' });
      await fetchMediaFiles();
      await fetchFolders();
      setSelectedFiles(new Set());
    } catch (error) {
      setMessage({ ok: false, text: `Not deleted: ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const response = await fetch('/api/admin/media/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim(), parentId: currentFolder })
      });
      const data = await body(response);
      if (!response.ok) { setMessage({ ok: false, text: `Folder not created: ${data.error || `HTTP ${response.status}`}` }); return; }
      await fetchFolders();
      setNewFolderName('');
      setShowCreateFolder(false);
      setMessage({ ok: true, text: `Folder "${data.folder?.name}" created.` });
    } catch (error) {
      setMessage({ ok: false, text: `Folder not created: ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  const handleRenameFolder = async (folder: MediaFolder) => {
    const name = window.prompt('New folder name:', folder.name);
    if (!name || name.trim() === folder.name) return;
    const response = await fetch(`/api/admin/media/folders/${folder.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() })
    });
    const data = await body(response);
    setMessage(response.ok ? { ok: true, text: `Renamed to "${name.trim()}".` } : { ok: false, text: `Not renamed: ${data.error || `HTTP ${response.status}`}` });
    await fetchFolders();
  };

  const handleDeleteFolder = async (folder: MediaFolder) => {
    if (!window.confirm(`Delete the empty folder "${folder.name}"?`)) return;
    const response = await fetch(`/api/admin/media/folders/${folder.id}`, { method: 'DELETE' });
    const data = await body(response);
    if (!response.ok) { setMessage({ ok: false, text: `Folder not deleted: ${data.error || `HTTP ${response.status}`}` }); return; }
    setMessage({ ok: true, text: `Folder "${folder.name}" deleted.` });
    if (currentFolder === folder.id) setCurrentFolder(folder.parentId ?? null);
    await fetchFolders();
  };

  const handleBulkTag = async (tags: string[]) => {
    const fileIds = Array.from(selectedFiles);
    try {
      const response = await fetch('/api/admin/media/bulk-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds, tags })
      });
      const data = await body(response);
      if (!response.ok) { setMessage({ ok: false, text: `Tags not added: ${data.error || `HTTP ${response.status}`}` }); return; }
      setMessage({ ok: true, text: `Tags added to ${fileIds.length} file(s).` });
      await fetchMediaFiles();
      setSelectedFiles(new Set());
    } catch (error) {
      setMessage({ ok: false, text: `Tags not added: ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  // W1c: target chosen from a folder list (it used to ask you to type a folder id).
  const handleBulkMove = async (target: string) => {
    const fileIds = Array.from(selectedFiles);
    const folderId = target === 'root' ? null : target;
    try {
      const response = await fetch('/api/admin/media/bulk-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds, folderId })
      });
      const data = await body(response);
      if (!response.ok) { setMessage({ ok: false, text: `Not moved: ${data.error || `HTTP ${response.status}`}` }); return; }
      const where = folderId ? `"${folders.find((f) => f.id === folderId)?.name ?? folderId}"` : 'the top level';
      setMessage({ ok: (data.errors || []).length === 0, text: `Moved ${data.moved} of ${data.total} file(s) to ${where}.${(data.errors || []).length ? ' ' + data.errors.join('; ') : ''}` });
      setMoveTarget('');
      await fetchMediaFiles();
      await fetchFolders();
      setSelectedFiles(new Set());
    } catch (error) {
      setMessage({ ok: false, text: `Not moved: ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  const toggleFileStar = async (fileId: string) => {
    try {
      const response = await fetch(`/api/admin/media/${fileId}/star`, { method: 'POST' });
      if (!response.ok) {
        const data = await body(response);
        setMessage({ ok: false, text: `Star not changed: ${data.error || `HTTP ${response.status}`}` });
        return;
      }
      await fetchMediaFiles();
    } catch (error) {
      setMessage({ ok: false, text: `Star not changed: ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return PhotoIcon;
    return DocumentIcon;
  };

  const currentFolderData = folders.find(f => f.id === currentFolder);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="bg-gray-200 dark:bg-gray-700 h-12 rounded-lg"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Media Library
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {currentFolderData ? `${currentFolderData.name} - ` : ''}{filteredFiles.length} files
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-l-lg ${
                viewMode === 'grid' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="Grid View"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-r-lg ${
                viewMode === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="List View"
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                {selectedFiles.size} selected
              </span>
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const tags = prompt('Enter tags (comma-separated):');
                    if (tags) {
                      handleBulkTag(tags.split(',').map(t => t.trim()));
                    }
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <TagIcon className="h-4 w-4" />
                </Button>
                {/* W1c: pick the target folder (it used to ask for a typed folder id) */}
                <select
                  aria-label="Move selected files to folder"
                  value={moveTarget}
                  onChange={(e) => { const t = e.target.value; setMoveTarget(t); if (t) handleBulkMove(t); }}
                  className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Move to...</option>
                  {currentFolder !== null && <option value="root">Top level</option>}
                  {folders
                    .filter((f) => f.id !== currentFolder)
                    .map((f) => ({ f, label: folderPath(f.id).map((p) => p.name).join(' / ') }))
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map(({ f, label }) => <option key={f.id} value={f.id}>{label}</option>)}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteFiles()}
                  className="text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedFiles(new Set())}
                  className="text-gray-600 hover:text-gray-700"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateFolder(true)}
          >
            <FolderIcon className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          
          <Button
            variant="primary"
            onClick={() => setShowUploadModal(true)}
          >
            <CloudArrowUpIcon className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Advanced Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Main Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search files, alt text, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchQuery('');
                }
              }}
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none"
            >
              <option value="all">All Types</option>
              <option value="images">Images</option>
              <option value="documents">Documents</option>
              <option value="videos">Videos</option>
            </select>
          </div>

          {/* Tag Filter */}
          <div className="relative">
            <TagIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by tags..."
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setTagFilter('');
                }
              }}
            />
          </div>

          {/* Sort Options */}
          <div className="relative">
            <AdjustmentsHorizontalIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                setSortBy(sort as any);
                setSortOrder(order as any);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none"
            >
              <option value="date-desc">📅 Newest First</option>
              <option value="date-asc">📅 Oldest First</option>
              <option value="name-asc">🔤 Name A-Z</option>
              <option value="name-desc">🔤 Name Z-A</option>
              <option value="size-desc">📏 Largest First</option>
              <option value="size-asc">📏 Smallest First</option>
            </select>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant={starredOnly ? "primary" : "outline"}
              size="sm"
              onClick={() => setStarredOnly(!starredOnly)}
              className="flex-1"
            >
              <StarIcon className="h-4 w-4 mr-1" />
              {starredOnly ? 'Starred' : 'All'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setTagFilter('');
                setStarredOnly(false);
                setSortBy('date');
                setSortOrder('desc');
              }}
              title="Clear all filters"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Quick Filter Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Quick filters:</div>
          {['Recent', 'Images', 'Documents', 'Large Files', 'Starred'].map((filter) => (
            <button
              key={filter}
              onClick={() => {
                switch (filter) {
                  case 'Recent':
                    setSortBy('date');
                    setSortOrder('desc');
                    break;
                  case 'Images':
                    setFilterType('images');
                    break;
                  case 'Documents':
                    setFilterType('documents');
                    break;
                  case 'Large Files':
                    setSortBy('size');
                    setSortOrder('desc');
                    break;
                  case 'Starred':
                    setStarredOnly(true);
                    break;
                }
              }}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span>💡 <strong>Keyboard Shortcuts:</strong></span>
          <span><kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">Ctrl+A</kbd> Select all</span>
          <span><kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">Ctrl+F</kbd> Focus search</span>
          <span><kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">Ctrl+U</kbd> Upload</span>
          <span><kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">Ctrl+G</kbd> Toggle view</span>
          <span><kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">Del</kbd> Delete selected</span>
          <span><kbd className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-600 rounded">Esc</kbd> Clear/Cancel</span>
        </div>
      </div>

      {/* Global Drag and Drop Zone */}
      <div 
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center bg-gray-50 dark:bg-gray-800/50 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
        onClick={() => setShowUploadModal(true)}
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
        }}
        onDrop={async (e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            await handleBulkFileUpload(files);
            // Ensure files are refreshed after upload
            await fetchMediaFiles();
          }
        }}
      >
        <CloudArrowUpIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Drag files here for instant upload
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          or click to browse • Multiple files supported
        </p>
      </div>

      {/* Bulk Upload Progress */}
      {bulkUploadProgress && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              ⏳ Uploading files... {bulkUploadProgress.completed}/{bulkUploadProgress.total}
            </span>
            <span className="text-sm text-blue-600 dark:text-blue-400 font-mono">
              {Math.round((bulkUploadProgress.completed / bulkUploadProgress.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(bulkUploadProgress.completed / bulkUploadProgress.total) * 100}%` }}
            />
          </div>
          {bulkUploadProgress.current && (
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              Currently uploading: {bulkUploadProgress.current}
            </div>
          )}
          {bulkUploadProgress.errors.length > 0 && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400">
              <div className="font-medium">⚠️ Upload errors:</div>
              {bulkUploadProgress.errors.map((error, index) => (
                <div key={index} className="text-xs">{error}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Result of the last action (server's answer) */}
      {message && (
        <div role={message.ok ? 'status' : 'alert'} className={`flex items-start justify-between gap-4 rounded-md border p-3 text-sm ${message.ok ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
          <span className="whitespace-pre-line">{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="underline shrink-0">Dismiss</button>
        </div>
      )}

      {/* W1c: folders - where you are, the folders inside it, rename/delete */}
      <nav aria-label="Folders" className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex flex-wrap items-center gap-1 text-sm">
          <button type="button" onClick={() => setCurrentFolder(null)} className={`px-2 py-1 rounded ${currentFolder === null ? 'font-semibold text-gray-900 dark:text-white' : 'text-blue-600 dark:text-blue-400 hover:underline'}`}>
            Top level
          </button>
          {folderPath(currentFolder).map((f) => (
            <React.Fragment key={f.id}>
              <span className="text-gray-400">/</span>
              <button type="button" onClick={() => setCurrentFolder(f.id)} className={`px-2 py-1 rounded ${f.id === currentFolder ? 'font-semibold text-gray-900 dark:text-white' : 'text-blue-600 dark:text-blue-400 hover:underline'}`}>
                {f.name}
              </button>
            </React.Fragment>
          ))}
          {currentFolderData && (
            <span className="ml-auto flex gap-2">
              <button type="button" onClick={() => handleRenameFolder(currentFolderData)} className="text-xs text-gray-600 dark:text-gray-300 hover:underline">Rename folder</button>
              <button type="button" onClick={() => handleDeleteFolder(currentFolderData)} className="text-xs text-red-600 dark:text-red-400 hover:underline">Delete folder</button>
            </span>
          )}
        </div>
        {folders.filter((f) => (f.parentId ?? null) === currentFolder).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {folders
              .filter((f) => (f.parentId ?? null) === currentFolder)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((f) => (
                <button key={f.id} type="button" onClick={() => setCurrentFolder(f.id)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-200">
                  <FolderIcon className="h-4 w-4 text-yellow-500" />
                  {f.name}
                  <span className="text-xs text-gray-500 dark:text-gray-400">{f.fileCount}</span>
                </button>
              ))}
          </div>
        )}
        {totalInFolder !== null && totalInFolder > files.length && (
          <p className="text-xs text-yellow-700 dark:text-yellow-300">Showing the first {files.length} of {totalInFolder} files in this folder.</p>
        )}
      </nav>

      {/* File Selection Actions */}
      {selectedFiles.size > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''} selected
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const allFileIds = filteredFiles.map(f => f.id);
                  setSelectedFiles(new Set(allFileIds));
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                Select All ({filteredFiles.length})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedFiles(new Set())}
                className="text-gray-600 hover:text-gray-700"
              >
                Clear Selection
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const tags = prompt('Add tags (comma-separated):');
                  if (tags) {
                    handleBulkTag(tags.split(',').map(t => t.trim()));
                  }
                }}
                className="text-green-600 hover:text-green-700"
              >
                <TagIcon className="h-4 w-4 mr-1" />
                Tag
              </Button>
              <label className="inline-flex items-center gap-1 text-sm text-blue-600">
                <FolderIcon className="h-4 w-4" />
                <select
                  aria-label="Move selected files to"
                  value={moveTarget}
                  onChange={(e) => { const t = e.target.value; setMoveTarget(t); if (t) handleBulkMove(t); }}
                  className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Move to...</option>
                  {currentFolder !== null && <option value="root">Top level</option>}
                  {folders
                    .filter((f) => f.id !== currentFolder)
                    .map((f) => ({ f, label: folderPath(f.id).map((p) => p.name).join(' / ') }))
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map(({ f, label }) => <option key={f.id} value={f.id}>{label}</option>)}
                </select>
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteFiles()}
                className="text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* File Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredFiles.map(file => {
            const FileIcon = getFileIcon(file.mimeType);
            
            return (
              <div
                key={file.id}
                className={`relative group bg-white dark:bg-gray-800 rounded-lg border p-3 hover:shadow-lg transition-all ${
                  selectedFiles.has(file.id) ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedFiles);
                      if (e.target.checked) {
                        newSelected.add(file.id);
                      } else {
                        newSelected.delete(file.id);
                      }
                      setSelectedFiles(newSelected);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {/* Star Button */}
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={() => toggleFileStar(file.id)}
                    className={`p-1 rounded ${file.starred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                  >
                    <StarIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* File Preview */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded mb-2 overflow-hidden">
                  {file.mimeType.startsWith('image/') ? (
                    <img
                      src={file.thumbnailUrl || file.url || '/images/placeholder-image.png'}
                      alt={file.alt || file.originalName}
                      className="w-full h-full object-cover cursor-pointer"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback if image fails to load
                        const target = e.target as HTMLImageElement;
                        console.warn('Image failed to load:', {
                          attemptedUrl: target.src,
                          fileUrl: file.url,
                          thumbnailUrl: file.thumbnailUrl
                        });
                        // Try the main URL if thumbnail failed
                        if (target.src !== file.url && file.url && !target.src.includes('placeholder')) {
                          target.src = file.url;
                        } else if (!target.src.includes('placeholder')) {
                          // If both fail, show placeholder
                          target.src = '/images/placeholder-image.png';
                        }
                      }}
                      onClick={() => {
                        setPreviewFile(file);
                        setShowPreview(true);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                  {file.tags && file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {file.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {file.tags.length > 2 && (
                        <span className="text-xs text-gray-500">+{file.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPreviewFile(file);
                      setShowPreview(true);
                    }}
                    className="bg-white text-gray-900"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  {file.mimeType.startsWith('image/') && (
                    <ImageResizeButton
                      imageUrl={file.url}
                      imageName={file.originalName}
                      mimeType={file.mimeType}
                      onResizeComplete={(resizedFile) => {
                        // Handle resized file - you could upload it as a new file or replace the existing one
                        console.log('Image resized:', resizedFile);
                        // For now, just show a message
                        alert('Image resized! You can now upload it as a new file.');
                      }}
                      resizeType="card"
                      className="bg-white text-blue-600"
                    />
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteFiles([file.id])}
                    className="bg-white text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {filteredFiles.map(file => {
            const FileIcon = getFileIcon(file.mimeType);
            
            return (
              <div
                key={file.id}
                className={`flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  selectedFiles.has(file.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.id)}
                  onChange={(e) => {
                    const newSelected = new Set(selectedFiles);
                    if (e.target.checked) {
                      newSelected.add(file.id);
                    } else {
                      newSelected.delete(file.id);
                    }
                    setSelectedFiles(newSelected);
                  }}
                  className="mr-4"
                />

                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center mr-4">
                  {file.mimeType.startsWith('image/') ? (
                    <img
                      src={file.thumbnailUrl || file.url || '/images/placeholder-image.png'}
                      alt={file.alt || file.originalName}
                      className="w-full h-full object-cover rounded"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.warn('List image failed to load:', {
                          attemptedUrl: target.src,
                          fileUrl: file.url,
                          fileId: file.id
                        });
                        // Try main URL if thumbnail failed
                        if (file.url && !target.src.includes('placeholder')) {
                          target.src = file.url;
                        } else if (!target.src.includes('placeholder')) {
                          target.src = '/images/placeholder-image.png';
                        }
                      }}
                    />
                  ) : (
                    <FileIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.originalName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                  {file.tags && file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {file.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleFileStar(file.id)}
                    className={`p-1 rounded ${file.starred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                  >
                    <StarIcon className="h-4 w-4" />
                  </button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPreviewFile(file);
                      setShowPreview(true);
                    }}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  {file.mimeType.startsWith('image/') && (
                    <ImageResizeButton
                      imageUrl={file.url}
                      imageName={file.originalName}
                      mimeType={file.mimeType}
                      onResizeComplete={(resizedFile) => {
                        console.log('Image resized:', resizedFile);
                        alert('Image resized! You can now upload it as a new file.');
                      }}
                      resizeType="card"
                      className="text-blue-600 hover:text-blue-700"
                    />
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteFiles([file.id])}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredFiles.length === 0 && !loading && (
        <div className="text-center py-12">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No files found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery || tagFilter || filterType !== 'all' || starredOnly
              ? 'Try adjusting your search filters'
              : 'Upload your first file to get started'
            }
          </p>
          <Button variant="primary" onClick={() => setShowUploadModal(true)}>
            <CloudArrowUpIcon className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>
      )}

      {/* Enhanced Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Upload Files
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setBulkUploadProgress(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  handleBulkFileUpload(files);
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files) {
                    handleBulkFileUpload(e.target.files);
                  }
                }}
                className="hidden"
              />
              
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Supports images, videos, and documents. Maximum 10MB per file.
              </p>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowUploadModal(false);
                  setBulkUploadProgress(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Preview Modal */}
      {showPreview && previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {previewFile.originalName}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              {previewFile.mimeType.startsWith('image/') && (
                <img
                  src={previewFile.url || previewFile.thumbnailUrl || '/images/placeholder-image.png'}
                  alt={previewFile.alt || previewFile.originalName}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.error('Preview image failed to load:', {
                      url: previewFile.url,
                      thumbnailUrl: previewFile.thumbnailUrl,
                      fileId: previewFile.id
                    });
                    // Try thumbnail if main URL failed
                    if (previewFile.thumbnailUrl && !target.src.includes('placeholder')) {
                      target.src = previewFile.thumbnailUrl;
                    } else if (!target.src.includes('placeholder')) {
                      target.src = '/images/placeholder-image.png';
                    }
                  }}
                  className="max-w-full h-auto rounded-lg mb-4"
                />
              )}
              
              <div className="space-y-2 text-sm">
                <p><strong>Size:</strong> {formatFileSize(previewFile.size)}</p>
                <p><strong>Type:</strong> {previewFile.mimeType}</p>
                <p><strong>Uploaded:</strong> {new Date(previewFile.uploadedAt).toLocaleString()}</p>
                <p><strong>Uploaded by:</strong> {previewFile.uploadedBy}</p>
                {previewFile.tags && previewFile.tags.length > 0 && (
                  <p><strong>Tags:</strong> {previewFile.tags.join(', ')}</p>
                )}
              </div>
              
              <div className="mt-6 flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(previewFile.url);
                  }}
                >
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = previewFile.url;
                    a.download = previewFile.originalName;
                    a.click();
                  }}
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Create New Folder
            </h3>
            
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                } else if (e.key === 'Escape') {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                }
              }}
            />
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary; 