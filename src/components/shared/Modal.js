import { useEffect, useRef } from 'react';

const Modal = ({ children, onClose }) => {
  const backdropRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    // Scroll backdrop to top after browser autofocus
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (backdropRef.current) backdropRef.current.scrollTop = 0;
      });
    });
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div ref={backdropRef} className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        {children}
      </div>
    </div>
  );
};

export default Modal;