import Layout from "@/components/site/Layout";

const sections = [
  {
    title: "1. Scope",
    body: [
      "This Privacy Policy explains how Fiesta House Maternity (\"we\", \"our\", \"us\") collects, uses, stores, and shares personal data when you use our website, contact us, book services, or interact with us through WhatsApp and other Meta business messaging tools.",
      "This policy applies to visitors, clients, and any person who communicates with us through our website, forms, social channels, or WhatsApp messages.",
    ],
  },
  {
    title: "2. Data We Collect",
    body: [
      "Contact and booking information: name, phone number, email address, preferred dates, and service preferences.",
      "Message content: information you share when you contact us through website forms, email, Instagram, Facebook, or WhatsApp.",
      "Technical data: IP address, browser details, device data, and basic usage analytics from our website.",
      "Media and session records: photos, selections, and communication notes related to delivering maternity photography services.",
    ],
  },
  {
    title: "3. How We Use Your Data",
    body: [
      "To respond to enquiries, confirm bookings, deliver services, and provide customer support.",
      "To send essential operational communications, including appointment updates and service information.",
      "To improve our website experience, security, and service quality.",
      "To comply with legal obligations and platform requirements for business messaging services, including Meta and WhatsApp integrations.",
    ],
  },
  {
    title: "4. WhatsApp and Meta Messaging Integrations",
    body: [
      "When we use WhatsApp Business Platform APIs, your phone number, profile metadata, and message content may be processed through Meta infrastructure to deliver messaging features.",
      "We only use messaging data for legitimate customer communication and service delivery, and we do not sell personal data.",
      "Where required by law, we rely on your consent or another lawful basis before sending business-initiated communications.",
      "You can opt out of non-essential messaging by contacting us using the details in this policy.",
    ],
  },
  {
    title: "5. Legal Bases (Where Applicable)",
    body: [
      "Contract: to provide services you request (bookings, consultations, and support).",
      "Legitimate interests: to operate and improve our business and communications.",
      "Consent: where required for specific message flows, promotions, or sensitive processing.",
      "Legal obligation: to meet regulatory, tax, and compliance duties.",
    ],
  },
  {
    title: "6. Data Sharing",
    body: [
      "We may share data with trusted processors and service providers that help us run our business (for example hosting, storage, analytics, messaging, payment, and admin tools).",
      "For WhatsApp API features, data may be processed by Meta/WhatsApp as part of message routing and platform operations.",
      "We may disclose data if required by law, legal process, or to protect rights, safety, and security.",
    ],
  },
  {
    title: "7. Retention",
    body: [
      "We keep personal data only for as long as necessary for the purposes in this policy, including customer support, legal, accounting, and operational requirements.",
      "When data is no longer needed, we securely delete, anonymize, or de-identify it where practical.",
    ],
  },
  {
    title: "8. Your Rights",
    body: [
      "Subject to local law, you may request access, correction, deletion, restriction, objection, or portability of your personal data.",
      "You may also request that we stop using your data for direct marketing or non-essential communications.",
      "To make a request, contact us at info@fiestahouseattire.com.",
    ],
  },
  {
    title: "9. Data Deletion Requests",
    body: [
      "If you want us to delete your personal data, email info@fiestahouseattire.com with the subject line \"Data Deletion Request\" and include enough information for us to identify your records.",
      "If you are interacting via Meta products and request deletion through Meta's app settings, we will process the request in line with applicable requirements and our platform obligations.",
      "We will respond within a reasonable period, subject to legal exceptions.",
    ],
  },
  {
    title: "10. Security",
    body: [
      "We apply reasonable technical and organizational safeguards to protect personal data against unauthorized access, loss, misuse, and alteration.",
      "No internet transmission or storage method is 100% secure, but we continuously improve our safeguards.",
    ],
  },
  {
    title: "11. International Processing",
    body: [
      "Our tools and providers may process data in countries outside your own. Where required, we use contractual and operational safeguards for international data transfers.",
    ],
  },
  {
    title: "12. Children's Privacy",
    body: [
      "Our services are not directed to children. We do not knowingly collect personal data from children in violation of applicable law.",
    ],
  },
  {
    title: "13. Changes to This Policy",
    body: [
      "We may update this policy from time to time. Material changes will be posted on this page with an updated effective date.",
    ],
  },
  {
    title: "14. Contact",
    body: [
      "Fiesta House Maternity",
      "Diamond Plaza II, Nairobi, Kenya",
      "Email: info@fiestahouseattire.com",
      "Phone/WhatsApp: +254 720 111 928",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <Layout
      title="Privacy Policy | Fiesta House Maternity"
      description="Read how Fiesta House Maternity collects, uses, stores, and protects your data, including WhatsApp and Meta messaging interactions."
      keywords="privacy policy, fiesta house maternity, whatsapp api privacy, data deletion request"
    >
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Privacy Policy - Fiesta House Maternity",
          url: "https://www.fiestahousematernity.com/privacy-policy",
          description:
            "Privacy policy describing data handling for website, bookings, and WhatsApp/Meta messaging.",
        })}
      </script>

      <section
        style={{
          background: "linear-gradient(135deg, var(--sky-blue-tint) 0%, #fff 75%)",
          borderBottom: "1px solid rgba(102,0,50,0.12)",
          padding: "6.5rem 0 3rem",
        }}
      >
        <div className="container" style={{ maxWidth: "980px" }}>
          <p
            style={{
              fontSize: "0.78rem",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "var(--magenta)",
              fontWeight: 700,
              marginBottom: "0.9rem",
            }}
          >
            Legal
          </p>
          <h1 className="display" style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", marginBottom: "0.8rem" }}>
            Privacy Policy
          </h1>
          <p style={{ marginBottom: 0, maxWidth: "760px", opacity: 0.8 }}>
            Effective date: August 19, 2026
          </p>
        </div>
      </section>

      <section className="section-padding" style={{ paddingTop: "3rem" }}>
        <div className="container" style={{ maxWidth: "980px" }}>
          <div
            style={{
              background: "#fff",
              border: "1px solid rgba(43,35,32,0.12)",
              borderRadius: "10px",
              padding: "clamp(1rem, 3vw, 2.2rem)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
            }}
          >
            {sections.map((section) => (
              <div key={section.title} style={{ marginBottom: "1.7rem" }}>
                <h2
                  style={{
                    fontSize: "clamp(1.2rem, 2.4vw, 1.75rem)",
                    color: "var(--magenta)",
                    marginBottom: "0.45rem",
                  }}
                >
                  {section.title}
                </h2>
                {section.body.map((line) => (
                  <p key={line} style={{ marginBottom: "0.55rem", opacity: 0.88 }}>
                    {line}
                  </p>
                ))}
              </div>
            ))}
            <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.7 }}>
              This page provides general privacy information and does not constitute legal advice.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
