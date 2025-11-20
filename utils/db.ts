import { StoredFile, StoredFileData } from '../types';

const DB_NAME = 'StudyosDB';
const DB_VERSION = 2; // Incremented version for schema change
const STORE_NAME = 'files';
const BACKUP_STORE_NAME = 'backups';

let db: IDBDatabase;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject('Error opening IndexedDB');
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(BACKUP_STORE_NAME)) {
        db.createObjectStore(BACKUP_STORE_NAME, { keyPath: 'timestamp' });
      }
    };
  });
};

const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onerror = () => reject(new Error('Failed to load image'));
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Could not get canvas context'));
                
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas to Blob conversion failed'));
                    }
                }, 'image/jpeg', 0.8); // Always compress to JPEG for consistency, with slightly higher quality for wallpapers.
            };
        };
        reader.onerror = error => reject(error);
    });
};


export const addFile = async (file: File): Promise<number> => {
  const db = await openDB();
  
  let fileToStore = file;
  // Auto-compress large images, but not GIFs to preserve animation
  if (file.type.startsWith('image/') && file.type !== 'image/gif' && file.size > 200 * 1024) { // > 200KB
    try {
      const compressedBlob = await compressImage(file);
      // Create a new file with .jpeg extension
      const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpeg";
      fileToStore = new File([compressedBlob], newName, { type: 'image/jpeg' });
      console.log(`Compressed image from ${file.size} to ${fileToStore.size} bytes.`);
    } catch (error) {
      console.error("Image compression failed, storing original file.", error);
      fileToStore = file;
    }
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const fileData: Omit<StoredFileData, 'id'> = {
        name: fileToStore.name,
        type: fileToStore.type,
        size: fileToStore.size,
        ts: Date.now(),
        data: fileToStore,
        tags: [],
        folder: '/',
    };
    const request = store.add(fileData);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject('Error adding file');
  });
};

export const getFiles = async (): Promise<StoredFile[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.openCursor(null, 'prev');
        const files: StoredFile[] = [];

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                const { data, ...metadata } = cursor.value;
                files.push(metadata);
                cursor.continue();
            } else {
                resolve(files);
            }
        };
        request.onerror = () => reject('Error getting files');
    });
};

export const getFile = async (id: number): Promise<StoredFileData | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result as StoredFileData || null);
        request.onerror = () => reject('Error getting file');
    });
};

export const updateFileMetadata = async (id: number, updates: Partial<Pick<StoredFile, 'name' | 'tags' | 'folder'>>): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const fileData = getRequest.result;
            if (fileData) {
                const updatedData = { ...fileData, ...updates };
                const putRequest = store.put(updatedData);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject('Error updating file');
            } else {
                reject('File not found for update');
            }
        };
        getRequest.onerror = () => reject('Error getting file for update');
    });
};

export const deleteFile = async (id: number): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Error deleting file');
    });
};


// --- Backup Functions ---

export const addBackup = async (backupData: object): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BACKUP_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(BACKUP_STORE_NAME);
        const backupRecord = {
            timestamp: Date.now(),
            data: JSON.stringify(backupData),
        };
        const request = store.put(backupRecord);
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Error adding backup');
    });
};

export const getBackups = async (): Promise<{ timestamp: number }[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BACKUP_STORE_NAME, 'readonly');
        const store = transaction.objectStore(BACKUP_STORE_NAME);
        const request = store.getAllKeys();
        request.onsuccess = () => {
            const timestamps = (request.result as number[]).sort((a, b) => b - a); // most recent first
            resolve(timestamps.map(ts => ({ timestamp: ts })));
        };
        request.onerror = () => reject('Error getting backup timestamps');
    });
};

export const getBackup = async (timestamp: number): Promise<{ timestamp: number, data: string } | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BACKUP_STORE_NAME, 'readonly');
        const store = transaction.objectStore(BACKUP_STORE_NAME);
        const request = store.get(timestamp);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject('Error getting backup data');
    });
};

export const deleteBackup = async (timestamp: number): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(BACKUP_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(BACKUP_STORE_NAME);
        const request = store.delete(timestamp);
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Error deleting backup');
    });
};