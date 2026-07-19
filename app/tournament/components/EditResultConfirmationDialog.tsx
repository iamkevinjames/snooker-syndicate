interface EditResultConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function EditResultConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
}: EditResultConfirmationDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-green-800/30 bg-[#101a13] p-5">
        <h3 className="text-base font-semibold text-white">Update Result?</h3>
        <p className="mt-2 text-sm text-[#9fb59d]">
          This match already has a result. Do you want to update it?
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-green-700/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#9fb59d] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border border-green-600 bg-green-700 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-white hover:bg-green-600"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
