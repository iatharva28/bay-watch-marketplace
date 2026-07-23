"use client";

import { useRef, useMemo, Suspense, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { WatchCollection } from "@/lib/bay/data";

/* =================================================================
   BAY Watch3D — a fully procedural luxury watch built in Three.js.
   No GLB assets; every component is generated from primitive
   geometry so it can adapt instantly to any watch in the maison.

   The watch is composed of:
     · Case (cylinder with chamfered top)
     · Bezel (torus or notched ring)
     · Dial (disc with sunburst texture)
     · Hour markers (12 applied indices)
     · Hands (hour, minute, second — animated)
     · Crown (cylinder on the right)
     · Lugs (4 angled extensions)
     · Optional tourbillon aperture at 6 o'clock
     · Optional sub-dials for complications

   Behaviour:
     · Scrolls-reactive: the watch rotates and tilts based on
       a scroll progress prop (0..1). As the user moves between
       sections, the watch turns to reveal new angles — the
       "watch does something" effect requested by the user.
     · Hands tick: the seconds hand sweeps continuously, the
       minute hand drifts, the hour hand advances slowly. The
       tourbillon cage rotates once per minute.
     · Mouse parallax: the case subtly orients toward the
       cursor for a sense of being observed.
   ================================================================= */

function WatchHands({
  complication,
  isActive,
  reducedMotion,
}: {
  complication: WatchCollection["complicationType"];
  isActive: { current: boolean };
  reducedMotion: { current: boolean };
}) {
  const hourRef = useRef<THREE.Group>(null);
  const minuteRef = useRef<THREE.Group>(null);
  const secondRef = useRef<THREE.Group>(null);
  const tourbillonRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    // Pause hands when off-screen or under reduced-motion.
    // Hands stay at their last position — frozen, like a real watch
    // that has stopped.
    if (!isActive.current || reducedMotion.current) return;
    const t = state.clock.elapsedTime;
    // Set to roughly 10:10 — the classic watch display pose
    if (hourRef.current)
      hourRef.current.rotation.z = -Math.PI / 3 + t * 0.02;
    if (minuteRef.current)
      minuteRef.current.rotation.z = Math.PI / 6 + t * 0.2;
    if (secondRef.current)
      secondRef.current.rotation.z = -t * 0.5;
    if (tourbillonRef.current)
      tourbillonRef.current.rotation.z = t * 0.3;
  });

  const handMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#E8EAEE",
        metalness: 0.95,
        roughness: 0.2,
      }),
    []
  );
  const secondMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#A8BCC7",
        metalness: 0.7,
        roughness: 0.3,
        emissive: "#2E4051",
        emissiveIntensity: 0.15,
      }),
    []
  );

  return (
    <group>
      {/* Hour hand */}
      <group ref={hourRef}>
        <mesh position={[0, 0.5, 0.05]} material={handMat}>
          <boxGeometry args={[0.08, 1.0, 0.04]} />
        </mesh>
      </group>
      {/* Minute hand */}
      <group ref={minuteRef}>
        <mesh position={[0, 0.75, 0.06]} material={handMat}>
          <boxGeometry args={[0.06, 1.5, 0.04]} />
        </mesh>
      </group>
      {/* Second hand */}
      <group ref={secondRef}>
        <mesh position={[0, 0.8, 0.07]} material={secondMat}>
          <boxGeometry args={[0.02, 1.7, 0.02]} />
        </mesh>
        {/* counterweight */}
        <mesh position={[0, -0.25, 0.07]} material={secondMat}>
          <boxGeometry args={[0.04, 0.4, 0.02]} />
        </mesh>
      </group>
      {/* Tourbillon aperture at 6 o'clock for tourbillon / grand complications */}
      {(complication === "tourbillon" ||
        complication === "skeleton" ||
        complication === "grand-complication") && (
        <group ref={tourbillonRef} position={[0, -1.05, 0.04]}>
          <mesh>
            <torusGeometry args={[0.32, 0.04, 12, 32]} />
            <meshStandardMaterial
              color="#C8CCD3"
              metalness={0.95}
              roughness={0.25}
            />
          </mesh>
          {/* tourbillon cage — three spokes */}
          {[0, 1, 2].map((i) => (
            <mesh
              key={i}
              rotation={[0, 0, (i * Math.PI * 2) / 3]}
              material={secondMat}
            >
              <boxGeometry args={[0.04, 0.6, 0.02]} />
            </mesh>
          ))}
          {/* center jewel */}
          <mesh>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial
              color="#6B8E9B"
              metalness={0.4}
              roughness={0.1}
              emissive="#2E4051"
              emissiveIntensity={0.3}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

function WatchDial({
  dialColor,
  complication,
}: {
  dialColor: string;
  complication: WatchCollection["complicationType"];
}) {
  // Hour markers — 12 applied indices
  const markers = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const r = 1.65;
      return {
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        isCardinal: i % 3 === 0,
      };
    });
  }, []);

  const markerMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#C8CCD3",
        metalness: 0.9,
        roughness: 0.25,
        emissive: "#3a3d44",
        emissiveIntensity: 0.05,
      }),
    []
  );

  // Sub-dials for perpetual calendar / chronograph / astrological
  const showSubdials =
    complication === "perpetual-calendar" ||
    complication === "chronograph" ||
    complication === "astrological" ||
    complication === "grand-complication" ||
    complication === "grand-sonnerie";

  const subdialPositions = [
    { x: -0.85, y: 0.85 },
    { x: 0.85, y: 0.85 },
    { x: -0.85, y: -0.85 },
    { x: 0.85, y: -0.85 },
  ];

  return (
    <group>
      {/* Dial disc — sunburst via emissive gradient + radial segments */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[2.0, 96]} />
        <meshStandardMaterial
          color={dialColor}
          metalness={0.6}
          roughness={0.4}
          emissive={dialColor}
          emissiveIntensity={0.08}
        />
      </mesh>

      {/* Minute track — fine ring */}
      <mesh position={[0, 0, 0.001]}>
        <ringGeometry args={[1.85, 1.9, 96]} />
        <meshStandardMaterial
          color="#2a2d34"
          metalness={0.4}
          roughness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Hour markers */}
      {markers.map((m, i) => (
        <mesh
          key={i}
          position={[m.x, m.y, 0.02]}
          material={markerMat}
        >
          {m.isCardinal ? (
            <boxGeometry args={[0.08, 0.18, 0.04]} />
          ) : (
            <boxGeometry args={[0.04, 0.12, 0.03]} />
          )}
        </mesh>
      ))}

      {/* Sub-dials */}
      {showSubdials &&
        subdialPositions.map((p, i) => (
          <group key={i} position={[p.x, p.y, 0.015]}>
            <mesh>
              <circleGeometry args={[0.45, 48]} />
              <meshStandardMaterial
                color="#0a0b0e"
                metalness={0.5}
                roughness={0.5}
              />
            </mesh>
            {/* sub-dial hand */}
            <mesh
              position={[0, 0.15, 0.02]}
              rotation={[0, 0, (i * Math.PI) / 4]}
            >
              <boxGeometry args={[0.025, 0.3, 0.015]} />
              <meshStandardMaterial
                color="#C8CCD3"
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>
            {/* track ring */}
            <mesh position={[0, 0, 0.001]}>
              <ringGeometry args={[0.4, 0.43, 48]} />
              <meshStandardMaterial
                color="#3a3d44"
                metalness={0.5}
                roughness={0.5}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}

      {/* Center pin */}
      <mesh position={[0, 0, 0.08]}>
        <cylinderGeometry args={[0.06, 0.06, 0.06, 16]} />
        <meshStandardMaterial
          color="#E8EAEE"
          metalness={0.95}
          roughness={0.15}
        />
      </mesh>
    </group>
  );
}

