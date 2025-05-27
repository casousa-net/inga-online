'use client';

import { CSSProperties } from 'react';

interface PlaceholderImageProps {
  text: string;
  width?: string | number;
  height?: string | number;
  bgColor?: string;
  textColor?: string;
  style?: CSSProperties;
  className?: string;
}

export function PlaceholderImage({
  text,
  width = '100%',
  height = '100%',
  bgColor = '#1a365d',
  textColor = 'white',
  style,
  className,
}: PlaceholderImageProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        backgroundColor: bgColor,
        color: textColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        textAlign: 'center',
        fontWeight: 'bold',
        borderRadius: '0.5rem',
        ...style,
      }}
    >
      {text}
    </div>
  );
}
