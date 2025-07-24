import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const images = [
  '/1.png',
  '/2.png', 
  '/3.png',
  '/4.png'
];

const App: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const [isPinching, setIsPinching] = useState(false);
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);
  const minSwipeDistance = 50;

  const nextImage = () => {
    if (scale === 1) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      resetZoom();
    }
  };

  const prevImage = () => {
    if (scale === 1) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      resetZoom();
    }
  };

  const goToImage = (index: number) => {
    if (scale === 1) {
      setCurrentIndex(index);
      resetZoom();
    }
  };

  const resetZoom = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  const getDistance = (touches: React.TouchList) => {
    const [touch1, touch2] = Array.from(touches);
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (scale === 1) {
      setScale(2);
    } else {
      resetZoom();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 500 && tapLength > 0) {
      e.preventDefault();
      if (scale === 1) {
        setScale(2);
      } else {
        resetZoom();
      }
    }
    setLastTap(currentTime);

    if (scale === 1 && !isPinching) {
      if (!touchStart || !touchEnd) return;
      
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      if (isLeftSwipe) {
        nextImage();
      } else if (isRightSwipe) {
        prevImage();
      }
    }
    
    setIsPinching(false);
    setTouchEnd(null);
    setTouchStart(null);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      setInitialDistance(getDistance(e.touches));
      setInitialScale(scale);
    } else if (e.touches.length === 1) {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches);
      const scaleChange = currentDistance / initialDistance;
      const newScale = Math.max(0.5, Math.min(4, initialScale * scaleChange));
      setScale(newScale);
    } else if (e.touches.length === 1 && scale > 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - (touchStart || 0);
      const deltaY = touch.clientY - (touchStart || 0);
      
      setTranslateX(prev => prev + deltaX * 0.5);
      setTranslateY(prev => prev + deltaY * 0.5);
    } else if (e.touches.length === 1) {
      setTouchEnd(e.targetTouches[0].clientX);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (scale === 1) {
        if (e.key === 'ArrowLeft') {
          prevImage();
        } else if (e.key === 'ArrowRight') {
          nextImage();
        }
      }
      if (e.key === 'Escape') {
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [scale]);

  useEffect(() => {
    resetZoom();
  }, [currentIndex]);

  return (
    <div className="app">
      <div 
        className="image-container"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="image-wrapper"
          style={{
            transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
            transition: isPinching ? 'none' : 'transform 0.3s ease'
          }}
        >
          <img 
            ref={imageRef}
            src={images[currentIndex]} 
            alt={`图片 ${currentIndex + 1}`}
            className="main-image"
            onDoubleClick={handleDoubleClick}
            onLoad={() => resetZoom()}
          />
        </div>
        
        {scale === 1 && (
          <>
            <button className="nav-btn prev-btn" onClick={prevImage}>
              &#8249;
            </button>
            <button className="nav-btn next-btn" onClick={nextImage}>
              &#8250;
            </button>
          </>
        )}
        
        {scale === 1 && (
          <div className="indicators">
            {images.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToImage(index)}
              />
            ))}
          </div>
        )}
        
        <div className="counter">
          {currentIndex + 1} / {images.length}
          {scale > 1 && <span className="zoom-info"> • {Math.round(scale * 100)}%</span>}
        </div>

        {scale > 1 && (
          <button className="reset-btn" onClick={resetZoom}>
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default App;