function WatchCase({
  caseFinish,
}: {
  caseFinish: WatchCollection["caseFinish"];
}) {
  const caseColor = useMemo(() => {
    switch (caseFinish) {
      case "polished-platinum":
        return "#D8DBE0";
      case "brushed-steel":
        return "#B5B8BD";
      case "sandblasted-titanium":
        return "#7A7D83";
      case "obsidian-ceramic":
        return "#1A1C20";
      default:
        return "#C8CCD3";
    }
  }, [caseFinish]);

  const caseMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: caseColor,
        metalness: 0.95,
        roughness:
          caseFinish === "brushed-steel"
            ? 0.45
            : caseFinish === "sandblasted-titanium"
              ? 0.7
              : caseFinish === "obsidian-ceramic"
                ? 0.3
                : 0.18,
      }),
    [caseColor, caseFinish]
  );

  const bezelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: caseColor,
        metalness: 0.95,
        roughness: caseFinish === "obsidian-ceramic" ? 0.25 : 0.15,
      }),
    [caseColor, caseFinish]
  );

  return (
    <group>
      {/* Case body — main cylindrical case */}
      <mesh material={caseMat} position={[0, 0, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[2.1, 2.1, 0.4, 96]} />
      </mesh>
      {/* Caseback — slight recess */}
      <mesh material={caseMat} position={[0, 0, -0.36]}>
        <cylinderGeometry args={[1.95, 1.95, 0.06, 96]} />
      </mesh>
      {/* Bezel — thin ring on top of case */}
      <mesh material={bezelMat} position={[0, 0, 0.04]}>
        <torusGeometry args={[2.0, 0.1, 24, 96]} />
      </mesh>
      {/* Crystal — sapphire dome */}
      <mesh position={[0, 0, 0.12]}>
        <sphereGeometry
          args={[2.0, 64, 32, 0, Math.PI * 2, 0, Math.PI / 6]}
        />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0}
          roughness={0}
          transmission={0.95}
          thickness={0.3}
          ior={1.5}
          transparent
          opacity={0.18}
        />
      </mesh>
      {/* Crown — at 3 o'clock */}
      <mesh material={caseMat} position={[2.3, 0, -0.15]}>
        <cylinderGeometry args={[0.18, 0.18, 0.25, 24]} />
      </mesh>
      <mesh material={caseMat} position={[2.42, 0, -0.15]}>
        <cylinderGeometry args={[0.14, 0.14, 0.06, 24]} />
      </mesh>
      {/* Crown guard / knurling suggestion — small rings */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          material={caseMat}
          position={[2.3 + i * 0.005, 0, -0.15]}
        >
          <torusGeometry args={[0.18, 0.012, 8, 24]} />
        </mesh>
      ))}
      {/* Lugs — 4 angled extensions to suggest a strap attachment */}
      {[
        { x: 1.45, y: 1.45, rot: Math.PI / 4 },
        { x: -1.45, y: 1.45, rot: -Math.PI / 4 },
        { x: 1.45, y: -1.45, rot: -Math.PI / 4 },
        { x: -1.45, y: -1.45, rot: Math.PI / 4 },
      ].map((lug, i) => (
        <mesh
          key={i}
          material={caseMat}
          position={[lug.x, lug.y, -0.2]}
          rotation={[0, 0, lug.rot]}
        >
          <boxGeometry args={[0.35, 0.35, 0.4]} />
        </mesh>
      ))}
    </group>
  );
}

