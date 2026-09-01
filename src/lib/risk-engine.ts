import {
  BusinessCriticality,
  OrganizationalRiskLevel,
  type BusinessCriticality as BusinessCriticalityValue,
  type BusinessImpact as BusinessImpactValue,
  type DataSensitivity as DataSensitivityValue,
  type OrganizationalRiskLevel as OrganizationalRiskLevelValue,
} from "../generated/prisma/client";

type RiskFactorName =
  | "CVSS / Technical Severity"
  | "Asset Criticality"
  | "Business Impact"
  | "Data Sensitivity"
  | "Internet Exposure";

export type RiskCalculationInput = {
  cvssScore: number;
  assetCriticality: BusinessCriticalityValue;
  businessImpact: BusinessImpactValue;
  dataSensitivity: DataSensitivityValue;
  internetExposure: boolean;
};

export type RiskFactorContribution = {
  factor: RiskFactorName;
  rawValue: string;
  normalizedScore: number;
  weight: number;
  weightedScore: number;
};

export type RiskCalculationResult = {
  organizationalRiskScore: number;
  organizationalRiskLevel: OrganizationalRiskLevelValue;
  explanation: string;
  factors: RiskFactorContribution[];
};

export type RiskAssessmentFreshnessInput = RiskCalculationInput & {
  storedOrganizationalRiskScore: number;
  storedOrganizationalRiskLevel: OrganizationalRiskLevelValue;
};

export type RiskAssessmentFreshnessResult = {
  isCurrent: boolean;
  calculatedRisk: RiskCalculationResult;
  scoreDifference: number;
  scoreMatches: boolean;
  levelMatches: boolean;
  label: "Assessment Current" | "Needs Reassessment";
  explanation: string;
};

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function assertScoreInRange(score: number) {
  if (!Number.isFinite(score) || score < 0 || score > 10) {
    throw new Error("CVSS score must be between 0.0 and 10.0.");
  }
}

function getCategoricalScore(
  value: BusinessCriticalityValue | BusinessImpactValue | DataSensitivityValue
) {
  if (value === BusinessCriticality.LOW) {
    return 2.5;
  }

  if (value === BusinessCriticality.MEDIUM) {
    return 5;
  }

  if (value === BusinessCriticality.HIGH) {
    return 7.5;
  }

  return 10;
}

export function deriveOrganizationalRiskLevel(
  score: number
): OrganizationalRiskLevelValue {
  if (score <= 3.99) {
    return OrganizationalRiskLevel.LOW;
  }

  if (score <= 6.49) {
    return OrganizationalRiskLevel.MEDIUM;
  }

  if (score <= 8.49) {
    return OrganizationalRiskLevel.HIGH;
  }

  return OrganizationalRiskLevel.CRITICAL;
}

export function calculateOrganizationalRisk(
  input: RiskCalculationInput
): RiskCalculationResult {
  assertScoreInRange(input.cvssScore);

  const assetCriticalityScore = getCategoricalScore(input.assetCriticality);
  const businessImpactScore = getCategoricalScore(input.businessImpact);
  const dataSensitivityScore = getCategoricalScore(input.dataSensitivity);
  const internetExposureScore = input.internetExposure ? 10 : 0;

  const factors: RiskFactorContribution[] = [
    {
      factor: "CVSS / Technical Severity",
      rawValue: input.cvssScore.toFixed(1),
      normalizedScore: input.cvssScore,
      weight: 0.35,
      weightedScore: input.cvssScore * 0.35,
    },
    {
      factor: "Asset Criticality",
      rawValue: formatEnum(input.assetCriticality),
      normalizedScore: assetCriticalityScore,
      weight: 0.25,
      weightedScore: assetCriticalityScore * 0.25,
    },
    {
      factor: "Business Impact",
      rawValue: formatEnum(input.businessImpact),
      normalizedScore: businessImpactScore,
      weight: 0.2,
      weightedScore: businessImpactScore * 0.2,
    },
    {
      factor: "Data Sensitivity",
      rawValue: formatEnum(input.dataSensitivity),
      normalizedScore: dataSensitivityScore,
      weight: 0.15,
      weightedScore: dataSensitivityScore * 0.15,
    },
    {
      factor: "Internet Exposure",
      rawValue: input.internetExposure ? "Internet-facing" : "Not internet-facing",
      normalizedScore: internetExposureScore,
      weight: 0.05,
      weightedScore: internetExposureScore * 0.05,
    },
  ];

  const rawScore =
    input.cvssScore * 0.35 +
    assetCriticalityScore * 0.25 +
    businessImpactScore * 0.2 +
    dataSensitivityScore * 0.15 +
    internetExposureScore * 0.05;
  const score = Math.min(10, Math.max(0, roundToTwo(rawScore)));
  const level = deriveOrganizationalRiskLevel(score);
  const exposureText = input.internetExposure
    ? "is internet-facing"
    : "is not internet-facing";

  return {
    organizationalRiskScore: score,
    organizationalRiskLevel: level,
    explanation:
      `The organizational risk score is ${score.toFixed(2)} ` +
      `(${formatEnum(level)}) because the vulnerability has a CVSS score of ` +
      `${input.cvssScore.toFixed(1)}, the affected asset has ` +
      `${formatEnum(input.assetCriticality)} business criticality and ` +
      `${exposureText}, the selected data sensitivity is ` +
      `${formatEnum(input.dataSensitivity)}, and the selected business impact is ` +
      `${formatEnum(input.businessImpact)}.`,
    factors,
  };
}

export function evaluateRiskAssessmentFreshness(
  input: RiskAssessmentFreshnessInput
): RiskAssessmentFreshnessResult {
  const calculatedRisk = calculateOrganizationalRisk(input);
  const storedScore = roundToTwo(input.storedOrganizationalRiskScore);
  const scoreDifference = roundToTwo(
    Math.abs(storedScore - calculatedRisk.organizationalRiskScore)
  );
  const scoreMatches = scoreDifference <= 0.01;
  const levelMatches =
    input.storedOrganizationalRiskLevel ===
    calculatedRisk.organizationalRiskLevel;
  const isCurrent = scoreMatches && levelMatches;

  return {
    isCurrent,
    calculatedRisk,
    scoreDifference,
    scoreMatches,
    levelMatches,
    label: isCurrent ? "Assessment Current" : "Needs Reassessment",
    explanation: isCurrent
      ? "The stored assessment matches the current risk-engine result for this vulnerability and asset context."
      : "The stored assessment does not match the current risk-engine result. Technical or business context may have changed, or this may be a legacy seeded assessment.",
  };
}
