import Link from "next/link";
import {
  AssetStatus,
  BusinessCriticality,
  type Asset,
  type Department,
  type User,
} from "@/generated/prisma/client";

type AssetFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  asset?: Asset;
  departments: Department[];
  users: User[];
  submitLabel: string;
};

const fieldClassName =
  "mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500";

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function AssetForm({
  action,
  asset,
  departments,
  users,
  submitLabel,
}: AssetFormProps) {
  return (
    <form action={action} className="space-y-6 text-slate-700">
      <div className="grid gap-5 lg:grid-cols-2">
        <label className="block text-sm font-medium">
          Name
          <input
            className={fieldClassName}
            defaultValue={asset?.name}
            name="name"
            required
            type="text"
          />
        </label>

        <label className="block text-sm font-medium">
          Asset Type
          <input
            className={fieldClassName}
            defaultValue={asset?.assetType}
            name="assetType"
            required
            type="text"
          />
        </label>

        <label className="block text-sm font-medium">
          IP Address
          <input
            className={fieldClassName}
            defaultValue={asset?.ipAddress ?? ""}
            name="ipAddress"
            type="text"
          />
        </label>

        <label className="block text-sm font-medium">
          Operating System
          <input
            className={fieldClassName}
            defaultValue={asset?.operatingSystem ?? ""}
            name="operatingSystem"
            type="text"
          />
        </label>

        <label className="block text-sm font-medium">
          Department
          <select
            className={fieldClassName}
            defaultValue={asset?.departmentId ?? ""}
            name="departmentId"
            required
          >
            <option disabled value="">
              Select a department
            </option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Owner
          <select
            className={fieldClassName}
            defaultValue={asset?.ownerId ?? ""}
            name="ownerId"
          >
            <option value="">No owner selected</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Business Criticality
          <select
            className={fieldClassName}
            defaultValue={asset?.businessCriticality ?? BusinessCriticality.MEDIUM}
            name="businessCriticality"
            required
          >
            {Object.values(BusinessCriticality).map((criticality) => (
              <option key={criticality} value={criticality}>
                {formatEnum(criticality)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Internet Exposure
          <select
            className={fieldClassName}
            defaultValue={asset?.internetExposure ? "true" : "false"}
            name="internetExposure"
            required
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </label>

        <label className="block text-sm font-medium">
          Status
          <select
            className={fieldClassName}
            defaultValue={asset?.status ?? AssetStatus.ACTIVE}
            name="status"
            required
          >
            {Object.values(AssetStatus).map((status) => (
              <option key={status} value={status}>
                {formatEnum(status)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
        <button
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          type="submit"
        >
          {submitLabel}
        </button>
        <Link
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          href={asset ? `/assets/${asset.id}` : "/assets"}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
