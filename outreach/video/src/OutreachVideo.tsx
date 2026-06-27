import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/*
 * Personalized outreach video.
 *
 * One pre-recorded talking-head take of Sid (assets/take.mp4) plays in a corner
 * circle for the whole duration and provides the audio. Over it, on-brand title
 * cards — the recipient's `video_slides` — fade through in sequence, evenly
 * dividing the take. Mirrors the use60 reference: near-black canvas, copper +
 * white type, Space Grotesk, face bubble bottom-right.
 *
 * Slides + the take's length are supplied by calculateMetadata in Root.tsx, so
 * the composition auto-sizes to whatever take you record.
 */

export type OutreachVideoProps = {
  slides: string[];
  takeSrc: string; // path under public/, e.g. "take.mp4"
};

const BG = '#0A0A0C';
const FG = '#F4F4F2';
const ACCENT = '#D08A5A';
const FONT = "'Space Grotesk', system-ui, sans-serif";

const Slide: React.FC<{ text: string; durationInFrames: number }> = ({
  text,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade/raise in over ~12 frames, fade out over the last ~12.
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 14 });
  const opacity = interpolate(
    frame,
    [0, 12, durationInFrames - 12, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const translateY = interpolate(enter, [0, 1], [24, 0]);

  // First word accented in copper (matches the reference "It's the layer…" cards).
  const [first, ...rest] = text.split(' ');

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        padding: '0 9% 0 9%',
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 88,
          lineHeight: 1.02,
          letterSpacing: '-0.02em',
          color: FG,
          maxWidth: '70%',
        }}
      >
        <span style={{ color: ACCENT }}>{first}</span>
        {rest.length ? ' ' + rest.join(' ') : ''}
      </div>
      <div style={{ width: 120, height: 4, background: ACCENT, marginTop: 28 }} />
    </AbsoluteFill>
  );
};

export const OutreachVideo: React.FC<OutreachVideoProps> = ({ slides, takeSrc }) => {
  const { durationInFrames, width, height } = useVideoConfig();
  const per = Math.floor(durationInFrames / Math.max(slides.length, 1));
  const bubble = Math.round(Math.min(width, height) * 0.26);

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {/* faint blueprint grid, like the site */}
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* brand mark, top-left */}
      <div
        style={{
          position: 'absolute',
          top: 48,
          left: 56,
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: '0.04em',
          color: FG,
        }}
      >
        MOTIF <span style={{ color: ACCENT }}>54</span>
      </div>

      {/* name/title slides */}
      {slides.map((text, i) => (
        <Sequence key={i} from={i * per} durationInFrames={per}>
          <Slide text={text} durationInFrames={per} />
        </Sequence>
      ))}

      {/* talking-head bubble, bottom-right */}
      <div
        style={{
          position: 'absolute',
          right: 56,
          bottom: 56,
          width: bubble,
          height: bubble,
          borderRadius: '50%',
          overflow: 'hidden',
          border: `2px solid ${ACCENT}`,
          boxShadow: '0 8px 30px rgba(0,0,0,.5)',
        }}
      >
        <OffthreadVideo
          src={staticFile(takeSrc)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    </AbsoluteFill>
  );
};
