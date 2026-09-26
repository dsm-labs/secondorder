"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  saveRiskAssessment,
  type RiskAssessmentFormState,
} from "@/app/vulnerabilities/[id]/assess-risk/actions";

type RiskAssessmentDefaults = {
  dataSensitivity: string;
  businessImpact: string;
  status: string;
};

type RiskAssessmentFormProps = {
  businessImpactOptions: string[];
  cancelHref: string;
  dataSensitivityOptions: string[];
  defaults: RiskAssessmentDefaults;
  riskStatusOptions: string[];
  submitLabel: string;
  vulnerabilityId: string;
};

const initialState: RiskAssessmentFormState = {
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

export default function RiskAssessmentForm({
  businessImpactOptions,
  cancelHref,
  dataSensitivityOptions,
  defaults,
  riskStatusOptions,
  submitLabel,
  vulnerabilityId,
}: RiskAssessmentFormProps) {
  const saveRiskAssessmentWithId = saveRiskAssessment.bind(null, vulnerabilityId);
  const [state, formAction, pending] = useActionState(
    saveRiskAssessmentWithId,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6 text-slate-700">
      {state.error ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <label className="block text-sm font-medium">
          Data Sensitivity
          <select
            className={fieldClassName}
            defaultValue={defaults.dataSensitivity}
            name="dataSensitivity"
            required
          >
            {dataSensitivityOptions.map((option) => (
              <option key={option} value={option}>
                {formatEnum(option)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Business Impact
          <select
            className={fieldClassName}
            defaultValue={defaults.businessImpact}
            name="businessImpact"
            required
          >
            {businessImpactOptions.map((option) => (
              <option key={option} value={option}>
                {formatEnum(option)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Risk Status
          <select
            className={fieldClassName}
            defaultValue={defaults.status}
            name="status"
            required
          >
            {riskStatusOptions.map((option) => (
              <option key={option} value={option}>
                {formatEnum(option)}
              </option>
            ))}
          </select>
        </label>
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
