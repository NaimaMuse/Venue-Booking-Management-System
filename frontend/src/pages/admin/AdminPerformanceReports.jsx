import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import ReportToolbar from '../../components/admin/ReportToolbar';
import {
  applyReportRangeChange,
  exportReportsCsv,
  getBookingDisplayStats,
  money,
  useAdminReports,
} from '../../hooks/useAdminReports';

function AdminPerformanceReports() {
  const [range, setRange] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const filter = {
    range,
    from: range === 'custom' ? from : '',
    to: range === 'custom' ? to : '',
  };
  const { reports, loading, error } = useAdminReports(filter);
  const bookingStats = useMemo(
    () => getBookingDisplayStats(reports.bookings),
    [reports.bookings]
  );