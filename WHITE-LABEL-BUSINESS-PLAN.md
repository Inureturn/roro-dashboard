# White Label Business Plan
## Building a SaaS Business with the RoRo Dashboard

---

## 🎯 Executive Summary

**Product:** Real-time vessel tracking dashboard (white-label)
**Target Market:** Shipping companies, logistics firms, port authorities
**Business Model:** Monthly SaaS subscription
**Initial Investment:** $0 (already built)
**Time to First Sale:** 2-4 weeks
**Potential Revenue:** $5,000-50,000/month (10-100 clients)

---

## 💰 Pricing Strategy

### **Tier 1: Starter - $99/month**
- Up to 20 vessels
- 2 tracking regions
- 90 days history
- Email support
- Shared infrastructure
- **Target:** Small shipping companies, freight forwarders

### **Tier 2: Professional - $199/month**
- Up to 50 vessels
- 5 tracking regions
- 90 days history
- Priority email support
- Custom domain (yourcompany.fleet-tracker.com)
- **Target:** Medium shipping lines, logistics firms

### **Tier 3: Enterprise - $499/month**
- Up to 200 vessels
- Unlimited regions
- 180 days history
- Phone + email support
- Dedicated infrastructure
- Custom branding
- White-label resale rights
- **Target:** Large shipping companies, port authorities

### **Add-ons:**
- Extra vessels: $5/vessel/month
- Extended history (1 year): $100/month
- Custom exports: $50 each
- API access: $200/month
- Custom features: $150/hour

---

## 📊 Revenue Projections

### **Year 1 (Conservative)**
| Month | Clients | MRR | ARR |
|-------|---------|-----|-----|
| 1-3 | 2 | $398 | $4,776 |
| 4-6 | 5 | $895 | $10,740 |
| 7-9 | 10 | $1,790 | $21,480 |
| 10-12 | 15 | $2,685 | $32,220 |

**Year 1 Total:** $32,220

### **Year 2 (Growth)**
| Quarter | Clients | MRR | ARR |
|---------|---------|-----|-----|
| Q1 | 25 | $4,475 | $53,700 |
| Q2 | 35 | $6,265 | $75,180 |
| Q3 | 50 | $8,950 | $107,400 |
| Q4 | 75 | $13,425 | $161,100 |

**Year 2 Total:** $161,100

### **Year 3 (Mature)**
- 100-150 clients
- $20,000-30,000 MRR
- $240,000-360,000 ARR

---

## 🏗️ Infrastructure Costs

### **Shared Multi-Tenant Model**

**For 1-20 clients:**
- AWS Lightsail ($10/mo): Handles multiple ingestors
- Supabase Pro ($25/mo): 8GB database
- Domain + SSL ($2/mo): fleet-tracker.com
- **Total Cost:** $37/month
- **Profit at 10 clients:** $990 - $37 = $953/month

**For 21-50 clients:**
- AWS EC2 ($30/mo): More powerful VPS
- Supabase Pro ($25/mo): Still fits
- CDN ($10/mo): Faster dashboard loads
- **Total Cost:** $65/month
- **Profit at 30 clients:** $5,970 - $65 = $5,905/month

**For 51-100 clients:**
- AWS EC2 ($100/mo): Dedicated server
- Supabase Team ($599/mo): 100GB database
- CDN + monitoring ($50/mo): Production grade
- **Total Cost:** $749/month
- **Profit at 75 clients:** $13,425 - $749 = $12,676/month

---

## 🔧 Technical Architecture

### **Multi-Tenant Setup**

```
PostgreSQL (Supabase)
├── Schema: client_a
│   ├── vessels
│   └── vessel_positions
├── Schema: client_b
│   ├── vessels
│   └── vessel_positions
└── Schema: client_c
    ├── vessels
    └── vessel_positions

Ingestor (One Process)
├── Subscribes to all clients' vessels
├── Routes data to correct schema
└── Rate limits per vessel (not per client)

Web Dashboard (Shared Codebase)
├── Domain routing: clienta.fleet-tracker.com
├── Loads client-specific schema
└── Custom branding per client
```

### **Code Structure**

