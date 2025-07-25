import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const images = [
  '/1.png',
  '/2.png', 
  '/3.png',
  '/4.png'
];

const App: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [curtainOpening, setCurtainOpening] = useState(false);
  const [welcomeFadingOut, setWelcomeFadingOut] = useState(false);
  const [showImageContainer, setShowImageContainer] = useState(false);
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
  const [lastCenter, setLastCenter] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // 最小滑动距离
  const minSwipeDistance = 50;

  // 打开窗帘
  const openCurtain = () => {
    setCurtainOpening(true);
    
    // 窗帘动画完成后开始淡出欢迎屏幕
    setTimeout(() => {
      setWelcomeFadingOut(true);
    }, 2500); // 窗帘动画持续2.5秒
    
    // 欢迎屏幕开始淡出时显示图片容器
    setTimeout(() => {
      setShowImageContainer(true);
    }, 2800);
    
    // 完全隐藏欢迎屏幕
    setTimeout(() => {
      setShowWelcome(false);
    }, 4000);
  };

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

  // 计算两点间距离
  const getDistance = (touches: React.TouchList) => {
    const [touch1, touch2] = Array.from(touches);
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  // 计算两点中心点
  const getCenter = (touches: React.TouchList) => {
    const [touch1, touch2] = Array.from(touches);
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
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
    e.preventDefault();
    const currentTime = new Date().getTime();
    const doubleTapDelay = currentTime - lastTap;
    
    if (e.touches.length === 2) {
      // 双指操作 - 缩放和拖拽
      setIsPinching(true);
      setIsDragging(false);
      setInitialDistance(getDistance(e.touches));
      setInitialScale(scale);
      const center = getCenter(e.touches);
      setLastCenter(center);
    } else if (e.touches.length === 1) {
      // 单指操作
      const touch = e.touches[0];
      setTouchEnd(null);
      setTouchStart(touch.clientX);
      setDragStart({ x: touch.clientX, y: touch.clientY });
      setIsDragging(scale > 1); // 只有在放大状态下才允许单指拖拽
      
      // 检查双击（只在未放大时）
      if (doubleTapDelay < 300 && doubleTapDelay > 0 && scale === 1) {
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
    e.preventDefault();
    
    if (e.touches.length === 2 && isPinching) {
      // 双指缩放和移动
      const currentDistance = getDistance(e.touches);
      const currentCenter = getCenter(e.touches);
      
      // 缩放
      const scaleChange = currentDistance / initialDistance;
      const newScale = Math.max(0.5, Math.min(4, initialScale * scaleChange));
      setScale(newScale);
      
      // 移动（基于双指中心点的变化）
      const deltaX = currentCenter.x - lastCenter.x;
      const deltaY = currentCenter.y - lastCenter.y;
      
      setTranslateX(prev => prev + deltaX);
      setTranslateY(prev => prev + deltaY);
      setLastCenter(currentCenter);
      
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      
      if (isDragging && scale > 1) {
        // 单指拖拽（放大状态下）
        const deltaX = touch.clientX - dragStart.x;
        const deltaY = touch.clientY - dragStart.y;
        
        setTranslateX(prev => prev + deltaX * 0.8);
        setTranslateY(prev => prev + deltaY * 0.8);
        setDragStart({ x: touch.clientX, y: touch.clientY });
      } else if (scale === 1) {
        // 单指滑动切换图片（未放大状态）
        setTouchEnd(touch.clientX);
      }
    }
  };

  // 处理触摸结束
  const handleTouchEnd = () => {
    // 滑动逻辑（只在未放大且未进行其他操作时生效）
    if (scale === 1 && !isPinching && !isDragging) {
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
    
    // 重置状态
    setIsPinching(false);
    setIsDragging(false);
    setTouchEnd(null);
    setTouchStart(null);
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

  useEffect(() => {
    resetZoom();
  }, [currentIndex]);

  return (
    <div className="app">
      {showWelcome && (
        <div className={`welcome-screen ${curtainOpening ? 'opening' : ''} ${welcomeFadingOut ? 'fade-out' : ''}`}>
          <div className="background-decoration">
            <div className="heart heart-1">💙</div>
            <div className="heart heart-2">💙</div>
            <div className="heart heart-3">💙</div>
            <div className="heart heart-4">💙</div>
            <div className="heart heart-5">💙</div>
            <div className="heart heart-6">💙</div>
          </div>

          <div className={`curtain-container ${curtainOpening ? 'opening' : ''}`}>
            <div className="curtain curtain-left"></div>
            <div className="curtain curtain-right"></div>
            
            <div className="curtain-content">
              <div className="wedding-title">
                <h1>💕 Yida & Fang 💕</h1>
                <h2>Wedding Ceremony</h2>
                <div className="date-text">08.02.2025</div>
              </div>
              
              <button className="open-button" onClick={openCurtain}>
                <span className="button-text">点击开启</span>
                <div className="button-shine"></div>
              </button>
              
              <div className="instruction-text">
                ✨ 轻触按钮开启 ✨
              </div>
            </div>
          </div>
        </div>
      )}
      
      {(showImageContainer || !showWelcome) && (
        <div 
          className={`image-container ${showImageContainer ? 'show' : ''}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
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
              重置
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default App;