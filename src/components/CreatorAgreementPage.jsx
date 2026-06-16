import LegalPage from "./LegalPage"

export default function CreatorAgreementPage() {
  return (
    <LegalPage
      documentId="creator-agreement"
      sectionLabel="Legal"
      title="Creator Agreement"
      version="1.0"
      lastUpdated="June 16, 2026"
    >
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0", margin: "0 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        1. Ownership of Your Design
      </h2>
      <p style={{ margin: "0 0 1rem" }}>
        You retain full ownership of any design you submit to PR5JECT. Submitting a design does not transfer your intellectual property rights to PR5JECT. You represent and warrant that you are the original creator of the submitted design and that it does not infringe on any third-party rights.
      </p>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0", margin: "1.5rem 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        2. License Granted to PR5JECT
      </h2>
      <p style={{ margin: "0 0 1rem" }}>
        By submitting a design to the Arena, you grant PR5JECT a <strong style={{ color: "#f0f0f0" }}>non-exclusive, worldwide, royalty-bearing license</strong> to reproduce, manufacture, display, market, and sell physical products featuring your design. This license is limited to the PR5JECT platform and its authorized manufacturing partners. PR5JECT will not sublicense your design to unaffiliated third parties without your written consent.
      </p>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0", margin: "1.5rem 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        3. Creator Royalty
      </h2>
      <p style={{ margin: "0 0 1rem" }}>
        For each unit sold of your funded design, you earn a <strong style={{ color: "#f0f0f0" }}>royalty per unit sold</strong> as determined by the current royalty schedule published on the PR5JECT platform. Royalty rates are subject to change for future designs but will not be reduced for designs already in production. Royalties are paid out on a rolling 30-day basis via your registered payment method. Additionally, the creator of any funded design receives one (1) free unit of the funded product.
      </p>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0", margin: "1.5rem 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        4. DMCA and IP Responsibility
      </h2>
      <p style={{ margin: "0 0 1rem" }}>
        You are solely responsible for ensuring your design does not infringe any copyright, trademark, or other intellectual property rights of third parties. If PR5JECT receives a valid DMCA takedown notice or intellectual property claim related to your design, we may remove the design from the Arena and cancel associated pre-orders. <strong style={{ color: "#f0f0f0" }}>You agree to indemnify and hold PR5JECT harmless</strong> from any claims, damages, or legal costs arising from your design's infringement of third-party rights.
      </p>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0", margin: "1.5rem 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        5. Content Standards
      </h2>
      <p style={{ margin: "0 0 1rem" }}>
        Designs must not contain content that is hateful, obscene, defamatory, or otherwise in violation of applicable law. PR5JECT reserves the right to reject or remove designs that violate these standards without liability to the creator.
      </p>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem", color: "#f0f0f0", margin: "1.5rem 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        6. Term and Termination
      </h2>
      <p style={{ margin: "0 0 1rem" }}>
        This agreement is effective from the date you submit your first design and continues until terminated. You may withdraw a design from the Arena at any time before it reaches the funding threshold. Once funded and in production, the license cannot be revoked for that production run. PR5JECT may terminate a creator's access for repeated violations of this agreement.
      </p>
    </LegalPage>
  )
}
