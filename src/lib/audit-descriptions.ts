function cleanLabel(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 120);
}

function quoted(value: string) {
  return `"${cleanLabel(value)}"`;
}

export const auditDescriptions = {
  signedIn: () => "Signed in.",
  signedOut: () => "Signed out.",
  assetCreated: (name: string) => `Created asset ${quoted(name)}.`,
  assetUpdated: (name: string) => `Updated asset ${quoted(name)}.`,
  assetArchived: (name: string) => `Archived asset ${quoted(name)}.`,
  vulnerabilityCreated: (identifier: string) =>
    `Created vulnerability ${quoted(identifier)}.`,
  vulnerabilityUpdated: (identifier: string) =>
    `Updated vulnerability ${quoted(identifier)}.`,
  riskCreated: (identifier: string) =>
    `Created risk assessment for vulnerability ${quoted(identifier)}.`,
  riskUpdated: (identifier: string) =>
    `Reassessed risk for vulnerability ${quoted(identifier)}.`,
  remediationTaskCreated: (title: string) =>
    `Created remediation task ${quoted(title)}.`,
  remediationTaskUpdated: (title: string) =>
    `Updated remediation task ${quoted(title)}.`,
} as const;
