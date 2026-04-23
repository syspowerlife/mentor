import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, File, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onUploadComplete: (metadata: { url: string; fileName: string; size: number; type: string }) => void;
  folder: string;
  allowedTypes?: string[];
  maxSizeMB?: number;
  label?: string;
  className?: string;
}

export function FileUpload({ 
  onUploadComplete, 
  folder, 
  allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'], 
  maxSizeMB = 5,
  label = "Clique ou arraste um arquivo para upload",
  className
}: FileUploadProps) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File) => {
    if (!allowedTypes.includes(file.type) && !allowedTypes.some(t => t.endsWith('/*') && file.type.startsWith(t.split('/')[0]))) {
      toast.error(`Tipo de arquivo não permitido. Use: ${allowedTypes.join(', ')}`);
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`O arquivo deve ter no máximo ${maxSizeMB}MB`);
      return false;
    }
    return true;
  };

  const handleUpload = async (file: File) => {
    if (!user || !validateFile(file)) return;

    setIsUploading(true);
    setUploadProgress(0);

    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error: any) => {
        console.error('Upload error:', error);
        toast.error(error.message || 'Erro ao fazer upload do arquivo.');
        setIsUploading(false);
        setUploadProgress(null);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onUploadComplete({
          url: downloadURL,
          fileName: file.name,
          size: file.size,
          type: file.type
        });
        setIsUploading(false);
        setUploadProgress(null);
        toast.success('Upload concluído com sucesso!');
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 text-center",
          isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
          isUploading && "pointer-events-none opacity-60"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={allowedTypes.join(',')}
        />

        {isUploading ? (
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        ) : (
          <Upload className={cn("w-10 h-10", isDragging ? "text-blue-500" : "text-slate-400")} />
        )}

        <div>
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <p className="text-xs text-slate-500 mt-1">
            Máximo {maxSizeMB}MB. Formatos: {allowedTypes.map(t => t.split('/')[1]).join(', ')}
          </p>
        </div>
      </div>

      {uploadProgress !== null && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-slate-600">
            <span>Enviando arquivo...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
    </div>
  );
}
