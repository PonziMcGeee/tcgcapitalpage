'use client';

// Estrellas: solo lectura (value) o para elegir nota (onChange).
export default function Stars({ value = 0, onChange, size = 20 }) {
  return (
    <span className="stars" role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const llena = n <= Math.round(value);
        const star = (
          <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={llena ? 'star on' : 'star'}>
            <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" strokeLinejoin="round" />
          </svg>
        );
        return onChange ? (
          <button
            key={n}
            type="button"
            className="star-btn"
            onClick={() => onChange(n)}
            aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
            aria-checked={n === value}
            role="radio"
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </span>
  );
}
