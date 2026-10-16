"use client";

/**
 * Global atmosfer katmanı — film grain, vignette, subtle noise.
 * pointer-events: none, sayfa etkileşimini engellemez.
 * SSR uyumlu — sabit SVG data URL'leri kullanır.
 */
export function Atmosphere() {
  return (
    <>
      {/* Film grain — sabit noise SVG, opacity çok hafif */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[100] opacity-[0.045] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='1'/%3E%3C/svg%3E\")",
          backgroundSize: "300px 300px",
        }}
      />

      {/* Vignette — sayfa kenarlarına hafif koyu */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[99]"
        style={{
          background:
            "radial-gradient(ellipse 90% 85% at 50% 50%, transparent 55%, rgba(11,11,15,0.18) 100%)",
        }}
      />

      {/* İnce üst ve alt kenar gradient — sinematik harf kutusu (letterbox) hissi */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[98] h-[1px] bg-gradient-to-r from-transparent via-black/10 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[98] h-[1px] bg-gradient-to-r from-transparent via-black/10 to-transparent"
      />
    </>
  );
}