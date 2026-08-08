"use client";

import { useState, useRef, useCallback } from "react";
import { UploadCloud, FileText, Loader2, X } from "lucide-react";
import Swal from "sweetalert2";
import axios from "@/lib/axios";
import { ResumeResult } from "@/types/resume";
import "./resumeUploader.css";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE_MB = 10;

interface Props {
  onAnalyzed: (result: ResumeResult) => void;
}

export default function ResumeUploader({ onAnalyzed }: Props) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = useCallback((candidate: File) => {
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      Swal.fire({ icon: "error", title: "Unsupported file type", text: "Please upload a PDF or DOCX resume." });
      return;
    }
    if (candidate.size > MAX_SIZE_MB * 1024 * 1024) {
      Swal.fire({ icon: "error", title: "File too large", text: `Please upload a file under ${MAX_SIZE_MB}MB.` });
      return;
    }
    setFile(candidate);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) validateAndSetFile(dropped);
    },
    [validateAndSetFile]
  );

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await axios.post("/api/app/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      onAnalyzed(data.data as ResumeResult);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Something went wrong while analyzing your resume. Please try again.";
      Swal.fire({ icon: "error", title: "Analysis failed", text: message });
    } finally {
      setUploading(false);
    }
  }, [file, onAnalyzed]);

  return (
    <div id="upload" className="scanza-uploader-root mx-auto w-full max-w-2xl scroll-mt-24">
      {!file ? (
        <div
          data-dragging={dragging}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="scanza-uploader-dropzone flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-scanza-border bg-scanza-surface px-8 py-16 text-center shadow-scanza-card"
        >
          <UploadCloud size={48} className="scanza-uploader-icon-bounce mb-4 text-scanza-primary" />
          <p className="mb-1 font-display text-lg font-semibold text-scanza-text">
            Drop your resume here, or click to browse
          </p>
          <p className="text-sm text-scanza-text-muted">PDF or DOCX, up to {MAX_SIZE_MB}MB — analyzed instantly, free.</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="rounded-3xl border border-scanza-border bg-scanza-surface p-8 shadow-scanza-card">
          <div className="mb-5 flex items-center justify-between rounded-xl bg-scanza-bg px-4 py-3">
            <div className="flex items-center gap-3">
              <FileText size={22} className="text-scanza-primary" />
              <div>
                <p className="max-w-[220px] truncate text-sm font-medium text-scanza-text">{file.name}</p>
                <p className="text-xs text-scanza-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            {!uploading && (
              <button onClick={() => setFile(null)} aria-label="Remove file" className="scanza-focus-ring text-scanza-text-muted hover:text-scanza-danger">
                <X size={18} />
              </button>
            )}
          </div>

          {uploading ? (
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-scanza-text-muted">
                <span className="flex items-center gap-2">
                  <Loader2 size={15} className="scanza-uploader-spinner" /> Analyzing your resume...
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-scanza-bg">
                <div className="scanza-uploader-progress-bar h-full rounded-full bg-gradient-to-r from-scanza-primary to-scanza-accent" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <button
              onClick={handleUpload}
              className="scanza-focus-ring w-full rounded-xl bg-scanza-primary py-3 text-sm font-semibold text-white shadow-scanza-card transition-transform hover:scale-[1.02] hover:bg-scanza-primary-hover"
            >
              Analyze My Resume
            </button>
          )}
        </div>
      )}
    </div>
  );
}
