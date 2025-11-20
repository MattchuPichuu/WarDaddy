import React, { useEffect, useRef, useState } from 'react';

interface IntroVideoProps {
  onComplete: () => void;
}

const IntroVideo: React.FC<IntroVideoProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Auto-play video
    video.play().catch(err => {
      console.error('Auto-play failed:', err);
      // If autoplay fails, skip to app after 2 seconds
      setTimeout(onComplete, 2000);
    });

    // Handle video end
    const handleEnded = () => {
      setFadeOut(true);
      setTimeout(onComplete, 500); // Fade out duration
    };

    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('ended', handleEnded);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <video
        ref={videoRef}
        className="max-w-full max-h-full object-contain"
        muted
        playsInline
      >
        <source src="/War_Daddy_GIF_Creation.mp4" type="video/mp4" />
      </video>

      {/* Skip button */}
      <button
        onClick={() => {
          setFadeOut(true);
          setTimeout(onComplete, 500);
        }}
        className="absolute bottom-8 right-8 text-slate-400 hover:text-white text-sm uppercase tracking-wider transition-colors opacity-50 hover:opacity-100"
      >
        Skip Intro →
      </button>
    </div>
  );
};

export default IntroVideo;
