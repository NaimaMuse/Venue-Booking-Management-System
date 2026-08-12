import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { API_BASE, formatDate, getFirstName, getUser } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';

const statusClass = {
  pending: 'status-badge-pending',
  accepted: 'status-badge-accepted',
  confirmed: 'status-badge-confirmed',
  cancelled: 'status-badge-cancelled',
  rejected: 'status-badge-rejected',
};

const CHART_COLORS = {
  pending: '#d4b37a',
  accepted: '#4a2040',
  rejected: '#b42318',
};

const resolveImage = (image) => {
  if (!image) {
    return '/banner01.png';
  }
  if (image.startsWith('http')) {
    return image;
  }
  return `${API_BASE}${image}`;
};

const IconBuilding = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 20V7L12 3L20 7V20"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    <path d="M9 20V13H15V20" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 3.5V7M16 3.5V7M4 10H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

function OwnerOverview() {
  const user = getUser();
  const location = useLocation();
  const [hotel, setHotel] = useState(null);
  const [halls, setHalls] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(location.state?.toast || '');
  const [showApprovalAlert, setShowApprovalAlert] = useState(false);

  useEffect(() => {
    if (location.state?.toast) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timer = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const [hotelResult, hallsResult, bookingsResult] = await Promise.all([
          api.get('/api/hotels/my-hotel').catch((err) => err),
          api.get('/api/halls/my-halls').catch((err) => err),
          api.get('/api/bookings/owner-requests').catch((err) => err),
        ]);

        if (hotelResult instanceof Error || hotelResult.isAxiosError) {
          if (hotelResult.response?.status !== 404) {
            throw new Error(getApiError(hotelResult, 'Failed to load hotel'));
          }
        } else {
          const nextHotel = hotelResult.data.hotel || null;
          setHotel(nextHotel);

          if (
            nextHotel?.verificationStatus === 'approved' &&
            nextHotel.hasSeenApprovalAlert === false
          ) {
            setShowApprovalAlert(true);
          }
        }

        if (hallsResult instanceof Error || hallsResult.isAxiosError) {
          const status = hallsResult.response?.status;
          if (status !== 403 && status !== 404) {
            throw new Error(getApiError(hallsResult, 'Failed to load halls'));
          }
        } else {
          setHalls(hallsResult.data.halls || []);
        }

        if (bookingsResult instanceof Error || bookingsResult.isAxiosError) {
          setBookings([]);
        } else {
          setBookings(bookingsResult.data.bookings || []);
        }
      } catch (err) {
        setError(getApiError(err, 'Unable to load dashboard'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!showApprovalAlert || !hotel?._id) {
      return undefined;
    }

    const timer = setTimeout(async () => {
      setShowApprovalAlert(false);
      try {
        await api.patch('/api/hotels/my-hotel/approval-alert-seen');
        setHotel((prev) =>
          prev ? { ...prev, hasSeenApprovalAlert: true } : prev
        );
      } catch (err) {
        console.error(getApiError(err, 'Failed to mark approval alert seen'));
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [showApprovalAlert, hotel?._id]);

  const metrics = useMemo(() => {
    const totalHalls = halls.filter((hall) => hall.isAvailable !== false).length;
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const upcomingVisits = bookings.filter(
      (b) => b.status === 'accepted' && b.appointment?.scheduledDate
    ).length;
    return { totalHalls, pending, upcomingVisits };
  }, [halls, bookings]);

  const monthOverview = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const thisMonth = bookings.filter((booking) => {
      const date = new Date(booking.createdAt || booking.eventDate);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    const accepted = thisMonth.filter(
      (b) => b.status === 'accepted' || b.status === 'confirmed'
    );
    const revenue = accepted.reduce(
      (sum, booking) => sum + (Number(booking.depositAmount) || 0),
      0
    );
    const occupancy =
      halls.length > 0
        ? Math.min(100, Math.round((accepted.length / halls.length) * 100))
        : 0;

    return {
      newBookings: thisMonth.length,
      acceptedBookings: accepted.length,
      revenue,
      occupancy,
    };
  }, [bookings, halls.length]);

  const statusChart = useMemo(() => {
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const accepted = bookings.filter(
      (b) => b.status === 'accepted' || b.status === 'confirmed'
    ).length;
    const rejected = bookings.filter(
      (b) => b.status === 'rejected' || b.status === 'cancelled'
    ).length;
    const total = pending + accepted + rejected;

    return [
      { name: 'Pending', value: pending, key: 'pending' },
      { name: 'Accepted', value: accepted, key: 'accepted' },
      { name: 'Rejected', value: rejected, key: 'rejected' },
    ].map((item) => ({
      ...item,
      percent: total ? Math.round((item.value / total) * 100) : 0,
    }));
  }, [bookings]);

  const recent = bookings.slice(0, 5);
  const status = hotel?.verificationStatus;
  const canAddHalls = status === 'approved';
  const chartHasData = statusChart.some((item) => item.value > 0);

  return (
    <div className="customer-page owner-dashboard">
      {toast && <div className="customer-toast">{toast}</div>}

      {showApprovalAlert && (
        <div className="owner-approval-flash" role="status">
          <span>
            Congratulations! Your hotel has been approved by the admin. You can
            now manage your venue and add halls.
          </span>
          <button
            type="button"
            className="owner-alert-dismiss"
            aria-label="Dismiss approval alert"
            onClick={async () => {
              setShowApprovalAlert(false);
              try {
                await api.patch('/api/hotels/my-hotel/approval-alert-seen');
                setHotel((prev) =>
                  prev ? { ...prev, hasSeenApprovalAlert: true } : prev
                );
              } catch (err) {
                console.error(
                  getApiError(err, 'Failed to mark approval alert seen')
                );
              }
            }}
          >
            ×
          </button>
        </div>
      )}