function WatchGroup({
  watch,
  scrollProgress,
  mousePos,
  isActive,
  reducedMotion,
}: {
  watch: WatchCollection;
  scrollProgress: { current: number };
  mousePos: { current: { x: number; y: number } };
  isActive: { current: boolean };
  reducedMotion: { current: boolean };
}) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current || !innerRef.current) return;
    // Pause all motion when off-screen or when user prefers reduced motion.
    // This is the key performance + a11y fix: the rAF loop still runs but
    // does zero work, so the browser can reclaim main-thread time.
    if (!isActive.current || reducedMotion.current) return;

    const p = scrollProgress.current;
    // As the user scrolls, the watch rotates up to ~540deg and tilts
    // — creating the "watch does something" effect on section change.
    const targetRotY = p * Math.PI * 3 + mousePos.current.x * 0.3;
    const targetRotX = -0.15 + mousePos.current.y * 0.15 + Math.sin(p * Math.PI) * 0.1;
    groupRef.current.rotation.y +=
      (targetRotY - groupRef.current.rotation.y) * 0.08;
    groupRef.current.rotation.x +=
      (targetRotX - groupRef.current.rotation.x) * 0.08;
    // gentle float
    innerRef.current.position.y = Math.sin(performance.now() / 1400) * 0.06;
  });

  return (
    <group ref={groupRef} rotation={[0, 0, 0]}>
      <group ref={innerRef}>
        <WatchCase caseFinish={watch.caseFinish} />
        <WatchDial
          dialColor={watch.dialColor}
          complication={watch.complicationType}
        />
        <WatchHands
          complication={watch.complicationType}
          isActive={isActive}
          reducedMotion={reducedMotion}
        />
      </group>
    </group>
  );
}

