import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { API_BASE } from '../../utils/auth';
import api, { getApiError } from '../../utils/api';

const AMENITY_OPTIONS = [
  'Sound System',
  'AC',
  'Stage',
  'VIP Room',
  'Catering Space',
  'Parking',
  'Lighting',
  'WiFi',
  'Decoration Setup',
];

const resolveImage = (image) => {
  if (!image) {
    return '';
  }
  if (image.startsWith('http') || image.startsWith('blob:')) {
    return image;
  }
  return `${API_BASE}${image}`;
};

function HallForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    hallName: '',
    capacity: '',
    pricePerDay: '',
    description: '',
    isAvailable: true,
  });
  const [hotel, setHotel] = useState(null);
  const [amenities, setAmenities] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        try {
          const { data: hotelData } = await api.get('/api/hotels/my-hotel');
          setHotel(hotelData.hotel);
        } catch (hotelErr) {
          if (hotelErr.response?.status === 404) {
            setHotel(null);
            setError(
              'No hotel profile found. Register your hotel before adding halls.'
            );
          } else {
            throw hotelErr;
          }
        }

        if (isEdit) {
          const { data: hallsData } = await api.get('/api/halls/my-halls');

          const hall = (hallsData.halls || []).find((item) => item._id === id);
          if (!hall) {
            throw new Error('Hall not found');
          }

          setForm({
            hallName: hall.hallName || '',
            capacity: String(hall.capacity ?? ''),
            pricePerDay: String(hall.pricePerDay ?? ''),
            description: hall.description || '',
            isAvailable: hall.isAvailable !== false,
          });
          setAmenities(hall.amenities || []);
          setExistingImages(hall.images || []);
        }
      } catch (err) {
        setError(getApiError(err, 'Unable to load form data'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isEdit]);

  useEffect(() => {
    const urls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [newFiles]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const toggleAmenity = (amenity) => {
    setAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((item) => item !== amenity)
        : [...prev, amenity]
    );
  };

  const handleFiles = (event) => {
    const files = Array.from(event.target.files || []);
    const capped = files.slice(0, Math.max(0, 5 - newFiles.length));

    if (files.length > capped.length) {
      setError('You can upload a maximum of 5 images.');
    } else {
      setError('');
    }

    setNewFiles((prev) => [...prev, ...capped].slice(0, 5));
    event.target.value = '';
  };