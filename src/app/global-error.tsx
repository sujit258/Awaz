"use client";

export const dynamic = "force-dynamic";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>Application Error | Awaz</title>
      </head>
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          backgroundColor: "#F7F8FA",
          color: "#17212F",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "1rem",
        }}
      >
        <div
          style={{
            maxWidth: "460px",
            width: "100%",
            backgroundColor: "#ffffff",
            padding: "2rem",
            borderRadius: "12px",
            border: "1px solid #E1E5EB",
            textAlign: "center",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              margin: "0 auto 1rem",
              borderRadius: "50%",
              backgroundColor: "#FEF3F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#B42318",
              fontSize: "1.5rem",
              fontWeight: "bold",
            }}
          >
            !
          </div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
              color: "#17212F",
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              color: "#5B6573",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
              lineHeight: 1.5,
            }}
          >
            A critical error occurred while rendering the page. You can try refreshing
            or navigate back to the dashboard.
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => reset()}
              style={{
                backgroundColor: "#2457D6",
                color: "#ffffff",
                border: "none",
                padding: "0.625rem 1.25rem",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                backgroundColor: "#F1F2F4",
                color: "#17212F",
                textDecoration: "none",
                padding: "0.625rem 1.25rem",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.875rem",
                display: "inline-block",
              }}
            >
              Back to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