```javascript
// ingest.mjs (modified for multi-tenant)
const clients = [
  {
    id: 'client-a',
    schema: 'client_a',
    vessels: ['357170000', '352808000'],
    bbox: [[124,33],[132,39]]
  },
  {
    id: 'client-b',
    schema: 'client_b',
    vessels: ['249901000', '229077000'],
    bbox: [[-6,30],[36,46]]
  }
];

// Subscribe to all vessels from all clients
const allVessels = clients.flatMap(c => c.vessels);

// Route data to correct schema
function savePosition(mmsi, position) {
  const client = findClientByMMSI(mmsi);
  supabase.schema(client.schema).from('vessel_positions').insert(position);
}
```

---

## 📈 Sales & Marketing Strategy

### **Target Customers**

**Primary:**
1. **Small-medium shipping lines** (10-50 vessels)
   - Pain: MarineTraffic too expensive
   - Benefit: 50% cost savings
   - Channels: LinkedIn, shipping forums

2. **Logistics companies** (tracking client vessels)
   - Pain: No white-label solution
   - Benefit: Resell to their customers
   - Channels: Freight forwarder associations

3. **Charter brokers** (monitor available vessels)
   - Pain: Manual tracking spreadsheets
   - Benefit: Real-time automation
   - Channels: Industry events, cold email

**Secondary:**
4. Port authorities (arrival predictions)
5. Insurance companies (risk monitoring)
6. Shipyards (construction tracking)

---

### **Marketing Channels**

**Month 1-3: Direct Outreach**
- LinkedIn: Connect with 50 shipping managers/week
- Email: 100 cold emails/week (3% response = 12 leads/month)
- Forums: Post in shipping/logistics communities
- **Cost:** $0 (time only)

**Month 4-6: Content Marketing**
- Blog: "How to Track Your Fleet for Under $100/month"
- YouTube: Dashboard demo videos
- SEO: "vessel tracking software", "fleet management dashboard"
- **Cost:** $200/month (freelance writer)

**Month 7-12: Paid Ads**
- Google Ads: "vessel tracking", "fleet management" ($500/mo)
- LinkedIn Ads: Target shipping decision-makers ($300/mo)
- Industry publications: Banner ads ($200/mo)
- **Cost:** $1,000/month
- **Expected:** 10-20 leads/month, 2-4 conversions

---

### **Sales Process**

**Lead → Trial → Close (2-3 weeks)**

1. **Inquiry:** Prospect fills demo request form
2. **Demo call:** 30-min Zoom showing their use case (15 mins)
3. **Free trial:** 14-day access with their vessels (instant)
4. **Check-in call:** Day 7 - answer questions (15 mins)
5. **Close:** Day 14 - convert to paid or extend trial

**Conversion rate:** 30-40% (industry standard for B2B SaaS)

**Sales tools needed:**
- Calendly: Schedule demos
- Loom: Video demos
- Stripe: Payment processing
- Intercom: Live chat
- **Total cost:** $100/month

---

## 🛠️ Operations

### **Your Time Commitment**

**Months 1-6 (Startup Phase):**
- Sales & marketing: 20 hours/week
- Customer onboarding: 5 hours/week
- Support: 5 hours/week
- Development: 5 hours/week
- **Total:** 35 hours/week (side business)

**Months 7-12 (Growth Phase):**
- Sales & marketing: 15 hours/week
- Customer success: 10 hours/week
- Support: 5 hours/week
- Development: 5 hours/week
- **Total:** 35 hours/week

**Year 2+ (Scale Phase):**
- Hire VA for support: -10 hours/week
- Automate onboarding: -5 hours/week
- Focus on sales: 20 hours/week
- **Total:** 20 hours/week (passive income!)

---

### **Hiring Plan**

**At 20 clients ($4,000 MRR):**
- **Hire:** Virtual assistant for support ($500/mo)
- **Handles:** Email support, vessel adds/removes
- **You:** Focus on sales + development

**At 50 clients ($10,000 MRR):**
- **Hire:** Sales rep (commission only) (20% of sales)
- **Handles:** Demos, onboarding
- **You:** Strategy + product

