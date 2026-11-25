# Data sources
| Source | Used for | Key | Status in ORBIS |
|---|---|---|---|
| CoinGecko | crypto prices | none (rate limited) | implemented |
| Frankfurter (ECB) | forex, daily | none | implemented |
| Twelve Data | stocks, indices, metals, commodities | `TWELVEDATA_KEY` | implemented |
| USGS | earthquakes, 1 min | none, public domain | implemented |
| GDELT, BBC/Al Jazeera RSS | events/news | none | implemented |
| World Bank | country indicators | none | implemented |
| Natural Earth | country boundaries | none | implemented |
| Anthropic API | AI analyst | `ANTHROPIC_API_KEY` | implemented |
| FRED, DBnomics, OECD, Our World in Data, Alpha Vantage, Marketstack | macro series, more markets, energy/CO2/food/water | FRED/AV/Marketstack need keys | planned |
| ACLED/UCDP, CFR tracker | conflict layer | licence | planned |
| Worldometers | reference only | n/a | **not scraped**: no API, and its terms restrict copying; it also republishes UN/World Bank figures that ORBIS takes from the original sources |
