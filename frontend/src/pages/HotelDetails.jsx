import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import Navbar from '../components/Navbar';
import { API_BASE } from '../utils/auth';
import api, { getApiError } from '../utils/api';

const resolveImage = (image) => {
  if (!image) {
    return '/hotel-hero-moole.png';
  }
  if (image.startsWith('http')) {
    return image;
  }
  return `${API_BASE}${image}`;
};

function HotelDetails() {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get(`/api/hotels/${id}`);
        setHotel(data.hotel || null);
        setHalls(data.halls || []);
      } catch (err) {
        setError(getApiError(err, 'Unable to load hotel details'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const heroImage = useMemo(() => {
    if (!hotel) {
      return '/hotel-hero-moole.png';
    }

    const name = String(hotel.hotelName || '').toLowerCase();
    const isMoole = name.includes('moole');

    if (isMoole) {
      return '/hotel-hero-moole.png';
    }

    return resolveImage(hotel.coverImage || halls[0]?.images?.[0]);
  }, [hotel, halls]);

  const scrollToHalls = () => {
    const section = document.getElementById('hotel-halls');
    if (!section) {
      return;
    }

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hasAbout = Boolean(hotel?.description?.trim());
  const hasContact = Boolean(
    hotel?.contactPhone || hotel?.address || hotel?.city
  );

  return (
    <>
      <section className="hh-body hh-details-body"></section>