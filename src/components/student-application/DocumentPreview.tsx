import React, { useState, useEffect } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from 'pdfjs-dist';

interface DocumentPreviewProps {
  file: (File & { url?: string }) | null;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ file, isOpen, onClose }) => {
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && file) {
      setIsLoading(true);
      setError(null);
      
      // Create a URL for the file
      try {
        // Handle files with existing URLs (from Supabase)
        if ('url' in file && typeof file.url === 'string') {
          setPdfData(file.url);
          setIsLoading(false);
          return;
        }
        
        // Otherwise convert the file to data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setPdfData(e.target.result as string);
          } else {
            setError('Failed to read file');
          }
          setIsLoading(false);
        };
        reader.onerror = () => {
          setError('Failed to read file');
          setIsLoading(false);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error('Error previewing document:', err);
        setError('Failed to load document for preview');
        setIsLoading(false);
      }
    } else {
      // Clean up when modal closes
      setPdfData(null);
      setError(null);
    }
  }, [file, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {file?.name || 'Document Preview'}
          </h2>
          <div className="flex items-center space-x-2">
            {pdfData && !isLoading && (
              <a
                href={pdfData}
                download={file?.name || 'document.pdf'}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
                title="Download"
              >
                <Download className="h-5 w-5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-10 w-10 text-primary-navy animate-spin mb-4" />
              <p className="text-gray-600">Loading document...</p>
            </div>
          )}
          
          {error && (
            <div className="flex flex-col items-center justify-center h-full text-red-500">
              <p>{error}</p>
            </div>
          )}
          
          {pdfData && !isLoading && !error && (
            <div className="h-full">
              <iframe
                src={pdfData}
                className="w-full h-full border-0"
                title="Document Preview"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview; 