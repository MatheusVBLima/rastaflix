export interface RastaflixOgImageProps {
  title?: string;
  subtitle?: string;
  ovelheraSrc?: string;
  iconSrc?: string;
}

/**
 * Visual layout for Open Graph / social preview cards (1200×630).
 * Used with next/og ImageResponse — inline styles only (Satori subset).
 * Mirrors the redesigned dark Rastaflix palette (Unbounded display + Geist body).
 */
export function RastaflixOgImage({
  title = "Rastaflix",
  subtitle = "Histórias que o dog tenta esconder.",
  ovelheraSrc,
  iconSrc,
}: RastaflixOgImageProps) {
  // Mapped from globals.css `.dark` Rastaflix palette
  const BG = "#141414"; // --background oklch(0.18 0 0)
  const CARD = "#191919"; // --card oklch(0.2 0 0)
  const MUTED = "#242424"; // --muted oklch(0.24 0 0)
  const BORDER = "#2c2c2c"; // --border oklch(0.28 0 0)
  const FG = "#e8eaed"; // --foreground oklch(0.93 0.01 255)
  const MUTED_FG = "#a3a3a3"; // --muted-foreground oklch(0.71 0 0)
  const PRIMARY = "#2a754c"; // --primary oklch(0.44 0.1 156.76)
  const PRIMARY_FG = "#e4f2ea"; // --primary-foreground
  const RING = "#59cf88"; // --ring oklch(0.8 0.18 151.71)

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: BG,
        fontFamily: "Geist, system-ui, sans-serif",
      }}
    >
      {/* Outer card frame with subtle top-right primary glow */}
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 28,
          right: 28,
          bottom: 28,
          borderRadius: 28,
          border: `1.5px solid ${BORDER}`,
          background:
            "radial-gradient(90% 80% at 88% 12%, rgba(42, 117, 76, 0.34), transparent 62%), " +
            CARD,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* Subtle Rasta accent bar along top edge */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            display: "flex",
          }}
        >
          <div style={{ flex: 1, background: "#16a34a" }} />
          <div style={{ flex: 1, background: "#facc15" }} />
          <div style={{ flex: 1, background: "#dc2626" }} />
        </div>
      </div>

      {/* Top brand row */}
      <div
        style={{
          position: "absolute",
          top: 66,
          left: 78,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        {iconSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconSrc}
            alt=""
            width={46}
            height={46}
            style={{
              objectFit: "cover",
              borderRadius: 999,
              border: `1.5px solid ${BORDER}`,
            }}
          />
        ) : null}
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: MUTED_FG,
          }}
        >
          Universo Ovelhera
        </div>
      </div>

      {/* Character on the right */}
      {ovelheraSrc ? (
        <div
          style={{
            position: "absolute",
            right: 54,
            bottom: 28,
            top: 96,
            width: 450,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ovelheraSrc}
            alt=""
            width={450}
            height={450}
            style={{ objectFit: "contain" }}
          />
        </div>
      ) : null}

      {/* Main content */}
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "24px 78px 0",
          maxWidth: ovelheraSrc ? 740 : undefined,
        }}
      >
        <div
          style={{
            fontFamily: "Unbounded, Geist, system-ui, sans-serif",
            fontSize: ovelheraSrc ? 88 : 112,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: "-0.04em",
            color: FG,
            marginBottom: 22,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: MUTED_FG,
            maxWidth: ovelheraSrc ? 560 : 900,
            lineHeight: 1.35,
            marginBottom: 34,
          }}
        >
          {subtitle}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {["Histórias", "Músicas", "Esculachos", "Clipes", "Awards"].map(
            (label, i) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  padding: "9px 18px",
                  borderRadius: 999,
                  fontSize: 18,
                  fontWeight: 600,
                  color: i === 0 ? PRIMARY_FG : MUTED_FG,
                  background: i === 0 ? PRIMARY : MUTED,
                  border:
                    i === 0
                      ? `1.5px solid ${RING}`
                      : `1px solid ${BORDER}`,
                }}
              >
                {label}
              </div>
            )
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: "absolute",
          bottom: 58,
          left: 78,
          right: 78,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: MUTED_FG,
            letterSpacing: "0.02em",
          }}
        >
          rastaflix.vercel.app
        </div>
      </div>
    </div>
  );
}
