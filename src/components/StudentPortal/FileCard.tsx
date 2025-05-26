import React from 'react';
import { Eye, Trash2, FileText } from 'lucide-react';

interface FileCardProps {
  file: File;
  documentType: 'NATIONAL_ID' | 'TRANSCRIPT';
  country?: string;
  onView: () => void;
  onDelete: () => void;
}

const FileCard: React.FC<FileCardProps> = ({
  file,
  documentType,
  country,
  onView,
  onDelete
}) => {
  // Format file size to human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex items-center p-4 border rounded-lg bg-gray-50 relative">
      <div className="flex-shrink-0 mr-4">
        <div className="bg-primary-navy/10 p-2 rounded-lg">
          <FileText className="h-8 w-8 text-primary-navy" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">
          {file.name}
        </h4>
        <div className="flex flex-wrap gap-x-4 text-xs text-gray-500 mt-1">
          <span>{formatFileSize(file.size)}</span>
          <span>{new Date().toLocaleDateString()}</span>
          {documentType === 'NATIONAL_ID' && (
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
              National ID
            </span>
          )}
          {documentType === 'TRANSCRIPT' && (
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
              Transcript
            </span>
          )}
          {country && (
            <span className="bg-gray-100 px-2 py-0.5 rounded">
              {country}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={onView}
          className="p-1.5 text-gray-500 hover:text-primary-navy hover:bg-primary-navy/10 rounded transition"
          title="View Document"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
          title="Delete Document"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default FileCard; 