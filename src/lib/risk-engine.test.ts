import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BusinessCriticality,
  BusinessImpact,
  DataSensitivity,
  OrganizationalRiskLevel,
} from "../generated/prisma/client";
import {
  calculateOrganizationalRisk,
  deriveOrganizationalRiskLevel,
} from "./risk-engine";

describe("risk engine", () => {
  it("calculates a very low risk scenario", () => {
    const result = calculateOrganizationalRisk({
      cvssScore: 1,
      assetCriticality: BusinessCriticality.LOW,
      businessImpact: BusinessImpact.LOW,
      dataSensitivity: DataSensitivity.LOW,
      internetExposure: false,
    });

    assert.equal(result.organizationalRiskScore, 1.85);
    assert.equal(result.organizationalRiskLevel, OrganizationalRiskLevel.LOW);
  });

  it("calculates a very high critical scenario", () => {
    const result = calculateOrganizationalRisk({
      cvssScore: 10,
      assetCriticality: BusinessCriticality.CRITICAL,
      businessImpact: BusinessImpact.CRITICAL,
      dataSensitivity: DataSensitivity.CRITICAL,
      internetExposure: true,
    });

    assert.equal(result.organizationalRiskScore, 10);
    assert.equal(
      result.organizationalRiskLevel,
      OrganizationalRiskLevel.CRITICAL
    );
  });

  it("reflects internet-facing versus non-internet-facing exposure", () => {
    const nonInternetFacing = calculateOrganizationalRisk({
      cvssScore: 6,
      assetCriticality: BusinessCriticality.MEDIUM,
      businessImpact: BusinessImpact.MEDIUM,
      dataSensitivity: DataSensitivity.MEDIUM,
      internetExposure: false,
    });
    const internetFacing = calculateOrganizationalRisk({
      cvssScore: 6,
      assetCriticality: BusinessCriticality.MEDIUM,
      businessImpact: BusinessImpact.MEDIUM,
      dataSensitivity: DataSensitivity.MEDIUM,
      internetExposure: true,
    });

    assert.equal(
      internetFacing.organizationalRiskScore -
        nonInternetFacing.organizationalRiskScore,
      0.5
    );
  });

  it("changes risk when business context changes for the same CVSS score", () => {
    const lowContext = calculateOrganizationalRisk({
      cvssScore: 7,
      assetCriticality: BusinessCriticality.LOW,
      businessImpact: BusinessImpact.LOW,
      dataSensitivity: DataSensitivity.LOW,
      internetExposure: false,
    });
    const criticalContext = calculateOrganizationalRisk({
      cvssScore: 7,
      assetCriticality: BusinessCriticality.CRITICAL,
      businessImpact: BusinessImpact.CRITICAL,
      dataSensitivity: DataSensitivity.CRITICAL,
      internetExposure: true,
    });

    assert.equal(lowContext.organizationalRiskScore, 3.95);
    assert.equal(criticalContext.organizationalRiskScore, 8.95);
    assert.equal(lowContext.organizationalRiskLevel, OrganizationalRiskLevel.LOW);
    assert.equal(
      criticalContext.organizationalRiskLevel,
      OrganizationalRiskLevel.CRITICAL
    );
  });

  it("uses exact risk-level boundaries", () => {
    assert.equal(deriveOrganizationalRiskLevel(3.99), OrganizationalRiskLevel.LOW);
    assert.equal(
      deriveOrganizationalRiskLevel(4),
      OrganizationalRiskLevel.MEDIUM
    );
    assert.equal(
      deriveOrganizationalRiskLevel(6.49),
      OrganizationalRiskLevel.MEDIUM
    );
    assert.equal(deriveOrganizationalRiskLevel(6.5), OrganizationalRiskLevel.HIGH);
    assert.equal(
      deriveOrganizationalRiskLevel(8.49),
      OrganizationalRiskLevel.HIGH
    );
    assert.equal(
      deriveOrganizationalRiskLevel(8.5),
      OrganizationalRiskLevel.CRITICAL
    );
  });

  it("never returns a score above 10", () => {
    const result = calculateOrganizationalRisk({
      cvssScore: 10,
      assetCriticality: BusinessCriticality.CRITICAL,
      businessImpact: BusinessImpact.CRITICAL,
      dataSensitivity: DataSensitivity.CRITICAL,
      internetExposure: true,
    });

    assert.ok(result.organizationalRiskScore <= 10);
  });
});
