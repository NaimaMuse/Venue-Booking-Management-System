const PENDING_BOOKING_KEY = 'hhf_pending_booking';

export const savePendingBooking = (draft) => {
  sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(draft));
};

export const getPendingBooking = () => {
  try {
    const raw = sessionStorage.getItem(PENDING_BOOKING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearPendingBooking = () => {
  sessionStorage.removeItem(PENDING_BOOKING_KEY);
};

export const submitPendingBookingIfAny = async (apiClient) => {
  const draft = getPendingBooking();
  if (!draft?.hallId || !draft?.eventDate || !draft?.guestCount) {
    return null;
  }

  await apiClient.post('/api/bookings', {
    hallId: draft.hallId,
    eventDate: draft.eventDate,
    guestCount: Number(draft.guestCount),
    specialNotes: draft.specialNotes || undefined,
  });

  clearPendingBooking();
  return draft;
};
