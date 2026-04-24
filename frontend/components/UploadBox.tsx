'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Check } from 'lucide-react';

interface UploadBoxProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
  onClose: () => void;
}

export default function UploadBox({ onUpload, isLoading, onClose }: UploadBoxProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      // Accept any file type for flexible extraction
      handleFileSelect(file);
    }
  };

  const handleFileSelect = async (file: File) => {
    console.log('🟢 [UploadBox] File selected:', file.name);
    setUploadedFile(file);
    setUploadStatus('uploading');
    
    try {
      console.log('🟢 [UploadBox] Calling onUpload handler...');
      await onUpload(file);
      console.log('🟢 [UploadBox] Upload handler completed successfully');
      setUploadStatus('success');
      setTimeout(() => {
        console.log('🟢 [UploadBox] Closing upload box');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('🟢 [UploadBox] Upload failed:', error);
      setUploadStatus('error');
      setTimeout(() => {
        setUploadStatus('idle');
      }, 2000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="h-full flex items-center justify-center p-6"
    >
      <div className="w-full max-w-md">
        {uploadStatus === 'success' ? (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-8 bg-dark-surface/40 border border-dark-border rounded-xl text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center"
            >
              <Check className="w-8 h-8 text-green-400" />
            </motion.div>
            <h3 className="text-lg font-semibold text-white mb-1">Upload Successful</h3>
            <p className="text-sm text-dark-text/60">{uploadedFile?.name}</p>
            <p className="text-xs text-dark-text/40 mt-2">Analyzing data...</p>
          </motion.div>
        ) : (
          <motion.label
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            animate={dragActive ? { scale: 1.02, borderColor: '#ef4444' } : {}}
            className={`relative p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              dragActive
                ? 'bg-red-500/5 border-red-500'
                : 'bg-dark-surface/40 border-dark-border hover:border-red-500/50'
            }`}
          >
            <input
              type="file"
              onChange={handleInputChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              accept="*/*"
              disabled={isLoading}
            />

            <div className="text-center">
              <motion.div
                animate={isLoading ? { y: [0, -8, 0] } : {}}
                transition={{ repeat: isLoading ? Infinity : 0, duration: 1.5 }}
                className="w-12 h-12 mx-auto mb-3 bg-dark-surface/60 rounded-lg flex items-center justify-center"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-6 h-6 border-2 border-transparent border-t-red-500 rounded-full"
                  ></motion.div>
                ) : (
                  <Upload className="w-6 h-6 text-red-400" />
                )}
              </motion.div>

              <h3 className="text-lg font-semibold text-white mb-1">
                {isLoading ? 'Uploading...' : 'Drop file here or click'}
              </h3>
              <p className="text-sm text-dark-text/60">
                Supports: CSV, JSON, Excel, Parquet, TSV, Feather, HDF5, NDJSON
              </p>
              {uploadedFile && (
                <p className="text-xs text-dark-text/40 mt-2">{uploadedFile.name}</p>
              )}
            </div>

            {/* Close Button */}
            {!isLoading && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-dark-surface-alt rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-dark-text/60" />
              </motion.button>
            )}
          </motion.label>
        )}
      </div>
    </motion.div>
  );
}
