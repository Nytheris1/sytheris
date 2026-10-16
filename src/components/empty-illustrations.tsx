"use client";

import { motion, useReducedMotion } from "motion/react";

const STROKE = "currentColor";
const ACCENT = "var(--color-accent-400)";

interface IllustrationProps {
  className?: string;
}

/* Boş favori — kalp, yarım çizilmiş */
export function FavoriteEmptyIllustration({ className }: IllustrationProps) {
  const reduced = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial="hidden"
      animate="show"
    >
      <motion.path
        d="M60 98 C60 98, 18 74, 18 44 C18 28, 30 16, 46 16 C54 16, 60 22, 60 22 C60 22, 66 16, 74 16 C90 16, 102 28, 102 44 C102 74, 60 98, 60 98 Z"
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          show: {
            pathLength: 1,
            opacity: 1,
            transition: {
              duration: reduced ? 0 : 1.4,
              ease: [0.22, 1, 0.36, 1],
            },
          },
        }}
      />
      <motion.circle
        cx="60"
        cy="52"
        r="3"
        fill={ACCENT}
        variants={{
          hidden: { opacity: 0, scale: 0 },
          show: {
            opacity: 1,
            scale: 1,
            transition: { delay: reduced ? 0 : 1.2, duration: 0.5 },
          },
        }}
      />
    </motion.svg>
  );
}

/* Boş geçmiş — saat, akrepler döner */
export function HistoryEmptyIllustration({ className }: IllustrationProps) {
  const reduced = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial="hidden"
      animate="show"
    >
      <motion.circle
        cx="60"
        cy="60"
        r="42"
        stroke={STROKE}
        strokeWidth="2.5"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          show: {
            pathLength: 1,
            opacity: 1,
            transition: {
              duration: reduced ? 0 : 1.2,
              ease: [0.22, 1, 0.36, 1],
            },
          },
        }}
      />
      {/* Saat ibresi */}
      <motion.line
        x1="60"
        y1="60"
        x2="60"
        y2="34"
        stroke={ACCENT}
        strokeWidth="3"
        strokeLinecap="round"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          show: {
            pathLength: 1,
            opacity: 1,
            transition: { delay: reduced ? 0 : 0.7, duration: 0.6 },
          },
        }}
      />
      <motion.line
        x1="60"
        y1="60"
        x2="78"
        y2="72"
        stroke={ACCENT}
        strokeWidth="3"
        strokeLinecap="round"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          show: {
            pathLength: 1,
            opacity: 1,
            transition: { delay: reduced ? 0 : 1, duration: 0.6 },
          },
        }}
      />
      <motion.circle
        cx="60"
        cy="60"
        r="3"
        fill={STROKE}
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { delay: reduced ? 0 : 0.6 } },
        }}
      />
    </motion.svg>
  );
}

/* Boş arama — büyüteç */
export function SearchEmptyIllustration({ className }: IllustrationProps) {
  const reduced = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial="hidden"
      animate="show"
    >
      <motion.circle
        cx="52"
        cy="52"
        r="30"
        stroke={STROKE}
        strokeWidth="2.5"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          show: {
            pathLength: 1,
            opacity: 1,
            transition: {
              duration: reduced ? 0 : 1.1,
              ease: [0.22, 1, 0.36, 1],
            },
          },
        }}
      />
      <motion.line
        x1="74"
        y1="74"
        x2="96"
        y2="96"
        stroke={ACCENT}
        strokeWidth="3"
        strokeLinecap="round"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          show: {
            pathLength: 1,
            opacity: 1,
            transition: { delay: reduced ? 0 : 0.8, duration: 0.5 },
          },
        }}
      />
      {/* İç çizikler — "arama yapıldı ama bulunamadı" hissi */}
      <motion.path
        d="M40 46 Q52 40, 64 46"
        stroke={STROKE}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
        variants={{
          hidden: { pathLength: 0 },
          show: {
            pathLength: 1,
            transition: { delay: reduced ? 0 : 1.3, duration: 0.4 },
          },
        }}
      />
      <motion.path
        d="M42 58 Q52 64, 62 58"
        stroke={STROKE}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
        variants={{
          hidden: { pathLength: 0 },
          show: {
            pathLength: 1,
            transition: { delay: reduced ? 0 : 1.5, duration: 0.4 },
          },
        }}
      />
    </motion.svg>
  );
}

/* Genel boş durum — kutu, boş */
export function GenericEmptyIllustration({ className }: IllustrationProps) {
  const reduced = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial="hidden"
      animate="show"
    >
      <motion.rect
        x="24"
        y="42"
        width="72"
        height="56"
        rx="6"
        stroke={STROKE}
        strokeWidth="2.5"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          show: {
            pathLength: 1,
            opacity: 1,
            transition: {
              duration: reduced ? 0 : 1.2,
              ease: [0.22, 1, 0.36, 1],
            },
          },
        }}
      />
      <motion.path
        d="M24 66 L44 66 L50 74 L70 74 L76 66 L96 66"
        stroke={ACCENT}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          show: {
            pathLength: 1,
            opacity: 1,
            transition: { delay: reduced ? 0 : 0.7, duration: 0.8 },
          },
        }}
      />
    </motion.svg>
  );
}