**At 100 clients ($20,000 MRR):**
- **Hire:** Full-time developer ($5,000/mo)
- **Handles:** Features, maintenance, scaling
- **You:** CEO role (10 hours/week)

---

## 🎨 White Label Customization

### **What You Customize Per Client:**

**Basic Branding:**
- ✅ Logo (replace in header)
- ✅ Colors (CSS variables)
- ✅ Domain (clientname.fleet-tracker.com)
- ✅ Company name in UI
- **Time:** 30 minutes per client

**Advanced (Enterprise tier):**
- Custom domain (www.clientfleet.com)
- Remove "Powered by" footer
- Custom login page
- Email notifications with their branding
- **Time:** 2-3 hours per client

---

### **Branding Implementation**

```css
/* style.css - CSS variables per client */
:root {
  --primary-color: #2a5298; /* Client's brand color */
  --logo-url: url('/logos/client-a.png');
  --company-name: 'Client Company Ltd';
}
```

```javascript
// config.js - per client
export default {
  clientId: 'client-a',
  schema: 'client_a',
  branding: {
    logo: '/logos/client-a.png',
    primaryColor: '#2a5298',
    companyName: 'Client Company Ltd',
    domain: 'clienta.fleet-tracker.com'
  }
}
```

---

## 🚀 Launch Checklist

### **Week 1-2: Product Preparation**
- [ ] Set up multi-tenant database structure
- [ ] Create landing page (fleet-tracker.com)
- [ ] Set up Stripe billing
- [ ] Create demo account with sample vessels
- [ ] Write sales deck

### **Week 3-4: First Client Push**
- [ ] LinkedIn outreach (50 connections)
- [ ] Cold email campaign (100 emails)
- [ ] Post in shipping forums
- [ ] Schedule 5 demo calls
- [ ] Close first paying client 🎯

### **Month 2: Growth**
- [ ] Onboard 3-5 clients
- [ ] Collect testimonials
- [ ] Create case study
- [ ] Launch content marketing
- [ ] Refine sales process

### **Month 3: Scale**
- [ ] 10 paying clients ($1,500 MRR)
- [ ] Hire VA for support
- [ ] Start paid ads
- [ ] Apply to startup accelerator (optional)

---

## 💡 Competitive Advantages

### **vs MarineTraffic:**
- ✅ 50% cheaper
- ✅ White-label option
- ✅ Unlimited users
- ✅ Self-hosted option
- ❌ Less global coverage (only tracked regions)

### **vs VesselFinder:**
- ✅ Custom branding
- ✅ Better UX
- ✅ Real-time (not delayed)
- ✅ Historical trails
- ❌ Smaller vessel database

### **vs Custom Development:**
- ✅ 90% cheaper ($200/mo vs $50k dev cost)
- ✅ Instant deployment
- ✅ Maintained by you
- ✅ Proven solution

---

## 📋 Legal & Compliance

### **Business Structure:**
- **LLC:** Recommended for liability protection
- **Cost:** $50-500 (varies by state)

### **Contracts:**
- **Service Agreement:** Use Termly.io template ($29)
- **Privacy Policy:** GDPR compliant (required)
- **Terms of Service:** Standard SaaS terms

### **Insurance:**
- **E&O Insurance:** $500-1,000/year (recommended at 20+ clients)

### **Payment Processing:**
- **Stripe:** 2.9% + 30¢ per transaction
- **Monthly example:** $199 plan = $6.07 fee

---

## 🎓 Customer Success

### **Onboarding Flow:**

**Day 1: Welcome Email**
```
Subject: Welcome to FleetTracker! 🚢

Hi [Name],

Welcome aboard! Here's how to get started:

1. Add your vessels (MMSI numbers)
2. Set tracking regions
3. Invite your team

Need help? Reply to this email or schedule a call:
[Calendly link]

Best,
[Your name]
```

**Day 3: Check-in**
- Automated email: "How's it going?"
- Offer: 15-min call to optimize setup

**Day 7: Feature highlight**
- Email: "Did you know you can export voyage history?"

**Day 14: Feedback request**
- Email: "How are we doing?"
- Survey: NPS score

