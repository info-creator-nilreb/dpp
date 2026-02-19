"use client";

import TimeFilterShared, { getDateRange, type TimeFilterProps } from "@/components/dashboard/TimeFilter";

export type { TimeRange } from "@/components/dashboard/TimeFilter";
export { getDateRange };

/**
 * Super Admin Time Filter – reuses shared component with super-admin base path
 */
export default function TimeFilter(props: Omit<TimeFilterProps, "basePath">) {
  return <TimeFilterShared basePath="/super-admin/dashboard" {...props} />;
}
