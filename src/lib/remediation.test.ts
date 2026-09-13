import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RemediationPriority,
  RemediationStatus,
} from "../generated/prisma/client";
import {
  isRemediationTaskOverdue,
  sortRemediationTasksForWorkflow,
} from "./remediation";

const currentTime = new Date("2026-09-12T12:00:00.000Z");

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
});
