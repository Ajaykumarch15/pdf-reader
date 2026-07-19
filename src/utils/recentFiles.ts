export interface RecentFile {
  id: string;
  name: string;
  size: number;
  lastOpened: number;
  reopenable: boolean;
}

type LocalFileHandle = {
  getFile: () => Promise<File>;
  queryPermission?: (options?: { mode?: 'read' }) => Promise<PermissionState>;
  requestPermission?: (options?: { mode?: 'read' }) => Promise<PermissionState>;
};

const RECENTS_KEY = 'comfort-reader-recent-files';
const DATABASE_NAME = 'comfort-reader-files';
const STORE_NAME = 'handles';

const getDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(DATABASE_NAME, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const saveHandle = async (id: string, handle: LocalFileHandle) => {
  const db = await getDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(handle, id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  db.close();
};

const getHandle = async (id: string) => {
  const db = await getDatabase();
  const handle = await new Promise<LocalFileHandle | undefined>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as LocalFileHandle | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return handle;
};

export const getRecentFiles = (): RecentFile[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]') as RecentFile[];
  } catch {
    return [];
  }
};

export const rememberRecentFile = async (file: File, handle?: LocalFileHandle) => {
  const existing = getRecentFiles();
  const match = existing.find((item) => item.name === file.name && item.size === file.size);
  const id = match?.id || crypto.randomUUID();
  const recent: RecentFile = { id, name: file.name, size: file.size, lastOpened: Date.now(), reopenable: Boolean(handle) || Boolean(match?.reopenable) };
  const next = [recent, ...existing.filter((item) => item.id !== id)].slice(0, 6);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  if (handle) await saveHandle(id, handle);
  return next;
};

export const reopenRecentFile = async (id: string) => {
  const handle = await getHandle(id);
  if (!handle) throw new Error('This PDF needs to be selected again because no saved file permission is available.');
  let permission = await handle.queryPermission?.({ mode: 'read' });
  if (permission !== 'granted') permission = await handle.requestPermission?.({ mode: 'read' });
  if (permission && permission !== 'granted') throw new Error('File permission was not granted.');
  return { file: await handle.getFile(), handle };
};

export const supportsFileHandlePicker = () => 'showOpenFilePicker' in window;
