# Simple Guide for Clients
## Managing Your RoRo Fleet Dashboard (Non-Technical)

---

## 🚢 I Want to Add a New Vessel

**What you need:**
- MMSI number (9 digits, like a phone number for ships)
- Find it on: Ship documents, MarineTraffic.com, or VesselFinder.com

**Send this email to your developer:**

```
Subject: Add Vessel to Dashboard

Please add the following vessel to our tracking dashboard:

MMSI: [paste 9-digit number]
Vessel Name: [if you know it]
Type: ☐ Our Fleet  ☐ Competitor
Tracking Region: ☐ Korea  ☐ Mediterranean  ☐ Other: _______

Thank you!
```

**Timeline:** Usually live within 1 hour.

---

## 🗑️ I Want to Remove a Vessel

**Send this email:**

```
Subject: Remove Vessel from Dashboard

Please remove this vessel from tracking:

MMSI: [9-digit number]
OR
Vessel Name: [name]

Reason: ☐ Sold  ☐ Scrapped  ☐ No longer relevant  ☐ Other: _______

☐ Keep historical data (recommended)
☐ Delete everything

Thank you!
```

---

## 🏷️ I Want to Mark Vessels as "My Fleet" vs "Competitors"

This changes the filter tabs in the dashboard.

**Send this email:**

```
Subject: Update Fleet Classification

Please update these vessels:

MY FLEET:
- MMSI: 357170000 (Ah Shin)
- MMSI: 352808000 (Hae Shin)
[list all your fleet vessels]

COMPETITORS:
- MMSI: 249901000 (MV Celine)
- MMSI: 229077000 (MV Faustine)
[list competitor vessels]

Thank you!
```

---

## 🌍 I Want to Track Vessels in a New Region

**Current regions:** Korea + Mediterranean

**Send this email:**

```
Subject: Add Tracking Region

Please add tracking for this region:

Region Name: [e.g., "Gulf of Mexico", "Singapore", "North Sea"]

OR draw on map:
1. Go to: https://boundingbox.klokantech.com/
2. Draw a rectangle around your region
3. Screenshot and attach to this email

Thank you!
```

---

## ℹ️ I Want to Update Vessel Information

(Name, operator, type, notes, etc.)

**Send this email:**

```
Subject: Update Vessel Information

Please update vessel MMSI: [number] with:

☐ Name: _______
☐ Operator: _______
☐ Type: ☐ Ro-Ro  ☐ Vehicles Carrier  ☐ Other: _______
☐ Flag: _______
☐ Notes: _______

Thank you!
```

---

## ❓ Common Questions

### "Why isn't my vessel showing on the map?"

**Possible reasons:**
1. Vessel not added to tracking list yet (ask developer)
2. Vessel is powered off / not transmitting AIS
3. Vessel is outside tracked regions
4. Just added - can take 5-30 minutes for first data

**What to do:**
Check if vessel is visible on MarineTraffic.com. If yes, contact developer. If no, vessel is not transmitting.

---

### "Vessel shows 'Stale Data' warning"

**Meaning:** No AIS signal received in 5+ minutes.

**Common reasons:**
- Vessel turned off AIS transmitter
- Vessel in port (sometimes turn off AIS)
- Lost satellite/terrestrial coverage

**What to do:**
Wait 30 minutes. If still stale, contact developer.

---

### "How many vessels can I track?"

**Current limit:** 50 vessels at $5/month

**If you need more:**
- 50-100 vessels: $5/month (tight fit)
- 100-200 vessels: $35/month
- 200+ vessels: $50-100/month

Developer will advise if you're approaching limits.

---

### "Can I export vessel data?"

**Yes!** Contact developer for:
- CSV export of all positions
- Voyage history report
- Custom date range exports

---

### "Can other people access the dashboard?"

**Yes!** Just share the dashboard URL.

**Options:**
1. **Public URL:** Anyone with link can view
2. **Password protected:** Ask developer to add authentication
3. **Embed widget:** Integrate into your own website

---

### "How do I know if the system is working?"

**Check these:**
1. **Dashboard:** Should show "Last Update" within last 5 minutes
2. **Vessel count:** Should match your expected count
3. **Active vessels:** Should be >0 if vessels are transmitting

**If any look wrong:** Contact developer with screenshot.

---

## 📞 Contact Developer

**Response Times:**
- Urgent (system down): 2-4 hours
- Add/remove vessels: 24 hours
- Information updates: 48 hours
- Questions: 48 hours

**Include in your message:**
- Clear description of what you need
- MMSI numbers or vessel names
- Screenshots if applicable
- Deadline (if urgent)

---

## 💰 Monthly Cost

**Basic (up to 50 vessels):** $5/month
**Pro (up to 200 vessels):** $35/month

Includes:
✅ 24/7 tracking
✅ Real-time updates
✅ 90 days of history
✅ Unlimited map views
✅ Developer support

**No hidden fees!** Cost is fixed per tier.

---

## ✅ What You Can Do Yourself

✅ **View dashboard** - Just open the URL
✅ **Filter vessels** - Click "My Fleet" / "Competitors" tabs
✅ **Search vessels** - Use search box in sidebar
✅ **View vessel details** - Click any vessel on map
✅ **Check system info** - Click ℹ️ button in header
✅ **Share URL** - Copy and send to colleagues

---

## ❌ What You Need Developer For

❌ Adding/removing vessels
❌ Changing tracking regions
❌ Updating vessel information
❌ Exporting data
❌ System troubleshooting
❌ Cost optimization
❌ Custom features

---

## 📋 Checklist: Onboarding New Client

**Week 1:**
- [ ] Receive vessel list (MMSIs) from client
- [ ] Confirm tracking regions
- [ ] Mark which are client's fleet vs competitors
- [ ] Developer adds all vessels
- [ ] Client reviews dashboard for accuracy

**Week 2:**
- [ ] Client checks vessels are appearing correctly
- [ ] Any corrections needed?
- [ ] Train client team on using dashboard
- [ ] Set up regular reporting (if needed)

**Monthly:**
- [ ] Review vessel list (any additions/removals?)
- [ ] Check costs are as expected
- [ ] Any new features needed?

---

**Need help?** Contact your developer with specific questions.

**Last Updated:** 2025-10-06
