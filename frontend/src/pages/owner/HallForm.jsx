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

const resolveVideo = (video) => {
  if (!video) {
    return '';
  }
  if (video.startsWith('http') || video.startsWith('blob:')) {
    return video;
  }
  return `${API_BASE}${video}`;
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
  const [existingVideo, setExistingVideo] = useState('');
  const [newVideoFile, setNewVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
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
          setExistingVideo(hall.videoUrl || '');
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

  useEffect(() => {
    if (!newVideoFile) {
      setVideoPreview('');
      return undefined;
    }

    const url = URL.createObjectURL(newVideoFile);
    setVideoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [newVideoFile]);

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

  const removeNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoFile = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      return;
    }
    setError('');
    setNewVideoFile(file);
    event.target.value = '';
  };

  const removeVideoFile = () => {
    setNewVideoFile(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.hallName.trim() || !form.capacity || !form.pricePerDay) {
      setError('Hall name, capacity, and price per day are required.');
      return;
    }

    try {
      setSaving(true);

      const body = new FormData();
      body.append('hallName', form.hallName.trim());
      body.append('capacity', String(form.capacity));
      body.append('pricePerDay', String(form.pricePerDay));
      body.append('description', form.description.trim());
      body.append('amenities', JSON.stringify(amenities));
      body.append('isAvailable', String(form.isAvailable));
      newFiles.forEach((file) => body.append('images', file));
      if (newVideoFile) {
        body.append('video', newVideoFile);
      }

      if (isEdit) {
        await api.put(`/api/halls/${id}`, body);
      } else {
        await api.post('/api/halls', body);
      }

      navigate('/owner/halls');
    } catch (err) {
      setError(getApiError(err, 'Unable to save hall'));
    } finally {
      setSaving(false);
    }
  };

  const hotelApproved = hotel?.verificationStatus === 'approved';
  const canSubmit = Boolean(hotel) && (isEdit || hotelApproved);
  const coverPreview =
    previews[0] ||
    (newFiles.length === 0 && existingImages[0]
      ? resolveImage(existingImages[0])
      : '');
  const photoCount = newFiles.length || existingImages.length;
  const remainingSlots = Math.max(0, 5 - newFiles.length);
  const hallVideo = videoPreview || resolveVideo(existingVideo);

  return (
    <div className="customer-page hall-form-page">
      <section className="customer-page-header hall-form-hero">
        <div>
          <p className="customer-eyebrow">
            {isEdit ? 'Edit Hall' : 'New Hall'}
          </p>
          <h1>{isEdit ? 'Update Hall Listing' : 'Add New Hall'}</h1>
          <p>
            {isEdit
              ? 'Refresh photos, pricing, and amenities so customers see the best version of your venue.'
              : 'Create a polished hall listing with capacity, pricing, amenities, and gallery photos.'}
          </p>
        </div>
        <Link to="/owner/halls" className="hall-form-back-btn">
          Back to Halls
        </Link>
      </section>

      {loading && <p className="customer-status">Loading form...</p>}

      {!loading && hotel && hotel.verificationStatus === 'pending' && (
        <div className="owner-status-banner owner-status-pending">
          Your hotel <strong>{hotel.hotelName}</strong> is still pending admin
          approval. You can prepare details, but halls go live only after
          approval.
        </div>
      )}

      {!loading && (
        <div className="hall-form-layout">
          <section className="customer-panel hall-form-main">
            <div className="customer-panel-head">
              <h2>Hall details</h2>
              <span className="hall-form-step-hint">
                {amenities.length} amenities · {photoCount} photos
              </span>
            </div>

            <form className="profile-form hall-form" onSubmit={handleSubmit}>
              {error && <p className="auth-error">{error}</p>}

              <div className="hall-form-hotel-chip">
                <span>Hotel</span>
                <strong>
                  {hotel
                    ? `${hotel.hotelName}${hotel.city ? ` · ${hotel.city}` : ''}`
                    : 'No hotel registered'}
                </strong>
              </div>

              <label className="hall-form-full">
                Hall Name
                <input
                  type="text"
                  name="hallName"
                  value={form.hallName}
                  onChange={handleChange}
                  placeholder="e.g. Grand Banquet Hall"
                  required
                />
              </label>

              <div className="hall-form-grid">
                <label>
                  Capacity
                  <div className="hall-form-input-wrap">
                    <input
                      type="number"
                      min="1"
                      name="capacity"
                      value={form.capacity}
                      onChange={handleChange}
                      placeholder="150"
                      required
                    />
                    <em>guests</em>
                  </div>
                </label>
                <label>
                  Price Per Day
                  <div className="hall-form-input-wrap is-price">
                    <em>$</em>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      name="pricePerDay"
                      value={form.pricePerDay}
                      onChange={handleChange}
                      placeholder="1000"
                      required
                    />
                  </div>
                </label>
              </div>

              <label className="hall-form-full">
                Description
                <textarea
                  name="description"
                  rows="5"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the hall layout, decor, lighting, and the events it suits best..."
                />
              </label>

              <div className="owner-amenities-block hall-form-full">
                <div className="hall-form-section-head">
                  <p className="owner-field-label">Amenities</p>
                  <span>Select all that apply</span>
                </div>
                <div className="owner-amenity-options">
                  {AMENITY_OPTIONS.map((amenity) => {
                    const selected = amenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        className={`owner-amenity-chip${selected ? ' is-selected' : ''}`}
                        onClick={() => toggleAmenity(amenity)}
                      >
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="hall-form-availability">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={form.isAvailable}
                  onChange={handleChange}
                />
                <span>
                  <strong>Available for booking</strong>
                  <em>Customers can request this hall when it is active.</em>
                </span>
              </label>

              <div className="hall-form-upload hall-form-full">
                <div className="hall-form-section-head">
                  <p className="owner-field-label">Gallery images</p>
                  <span>Up to 5 photos · {remainingSlots} left</span>
                </div>

                <label className="hall-form-dropzone">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    multiple
                    hidden
                    onChange={handleFiles}
                    disabled={remainingSlots === 0}
                  />
                  <strong>Choose images</strong>
                  <span>PNG, JPG, or WEBP. Best with wide venue photos.</span>
                </label>

                {isEdit && (
                  <p className="profile-upload-hint">
                    Uploading new images replaces the previous gallery.
                  </p>
                )}

                {(existingImages.length > 0 || previews.length > 0) && (
                  <div className="owner-image-previews hall-form-previews">
                    {newFiles.length === 0 &&
                      existingImages.map((image) => (
                        <img key={image} src={resolveImage(image)} alt="" />
                      ))}
                    {previews.map((src, index) => (
                      <div key={src} className="owner-preview-item">
                        <img src={src} alt="" />
                        <button
                          type="button"
                          onClick={() => removeNewFile(index)}
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="hall-form-upload hall-form-full">
                <div className="hall-form-section-head">
                  <p className="owner-field-label">Hall video</p>
                  <span>Optional · 1 short MP4, WEBM, or MOV file</span>
                </div>

                <label className="hall-form-dropzone">
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,.mov"
                    hidden
                    onChange={handleVideoFile}
                  />
                  <strong>{hallVideo ? 'Replace video' : 'Choose video'}</strong>
                  <span>Show the space, decor, entrance, or seating layout.</span>
                </label>

                {hallVideo && (
                  <div className="hall-form-video-preview">
                    <video src={hallVideo} controls preload="metadata" />
                    {newVideoFile && (
                      <button
                        type="button"
                        className="hall-form-remove-video"
                        onClick={removeVideoFile}
                      >
                        Remove selected video
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="hall-form-actions">
                <Link to="/owner/halls" className="owner-schedule-btn">
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="customer-gold-btn profile-save-btn"
                  disabled={saving || !canSubmit}
                >
                  {saving
                    ? 'Saving...'
                    : isEdit
                      ? 'Save Changes'
                      : 'Create Hall'}
                </button>
              </div>
            </form>
          </section>

          <aside className="customer-panel hall-form-preview">
            <div className="customer-panel-head">
              <h2>Live preview</h2>
            </div>

            <div className="hall-preview-card">
              <div
                className="hall-preview-cover"
                style={
                  coverPreview
                    ? { backgroundImage: `url(${coverPreview})` }
                    : undefined
                }
              >
                {!coverPreview && <span>Add a cover photo</span>}
              </div>
              {hallVideo && (
                <div className="hall-preview-video-wrap">
                  <video src={hallVideo} controls preload="metadata" />
                </div>
              )}
              <div className="hall-preview-body">
                <p className="hall-preview-hotel">
                  {hotel?.hotelName || 'Your hotel'}
                </p>
                <h3>{form.hallName.trim() || 'Hall name'}</h3>
                <div className="hall-preview-meta">
                  <span>
                    {form.capacity ? `${form.capacity} guests` : 'Capacity'}
                  </span>
                  <span>
                    {form.pricePerDay
                      ? `$${form.pricePerDay}/day`
                      : 'Price / day'}
                  </span>
                </div>
                <p className="hall-preview-copy">
                  {form.description.trim() ||
                    'Your hall description will appear here for customers.'}
                </p>
                {amenities.length > 0 && (
                  <div className="hall-preview-amenities">
                    {amenities.slice(0, 4).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                    {amenities.length > 4 && (
                      <span>+{amenities.length - 4}</span>
                    )}
                  </div>
                )}
                <span
                  className={`hall-preview-status${
                    form.isAvailable ? '' : ' is-inactive'
                  }`}
                >
                  {form.isAvailable ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <ul className="hall-preview-checklist">
              <li className={form.hallName.trim() ? 'is-done' : ''}>
                Hall name
              </li>
              <li className={form.capacity && form.pricePerDay ? 'is-done' : ''}>
                Capacity and price
              </li>
              <li className={amenities.length > 0 ? 'is-done' : ''}>
                Amenities selected
              </li>
              <li className={photoCount > 0 ? 'is-done' : ''}>Photos added</li>
              <li className={hallVideo ? 'is-done' : ''}>Video added</li>
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}

export default HallForm;


