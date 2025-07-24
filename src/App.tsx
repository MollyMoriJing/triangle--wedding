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
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  const [touchEnd, setTouchEnd] = useState<{x: number, y: number} | null>(null);
  const [lastTouchMove, setLastTouchMove] = useState<{x: number, y: number} | null>(null);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const [isPinching, setIsPinching] = useState(false);
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);

  // 最小滑动距离
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

  // 限制拖拽边界
  const constrainTranslate = (x: number, y: number, currentScale: number) => {
    if (currentScale <= 1) return { x: 0, y: 0 };
    
    // 根据缩放比例计算最大拖拽距离
    const maxTranslate = Math.min(200 * currentScale, 400);
    
    return {
      x: Math.max(-maxTranslate, Math.min(maxTranslate, x)),
      y: Math.max(-maxTranslate, Math.min(maxTranslate, y))
    };
  };

  // 计算两点间距离
  const getDistance = (touches: React.TouchList) => {
    const [touch1, touch2] = Array.from(touches);
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  // 双击放大
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (scale === 1) {
      setScale(2);
    } else {
      resetZoom();
    }
  };

  // 处理触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    const currentTime = new Date().getTime();
    const doubleTapDelay = currentTime - lastTap;
    
    if (e.touches.length === 2) {
      // 双指操作
      setIsPinching(true);
      setInitialDistance(getDistance(e.touches));
      setInitialScale(scale);
    } else if (e.touches.length === 1) {
      // 单指操作
      const touch = e.targetTouches[0];
      const touchPoint = { x: touch.clientX, y: touch.clientY };
      setTouchEnd(null);
      setTouchStart(touchPoint);
      setLastTouchMove(touchPoint);
      
      // 检查双击
      if (doubleTapDelay < 300 && doubleTapDelay > 0) {
        e.preventDefault();
        if (scale === 1) {
          setScale(2);
        } else {
          resetZoom();
        }
      }
    }
    
    setLastTap(currentTime);
  };

  // 处理触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching) {
      // 双指缩放
      e.preventDefault();
      const currentDistance = getDistance(e.touches);
      const scaleChange = currentDistance / initialDistance;
      const newScale = Math.max(0.5, Math.min(4, initialScale * scaleChange));
      setScale(newScale);
    } else if (e.touches.length === 1 && scale > 1) {
      // 单指拖拽（放大状态下）
      e.preventDefault();
      const touch = e.touches[0];
      const currentTouch = { x: touch.clientX, y: touch.clientY };
      
      if (lastTouchMove) {
        const deltaX = currentTouch.x - lastTouchMove.x;
        const deltaY = currentTouch.y - lastTouchMove.y;
        
        // 增加移动敏感度，根据缩放比例调整移动速度
        const moveMultiplier = Math.min(scale, 2);
        const newX = translateX + deltaX * moveMultiplier;
        const newY = translateY + deltaY * moveMultiplier;
        
        // 应用边界限制
        const constrained = constrainTranslate(newX, newY, scale);
        setTranslateX(constrained.x);
        setTranslateY(constrained.y);
      }
      
      setLastTouchMove(currentTouch);
    } else if (e.touches.length === 1 && scale === 1) {
      // 单指滑动切换图片
      const touch = e.targetTouches[0];
      setTouchEnd({ x: touch.clientX, y: touch.clientY });
    }
  };

  // 处理触摸结束
  const handleTouchEnd = () => {
    // 滑动逻辑（只在未放大且未捏合时生效）
    if (scale === 1 && !isPinching && touchStart && touchEnd) {
      const distance = touchStart.x - touchEnd.x;
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
    setLastTouchMove(null);
  };

  // 键盘导航
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

  // 重置缩放当切换图片时
  useEffect(() => {
    resetZoom();
  }, [currentIndex]);

  return (
    <div className="app">
      <div 
        className={`image-container ${scale > 1 ? 'zoomed' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className={`image-wrapper ${scale > 1 ? 'zoomed' : ''}`}
          style={{
            transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
            transition: isPinching || scale > 1 ? 'none' : 'transform 0.3s ease'
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
        
        {/* 导航按钮 - 只在未放大时显示 */}
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
        
        {/* 指示器 - 只在未放大时显示 */}
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
        
        {/* 计数器 */}
        <div className="counter">
          {currentIndex + 1} / {images.length}
          {scale > 1 && <span className="zoom-info"> • {Math.round(scale * 100)}%</span>}
        </div>

        {/* 重置按钮 - 只在放大时显示 */}
        {scale > 1 && (
          <button className="reset-btn" onClick={resetZoom}>
            重置
          </button>
        )}
      </div>
    </div>
  );
};

export default App;