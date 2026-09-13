import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Audio } from '@remotion/media';

const BG = '#eef0ee';
const INK = '#111311';
const MUTED = '#656a64';
const LINE = '#c8ccc6';
const RED = '#c43d31';
const GREEN = '#207b4a';
const AMBER = '#a16d16';

const pct = (value: number, total: number) => Math.round(total * value);

const fade = (frame: number, duration: number) =>
  interpolate(frame, [0, 12, Math.max(13, duration - 12), duration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

const StageChip: React.FC<{ label: string; index: string }> = ({ label, index }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      border: `1px solid ${INK}`,
      padding: '10px 14px',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: 15,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      background: '#f8f9f7',
    }}
  >
    <strong>{index}</strong>
    <span>{label}</span>
  </div>
);

const Screenshot: React.FC<{
  src: string;
  frame: number;
  duration: number;
  scaleFrom?: number;
  scaleTo?: number;
  align?: 'center' | 'top';
}> = ({ src, frame, duration, scaleFrom = 1.01, scaleTo = 1.06, align = 'center' }) => (
  <div
    style={{
      position: 'relative',
      overflow: 'hidden',
      border: `2px solid ${INK}`,
      background: '#f8f9f7',
      boxShadow: '0 26px 80px rgba(17,19,17,0.12)',
      width: '100%',
      height: '100%',
    }}
  >
    <Img
      src={staticFile(src)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        objectPosition: align,
        scale: interpolate(frame, [0, duration], [scaleFrom, scaleTo], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.linear,
        }),
      }}
    />
  </div>
);

