'use client';

import React, { useState, useRef } from 'react';

interface DocumentUploadProps {
  onUpload: (files: File[], type: 'nationalId' | 'transcripts') => void;
  uploadedFiles: {
    nationalId: File[];
    transcripts: File[];
  };
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUpload, uploadedFiles }) => {
  const [previewUrls, setPreviewUrls] = useState<{ [key: string]: string }>({});
  const nationalIdInputRef = useRef<HTMLInputElement>(null);
  const transcriptsInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'nationalId' | 'transcripts') => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const invalidFiles = files.filter(file => !file.type.includes('pdf'));
    if (invalidFiles.length > 0) {
      alert('Please upload only PDF files');
      return;
    }

    onUpload(files, type);

    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => ({
          ...prev,
          [file.name]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePreviewClick = (file: File) => {
    const url = previewUrls[file.name];
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleRemoveFile = (file: File, type: 'nationalId' | 'transcripts') => {
    const newFiles = type === 'nationalId' 
      ? [] 
      : uploadedFiles.transcripts.filter(f => f.name !== file.name);
    onUpload(newFiles, type);
    setPreviewUrls(prev => {
      const newUrls = { ...prev };
      delete newUrls[file.name];
      return newUrls;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">National ID</h4>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => nationalIdInputRef.current?.click()}
            className="px-4 py-2 text-sm font-medium text-white bg-navy-blue border border-transparent rounded-md shadow-sm hover:bg-navy-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-blue"
          >
            Upload National ID
          </button>
          <input
            type="file"
            ref={nationalIdInputRef}
            onChange={(e) => handleFileChange(e, 'nationalId')}
            accept=".pdf"
            className="hidden"
          />
          {uploadedFiles.nationalId.map(file => (
            <div key={file.name} className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{file.name}</span>
              <button
                type="button"
                onClick={() => handlePreviewClick(file)}
                className="text-navy-blue hover:text-navy-blue-dark"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => handleRemoveFile(file, 'nationalId')}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Transcripts</h4>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => transcriptsInputRef.current?.click()}
            className="px-4 py-2 text-sm font-medium text-white bg-navy-blue border border-transparent rounded-md shadow-sm hover:bg-navy-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-blue"
          >
            Upload Transcripts
          </button>
          <input
            type="file"
            ref={transcriptsInputRef}
            onChange={(e) => handleFileChange(e, 'transcripts')}
            accept=".pdf"
            multiple
            className="hidden"
          />
        </div>
        <div className="mt-2 space-y-2">
          {uploadedFiles.transcripts.map(file => (
            <div key={file.name} className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{file.name}</span>
              <button
                type="button"
                onClick={() => handlePreviewClick(file)}
                className="text-navy-blue hover:text-navy-blue-dark"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => handleRemoveFile(file, 'transcripts')}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload; 