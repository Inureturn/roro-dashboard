# Testing Arrow Markers

## What You Should See

### My Fleet View (Default)
When you open the dashboard, you should see **5 blue arrows** on the map:

1. **Ah Shin** (357170000) - Blue arrow
2. **Hae Shin** (352808000) - Blue arrow
3. **O Soo Shin** (352001129) - Blue arrow
4. **Sang Shin** (355297000) - Blue arrow
5. **Young Shin** (356005000) - Blue arrow

### All Tracked View
When you click the "All Tracked" tab, you should see **14 arrows total**:

**5 Blue Arrows** (Your Fleet):
- Ah Shin, Hae Shin, O Soo Shin, Sang Shin, Young Shin

**9 Orange Arrows** (Competitors):
- ARK FUTURA (219927000)
- CELINE (249901000)
- SERAPHINE (229076000)
- GMT Astro (373817000)
- MV Faustine (229077000)
- MV Silver Queen (352001162)
- MV Silver Ray (355137000)
- MV Silver Sky (352001920)
- MV Tonsberg (249904000)

## Arrow Features

### Direction
- Arrows point in the direction the vessel is heading
- Uses `heading_deg` from vessel's compass, or `cog_deg` (course over ground) if heading unavailable
- Arrow points **north** when heading is 0°, rotates clockwise

### Colors
- **Blue (#4a7fc9)**: Your fleet vessels (Shin Group)
- **Orange (#ff9800)**: Competitor vessels
- White stroke around arrows for visibility on dark background

### Hover
- Hover over any arrow to see the vessel name in a tooltip

### Click
- Click an arrow to open the vessel details panel on the right

## Testing Checklist

- [ ] Refresh the dashboard page
- [ ] Verify only 5 vessels appear in "My Fleet" view (all blue arrows)
- [ ] Click "All Tracked" tab
- [ ] Verify 14 vessels appear (5 blue + 9 orange arrows)
- [ ] Check ARK FUTURA, CELINE, SERAPHINE are orange (not blue)
- [ ] Hover over an arrow to see vessel name
- [ ] Verify arrows point in different directions based on vessel heading
- [ ] Click an arrow to open details panel

## Currently Transmitting

As of last check, 3 vessels are actively transmitting AIS data:
- MV Celine (249901000) - Should show **ORANGE** arrow
- MV Seraphine (229076000) - Should show **ORANGE** arrow
- Ark Futura (219927000) - Should show **ORANGE** arrow

If you only see these 3 arrows, that's normal - the other vessels will appear once they transmit AIS messages.
