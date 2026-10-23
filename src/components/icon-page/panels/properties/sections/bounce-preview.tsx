"use client";

import { useEffect, useRef } from "react";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(MotionPathPlugin, useGSAP);

export default function BouncePreview() {
  const reduceMotion = useReducedMotion();
  const circleRef = useRef<SVGCircleElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    const circle = circleRef.current;
    const path = pathRef.current;
    if (!circle || !path) return;
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    if (reduceMotion) {
      gsap.set(path, { strokeDashoffset: 0 });
      return;
    }
    const tl = gsap.timeline({ repeat: -1, yoyo: true });
    tl.to(
      circle,
      {
        motionPath: { path, align: path, alignOrigin: [0.5, 0.5] },
        duration: 3,
        ease: "power1.inOut",
      },
      0,
    );
    tl.to(path, { strokeDashoffset: 0, duration: 3, ease: "power1.inOut" }, 0);
    timelineRef.current = tl;
  }, [reduceMotion]);

  useEffect(() => {
    const svg = pathRef.current?.ownerSVGElement;
    if (!svg) return;
    let inView = true;
    const sync = () => {
      const tl = timelineRef.current;
      if (!tl) return;
      if (inView && !document.hidden) tl.play();
      else tl.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    observer.observe(svg);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [reduceMotion]);

  return (
    <svg width="44" height="44" viewBox="0 0 124 86" fill="none" overflow="visible">
      <path
        ref={pathRef}
        d="M1.5 84.5002C2.16667 70.5002 9 41.9002 31 39.5002C58.5 36.5002 69.5 76.0002 70 83.0002C70.5 90.0002 68.5 21 101.5 11"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle ref={circleRef} cx="114.5" cy="9" r="7.5" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}
