'use client';

import React, { useRef, useState } from 'react';
import { Paperclip, X, Image, FileText, File } from 'lucide-react';
import { FileAttachment } from '@/lib/types';

interface FileUploadProps {
  onFilesSelected: (files: FileAttachment[]) => void;
  attachments: FileAttachment[];
  onRemoveAttachment: (id: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  attachments,
  onRemoveAttachment,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newAttachments: FileAttachment[] = [];

    Array.from(files).forEach((file) => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      // Check file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'text/plain',
        'text/csv',
        'application/pdf',
        'application/json',
        'text/markdown',
      ];

      if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not supported.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        
        const attachment: FileAttachment = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          base64,
        };

        newAttachments.push(attachment);
        
        // Call callback when all files are processed
        if (newAttachments.length === files.length) {
          onFilesSelected(newAttachments);
        }
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.includes('text') || type.includes('json')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      {/* File Attachments Display */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 glass rounded-lg">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 text-sm"
            >
              {getFileIcon(attachment.type)}
              <span className="text-text truncate max-w-32">{attachment.name}</span>
              <span className="text-text-secondary text-xs">
                ({formatFileSize(attachment.size)})
              </span>
              <button
                onClick={() => onRemoveAttachment(attachment.id)}
                className="text-red-400 hover:text-red-300 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative ${
          dragOver
            ? 'border-accent bg-accent/5'
            : 'border-glass hover:border-accent/50'
        } border-2 border-dashed rounded-lg transition-colors`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.webp,.txt,.csv,.pdf,.json,.md"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors"
          >
            <Paperclip className="w-4 h-4" />
            <span className="text-sm">
              {dragOver ? 'Drop files here' : 'Attach files or drag & drop'}
            </span>
          </button>
        </div>
      </div>

      <div className="text-xs text-text-secondary">
        Supported: Images (JPEG, PNG, GIF, WebP), Text files, PDFs, JSON, Markdown. Max 10MB per file.
      </div>
    </div>
  );
};
