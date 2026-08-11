import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api, { getApiError } from '../../utils/api';

const statusLabel = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

function HotelProfile() {
  const [form, setForm] = useState({
    hotelName: '',
    address: '',
    city: '',
    contactPhone: '',
    description: '',
  });
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showApprovalAlert, setShowApprovalAlert] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const { data } = await api.get('/api/hotels/my-hotel');
        const nextHotel = data.hotel;
        setHotel(nextHotel);
        setForm({
          hotelName: nextHotel.hotelName || '',
          address: nextHotel.address || '',
          city: nextHotel.city || '',
          contactPhone: nextHotel.contactPhone || '',
          description: nextHotel.description || '',
        });

        if (
          nextHotel?.verificationStatus === 'approved' &&
          nextHotel.hasSeenApprovalAlert === false
        ) {
          setShowApprovalAlert(true);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setHotel(null);
        } else {
          setError(getApiError(err, 'Unable to load hotel profile'));
        }
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

    const markSeen = async () => {
      try {
        await api.patch('/api/hotels/my-hotel/approval-alert-seen');
        setHotel((prev) =>
          prev ? { ...prev, hasSeenApprovalAlert: true } : prev
        );
      } catch (err) {
        console.error(getApiError(err, 'Failed to mark approval alert seen'));
      }
    };

    const timer = setTimeout(() => {
      setShowApprovalAlert(false);
      markSeen();
    }, 5000);

    return () => clearTimeout(timer);
  }, [showApprovalAlert, hotel?._id]);

  const dismissApprovalAlert = async () => {
    setShowApprovalAlert(false);
    try {
      await api.patch('/api/hotels/my-hotel/approval-alert-seen');
      setHotel((prev) =>
        prev ? { ...prev, hasSeenApprovalAlert: true } : prev
      );
    } catch (err) {
      console.error(getApiError(err, 'Failed to mark approval alert seen'));
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (
      !form.hotelName.trim() ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.contactPhone.trim()
    ) {
      setError('Hotel name, address, city, and contact phone are required.');
      return;
    }

    try {
      setSaving(true);

      const isUpdate = Boolean(hotel);
      const payload = {
        hotelName: form.hotelName.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        contactPhone: form.contactPhone.trim(),
        description: form.description.trim(),
      };

      const { data } = isUpdate
        ? await api.put('/api/hotels/my-hotel', payload)
        : await api.post('/api/hotels', payload);

      setHotel(data.hotel);
      setSuccess(
        isUpdate
          ? 'Hotel profile updated successfully.'
          : 'Hotel registered successfully and is pending approval.'
      );
    } catch (err) {
      setError(getApiError(err, 'Unable to save hotel profile'));
    } finally {
      setSaving(false);
    }
  };