import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  APPLICATION_TIME_ZONE,
  formatDateInputValue,
  formatDisplayDate,
  formatDisplayTimestamp,
  formatIsoCalendarDate,
  formatNumericDisplayDate,
} from "./date-format";

describe("date formatting", () => {
  it("uses the configured Eastern timezone", () => {
    assert.equal(APPLICATION_TIME_ZONE, "America/New_York");
    assert.equal(
      formatDisplayDate("2026-07-15T02:30:00.000Z"),
      "Jul 14, 2026"
    );
    assert.equal(
      formatNumericDisplayDate("2026-07-15T02:30:00.000Z"),
      "07/14/2026"
    );
    assert.equal(
      formatDateInputValue("2026-07-15T02:30:00.000Z"),
      "2026-07-14"
    );
  });

  it("shows EST for winter timestamps", () => {
    assert.equal(
      formatDisplayTimestamp("2026-01-15T17:00:00.000Z"),
      "Jan 15, 2026, 12:00 PM EST"
    );
  });

  it("shows EDT for summer timestamps", () => {
    assert.equal(
      formatDisplayTimestamp("2026-07-15T16:00:00.000Z"),
      "Jul 15, 2026, 12:00 PM EDT"
    );
  });

  it("handles the spring daylight-saving transition", () => {
    assert.equal(
      formatDisplayTimestamp("2026-03-08T06:59:00.000Z"),
      "Mar 8, 2026, 1:59 AM EST"
    );
    assert.equal(
      formatDisplayTimestamp("2026-03-08T07:00:00.000Z"),
      "Mar 8, 2026, 3:00 AM EDT"
    );
  });

  it("preserves validated ISO calendar dates", () => {
    assert.equal(
      formatIsoCalendarDate("2026-09-25T00:00:00.000Z"),
      "Sep 25, 2026"
    );
  });
});
