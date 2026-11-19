"use client";

import { useCallback, useRef, useState } from "react";

interface VirtualJoystickProps {
  onMove: (dx: number, dz: number) => void;
  disabled?: boolean;
}

const MAX_RADIUS = 44;

/**
 * Joystick virtual responsivo para telas touch/mobile.
 * Emite intents normalizados (-1..1) e trata pointercancel/lostpointercapture
 * para nunca deixar o personagem travado andando.
 */
export function VirtualJoystick({ onMove, disabled }: VirtualJoystickProps) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const centerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [knob, setKnob] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const reset = useCallback(() => {
    pointerIdRef.current = null;
    setKnob({ x: 0, y: 0, active: false });
    onMove(0, 0);
  }, [onMove]);

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - centerRef.current.x;
      const dy = clientY - centerRef.current.y;
      const dist = Math.hypot(dx, dy);
      const clamped = Math.min(dist, MAX_RADIUS);
      const angle = Math.atan2(dy, dx);
      const kx = Math.cos(angle) * clamped;
      const ky = Math.sin(angle) * clamped;

      setKnob({ x: kx, y: ky, active: true });

      const deadZone = 6;
      if (dist < deadZone) {
        onMove(0, 0);
      } else {
        onMove(kx / MAX_RADIUS, ky / MAX_RADIUS);
      }
    },
    [onMove]
  );

  if (disabled) return null;

  return (
    <div
      ref={baseRef}
      role="application"
      aria-label="Controle direcional"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        if (pointerIdRef.current !== null) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        pointerIdRef.current = e.pointerId;
        const rect = e.currentTarget.getBoundingClientRect();
        centerRef.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
        updateFromPointer(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        updateFromPointer(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        reset();
      }}
      onPointerCancel={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        reset();
      }}
      onLostPointerCapture={() => {
        if (pointerIdRef.current !== null) reset();
      }}
      className="relative flex size-28 select-none items-center justify-center rounded-full border-2 border-white/25 bg-black/35 backdrop-blur-sm md:hidden"
    >
      <div className="pointer-events-none size-14 rounded-full border border-white/15" />
      <div
        className="pointer-events-none absolute size-12 rounded-full border-2 border-yellow-300/90 bg-yellow-400/80 shadow-lg transition-transform duration-75"
        style={{
          transform: `translate3d(${knob.x}px, ${knob.y}px, 0) scale(${knob.active ? 1.06 : 1})`,
        }}
      />
    </div>
  );
}