const BaseScene: React.FC<{
  label: string;
  index: string;
  title: string;
  body?: string;
  duration: number;
  children?: React.ReactNode;
}> = ({ label, index, title, body, duration, children }) => {
  const frame = useCurrentFrame();
  const opacity = fade(frame, duration);
  const titleY = interpolate(frame, [0, 18], [26, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill
      style={{
        background: BG,
        color: INK,
        padding: '62px 72px 58px',
        opacity,
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(17,19,17,.035) 1px, transparent 1px),linear-gradient(90deg, rgba(17,19,17,.035) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <StageChip label={label} index={index} />
        <div
          style={{
            marginTop: 30,
            translate: `0 ${titleY}px`,
            display: 'grid',
            gridTemplateColumns: body ? '1.55fr 0.8fr' : '1fr',
            gap: 54,
            alignItems: 'end',
          }}
        >
          <h1
            style={{
              margin: 0,
              maxWidth: 1260,
              fontFamily: 'Georgia, Times New Roman, serif',
              fontWeight: 500,
              fontSize: body ? 68 : 92,
              lineHeight: 0.98,
              letterSpacing: '-0.055em',
            }}
          >
            {title}
          </h1>
          {body ? (
            <p style={{ margin: 0, fontSize: 25, lineHeight: 1.42, color: MUTED }}>{body}</p>
          ) : null}
        </div>
        <div style={{ flex: 1, minHeight: 0, marginTop: 36 }}>{children}</div>
      </div>
    </AbsoluteFill>
  );
};

const RubricScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  return (
    <BaseScene
      label="RUBRIC"
      index="01"
      title="PERTAIN"
      body="A useful multi-step agent connected to real apps — and proof that it knows when not to act."
      duration={duration}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr', gap: 34, height: '100%' }}>
        <Screenshot src="capture/hero.png" frame={frame} duration={duration} />
        <div style={{ display: 'grid', gap: 14, alignContent: 'center' }}>
          {[
            ['TECHNICAL EXECUTION', '30%'],
            ['RELIABILITY & EVALUATION', '25%'],
            ['USEFULNESS', '20%'],
            ['ORIGINALITY', '15%'],
            ['DEMO CLARITY', '10%'],
          ].map(([label, value]) => (
            <div key={label} style={{ borderTop: `1px solid ${INK}`, padding: '16px 0', display: 'flex', justifyContent: 'space-between', fontSize: 20 }}>
              <span>{label}</span><strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
    </BaseScene>
  );
};

const PainScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  return (
    <BaseScene
      label="PAIN"
      index="02"
      title="One recovery sentence can reach customers living in different operational realities."
      duration={duration}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr .75fr', gap: 34, height: '100%' }}>
        <Screenshot src="capture/statement.png" frame={frame} duration={duration} scaleTo={1.035} />
        <div style={{ borderLeft: `2px solid ${INK}`, paddingLeft: 30, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 15, letterSpacing: '.12em', color: MUTED }}>THE MESSAGE UNDER TEST</div>
          <div style={{ marginTop: 18, fontFamily: 'Georgia, serif', fontSize: 46, lineHeight: 1.04, letterSpacing: '-.035em' }}>
            “Your production workflows are fully restored.”
          </div>
        </div>
      </div>
    </BaseScene>
  );
};

const ProblemScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, duration], [0, -22], { extrapolateRight: 'clamp' });
  return (
    <BaseScene
      label="PROBLEM"
      index="03"
      title="Global language. Customer-specific truth."
      body="The message is identical. The evidence envelope is not."
      duration={duration}
    >
      <div style={{ position: 'relative', height: '100%' }}>
        <div style={{ position: 'absolute', inset: 0, translate: `${x}px 0` }}>
          <Screenshot src="capture/partition.png" frame={frame} duration={duration} scaleFrom={1.02} scaleTo={1.08} />
        </div>
        <div style={{ position: 'absolute', right: 34, bottom: 30, display: 'flex', gap: 10 }}>
          <Pill color={RED} text="HOLD" />
          <Pill color={GREEN} text="ALLOW" />
          <Pill color={AMBER} text="UNKNOWN" />
        </div>
      </div>
    </BaseScene>
  );
};

const Pill: React.FC<{ color: string; text: string }> = ({ color, text }) => (
  <div style={{ background: color, color: 'white', padding: '12px 18px', fontSize: 18, fontWeight: 800, letterSpacing: '.06em' }}>{text}</div>
);

const DifferentiatorScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const rail = interpolate(frame, [4, 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <BaseScene
      label="DIFFERENTIATOR"
      index="04"
      title="ONE STATEMENT → THREE CUSTOMER TRUTHS"
      duration={duration}
    >
      <div style={{ display: 'grid', gridTemplateRows: '1fr auto', gap: 20, height: '100%' }}>
        <Screenshot src="capture/partition.png" frame={frame} duration={duration} scaleFrom={1.015} scaleTo={1.04} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, border: `1px solid ${INK}` }}>
          {[
            ['ACME', 'HOLD', 'EU AUTH DEGRADED', RED],
            ['GLOBEX', 'ALLOW', 'US AUTH + CORE API HEALTHY', GREEN],
            ['INITECH', 'UNKNOWN', 'DEPENDENCY MAP MISSING', AMBER],
          ].map(([customer, verdict, reason, color], i) => (
            <div key={customer} style={{ padding: '14px 18px', borderRight: i < 2 ? `1px solid ${INK}` : undefined, opacity: rail }}>
              <div style={{ fontSize: 12, color: MUTED, letterSpacing: '.12em' }}>{customer}</div>
              <div style={{ fontSize: 30, fontWeight: 900, color, marginTop: 4 }}>{verdict}</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>{reason}</div>
            </div>
          ))}
        </div>
      </div>
    </BaseScene>
  );
};

const ExecutionScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  return (
    <BaseScene
      label="EXECUTION"
      index="05"
      title="Model for meaning. Deterministic policy for authority."
      body="Gmail supplies the draft. Salesforce supplies customer dependency truth. Jira supplies incident state."
      duration={duration}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr .75fr', gap: 34, height: '100%' }}>
        <Screenshot src="capture/execution.png" frame={frame} duration={duration} />
        <div style={{ display: 'grid', gap: 12, alignContent: 'center' }}>
          {[
            ['GMAIL', 'exact statement + recipients'],
            ['MODEL', 'bounded semantic mapping'],
            ['SALESFORCE', 'customer dependency evidence'],
            ['JIRA', 'fresh service state'],
            ['POLICY', 'HOLD / ALLOW / UNKNOWN / REVIEW'],
          ].map(([a, b]) => (
            <div key={a} style={{ border: `1px solid ${LINE}`, background: '#f8f9f7', padding: '18px 20px' }}>
              <div style={{ fontSize: 12, letterSpacing: '.13em', color: MUTED }}>{a}</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 5 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>
    </BaseScene>
  );
};

const EvidenceScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  return (
    <BaseScene
      label="EVIDENCE"
      index="06"
      title="Show how you know it works."
      duration={duration}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 34, height: '100%' }}>
        <Screenshot src="capture/proof.png" frame={frame} duration={duration} scaleTo={1.035} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignContent: 'center' }}>
          <Stat value="3" label="real external apps" />
          <Stat value="MODEL" label="semantic path proven" />
          <Stat value="20/20" label="bounded controls" />
          <Stat value="0" label="sends on stale evidence" />
          <Stat value="1" label="guarded ALLOW delivery" />
          <Stat value="REAL" label="failure preserved" />
        </div>
      </div>
    </BaseScene>
  );
};

const Stat: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div style={{ border: `2px solid ${INK}`, minHeight: 130, padding: '20px', background: '#f8f9f7', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
    <strong style={{ fontSize: 44, letterSpacing: '-.05em' }}>{value}</strong>
    <span style={{ fontSize: 14, color: MUTED, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</span>
  </div>
);

const StoryScene: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [0, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: INK, color: '#f0f2ef', fontFamily: 'Arial, Helvetica, sans-serif', opacity: fade(frame, duration) }}>
      <div style={{ position: 'absolute', top: 70, left: 72, fontSize: 15, letterSpacing: '.16em' }}>07 / STORY</div>
      <div style={{ margin: 'auto', width: 1600, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 88, lineHeight: .98, letterSpacing: '-.055em' }}>
          One statement.<br />Three customer truths.
        </div>
        <div style={{ width: `${Math.round(line * 920)}px`, height: 2, background: '#f0f2ef', margin: '42px auto 34px' }} />
        <div style={{ fontSize: 32, color: '#c8ccc6' }}>Only evidence-supported recipients are allowed to move.</div>
        <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center', gap: 12 }}>
          <Pill color={RED} text="HOLD" /><Pill color={GREEN} text="ALLOW" /><Pill color={AMBER} text="UNKNOWN" />
        </div>
        <div style={{ marginTop: 52, fontSize: 18, letterSpacing: '.16em', color: '#929890' }}>PERTAIN · PER-CUSTOMER INCIDENT TRUTH GATE</div>
      </div>
    </AbsoluteFill>
  );
};

export const PERTAINDemo: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const marks = [0, 0.14, 0.29, 0.36, 0.55, 0.73, 0.92, 1].map((v) => pct(v, durationInFrames));
  const scenes = [
    { from: marks[0], to: marks[1], component: RubricScene },
    { from: marks[1], to: marks[2], component: PainScene },
    { from: marks[2], to: marks[3], component: ProblemScene },
    { from: marks[3], to: marks[4], component: DifferentiatorScene },
    { from: marks[4], to: marks[5], component: ExecutionScene },
    { from: marks[5], to: marks[6], component: EvidenceScene },
    { from: marks[6], to: marks[7], component: StoryScene },
  ];

  return (
    <AbsoluteFill style={{ background: BG }}>
      <Audio src={staticFile('voiceover.mp3')} />
      {scenes.map((scene, i) => {
        const Component = scene.component;
        const duration = Math.max(1, scene.to - scene.from);
        return (
          <Sequence key={i} from={scene.from} durationInFrames={duration}>
            <Component duration={duration} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
