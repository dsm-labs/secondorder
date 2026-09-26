"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createRemediationTask,
  updateRemediationTask,
  type RemediationTaskFormState,
} from "@/app/remediation/actions";

type VulnerabilityOption = {
  id: string;
  identifier: string;
  title: string;
  affectedAsset: {
    id: string;
    name: string;
  };
};

type UserOption = {
  id: string;
  name: string;
  role: string;
};

type RemediationTaskFormValues = {
  id?: string;
  title: string;
  description: string;
  assignedUserId: string;
  relatedVulnerabilityId: string;
  priority: string;
  dueDate: string;
  status: string;
  resolutionNotes: string;
};

type RemediationTaskFormProps = {
  cancelHref: string;
  priorityOptions: string[];
  statusOptions: string[];
  submitLabel: string;
  task?: RemediationTaskFormValues;
  users: UserOption[];
  vulnerabilities: VulnerabilityOption[];
};

const initialState: RemediationTaskFormState = {
  error: "",
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

export default function RemediationTaskForm({
  cancelHref,
  priorityOptions,
  statusOptions,
  submitLabel,
  task,
  users,
  vulnerabilities,
}: RemediationTaskFormProps) {
  const action = task?.id
    ? updateRemediationTask.bind(null, task.id)
    : createRemediationTask;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [selectedVulnerabilityId, setSelectedVulnerabilityId] = useState(
    task?.relatedVulnerabilityId ?? ""
  );
  const selectedVulnerability = vulnerabilities.find(
    (vulnerability) => vulnerability.id === selectedVulnerabilityId
  );

  return (
    <form action={formAction} className="space-y-6 text-slate-700">
      {state.error ? (
        <div
          aria-live="polite"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="block text-sm font-medium lg:col-span-2">
          Task Title
          <input
            className={fieldClassName}
            defaultValue={task?.title}
            maxLength={160}
            name="title"
            required
            type="text"
          />
        </label>

        <label className="block text-sm font-medium lg:col-span-2">
          Description
          <textarea
            className={`${fieldClassName} min-h-28`}
            defaultValue={task?.description}
            maxLength={4000}
            name="description"
          />
        </label>

        <label className="block text-sm font-medium">
          Related Vulnerability
          <select
            className={fieldClassName}
            name="relatedVulnerabilityId"
            onChange={(event) => setSelectedVulnerabilityId(event.target.value)}
            required
            value={selectedVulnerabilityId}
          >
            <option disabled value="">
              Select a vulnerability
            </option>
            {vulnerabilities.map((vulnerability) => (
              <option key={vulnerability.id} value={vulnerability.id}>
                {vulnerability.identifier}: {vulnerability.title}
              </option>
            ))}
          </select>
          <span className="mt-2 block text-xs font-normal text-slate-500">
            Affected asset: {selectedVulnerability?.affectedAsset.name ?? "Select a vulnerability"}
          </span>
        </label>

        <label className="block text-sm font-medium">
          Assigned User
          <select
            className={fieldClassName}
            defaultValue={task?.assignedUserId ?? ""}
            name="assignedUserId"
            required
          >
            <option disabled value="">
              Select a user
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({formatEnum(user.role)})
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Priority
          <select
            className={fieldClassName}
            defaultValue={task?.priority ?? "MEDIUM"}
            name="priority"
            required
          >
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {formatEnum(priority)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Due Date
          <input
            className={fieldClassName}
            defaultValue={task?.dueDate}
            name="dueDate"
            required
            type="date"
          />
        </label>

        <label className="block text-sm font-medium">
          Status
          <select
            className={fieldClassName}
            defaultValue={task?.status ?? "OPEN"}
            name="status"
            required
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {formatEnum(status)}
              </option>
            ))}
          </select>
        </label>

        {task ? (
          <label className="block text-sm font-medium lg:col-span-2">
            Resolution Notes
            <textarea
              className={`${fieldClassName} min-h-28`}
              defaultValue={task.resolutionNotes}
              maxLength={4000}
              name="resolutionNotes"
            />
          </label>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
        <button
          aria-disabled={pending}
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={pending}
          type="submit"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
        <Link
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          href={cancelHref}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
