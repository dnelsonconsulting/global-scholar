import React from 'react';
import { HiOutlineUpload } from 'react-icons/hi';
import { Loader2 } from 'lucide-react';

interface FileUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  status?: string;
  error?: string;
  uploadProgress?: number;
  isInitializing?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  file, 
  onFileChange, 
  status, 
  error,
  uploadProgress,
  isInitializing = false
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) {
        onFileChange(null);
        return;
      }

      // Validate file type
      if (!selectedFile.type.includes('pdf')) {
        throw new Error('Only PDF files are allowed');
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Read file as ArrayBuffer
      const arrayBuffer = await selectedFile.arrayBuffer();
      
      // Create a new File object with the correct type
      const newFile = new File([arrayBuffer], selectedFile.name, {
        type: 'application/pdf',
        lastModified: selectedFile.lastModified
      });

      onFileChange(newFile);
    } catch (error) {
      console.error('File validation error:', error);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset the input
      }
      onFileChange(null);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Upload Document <span className="text-red-500">*</span>
      </label>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`flex items-center justify-center w-full md:w-auto px-4 py-3 border-2 ${
            isInitializing || typeof uploadProgress === 'number'
              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 bg-white text-gray-700 hover:border-primary-navy focus:outline-none focus:ring-2 focus:ring-primary-navy'
          } rounded-md font-semibold`}
          disabled={isInitializing || typeof uploadProgress === 'number'}
        >
          {isInitializing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Initializing...
            </>
          ) : (
            <>
              <HiOutlineUpload className="mr-2 h-5 w-5" />
              {file ? 'Replace Document' : 'Upload Document'}
            </>
          )}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,application/pdf"
          className="hidden"
          disabled={isInitializing || typeof uploadProgress === 'number'}
        />
      </div>
      
      {file && (
        <div className="mt-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          {typeof uploadProgress === 'number' && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary-navy h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 mt-1">
                {uploadProgress}% uploaded
              </span>
            </div>
          )}
        </div>
      )}
      {status && <p className="text-xs text-green-600 mt-1">{status}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default FileUpload; 