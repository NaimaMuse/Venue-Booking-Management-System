import React, { useEffect, useMemo, useState } from 'react';

import { formatDate, getAvatarUrl, getFirstName } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';

const getNameLetter = (fullName = '') => {
  const first = getFirstName(fullName);
  return first.charAt(0).toUpperCase() || 'C';
};

const statusClass = {
  pending: 'status-badge-pending',
  accepted: 'status-badge-accepted',
  confirmed: 'status-badge-confirmed',
  cancelled: 'status-badge-cancelled',
  rejected: 'status-badge-rejected',
};

const statusLabel = {
  pending: 'Pending',
  accepted: 'Accepted',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

const IconTotal = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

const IconPending = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const IconAccepted = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
    <path
      d="M8.5 12.2L11 14.7L15.5 9.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconConfirmed = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M7 4.5H17C18.1 4.5 19 5.4 19 6.5V19L12 15.8L5 19V6.5C5 5.4 5.9 4.5 7 4.5Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [scheduleBooking, setScheduleBooking] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    scheduledDate: '',
    locationNotes: '',
  });
  const [scheduleError, setScheduleError] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [confirmBooking, setConfirmBooking] = useState(null);
  const [confirmForm, setConfirmForm] = useState({
    depositAmount: '',
    depositPaid: true,
    agreementNotes: '',
  });
  const [confirmError, setConfirmError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get('/api/bookings/owner-requests');
      setBookings(data.bookings || []);
    } catch (err) {
      setError(getApiError(err, 'Unable to load booking requests'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const updateStatus = async (bookingId, status) => {
    try {
      setBusyId(bookingId);
      setError('');

      const { data } = await api.patch(`/api/bookings/${bookingId}/status`, {
        status,
      });

      setBookings((prev) =>
        prev.map((item) => (item._id === bookingId ? data.booking : item))
      );

      if (status === 'accepted') {
        const booking = data.booking;
        setScheduleBooking(booking);
        setScheduleForm({
          scheduledDate: booking.appointment?.scheduledDate
            ? new Date(booking.appointment.scheduledDate)
                .toISOString()
                .slice(0, 16)
            : '',
          locationNotes: booking.appointment?.locationNotes || '',
        });
        setScheduleError('');
      }
    } catch (err) {
      setError(getApiError(err, 'Unable to update booking status'));
    } finally {
      setBusyId('');
    }
  };

  const openScheduleModal = (booking) => {
    setScheduleBooking(booking);
    setScheduleForm({
      scheduledDate: booking.appointment?.scheduledDate
        ? new Date(booking.appointment.scheduledDate).toISOString().slice(0, 16)
        : '',
      locationNotes: booking.appointment?.locationNotes || '',
    });
    setScheduleError('');
  };

  const openConfirmModal = (booking) => {
    setConfirmBooking(booking);
    setConfirmForm({
      depositAmount: booking.depositAmount ? String(booking.depositAmount) : '',
      depositPaid: true,
      agreementNotes: booking.agreementNotes || '',
    });
    setConfirmError('');
  };

  const handleScheduleSubmit = async (event) => {
    event.preventDefault();
    if (!scheduleBooking) {
      return;
    }

    if (!scheduleForm.scheduledDate) {
      setScheduleError('Inspection date and time are required.');
      return;
    }

    try {
      setScheduling(true);
      setScheduleError('');

      const { data } = await api.patch(
        `/api/bookings/${scheduleBooking._id}/appointment`,
        {
          scheduledDate: scheduleForm.scheduledDate,
          locationNotes: scheduleForm.locationNotes.trim(),
        }
      );

      setBookings((prev) =>
        prev.map((item) =>
          item._id === scheduleBooking._id ? data.booking : item
        )
      );
      setScheduleBooking(null);
    } catch (err) {
      setScheduleError(getApiError(err, 'Unable to schedule visit'));
    } finally {
      setScheduling(false);
    }
  };

  const handleConfirmSubmit = async (event) => {
    event.preventDefault();
    if (!confirmBooking) {
      return;
    }

    if (!confirmForm.depositPaid) {
      setConfirmError('Toggle deposit paid to confirm the booking.');
      return;
    }

    if (
      confirmForm.depositAmount === '' ||
      Number(confirmForm.depositAmount) <= 0
    ) {
      setConfirmError('Enter the deposit amount collected.');
      return;
    }