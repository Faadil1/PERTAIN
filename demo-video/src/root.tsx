import React from 'react';
import { Composition } from 'remotion';
import { PERTAINDemo } from './video';
import { AUDIO_DURATION_SECONDS } from './audio-duration';

export const RemotionRoot: React.FC = () => {
  const fps = 30;
  return (
    <Composition
      id="PERTAINDemo"
      component={PERTAINDemo}
      durationInFrames={Math.max(1, Math.ceil(AUDIO_DURATION_SECONDS * fps))}
      fps={fps}
      width={1920}
      height={1080}
    />
  );
};
