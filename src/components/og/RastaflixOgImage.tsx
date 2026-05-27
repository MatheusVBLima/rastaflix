export interface RastaflixOgImageProps {
  title?: string;
  subtitle?: string;
  ovelheraSrc?: string;
  iconSrc?: string;
}

/**
 * Visual layout for Open Graph / social preview cards (1200×630).
 * Used with next/og ImageResponse — inline styles only (Satori subset).
 * Palette follows the app's `.dark` theme: neutral dark gray bg, light
 * foreground, green primary accent.
 */
export function RastaflixOgImage({
  title = "Rastaflix",
  subtitle = "Acompanhe a saga do nosso rastafari mineiro",
  ovelheraSrc,
  iconSrc,
}: RastaflixOgImageProps) {
  // Mapped from globals.css `.dark` tokens — kept semantic so usage matches
  // app conventions: bg around the card, card surface inside, muted for
  // inactive controls, accent/border for hairlines, primary for the active CTA.
  const BG = "#1f1f1f"; // --background
  const CARD = "#2f2f2f"; // --card
  const MUTED = "#3a3a3a"; // --muted
  const BORDER = "#3f3f3f"; // --border
  const FG = "#ebebed"; // --foreground
  const MUTED_FG = "#b4b4b4"; // --muted-foreground
  const PRIMARY = "#3f9e6a"; // --primary (dark green)
  const PRIMARY_FG = "#dcfce7"; // --primary-foreground
  const RING = "#5dd28a"; // --ring (bright green)

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: BG,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Rasta tri-color side bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 14,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, background: "#16a34a" }} />
        <div style={{ flex: 1, background: "#facc15" }} />
        <div style={{ flex: 1, background: "#dc2626" }} />
      </div>

      {/* Outer frame */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 44,
          right: 30,
          bottom: 30,
          borderRadius: 24,
          border: `1.5px solid ${BORDER}`,
          background: CARD,
        }}
      />

      {/* Top brand row */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 88,
          display: "flex",
          alignItems: "center",
          zIndex: 1,
        }}
      >
        <div
          style={{
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
              width={56}
              height={56}
              style={{ objectFit: "contain" }}
            />
          ) : null}
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: MUTED_FG,
            }}
          >
            Universo Ovelhera
          </div>
        </div>
      </div>

      {/* Character on the right */}
      {ovelheraSrc ? (
        <div
          style={{
            position: "absolute",
            right: 60,
            bottom: 30,
            top: 110,
            width: 460,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ovelheraSrc}
            alt=""
            width={460}
            height={460}
            style={{
              objectFit: "contain",
            }}
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
          padding: "0 88px",
          maxWidth: ovelheraSrc ? 760 : undefined,
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 64,
              height: 3,
              background:
                "linear-gradient(90deg, #16a34a 0%, #facc15 50%, #dc2626 100%)",
              borderRadius: 999,
            }}
          />
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: MUTED_FG,
            }}
          >
            Eterno Ciclo
          </div>
        </div>

        <div
          style={{
            fontSize: ovelheraSrc ? 132 : 168,
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: "-0.045em",
            color: FG,
            marginBottom: 26,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: MUTED_FG,
            maxWidth: ovelheraSrc ? 600 : 940,
            lineHeight: 1.3,
            marginBottom: 36,
          }}
        >
          {subtitle}
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
          }}
        >
          {["Histórias", "Músicas", "Esculachos", "Clipes", "Lives"].map(
            (label, i) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  padding: ovelheraSrc ? "9px 18px" : "12px 24px",
                  borderRadius: 999,
                  fontSize: ovelheraSrc ? 18 : 22,
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
          bottom: 56,
          left: 88,
          right: 70,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: MUTED_FG,
            letterSpacing: "0.04em",
          }}
        >
          rastaflix.vercel.app
        </div>
      </div>
    </div>
  );
}
