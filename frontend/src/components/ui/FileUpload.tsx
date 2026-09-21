import React, { useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface FileUploadProps {
  accept?: string;
  onUpload: (file: File) => void;
  label?: string;
  multiple?: boolean;
  maxSize?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = '.csv,.xlsx,.xls',
  onUpload,
  label = 'Subir archivo',
  multiple = false,
  maxSize = 10 * 1024 * 1024,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndUpload(droppedFiles);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    validateAndUpload(selectedFiles);
  };

  const validateAndUpload = (selectedFiles: File[]) => {
    selectedFiles.forEach((file) => {
      if (file.size > maxSize) {
        toast.error(`El archivo ${file.name} excede el tamaño máximo`);
        return;
      }
      setFiles((prev) => [...prev, file]);
      onUpload(file);
      toast.success(`${file.name} cargado correctamente`);
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ${
          isDragging ? 'border-primary-500 bg-primary-500/10' : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={24} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-400">Arrastra archivos aquí o haz clic para seleccionar</p>
        <p className="text-xs text-gray-500 mt-1">Formatos: CSV, XLSX (max. 10MB)</p>
        <input ref={fileInputRef} type="file" className="hidden" accept={accept} multiple={multiple} onChange={handleFileChange} />
      </div>
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-gray-400" />
                <span className="text-sm text-gray-300">{file.name}</span>
                <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
              <button onClick={() => removeFile(index)} className="text-gray-400 hover:text-red-400 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
