import React from 'react';
import { Composition, staticFile } from 'remotion';
import { getVideoMetadata } from '@remotion/media-utils';
import { OutreachVideo, OutreachVideoProps } from './OutreachVideo';

const FPS = 30;

/*
 * The composition auto-sizes its duration to the recorded take (public/take.mp4)
 * via calculateMetadata, so you don't hand-count frames. Slides come in through
 * inputProps — render.mjs passes each recipient's `video_slides`.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="OutreachVideo"
      component={OutreachVideo}
      durationInFrames={300}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={
        {
          slides: [
            'Hey there.',
            'The senior debt is rarely the hold up.',
            'It’s the layer underneath. The pre-bankable equity.',
            'I close the gate. So the capital can move.',
          ],
          takeSrc: 'take.mp4',
        } satisfies OutreachVideoProps
      }
      calculateMetadata={async ({ props }) => {
        const meta = await getVideoMetadata(staticFile(props.takeSrc));
        return {
          durationInFrames: Math.round(meta.durationInSeconds * FPS),
          fps: FPS,
        };
      }}
    />
  );
};
