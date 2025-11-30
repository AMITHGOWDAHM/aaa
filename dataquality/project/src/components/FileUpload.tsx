import React, { useCallback } from 'react';
import { Upload, FileText, Database } from 'lucide-react';


interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading }) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && (file.type === 'text/csv' || file.type === 'application/json' || file.name.endsWith('.csv') || file.name.endsWith('.json'))) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="relative border-2 border-dashed border-blue-300 rounded-xl p-12 text-center bg-white/80 backdrop-blur-sm hover:border-blue-400 transition-all duration-300 hover:bg-white/90"
      >
        <input
          type="file"
          accept=".csv,.json"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
        />
        
        <div className="flex flex-col items-center space-y-4">
          {isLoading ? (
            <div className="animate-spin">
              <Database className="w-12 h-12 text-blue-500" />
            </div>
          ) : (
            <Upload className="w-12 h-12 text-blue-500" />
          )}
          
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {isLoading ? 'Processing Dataset...' : 'Upload Your Dataset'}
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop your CSV or JSON file here, or click to browse
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                CSV
              </span>
              <span className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                JSON
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};