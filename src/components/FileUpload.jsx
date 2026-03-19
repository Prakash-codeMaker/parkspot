import React, { useEffect, useRef, useState } from 'react';
import { C } from '../tokens.js';
import { storage } from '../firebase.js';
import {
  getDownloadURL,
  ref,
  uploadBytesResumable
} from 'firebase/storage';
import { FileUp, Image as ImageIcon, FileText, CheckCircle2, X } from 'lucide-react';

export function FileUpload({
  label,
  storagePath,
  onUpload,
  accept = 'image/*,.pdf',
  maxSizeMB = 5,
  instruction
}) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const validateFile = (f) => {
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (f.size > maxBytes) {
      setError(`File is too large. Max ${maxSizeMB}MB.`);
      return false;
    }
    const allowed = (accept || '').split(',').map((s) => s.trim());
    if (
      allowed.length &&
      !allowed.some((a) => {
        if (!a) return false;
        if (a === '*/*') return true;
        if (a.endsWith('/*')) {
          const prefix = a.replace('/*', '');
          return f.type.startsWith(prefix);
        }
        if (a.startsWith('.')) {
          return f.name.toLowerCase().endsWith(a.toLowerCase());
        }
        return f.type === a;
      })
    ) {
      setError('Unsupported file type.');
      return false;
    }
    return true;
  };

  const startUpload = (f) => {
    if (!validateFile(f)) return;
    setError('');
    setFile(f);
    const isImage = f.type.startsWith('image/');
    if (isImage) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
    const path = `${storagePath}/${f.name}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, f);
    task.on(
      'state_changed',
      (snap) => {
        const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
        setProgress(pct);
      },
      () => {
        setError('Upload failed. Please try again.');
        setProgress(0);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setUploadedUrl(url);
        setProgress(100);
        if (onUpload) onUpload(url);
      }
    );
  };

  const handleInput = (e) => {
    const f = e.target.files?.[0];
    if (f) startUpload(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) startUpload(f);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl('');
    setUploadedUrl('');
    setProgress(0);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
    if (onUpload) onUpload('');
  };

  const isImage = file?.type?.startsWith('image/') || previewUrl;

  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <div
          style={{
            fontSize: 13,
            marginBottom: 4,
            color: C.slate
          }}
        >
          {label}
        </div>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        style={{
          border: `2px dashed ${C.border}`,
          borderRadius: 12,
          padding: 10,
          background: C.bg,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: C.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: C.blue
          }}
        >
          <FileUp size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 12,
              color: C.slate
            }}
          >
            Click to upload or drag and drop
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.slateL
            }}
          >
            {instruction || 'JPG, PNG or PDF'} · Max {maxSizeMB}MB
          </div>
        </div>
        {uploadedUrl && (
          <CheckCircle2 size={18} color={C.green} />
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInput}
          style={{ display: 'none' }}
        />
      </div>
      {file && (
        <div
          style={{
            marginTop: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              overflow: 'hidden',
              background: C.white,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isImage && previewUrl ? (
              <img
                src={previewUrl}
                alt={file.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <>
                {file.type === 'application/pdf' ? (
                  <FileText size={20} color={C.slate} />
                ) : (
                  <ImageIcon size={20} color={C.slate} />
                )}
              </>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 12,
                color: C.slate
              }}
            >
              {file.name}
            </div>
            <div
              style={{
                height: 5,
                borderRadius: 999,
                background: C.bg,
                overflow: 'hidden',
                marginTop: 3
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: uploadedUrl ? C.green : C.blue,
                  transition: 'width 0.15s ease'
                }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={clearFile}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 2,
              cursor: 'pointer'
            }}
          >
            <X size={16} color={C.slateL} />
          </button>
        </div>
      )}
      {error && (
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            color: C.red
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

