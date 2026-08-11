import React, { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';

import { getCroppedAvatarBlob } from '../utils/cropImage';

function AvatarCropModal({ imageSrc, onCancel, onComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      const blob = await getCroppedAvatarBlob(imageSrc, croppedAreaPixels);
      const file = new File([blob], `avatar-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });
      const previewUrl = URL.createObjectURL(blob);
      onComplete({ file, previewUrl });
    } catch (err) {
      setError(err.message || 'Unable to crop image');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="avatar-crop-overlay" role="presentation">
      <div
        className="avatar-crop-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-crop-title"
      >
        <div className="avatar-crop-head">
          <h2 id="avatar-crop-title">Reposition &amp; Crop</h2>
          <button
            type="button"
            className="booking-modal-close"
            onClick={onCancel}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="avatar-crop-hint">
          Drag to reposition, then use zoom to crop your photo.
        </p>

        <div className="avatar-crop-stage">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <label className="avatar-zoom-control">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <div className="avatar-crop-actions">
          <button
            type="button"
            className="avatar-crop-cancel"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="customer-gold-btn"
            onClick={handleApply}
            disabled={saving}
          >
            {saving ? 'Applying...' : 'Use Photo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AvatarCropModal;
