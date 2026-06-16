import LegalPage from "./LegalPage"

export default function PrivacyPage() {
  return (
    <LegalPage
      documentId="privacy"
      sectionLabel="Legal"
      title="Privacy Policy"
      version="1.0"
      lastUpdated="June 16, 2026"
    >
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0", margin: "0 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        1. Data We Collect
      </h2>
      <p style={{ margin: "0 0 1rem" }}>
        PR5JECT collects the following information from users:
      </p>
      <ul style={{ paddingLeft: "1.5rem", margin: "0 0 1rem", lineHeight: 2 }}>
        <li><strong style={{ color: "#f0f0f0" }}>Email address</strong> — required for account creation and transactional communications.</li>
        <li><strong style={{ color: "#f0f0f0" }}>Phone number</strong> — optional, used only if provided for account recovery.</li>
        <li><strong style={{ color: "#f0f0f0" }}>Order history</strong> — designs pre-ordered, sizes, amounts, and payment method metadata (card last 4 digits, expiry). Full card details are never stored by PR5JECT; they are held by Stripe.</li>
        <li><strong style={{ color: "#f0f0f0" }}>Design uploads</strong> — images and configurations submitted to the Arena, associated with your account.</li>
        <li><strong style={{ color: "#f0f0f0" }}>Usage data</strong> — page views, clicks, and interaction events used to improve the platform.</li>
        <li><strong style={{ color: "#f0f0f0" }}>IP address and device info</strong> — logged for security, fraud prevention, and legal compliance.</li>
      </ul>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0", margin: "1.5rem 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        2. How We Use Your Data
      </h2>
      <p style={{ margin: "0 0 1rem" }}>
        Your data is used exclusively to operate the PR5JECT platform: processing pre-orders, communicating order status, enabling creator features, detecting fraud, and improving the user experience. We use your email to send transactional messages (order confirmations, shipping updates, legal notices). We may send promotional emails only if you opt in.
      </p>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0", margin: "1.5rem 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        3. Data Sharing
      </h2>
      <p style={{ margin: "0 0 1rem" }}>
        PR5JECT does <strong style={{ color: "#f0f0f0" }}>not sell your personal data to third parties</strong>. We share limited information only with service providers necessary to operate the platform (e.g., Stripe for payment processing, AWS for infrastructure). These providers are bound by confidentiality obligations. We may disclose data if required by law or to protect the rights and safety of our users.
      </p>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0", margin: "1.5rem 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        4. Data Retention
      </h2>
      <p style={{ margin: "0 0 1rem" }}>
        We retain your account data for as long as your account is active. Order records and legal acceptance logs are retained for a minimum of 7 years for legal and financial compliance. You may request deletion of your account at any time by contacting support@pr5ject.com, subject to applicable legal retention requirements.
      </p>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0", margin: "1.5rem 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        5. Your Rights
      </h2>
      <p style={{ margin: "0 0 1rem" }}>
        You have the right to access, correct, or request deletion of your personal data. To exercise these rights, contact support@pr5ject.com. We will respond within 30 days.
      </p>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0", margin: "1.5rem 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        6. Cookies and Tracking
      </h2>
      <p style={{ margin: "0 0 1rem" }}>
        PR5JECT uses minimal analytics tracking (page views and interaction events) stored locally. We do not use third-party advertising cookies. You may disable JavaScript-based tracking by adjusting your browser settings.
      </p>
    </LegalPage>
  )
}
