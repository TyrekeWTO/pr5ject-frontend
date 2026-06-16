import LegalPage from "./LegalPage"

export default function TermsPage() {
  return (
    <LegalPage
      documentId="terms"
      sectionLabel="Legal"
      title="Terms of Service"
      version="1.0"
      lastUpdated="June 16, 2026"
    >
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0", margin: "0 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        1. Crowdfunded Pre-Order Model
      </h2>
      <p style={{ margin: "0 0 1rem" }}>
        PR5JECT operates a crowdfunded manufacturing model. Designs are submitted by creators and enter the Arena, where community members can place pre-orders. A design moves to production only when it reaches the funding threshold (currently 50 pre-orders). There is <strong style={{ color: "#f0f0f0" }}>no guaranteed ship date</strong> for any design. By placing a pre-order, you acknowledge that production timelines depend on threshold achievement and manufacturing capacity.
      </p>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0", margin: "1.5rem 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        2. Payment and Charges
      </h2>
      <p style={{ margin: "0 0 1rem" }}>
        When you place a pre-order, your payment method is saved but <strong style={{ color: "#f0f0f0" }}>nothing is charged immediately</strong>. Your card is charged only if and when the design successfully reaches its funding threshold. If a design does not fund, no charge is made and your saved payment information is discarded.
      </p>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0", margin: "1.5rem 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        3. Refund Policy
      </h2>
      <p style={{ margin: "0 0 1rem" }}>
        Pre-orders may be cancelled before the funding threshold is reached. Once a design funds and production begins, <strong style={{ color: "#f0f0f0" }}>no refunds will be issued</strong>. Orders for funded designs that have entered manufacturing are final. PR5JECT may issue refunds at its sole discretion in cases of significant defect or failure to deliver.
      </p>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0", margin: "1.5rem 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        4. Design Submissions
      </h2>
      <p style={{ margin: "0 0 1rem" }}>
        Creators who submit designs to the Arena grant PR5JECT a license to produce and sell those designs as outlined in the Creator Agreement. Submissions must comply with our content guidelines and must not infringe any third-party intellectual property rights. PR5JECT reserves the right to remove any design that violates these terms.
      </p>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0", margin: "1.5rem 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        5. Dispute Resolution
      </h2>
      <p style={{ margin: "0 0 1rem" }}>
        Any dispute arising from your use of PR5JECT shall first be addressed by contacting us at support@pr5ject.com. If a dispute cannot be resolved informally within 30 days, it shall be submitted to binding arbitration in accordance with applicable law. By using PR5JECT you waive the right to participate in class-action lawsuits.
      </p>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0", margin: "1.5rem 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        6. Modifications
      </h2>
      <p style={{ margin: "0 0 1rem" }}>
        PR5JECT may update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the revised Terms. We will notify users of material changes via email or in-app notification.
      </p>
    </LegalPage>
  )
}
