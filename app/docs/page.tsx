export default function DocsPage() {
  return (
    <div style={{ padding: "80px", color: "white" }}>
      <h1>Meterly API Documentation</h1>

      <p style={{ color: "#9ca3af", marginTop: "10px" }}>
        Meterly provides APIs to track usage, enforce limits, and bill customers
        based on real consumption.
      </p>

      <h2 style={{ marginTop: "40px" }}>Authentication</h2>
      <pre>
        Authorization: Bearer YOUR_API_KEY
      </pre>

      <h2 style={{ marginTop: "40px" }}>Example Request</h2>
      <pre>
{`curl https://api.meterly.dev/v1/usage
-H "Authorization: Bearer sk_live_xxxxx"`}
      </pre>

      <p style={{ marginTop: "30px" }}>
        👉 To generate an API key, sign in and visit your dashboard.
      </p>
    </div>
  );
}
