import React, { useState } from 'react';

/**
 * StarRating component
 * - View mode: Displays star rating (1-5) with fractional support and review count
 * - Interactive mode: Allows user to click/hover 1-5 stars to select a rating
 */
export function StarRating({
  rating = 0,
  reviewCount = null,
  size = 'md', // 'sm' | 'md' | 'lg'
  interactive = false,
  onChange = null,
  showValue = true,
  showCount = true,
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive ? hoverRating || rating : rating;
  const clampedRating = Math.max(0, Math.min(5, Number(displayRating) || 0));

  const sizeStyles = {
    sm: { starSize: 14, fontSize: '0.8rem', gap: 2 },
    md: { starSize: 18, fontSize: '0.95rem', gap: 4 },
    lg: { starSize: 26, fontSize: '1.25rem', gap: 6 },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  const starLabels = {
    1: 'Poor (1/5)',
    2: 'Fair (2/5)',
    3: 'Good (3/5)',
    4: 'Very Good (4/5)',
    5: 'Excellent (5/5)',
  };

  return (
    <div
      className={`hh-star-rating hh-star-rating-${size}${interactive ? ' is-interactive' : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: currentSize.gap,
      }}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={
        interactive
          ? 'Select star rating'
          : `Rating: ${clampedRating.toFixed(1)} out of 5 stars`
      }
    >
      <div
        className="hh-stars-container"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: currentSize.gap,
        }}
      >
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFull = clampedRating >= starIndex;
          const isHalf = !isFull && clampedRating >= starIndex - 0.5;

          return (
            <button
              key={starIndex}
              type={interactive ? 'button' : undefined}
              disabled={!interactive}
              className={`hh-star-btn${isFull ? ' is-full' : isHalf ? ' is-half' : ' is-empty'}`}
              onClick={() => interactive && onChange && onChange(starIndex)}
              onMouseEnter={() => interactive && setHoverRating(starIndex)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              onFocus={() => interactive && setHoverRating(starIndex)}
              onBlur={() => interactive && setHoverRating(0)}
              title={interactive ? starLabels[starIndex] : undefined}
              aria-label={interactive ? starLabels[starIndex] : undefined}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: interactive ? 'pointer' : 'default',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isFull || isHalf ? '#d99e32' : '#d8d1d6',
                transition: 'transform 0.15s ease, color 0.15s ease',
                transform: interactive && hoverRating >= starIndex ? 'scale(1.2)' : 'scale(1)',
              }}
            >
              <svg
                width={currentSize.starSize}
                height={currentSize.starSize}
                viewBox="0 0 24 24"
                fill={isFull ? 'currentColor' : isHalf ? 'url(#half-star-grad)' : 'none'}
                stroke="currentColor"
                strokeWidth={isFull || isHalf ? '0' : '1.8'}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {isHalf && (
                  <defs>
                    <linearGradient id="half-star-grad">
                      <stop offset="50%" stopColor="#d99e32" />
                      <stop offset="50%" stopColor="#d8d1d6" />
                    </linearGradient>
                  </defs>
                )}
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          );
        })}
      </div>

      {showValue && (
        <span
          className="hh-rating-val"
          style={{
            fontWeight: 700,
            color: '#3a1834',
            fontSize: currentSize.fontSize,
            marginLeft: 4,
          }}
        >
          {clampedRating > 0 ? clampedRating.toFixed(1) : 'New'}
        </span>
      )}

      {showCount && reviewCount !== null && (
        <span
          className="hh-rating-count"
          style={{
            color: '#7a6f78',
            fontSize: currentSize.fontSize,
            marginLeft: 2,
          }}
        >
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      )}

      {interactive && displayRating > 0 && (
        <span
          className="hh-rating-label-hint"
          style={{
            fontSize: '0.85rem',
            color: '#a05286',
            fontWeight: 600,
            marginLeft: 8,
          }}
        >
          {starLabels[displayRating] || ''}
        </span>
      )}
    </div>
  );
}

export default StarRating;
