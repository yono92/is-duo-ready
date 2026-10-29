'use client';

import { useId, useRef, useState, useCallback, type KeyboardEvent, type PointerEvent } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Button } from '@astryxdesign/core/Button';
import { RotateCcw } from 'lucide-react';
import styles from './device-preview.module.css';

const DeviceScene = dynamic(() => import('./device-scene'), { ssr: false });
const initialView = { pitch: 8, yaw: -16 };
const initialAngle = 150;
const clampPitch = (value: number) => Math.max(-65, Math.min(65, value));
const clampAngle = (value: number) => Math.max(0, Math.min(180, Math.round(value)));
const wrapYaw = (value: number) => ((((value + 180) % 360) + 360) % 360) - 180;
type Drag = { id: number; x: number; y: number } & (
  | { kind: 'rotate'; pitch: number; yaw: number }
  | { kind: 'fold'; angle: number; dx: number; dy: number }
);

export function DevicePreview() {
  const t = useTranslations('DevicePreview');
  const hintId = useId();
  const keyboardHintId = useId();
  const [view, setView] = useState(initialView);
  const [angle, setAngle] = useState(initialAngle);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const leftHandle = useRef<HTMLDivElement>(null);
  const rightHandle = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const onReady = useCallback(() => setStatus('ready'), []);
  const onUnavailable = useCallback(() => {
    drag.current = null;
    setDragging(false);
    setStatus('unavailable');
  }, []);

  function reset() {
    drag.current = null;
    setDragging(false);
    setView(initialView);
    setAngle(initialAngle);
  }

  function startDrag(event: PointerEvent<HTMLDivElement>, kind: 'rotate' | 'fold') {
    if (status !== 'ready' || !event.isPrimary || event.button !== 0 || drag.current) return;
    event.stopPropagation();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = { id: event.pointerId, x: event.clientX, y: event.clientY };
    drag.current =
      kind === 'rotate'
        ? { ...start, kind, ...view }
        : {
            ...start,
            kind,
            angle,
            dx: Number(event.currentTarget.dataset['dragX']),
            dy: Number(event.currentTarget.dataset['dragY']),
          };
    setDragging(true);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    event.stopPropagation();
    const x = event.clientX - start.x;
    const y = event.clientY - start.y;
    if (start.kind === 'fold') {
      setAngle(clampAngle(start.angle + (x * start.dx + y * start.dy) * 1.2));
    } else {
      setView({ yaw: wrapYaw(start.yaw + x * 0.7), pitch: clampPitch(start.pitch + y * 0.5) });
    }
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return;
    event.stopPropagation();
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function rotateWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (status !== 'ready') return;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') return reset();
    setView((current) => ({
      pitch: clampPitch(
        current.pitch + (event.key === 'ArrowDown' ? 10 : event.key === 'ArrowUp' ? -10 : 0),
      ),
      yaw: wrapYaw(
        current.yaw + (event.key === 'ArrowRight' ? 15 : event.key === 'ArrowLeft' ? -15 : 0),
      ),
    }));
  }

  function foldWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    event.stopPropagation();
    if (status !== 'ready') return;
    const step = event.shiftKey ? 15 : 5;
    const changes: Record<string, number> = {
      ArrowLeft: -step,
      ArrowDown: -step,
      ArrowRight: step,
      ArrowUp: step,
    };
    if (event.key === 'Home' || event.key === 'End' || event.key in changes) {
      event.preventDefault();
      setAngle((current) =>
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? 180
            : clampAngle(current + changes[event.key]!),
      );
    }
  }

  return (
    <figure className={styles.preview} data-ready={status === 'ready'}>
      <div
        role="group"
        tabIndex={0}
        aria-label={t('label')}
        aria-describedby={`${hintId} ${keyboardHintId}`}
        className={styles.stage}
        data-dragging={dragging}
        onPointerDown={(event) => startDrag(event, 'rotate')}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onKeyDown={rotateWithKeyboard}
      >
        {status !== 'ready' && (
          <Image
            src="/device/iphone-duo-render.png"
            alt={t('fallbackAlt')}
            fill
            sizes="(max-width: 767px) 324px, 420px"
            priority
            className={styles.fallback}
          />
        )}
        <div className={styles.shadow} aria-hidden="true" />
        <div
          className={styles.canvas}
          aria-hidden="true"
          data-testid="device-model"
          data-pitch={view.pitch}
          data-yaw={view.yaw}
          data-angle={angle}
          data-status={status}
        >
          {status !== 'unavailable' && (
            <DeviceScene
              {...view}
              angle={angle}
              onReady={onReady}
              onUnavailable={onUnavailable}
              leftHandle={leftHandle}
              rightHandle={rightHandle}
            />
          )}
        </div>
        {(['left', 'right'] as const).map((side) => (
          <div
            key={side}
            ref={side === 'left' ? leftHandle : rightHandle}
            className={styles.edgeHandle}
            role="slider"
            tabIndex={status === 'ready' ? 0 : -1}
            aria-label={t(side === 'left' ? 'leftEdge' : 'rightEdge')}
            aria-describedby={keyboardHintId}
            aria-valuemin={0}
            aria-valuemax={180}
            aria-valuenow={angle}
            aria-valuetext={t('degrees', { value: angle })}
            aria-orientation="horizontal"
            aria-disabled={status !== 'ready'}
            data-drag-x={side === 'left' ? -1 : 1}
            data-drag-y={0}
            onPointerDown={(event) => startDrag(event, 'fold')}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            onKeyDown={foldWithKeyboard}
          />
        ))}
      </div>
      <figcaption className={styles.caption}>
        <span>{t('caption')}</span>
        <span id={hintId}>{t(status === 'unavailable' ? 'unavailable' : 'hint')}</span>
        <span id={keyboardHintId} className="sr-only">
          {t('keyboardHint')}
        </span>
      </figcaption>
      <div className={styles.actions}>
        <Button
          label={t('reset')}
          icon={<RotateCcw size={14} />}
          size="sm"
          variant="ghost"
          isDisabled={status !== 'ready'}
          onClick={reset}
        />
      </div>
    </figure>
  );
}
