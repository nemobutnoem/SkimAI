import React, { useState, useEffect } from 'react';

// Number animation hook
export function useCountUp(endValue, duration = 1500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let animationFrame;
    const startValue = 0; // Always start from 0 for the wow effect on mount/update

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function (easeOutCubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      setValue(startValue + (endValue - startValue) * easeProgress);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      } else {
        setValue(endValue);
      }
    };

    if (endValue > 0) {
      animationFrame = window.requestAnimationFrame(step);
    } else {
      setValue(0);
    }
    
    return () => window.cancelAnimationFrame(animationFrame);
  }, [endValue, duration]);

  return value;
}

// Number display component
export function AnimatedNumber({ value, format = (v) => Math.round(v), duration = 1500 }) {
  const current = useCountUp(value, duration);
  return <>{format(current)}</>;
}

// Typewriter component
export function TypewriterText({ text, speed = 30 }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      return;
    }
    
    setDisplayedText('');
    let i = 0;
    let timerId;
    
    // Add a tiny random variance to speed for realism
    const typeNextChar = () => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i < text.length) {
        timerId = setTimeout(typeNextChar, speed + (Math.random() * 20 - 10));
      }
    };
    
    timerId = setTimeout(typeNextChar, speed);
    return () => clearTimeout(timerId);
  }, [text, speed]);

  return <>{displayedText}</>;
}
