import React, { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import ReportToolbar from '../../components/admin/ReportToolbar';
import {
  applyReportRangeChange,
  exportReportsCsv,
  getBookingDisplayStats,
  useAdminReports,
} from '../../hooks/useAdminReports';

const IconHotels = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 19.5V6.8C4 5.8 4.8 5 5.8 5H14.2C15.2 5 16 5.8 16 6.8V19.5"
      stroke="currentColor"
      strokeWidth="1.7"
    />
    <path d="M16 10H19.2C20.2 10 21 10.8 21 11.8V19.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M3.5 19.5H20.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M8 9H10M8 12.5H10M8 16H10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconHalls = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M4 10H20" stroke="currentColor" strokeWidth="1.7" />
    <path d="M9 14H15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconBookings = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4.5" y="5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 3.5V6.5M16 3.5V6.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M4.5 10H19.5" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

function MiniDonut({ data, total }) {
  if (!data.length) {
    return <p className="ops-mini-empty">No data</p>;
  }

  return (
    <div className="ops-mini-donut">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={34}
            outerRadius={48}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="ops-mini-donut-center">
        <strong>{total}</strong>
      </div>
    </div>
  );
}
