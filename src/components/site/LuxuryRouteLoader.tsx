const LuxuryRouteLoader = () => {
  return (
    <div
      aria-live="polite"
      aria-busy="true"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#ffffff",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "min(460px, 92vw)",
          textAlign: "center",
          color: "#2c2c2a",
          fontFamily: "'Cormorant Garamond', serif",
        }}
      >
        <style>{`
          @keyframes fhSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fhDot {
            0%, 100% { transform: scale(1); opacity: .45; }
            50% { transform: scale(1.25); opacity: 1; }
          }
          @keyframes fhShimmer {
            0% { transform: translateX(-130%); }
            100% { transform: translateX(130%); }
          }
          @keyframes fhFade {
            0%, 100% { opacity: .72; }
            50% { opacity: 1; }
          }
        `}</style>

        <div
          aria-hidden="true"
          style={{
            width: "42px",
            height: "42px",
            margin: "0 auto 1rem",
            borderRadius: "999px",
            border: "2px solid rgba(44,44,42,.14)",
            borderTopColor: "#c43da7",
            borderRightColor: "#10a6c9",
            animation: "fhSpin 1.05s linear infinite",
          }}
        />

        <div
          style={{
            fontSize: "clamp(1.8rem, 4.6vw, 2.6rem)",
            letterSpacing: ".08em",
            lineHeight: 1.1,
            fontWeight: 500,
            animation: "fhFade 2.4s ease-in-out infinite",
          }}
        >
          Fiesta House Maternity
        </div>

        <div
          style={{
            marginTop: "0.8rem",
            fontFamily: "'Montserrat', 'Segoe UI', sans-serif",
            fontSize: ".65rem",
            letterSpacing: ".3em",
            textTransform: "uppercase",
            color: "#10a6c9",
            opacity: 0.9,
          }}
        >
          Expect in Style
        </div>

        <div
          style={{
            margin: "1.2rem auto 0",
            width: "min(220px, 66vw)",
            height: "2px",
            position: "relative",
            overflow: "hidden",
            background: "rgba(44,44,42,.12)",
            borderRadius: "999px",
          }}
        >
          <span
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(90deg, transparent 0%, #c43da7 45%, #10a6c9 55%, transparent 100%)",
              animation: "fhShimmer 1.45s ease-in-out infinite",
            }}
          />
        </div>

        <div
          aria-hidden="true"
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "999px",
            margin: "0.9rem auto 0",
            background: "#d9a21b",
            animation: "fhDot 1.1s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
};

export default LuxuryRouteLoader;