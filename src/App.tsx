import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const images = [
  '/1.png',
  '/2.png', 
  '/3.png',
  '/4.png',
  '/5.png'
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
  const [initialTranslate, setInitialTranslate] = useState({ x: 0, y: 0 });
  const [lastCenter, setLastCenter] = useState({ x: 0, y: 0 });
  const [pinchCenter, setPinchCenter] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    setImageLoaded(false);
  };

  // 更新图片和容器尺寸
  const updateSizes = () => {
    if (imageRef.current && containerRef.current) {
      const imgRect = imageRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setImageSize({ width: imgRect.width, height: imgRect.height });
      setContainerSize({ width: containerRect.width, height: containerRect.height });
    }
  };

  // 处理图片加载完成
  const handleImageLoad = () => {
    setImageLoaded(true);
    updateSizes();
    
    // 确保图片以最高质量显示
    if (imageRef.current) {
      // 强制重绘以确保清晰度
      imageRef.current.style.opacity = '0.99';
      setTimeout(() => {
        if (imageRef.current) {
          imageRef.current.style.opacity = '1';
        }
      }, 10);
    }
  };

  // 计算边界限制
  const getBoundaries = (currentScale: number) => {
    const scaledWidth = imageSize.width * currentScale;
    const scaledHeight = imageSize.height * currentScale;
    
    const maxTranslateX = Math.max(0, (scaledWidth - containerSize.width) / 2);
    const maxTranslateY = Math.max(0, (scaledHeight - containerSize.height) / 2);
    
    return {
      minX: -maxTranslateX,
      maxX: maxTranslateX,
      minY: -maxTranslateY,
      maxY: maxTranslateY
    };
  };

  // 约束位移在边界内
  const constrainTranslate = (x: number, y: number, currentScale: number) => {
    const boundaries = getBoundaries(currentScale);
    return {
      x: Math.max(boundaries.minX, Math.min(boundaries.maxX, x)),
      y: Math.max(boundaries.minY, Math.min(boundaries.maxY, y))
    };
  };

  // 将屏幕坐标转换为图片相对坐标
  const screenToImageCoords = (screenX: number, screenY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;
    
    return {
      x: screenX - centerX,
      y: screenY - centerY
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
      // 计算点击位置作为缩放中心
      const imageCoords = screenToImageCoords(e.clientX, e.clientY);
      const newScale = 2.5;
      
      // 根据点击位置调整位移，使点击点保持在同一位置
      const scaleRatio = newScale / scale;
      const newTranslateX = translateX * scaleRatio - imageCoords.x * (scaleRatio - 1);
      const newTranslateY = translateY * scaleRatio - imageCoords.y * (scaleRatio - 1);
      
      const constrained = constrainTranslate(newTranslateX, newTranslateY, newScale);
      
      setScale(newScale);
      setTranslateX(constrained.x);
      setTranslateY(constrained.y);
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
      setInitialTranslate({ x: translateX, y: translateY });
      
      const center = getCenter(e.touches);
      const imageCoords = screenToImageCoords(center.x, center.y);
      setPinchCenter(imageCoords);
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
        const imageCoords = screenToImageCoords(touch.clientX, touch.clientY);
        const newScale = 2.5;
        
        // 根据点击位置调整位移
        const scaleRatio = newScale / scale;
        const newTranslateX = translateX * scaleRatio - imageCoords.x * (scaleRatio - 1);
        const newTranslateY = translateY * scaleRatio - imageCoords.y * (scaleRatio - 1);
        
        const constrained = constrainTranslate(newTranslateX, newTranslateY, newScale);
        
        setScale(newScale);
        setTranslateX(constrained.x);
        setTranslateY(constrained.y);
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
      
      // 计算缩放比例
      const scaleChange = currentDistance / initialDistance;
      const newScale = Math.max(0.8, Math.min(5, initialScale * scaleChange));
      
      // 计算基于缩放中心的位移调整
      const scaleRatio = newScale / initialScale;
      let newTranslateX = initialTranslate.x * scaleRatio - pinchCenter.x * (scaleRatio - 1);
      let newTranslateY = initialTranslate.y * scaleRatio - pinchCenter.y * (scaleRatio - 1);
      
      // 添加手指移动的位移（相对于初始中心点）
      const centerDeltaX = currentCenter.x - lastCenter.x;
      const centerDeltaY = currentCenter.y - lastCenter.y;
      newTranslateX += centerDeltaX;
      newTranslateY += centerDeltaY;
      
      // 约束在边界内
      const constrained = constrainTranslate(newTranslateX, newTranslateY, newScale);
      
      setScale(newScale);
      setTranslateX(constrained.x);
      setTranslateY(constrained.y);
      
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      
      if (isDragging && scale > 1) {
        // 单指拖拽（放大状态下）
        const deltaX = touch.clientX - dragStart.x;
        const deltaY = touch.clientY - dragStart.y;
        
        const newTranslateX = translateX + deltaX;
        const newTranslateY = translateY + deltaY;
        
        // 约束在边界内
        const constrained = constrainTranslate(newTranslateX, newTranslateY, scale);
        
        setTranslateX(constrained.x);
        setTranslateY(constrained.y);
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

  // 鼠标滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const mouseCoords = screenToImageCoords(e.clientX, e.clientY);
    const scaleStep = 0.1;
    const newScale = Math.max(0.8, Math.min(5, scale + (e.deltaY < 0 ? scaleStep : -scaleStep)));
    
    if (newScale !== scale) {
      // 根据鼠标位置调整位移
      const scaleRatio = newScale / scale;
      const newTranslateX = translateX * scaleRatio - mouseCoords.x * (scaleRatio - 1);
      const newTranslateY = translateY * scaleRatio - mouseCoords.y * (scaleRatio - 1);
      
      const constrained = constrainTranslate(newTranslateX, newTranslateY, newScale);
      
      setScale(newScale);
      setTranslateX(constrained.x);
      setTranslateY(constrained.y);
    }
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

  // 监听图片加载和窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      updateSizes();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    resetZoom();
    // 延迟更新尺寸，确保图片已加载
    setTimeout(updateSizes, 100);
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
                <span className="button-text">开启 Tap Here</span>
                <div className="button-shine"></div>
              </button>
              
              <div className="instruction-text">
                ✨ 轻触按钮开启 ✨
              </div>
              <div className="instruction-text">
                ✨ Tap to Explore ✨
              </div>
            </div>
          </div>
        </div>
      )}
      
      {(showImageContainer || !showWelcome) && (
        <div 
          ref={containerRef}
          className={`image-container ${showImageContainer ? 'show' : ''}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          <div 
            className="image-wrapper"
            style={{
              transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
              transition: isPinching || isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          >
            <img 
              ref={imageRef}
              src={images[currentIndex]} 
              alt={`图片 ${currentIndex + 1}`}
              className="main-image"
              onDoubleClick={handleDoubleClick}
              onLoad={handleImageLoad}
              draggable={false}
              loading="eager"
              decoding="sync"
              style={{
                opacity: imageLoaded ? 1 : 0.8,
                filter: imageLoaded ? 'none' : 'blur(0.5px)',
                transition: 'opacity 0.3s ease, filter 0.3s ease'
              }}
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
              重置 Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default App;