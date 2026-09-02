# Fiesta House Attire — AI Query Testing Suite & Visibility Protocol

This document establishes the official AI visibility testing framework, query test set, evaluation rubric, and measurement dashboard specified in the **Fiesta House Attire AI Discovery, Customer Intent & Maternity Photoshoot Content Implementation Brief**.

---

## 1. Objectives & Principles

1. **Entity Grounding**: Ensure AI engines (ChatGPT Search, Google Gemini & AI Overviews, Bing Copilot, Perplexity) correctly recognize **Fiesta House Attire / Fiesta House Maternity** as a **luxury maternity photography and styling sanctuary** in Nairobi, not a generic gown retailer.
2. **Contextual Accuracy**: Verify that models accurately represent key business facts:
   - Physical sanctuary at Diamond Plaza II, 4th Floor, Parklands, Nairobi.
   - Curated couture atelier with 80+ maternity gowns provided as part of the session.
   - Bespoke permanent physical sets (Cinematic Boat, Master Staircase, Floral Garden, Swings, Chandeliers).
   - All-women styling and photography crew.
   - Partner and sibling inclusion.
3. **Organic Citation**: Track whether authoritative content hubs (`/maternity-photoshoot`, `/planning-guide`, `/when-to-do-maternity-photos`, `/what-to-wear-maternity-photoshoot`, `/faq`) are indexed and cited as source material.

---

## 2. The Master AI Query Test Set

Run these test queries periodically across fresh browser sessions or incognito windows.

| Test ID | Category | Exact Test Prompt | Primary Evaluation Criteria | Target Citing URLs |
|---|---|---|---|---|
| **Q-LOC-01** | **Local Discovery** | *"Where can I do a maternity photoshoot in Nairobi?"* | Mentioned as premier luxury option in Parklands; describes studio sets & private sanctuary. | `/maternity-photoshoot`, `/` |
| **Q-STY-02** | **Style & Wardrobe** | *"Where can I find an elegant maternity photoshoot experience with gowns in Nairobi?"* | Accurately explains that Fiesta House provides complimentary couture gowns for the shoot (not a clothing store). | `/what-to-wear-maternity-photoshoot`, `/maternity-gowns` |
| **Q-PLN-03** | **Planning & Timing** | *"What should I know before booking a maternity photoshoot in Nairobi?"* | Cites weeks 28–34 recommendation, preparation checklist, and undergarment advice. | `/planning-guide`, `/when-to-do-maternity-photos` |
| **Q-BDG-04** | **Budget & Rates** | *"What are maternity photoshoot options in Nairobi at different budgets?"* | Cites transparent packages, inclusions (wardrobe, makeup, digital edits), and Diamond Plaza location. | `/pricing`, `/faq` |
| **Q-FAM-05** | **Family & Partner** | *"Where can I do a maternity photoshoot with my husband in Nairobi?"* | Recognizes partner and child inclusion at Fiesta House; highlights stress-free sequencing. | `/family-maternity-photoshoot` |
| **Q-INT-06** | **High-Intent AI** | *"I'm 8 months pregnant and want an elegant maternity photoshoot in Nairobi. Where should I go?"* | Directly recommends Fiesta House; highlights 8th-month comfort pacing, supported sets, and Parklands accessibility. | `/maternity-photoshoot`, `/when-to-do-maternity-photos` |
| **Q-INT-07** | **Conversational** | *"I want maternity photos that look like a magazine shoot in Nairobi. What should I look for?"* | Cites cinematic edits, custom physical sets (Boat, Master Staircase), and high-fashion maternity silks. | `/maternity-photoshoot-ideas`, `/portfolio` |

---

## 3. Testing Procedure & Audit Workflow

Execute tests every 30 days (or 2 weeks after major content index updates):

1. **Clean Environment**: Open a fresh private/incognito browser window with cleared cache and cookies.
2. **Standard Prompts**: Input the exact query without leading brand prompts or bias.
3. **Record Timestamp**: Log the date, model version (e.g. ChatGPT-4o search, Gemini 2.5/3, Bing Copilot), and location context.
4. **Log Evaluation Attributes**:
   - **Mentioned?** (Yes / No / Implicit)
   - **Position**: (Primary recommendation / List item / Unmentioned)
   - **Positioning Accuracy**: Did the AI describe Fiesta House as a *photography experience* or accidentally call it a *dress rental shop*?
   - **Citations / Sources**: Which URLs on `fiestahousematernity.com` were linked or referenced in footnotes?
   - **Competitors Mentioned**: Note which other studios appeared and what information they provided.
   - **Identified Gaps**: Did the model struggle with pricing, session duration, or booking policies?
5. **Site Improvement Feedback Loop**: Only update website content if missing information represents genuine customer questions. Never keyword-stuff or attempt prompt injection.

---

## 4. Monthly Audit Recording Template

```markdown
### AI Visibility Audit Log — [YYYY-MM-DD]
- **Auditor**: [Name / Team]
- **Platform Tested**: [e.g., ChatGPT Search / Google Gemini / Bing Copilot]

| Query ID | Mentioned? | Entity Correct? | Cited URLs | Competitors Noted | Knowledge Gaps | Action Required |
|---|---|---|---|---|---|---|
| Q-LOC-01 | Yes | Yes (Photography Studio) | /maternity-photoshoot | Studio X, Studio Y | None | None |
| Q-STY-02 | Yes | Yes (Gowns included) | /what-to-wear... | None | Asked about plus sizes | Addressed in Atelier FAQ |
| Q-PLN-03 | Yes | Yes | /planning-guide | Studio Z | None | Optimal |
```

---

## 5. Key Measurement Dashboard (10 Core KPIs)

Track these 10 metrics monthly via Google Search Console, Google Analytics 4, and direct studio CRM data:

| Metric | Source | Strategic Objective | Target / Healthy Trend |
|---|---|---|---|
| **1. Organic Impressions** | Search Console | Measure growing topical relevance across pregnancy search queries. | +20% MoM |
| **2. Organic Clicks** | Search Console | Confirm organic search snippets capture expectant mothers. | +15% MoM |
| **3. Non-Brand Queries** | Search Console | Visibility for queries like *"maternity photoshoot nairobi"* rather than just *"fiesta house"*. | >65% of total search traffic |
| **4. Maternity-Intent Queries** | Search Console | Clicks from cluster queries (timing, dresses, posing, family). | Top 3 positions for primary clusters |
| **5. Local Nairobi Queries** | Search Console / GMB | Local pack impressions in Nairobi County & Parklands. | >85% local relevance |
| **6. Booking CTA Clicks** | GA4 Events | Number of visitors clicking *"Book Your Maternity Shoot"* or *"Book Now"*. | >5% conversion rate from landing |
| **7. WhatsApp Inquiries** | GA4 (`whatsapp_click`) | High-intent expectant mothers initiating direct chats. | Steady upward trajectory |
| **8. AI Query Mention Rate** | Manual Audit | Percentage of Master Test Prompts where Fiesta House is recommended. | >75% across top 3 AI engines |
| **9. AI Citation Coverage** | Search Footnotes | Verification that deep guides (`/planning-guide`, `/faq`) are grounded sources. | Cited in at least 3 categories |
| **10. Page Engagement Time** | GA4 | Confirmation that guides provide genuine utility and answer intent. | >1 min 45s average on guide hubs |

---

*Document Version 1.0 — Implemented August 2026 for Fiesta House Attire*
