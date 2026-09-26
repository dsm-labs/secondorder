import { archiveAsset } from "@/app/assets/actions";
import SubmitButton from "@/components/ui/submit-button";

type ArchiveAssetFormProps = {
  assetId: string;
};

export default function ArchiveAssetForm({ assetId }: ArchiveAssetFormProps) {
  const archiveAssetWithId = archiveAsset.bind(null, assetId);

  return (
    <form
      action={archiveAssetWithId}
      className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4"
    >
      <p className="text-sm font-semibold text-slate-950">Archive asset</p>
      <p className="mt-2 text-sm text-slate-600">
        Archiving keeps this asset in the database and changes its status to
        Archived.
      </p>
      <label className="mt-4 flex gap-2 text-sm text-slate-700">
        <input
          className="mt-1 h-4 w-4 rounded border-slate-300"
          name="confirmArchive"
          required
          type="checkbox"
        />
        I understand this will mark the asset as archived.
      </label>
      <SubmitButton
        className="mt-4 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800 transition hover:bg-red-50 disabled:opacity-60"
        pendingLabel="Archiving..."
      >
        Archive Asset
      </SubmitButton>
    </form>
  );
}
