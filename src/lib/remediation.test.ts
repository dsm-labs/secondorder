import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  OrganizationalRiskLevel,
  RemediationPriority,
  RemediationStatus,
  VulnerabilitySeverity,
  type RemediationPriority as RemediationPriorityValue,
} from "../generated/prisma/client";
import {
  aggregateRemediationWorkload,
  calculateApproximateAverageRemediationTimeMs,
  countUniqueCriticalUnresolvedVulnerabilities,
  isRemediationTaskActive,
  isRemediationTaskOverdue,
  rankCriticalUnresolvedTasks,
  sortRemediationTasksForWorkflow,
} from "./remediation";

const currentTime = new Date("2026-09-12T12:00:00.000Z");
const dayInMilliseconds = 24 * 60 * 60 * 1000;

describe("remediation workflow", () => {
  it("marks an unresolved task with a past due date as overdue", () => {
    assert.equal(
      isRemediationTaskOverdue(
        {
          dueDate: new Date("2026-09-11T12:00:00.000Z"),
          status: RemediationStatus.IN_PROGRESS,
        },
        currentTime
      ),
      true
    );
  });

  it("does not mark a future task as overdue", () => {
    assert.equal(
      isRemediationTaskOverdue(
        {
          dueDate: new Date("2026-09-13T12:00:00.000Z"),
          status: RemediationStatus.OPEN,
        },
        currentTime
      ),
      false
    );
  });

  it("does not mark resolved or accepted-risk tasks as overdue", () => {
    const dueDate = new Date("2026-09-01T12:00:00.000Z");

    assert.equal(
      isRemediationTaskOverdue(
        { dueDate, status: RemediationStatus.RESOLVED },
        currentTime
      ),
      false
    );
    assert.equal(
      isRemediationTaskOverdue(
        { dueDate, status: RemediationStatus.ACCEPTED_RISK },
        currentTime
      ),
      false
    );
  });

  it("orders overdue work before due date and then by priority", () => {
    const tasks = [
      {
        id: "resolved",
        title: "Resolved task",
        dueDate: new Date("2026-09-01T12:00:00.000Z"),
        priority: RemediationPriority.CRITICAL,
        status: RemediationStatus.RESOLVED,
      },
      {
        id: "future",
        title: "Future task",
        dueDate: new Date("2026-09-13T12:00:00.000Z"),
        priority: RemediationPriority.CRITICAL,
        status: RemediationStatus.OPEN,
      },
      {
        id: "overdue-low",
        title: "Overdue low-priority task",
        dueDate: new Date("2026-09-11T12:00:00.000Z"),
        priority: RemediationPriority.LOW,
        status: RemediationStatus.OPEN,
      },
      {
        id: "overdue-high",
        title: "Overdue high-priority task",
        dueDate: new Date("2026-09-11T12:00:00.000Z"),
        priority: RemediationPriority.HIGH,
        status: RemediationStatus.IN_PROGRESS,
      },
      {
        id: "overdue-earliest",
        title: "Earliest overdue task",
        dueDate: new Date("2026-09-10T12:00:00.000Z"),
        priority: RemediationPriority.MEDIUM,
        status: RemediationStatus.AWAITING_VALIDATION,
      },
    ];

    const sortedIds = sortRemediationTasksForWorkflow(tasks, currentTime).map(
      (task) => task.id
    );

    assert.deepEqual(sortedIds, [
      "overdue-earliest",
      "overdue-high",
      "overdue-low",
      "resolved",
      "future",
    ]);
  });

  it("excludes resolved and accepted-risk tasks from active work", () => {
    assert.equal(
      isRemediationTaskActive({ status: RemediationStatus.OPEN }),
      true
    );
    assert.equal(
      isRemediationTaskActive({ status: RemediationStatus.RESOLVED }),
      false
    );
    assert.equal(
      isRemediationTaskActive({ status: RemediationStatus.ACCEPTED_RISK }),
      false
    );
  });

  it("counts unique critical unresolved vulnerabilities once", () => {
    const criticalVulnerability = {
      id: "vulnerability-critical",
      severity: VulnerabilitySeverity.CRITICAL,
      riskRecord: null,
    };
    const tasks = [
      {
        status: RemediationStatus.OPEN,
        relatedVulnerability: criticalVulnerability,
      },
      {
        status: RemediationStatus.IN_PROGRESS,
        relatedVulnerability: criticalVulnerability,
      },
      {
        status: RemediationStatus.OPEN,
        relatedVulnerability: {
          id: "vulnerability-risk-critical",
          severity: VulnerabilitySeverity.HIGH,
          riskRecord: {
            organizationalRiskLevel: OrganizationalRiskLevel.CRITICAL,
          },
        },
      },
      {
        status: RemediationStatus.RESOLVED,
        relatedVulnerability: {
          id: "vulnerability-resolved",
          severity: VulnerabilitySeverity.CRITICAL,
          riskRecord: null,
        },
      },
    ];

    assert.equal(countUniqueCriticalUnresolvedVulnerabilities(tasks), 2);
  });

  it("calculates average remediation time from resolved tasks only", () => {
    const createdAt = new Date("2026-09-01T00:00:00.000Z");
    const tasks = [
      {
        createdAt,
        updatedAt: new Date(createdAt.getTime() + 2 * dayInMilliseconds),
        status: RemediationStatus.RESOLVED,
      },
      {
        createdAt,
        updatedAt: new Date(createdAt.getTime() + 4 * dayInMilliseconds),
        status: RemediationStatus.RESOLVED,
      },
      {
        createdAt,
        updatedAt: new Date(createdAt.getTime() + 20 * dayInMilliseconds),
        status: RemediationStatus.IN_PROGRESS,
      },
      {
        createdAt,
        updatedAt: new Date(createdAt.getTime() + 10 * dayInMilliseconds),
        status: RemediationStatus.ACCEPTED_RISK,
      },
    ];

    assert.equal(
      calculateApproximateAverageRemediationTimeMs(tasks),
      3 * dayInMilliseconds
    );
  });

  it("returns no average when there are no resolved tasks", () => {
    assert.equal(
      calculateApproximateAverageRemediationTimeMs([
        {
          createdAt: new Date("2026-09-01T00:00:00.000Z"),
          updatedAt: new Date("2026-09-03T00:00:00.000Z"),
          status: RemediationStatus.IN_PROGRESS,
        },
      ]),
      null
    );
  });

  it("aggregates active workload and overdue counts by user", () => {
    const userA = {
      id: "user-a",
      name: "Alex Analyst",
      department: { name: "Security" },
    };
    const userB = {
      id: "user-b",
      name: "Jordan Admin",
      department: { name: "IT Operations" },
    };
    const tasks = [
      {
        assignedUser: userA,
        dueDate: new Date("2026-09-10T12:00:00.000Z"),
        priority: RemediationPriority.CRITICAL,
        status: RemediationStatus.OPEN,
      },
      {
        assignedUser: userA,
        dueDate: new Date("2026-09-15T12:00:00.000Z"),
        priority: RemediationPriority.HIGH,
        status: RemediationStatus.IN_PROGRESS,
      },
      {
        assignedUser: userA,
        dueDate: new Date("2026-09-01T12:00:00.000Z"),
        priority: RemediationPriority.CRITICAL,
        status: RemediationStatus.RESOLVED,
      },
      {
        assignedUser: userB,
        dueDate: new Date("2026-09-09T12:00:00.000Z"),
        priority: RemediationPriority.MEDIUM,
        status: RemediationStatus.AWAITING_VALIDATION,
      },
      {
        assignedUser: userB,
        dueDate: new Date("2026-09-08T12:00:00.000Z"),
        priority: RemediationPriority.HIGH,
        status: RemediationStatus.ACCEPTED_RISK,
      },
    ];

    assert.deepEqual(aggregateRemediationWorkload(tasks, currentTime), [
      {
        criticalPriorityCount: 1,
        departmentName: "Security",
        highPriorityCount: 1,
        overdueCount: 1,
        totalUnresolvedTasks: 2,
        userId: "user-a",
        userName: "Alex Analyst",
      },
      {
        criticalPriorityCount: 0,
        departmentName: "IT Operations",
        highPriorityCount: 0,
        overdueCount: 1,
        totalUnresolvedTasks: 1,
        userId: "user-b",
        userName: "Jordan Admin",
      },
    ]);
  });

  it("ranks critical work by stored risk, CVSS, then task priority", () => {
    const makeTask = ({
      cvssScore,
      id,
      priority,
      riskScore,
    }: {
      cvssScore: number;
      id: string;
      priority: RemediationPriorityValue;
      riskScore: number;
    }) => ({
      dueDate: new Date("2026-09-20T12:00:00.000Z"),
      id,
      priority,
      status: RemediationStatus.OPEN,
      title: id,
      relatedVulnerability: {
        cvssScore,
        id: `vulnerability-${id}`,
        severity: VulnerabilitySeverity.CRITICAL,
        riskRecord: {
          organizationalRiskLevel: OrganizationalRiskLevel.CRITICAL,
          organizationalRiskScore: riskScore,
        },
      },
    });
    const ranked = rankCriticalUnresolvedTasks([
      makeTask({
        cvssScore: 9.8,
        id: "lower-risk",
        priority: RemediationPriority.CRITICAL,
        riskScore: 8.7,
      }),
      makeTask({
        cvssScore: 8.5,
        id: "higher-risk",
        priority: RemediationPriority.LOW,
        riskScore: 9.2,
      }),
      makeTask({
        cvssScore: 9.1,
        id: "same-risk-higher-cvss",
        priority: RemediationPriority.LOW,
        riskScore: 9,
      }),
      makeTask({
        cvssScore: 8.8,
        id: "same-risk-lower-cvss",
        priority: RemediationPriority.CRITICAL,
        riskScore: 9,
      }),
    ]);

    assert.deepEqual(
      ranked.map((task) => task.id),
      [
        "higher-risk",
        "same-risk-higher-cvss",
        "same-risk-lower-cvss",
        "lower-risk",
      ]
    );
  });
});
