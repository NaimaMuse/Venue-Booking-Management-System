import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import Navbar from '../components/Navbar';
import { API_BASE } from '../utils/auth';
import api, { getApiError } from '../utils/api';

const resolveImage = (image) => {
  if (!image) {
    return '/banner01.png';
  }
  if (image.startsWith('http')) {
    return image;
  }
  return `${API_BASE}${image}`;
};

const emptyFilters = { q: '', minCapacity: '', maxPrice: '' };

function Hotels() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q')?.trim() || '';

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [capacityTerm, setCapacityTerm] = useState('');
  const [maxPriceTerm, setMaxPriceTerm] = useState('');

  const [filters, setFilters] = useState({
    ...emptyFilters,
    q: initialQuery,
  });

  useEffect(() => {
    const nextQuery = searchParams.get('q')?.trim() || '';
    setSearchTerm(nextQuery);
    setFilters((prev) => ({ ...prev, q: nextQuery }));
  }, [searchParams]);

  const hasActiveFilters = Boolean(
    filters.q || filters.minCapacity || filters.maxPrice
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const params = {};

        if (filters.q) {
          params.q = filters.q;
        }

        if (filters.minCapacity) {
          params.minCapacity = filters.minCapacity;
        }

        if (filters.maxPrice) {
          params.maxPrice = filters.maxPrice;
        }

        const { data } = await api.get('/api/hotels', {
          params: Object.keys(params).length ? params : undefined,
        });

        setHotels(data.hotels || []);
      } catch (err) {
        setError(getApiError(err, 'Unable to load hotels'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filters]);

  const handleSearch = (event) => {
    event.preventDefault();

    setFilters({
      q: searchTerm.trim(),
      minCapacity: capacityTerm.trim(),
      maxPrice: maxPriceTerm.trim(),
    });
  };

  const handleClear = () => {
    setSearchTerm('');
    setCapacityTerm('');
    setMaxPriceTerm('');
    setFilters(emptyFilters);
  };