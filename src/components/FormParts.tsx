import React, { useEffect, useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { ModalButton } from "./CustomButtons";
import icons from "../constants/icon";

/* =====================================================================
   Shared building blocks for every form, so they all look like the
   vehicle registration form: white rounded modal, labels above inputs,
   dashed photo box, grey footer with Cancel + a dark main button.
   ===================================================================== */

export const inputStyles =
  "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400";

export const labelStyles = "block text-sm font-semibold text-gray-700 mb-1";

/* ---------------- Modal shell ---------------- */

interface FormModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  isView?: boolean;
  isSubmitting?: boolean;
  submitLabel: string;
  submittingLabel?: string;
  cancelLabel?: string;
  maxWidth?: string; // e.g. "max-w-3xl"
  children: React.ReactNode;
}

export const FormModal = ({
  open,
  title,
  onClose,
  onSubmit,
  isView = false,
  isSubmitting = false,
  submitLabel,
  submittingLabel = "Processing...",
  cancelLabel,
  maxWidth = "max-w-3xl",
  children,
}: FormModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-1300 flex justify-center items-center p-4">
      <form
        onSubmit={onSubmit}
        className={`bg-white w-full ${maxWidth} max-h-full overflow-auto rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <ModalButton type="button" onclick={onClose} />
        </div>

        <div className="p-6">{children}</div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all"
          >
            {cancelLabel ?? (isView ? "Close" : "Cancel")}
          </button>

          {!isView && (
            <button
              disabled={isSubmitting}
              type="submit"
              className="flex-2 px-4 py-2.5 rounded-lg bg-gray-900 text-white font-bold hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {submittingLabel}
                </>
              ) : (
                submitLabel
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

/* ---------------- Labeled field ---------------- */

export const Field = ({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={className}>
    <label className={labelStyles}>{label}</label>
    {children}
    {error && <p className="text-red-500 text-[10px] mt-1 font-bold">{error}</p>}
  </div>
);

/* ---------------- Photo upload box ---------------- */

export const PhotoUpload = ({
  label,
  previewUrl,
  emptyText = "No image selected",
  isView = false,
  wide = false, // short and wide, good for IDs and signatures
  fit = "cover",
  inputProps,
}: {
  label: string;
  previewUrl?: string | null;
  emptyText?: string;
  isView?: boolean;
  wide?: boolean;
  fit?: "cover" | "contain";
  inputProps: UseFormRegisterReturn;
}) => (
  <div className="w-full flex flex-col items-center">
    <label className={labelStyles}>{label}</label>

    <div
      className={`relative group w-full ${
        wide ? "h-40" : "aspect-square"
      } border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex flex-col items-center justify-center transition-all hover:border-blue-400`}
    >
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={label}
          className={`w-full h-full ${fit === "contain" ? "object-contain p-2" : "object-cover"}`}
        />
      ) : (
        <div className="text-center p-4">
          <icons.add className="text-3xl text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">{emptyText}</p>
        </div>
      )}

      {!isView && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <p className="text-white text-xs font-bold">Change Image</p>
        </div>
      )}
    </div>

    {!isView && (
      <input
        type="file"
        accept="image/*"
        {...inputProps}
        className="mt-3 text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer w-full"
      />
    )}
  </div>
);

/* ---------------- Preview of a file the user just picked ---------------- */

export const useFilePreview = (file: File | undefined) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
};