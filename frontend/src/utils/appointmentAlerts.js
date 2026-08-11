const STORAGE_KEY = 'hhf_seen_appointment_ids';

const readSeenIds = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (error) {
    return [];
  }
};

const writeSeenIds = (ids) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids.map(String))]));
  window.dispatchEvent(new Event('appointment-alerts-changed'));
};

export const isAppointmentBooking = (booking) =>
  booking?.status === 'accepted' &&
  Boolean(
    booking.appointment?.scheduledDate || booking.appointment?.locationNotes
  );

export const getAppointmentIds = (bookings = []) =>
  bookings.filter(isAppointmentBooking).map((booking) => String(booking._id));

export const getNewAppointmentCount = (bookings = []) => {
  const seen = new Set(readSeenIds());
  return getAppointmentIds(bookings).filter((id) => !seen.has(id)).length;
};

export const markAppointmentsSeen = (bookings = []) => {
  const currentIds = getAppointmentIds(bookings);
  if (currentIds.length === 0) {
    writeSeenIds(readSeenIds());
    return;
  }

  const merged = [...readSeenIds(), ...currentIds];
  writeSeenIds(merged);
};

export const clearAppointmentAlertsStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('appointment-alerts-changed'));
};
