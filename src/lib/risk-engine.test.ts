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
  evaluateRiskAssessmentFreshness,
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

  it("factor contributions add up to the final score", () => {
    const result = calculateOrganizationalRisk({
      cvssScore: 8.8,
      assetCriticality: BusinessCriticality.HIGH,
      businessImpact: BusinessImpact.CRITICAL,
      dataSensitivity: DataSensitivity.MEDIUM,
      internetExposure: true,
    });
    const contributionTotal = result.factors.reduce(
      (total, factor) => total + factor.weightedScore,
      0
    );

    assert.equal(
      Math.round(contributionTotal * 100) / 100,
      result.organizationalRiskScore
    );
  });

  it("marks a matching stored assessment as current", () => {
    const freshness = evaluateRiskAssessmentFreshness({
      cvssScore: 8,
      assetCriticality: BusinessCriticality.HIGH,
      businessImpact: BusinessImpact.HIGH,
      dataSensitivity: DataSensitivity.MEDIUM,
      internetExposure: true,
      storedOrganizationalRiskScore: 7.43,
      storedOrganizationalRiskLevel: OrganizationalRiskLevel.HIGH,
    });

    assert.equal(freshness.isCurrent, true);
    assert.equal(freshness.label, "Assessment Current");
  });

  it("marks a mismatching stored score as needing reassessment", () => {
    const freshness = evaluateRiskAssessmentFreshness({
      cvssScore: 8,
      assetCriticality: BusinessCriticality.HIGH,
      businessImpact: BusinessImpact.HIGH,
      dataSensitivity: DataSensitivity.MEDIUM,
      internetExposure: true,
      storedOrganizationalRiskScore: 5.25,
      storedOrganizationalRiskLevel: OrganizationalRiskLevel.MEDIUM,
    });

    assert.equal(freshness.isCurrent, false);
    assert.equal(freshness.label, "Needs Reassessment");
    assert.equal(freshness.scoreDifference, 2.18);
  });

  it("shows different contribution breakdowns for the same CVSS with different business context", () => {
    const lowerBusinessContext = calculateOrganizationalRisk({
      cvssScore: 8,
      assetCriticality: BusinessCriticality.LOW,
      businessImpact: BusinessImpact.LOW,
      dataSensitivity: DataSensitivity.LOW,
      internetExposure: false,
    });
    const higherBusinessContext = calculateOrganizationalRisk({
      cvssScore: 8,
      assetCriticality: BusinessCriticality.CRITICAL,
      businessImpact: BusinessImpact.CRITICAL,
      dataSensitivity: DataSensitivity.CRITICAL,
      internetExposure: true,
    });

    assert.notEqual(
      lowerBusinessContext.organizationalRiskScore,
      higherBusinessContext.organizationalRiskScore
    );
    assert.notDeepEqual(
      lowerBusinessContext.factors,
      higherBusinessContext.factors
    );
  });
});
