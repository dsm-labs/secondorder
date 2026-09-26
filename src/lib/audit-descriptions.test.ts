import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { auditDescriptions } from "./audit-descriptions";

describe("audit descriptions", () => {
  it("builds concise deterministic descriptions", () => {
    assert.equal(auditDescriptions.signedIn(), "Signed in.");
    assert.equal(auditDescriptions.signedOut(), "Signed out.");
    assert.equal(
      auditDescriptions.assetCreated("Customer Portal"),
      'Created asset "Customer Portal".'
    );
    assert.equal(
      auditDescriptions.vulnerabilityUpdated("CVE-DEMO-001"),
      'Updated vulnerability "CVE-DEMO-001".'
    );
    assert.equal(
      auditDescriptions.riskUpdated("CVE-DEMO-001"),
      'Reassessed risk for vulnerability "CVE-DEMO-001".'
    );
  });

  it("normalizes entity labels without accepting record bodies", () => {
    assert.equal(
      auditDescriptions.remediationTaskCreated("  Patch\ncustomer   portal  "),
      'Created remediation task "Patch customer portal".'
    );
  });
});