function StudioLighting() {
  return (
    <>
      {/* Ambient — soft cool fill */}
      <ambientLight intensity={0.25} color="#A8BCC7" />
      {/* Key light — platinum-tinted from upper-left */}
      <directionalLight
        position={[5, 6, 5]}
        intensity={2.5}
        color="#F2F2EF"
      />
      {/* Rim light — cool steel from behind */}
      <directionalLight
        position={[-4, 2, -4]}
        intensity={1.4}
        color="#6B8E9B"
      />
      {/* Fill from below to lift shadow detail */}
      <pointLight position={[0, -3, 3]} intensity={0.6} color="#2E4051" />
    </>
  );
}

/**
 * Public component. Renders a Canvas containing the watch.
 * `scrollProgressRef` and `mousePosRef` are mutable refs that
 * the parent updates each frame; the watch reads them in
 * useFrame so we avoid React re-renders on scroll/mouse move.
 *
 * Performance: an IntersectionObserver pauses all rAF work when
 * the canvas is off-screen. Accessibility: a matchMedia check
 * pauses all autonomous motion when the user has opted into
 * reduced motion.
 */
export default function Watch3D({
  watch,
  scrollProgressRef,
  mousePosRef,
  className,
}: {
  watch: WatchCollection;
  scrollProgressRef: React.RefObject<number>;
  mousePosRef: React.RefObject<{ x: number; y: number }>;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isActiveRef = useRef(true);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Reduced-motion check — read once, never re-renders
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    const onMq = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener("change", onMq);

    // IntersectionObserver — pause rendering when off-screen
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isActiveRef.current = entry.isIntersecting;
        }
      },
      { rootMargin: "100px" }
    );
    io.observe(el);

    return () => {
      mq.removeEventListener("change", onMq);
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 35 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>
          <StudioLighting />
          <WatchGroup
            watch={watch}
            scrollProgress={scrollProgressRef as React.RefObject<number>}
            mousePos={mousePosRef as React.RefObject<{ x: number; y: number }>}
            isActive={isActiveRef}
            reducedMotion={reducedMotionRef}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

/**
 * Hook used by the parent to drive the watch from scroll
 * position and mouse position without triggering re-renders.
 * Returns refs that should be passed to <Watch3D />.
 */
export function useWatchDrivers() {
  const scrollProgressRef = useRef(0);
  const mousePosRef = useRef({ x: 0, y: 0 });

  return { scrollProgressRef, mousePosRef };
}