**Day 30: Upsell**
- Email: "Tracking more than 20 vessels? Upgrade to Pro"

---

## 🔮 Future Features (Upsell Opportunities)

**Planned (6-12 months):**
- ✅ Arrival predictions ($50/mo add-on)
- ✅ Port congestion alerts ($50/mo add-on)
- ✅ Route optimization ($100/mo add-on)
- ✅ Fuel consumption tracking ($100/mo add-on)
- ✅ API access for integration ($200/mo add-on)
- ✅ Mobile app (iOS/Android) ($50/mo add-on)

**Each feature = potential 20-30% MRR increase**

---

## 📞 Support Strategy

### **Support Channels:**
- **Email:** support@fleet-tracker.com (24-48h response)
- **Live chat:** Intercom (business hours)
- **Phone:** Enterprise tier only
- **Knowledge base:** Self-service docs

### **Support Metrics to Track:**
- First response time: <24 hours
- Resolution time: <48 hours
- Customer satisfaction: >90%
- Churn rate: <5%/month

---

## 🎯 Success Metrics

### **Key Performance Indicators (KPIs):**

**Revenue Metrics:**
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- ARPU (Average Revenue Per User): $150-250
- LTV (Lifetime Value): $5,000-15,000
- CAC (Customer Acquisition Cost): <$500

**Growth Metrics:**
- New clients/month: 5-10 (Year 1)
- Churn rate: <5%/month
- Upgrade rate: 10-15%/month
- Referral rate: 20-30%

**Operational Metrics:**
- Uptime: >99.9%
- Support response time: <24h
- NPS (Net Promoter Score): >50

---

## 💼 Exit Strategy (Optional)

**When to sell (Years 3-5):**

**SaaS Valuation Multiples:**
- **4-6x ARR** (typical for $500k-2M ARR)
- **6-10x ARR** (if growing >50%/year)

**Example:**
- Year 3: $300k ARR
- Valuation: $1.5M - $2.5M
- **Sell to:** Larger shipping software company

**Or keep as cash cow:**
- $20k-30k/month passive income
- 10-20 hours/week time commitment
- Hire team to run operations

---

## ✅ Action Plan (Next 30 Days)

### **Week 1:**
- [ ] Set up LLC business entity
- [ ] Register domain: fleet-tracker.com
- [ ] Create landing page with Webflow/Carrd
- [ ] Set up Stripe account
- [ ] Write sales pitch

### **Week 2:**
- [ ] Build multi-tenant database structure
- [ ] Test with 2 demo accounts
- [ ] Create demo video (Loom)
- [ ] Write cold email templates
- [ ] Set up LinkedIn profile

### **Week 3:**
- [ ] Send 100 cold emails
- [ ] Connect with 50 people on LinkedIn
- [ ] Post in 5 shipping forums
- [ ] Schedule 3-5 demo calls
- [ ] Prepare sales deck

### **Week 4:**
- [ ] Close first client 🎯
- [ ] Set up billing/invoicing
- [ ] Create onboarding checklist
- [ ] Start second round of outreach
- [ ] Celebrate! 🎉

---

## 🚀 Bottom Line

**This is a REAL business opportunity.**

**Pros:**
- ✅ Product already built (zero dev cost)
- ✅ Recurring revenue model
- ✅ Low infrastructure costs (<$100/mo for 20 clients)
- ✅ Scalable to $300k+ ARR
- ✅ Can run as side business initially
- ✅ High profit margins (80-90%)

**Cons:**
- ❌ Need sales skills
- ❌ B2B sales cycle (2-4 weeks)
- ❌ Customer support required
- ❌ Competitive market (but you're cheaper)

**My Recommendation:**
Start with **1-2 clients** (your current client + one more).

If you can land 5-10 clients in 6 months, you have a **$50k+/year side business**.

If you hit 50 clients in 2 years, you have a **$200k+/year full-time business**.

**Worth pursuing? Absolutely.** 🚀

---

**Questions? See [FINAL-CHECKLIST.md](FINAL-CHECKLIST.md) or contact me for consultation.**

**Last Updated:** 2025-10-06
