"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { ScrollProgress } from "@/components/scroll-progress";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  return (
    <>
      <ScrollProgress />
      {reduced ? (
        children
      ) : (
        <motion.div
          key={pathname}
          initial={{
            opacity: 0,
            y: 16,
            scale: 0.994,
            filter: "blur(6px)",
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
          }}
          transition={{
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {children}
        </motion.div>
      )}
    </>
  );
}