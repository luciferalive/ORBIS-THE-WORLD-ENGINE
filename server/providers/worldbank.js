// World Bank Indicators API (open, no key, annual data with ~1 year lag). https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
import { fetchJson } from "../http.js";
import * as registry from "../registry.js";
export const ID = "worldbank";
registry.declare(ID, { name: "World Bank Indicators", kind: "economy / population", frequency: "annual", url: "https://data.worldbank.org", keyRequired: false });
export const INDICATORS = { population: "SP.POP.TOTL", gdp: "NY.GDP.MKTP.CD", gdpGrowth: "NY.GDP.MKTP.KD.ZG", inflation: "FP.CPI.TOTL.ZG", lifeExpectancy: "SP.DYN.LE00.IN", urbanPct: "SP.URB.TOTL.IN.ZS", birthRate: "SP.DYN.CBRT.IN", deathRate: "SP.DYN.CDRT.IN", fertility: "SP.DYN.TFRT.IN", unemployment: "SL.UEM.TOTL.ZS", debtGdp: "GC.DOD.TOTL.GD.ZS", gdpPerCapita: "NY.GDP.PCAP.CD", tradeGdp: "NE.TRD.GNFS.ZS", currentAccountGdp: "BN.CAB.XOKA.GD.ZS", electricityAccess: "EG.ELC.ACCS.ZS", co2PerCapita: "EN.GHG.CO2.PC.CE.AR5", renewablesPct: "EG.FEC.RNEW.ZS", energyImportsPct: "EG.IMP.CONS.ZS", age65Pct: "SP.POP.65UP.TO.ZS", urbanGrowth: "SP.URB.GROW", landAreaKm2: "AG.LND.TOTL.K2", freshwaterPerCapita: "ER.H2O.INTR.PC", forestPct: "AG.LND.FRST.ZS", reservesUsd: "FI.RES.TOTL.CD", interestRealPct: "FR.INR.RINR",
  agriLandPct: "AG.LND.AGRI.ZS", cropIndex: "AG.PRD.CROP.XD", foodIndex: "AG.PRD.FOOD.XD", agriValueAddedPct: "NV.AGR.TOTL.ZS", undernourishmentPct: "SN.ITK.DEFC.ZS", cerealYield: "AG.YLD.CREL.KG", fertilizerKgHa: "AG.CON.FERT.ZS", waterWithdrawalPct: "ER.H2O.FWTL.ZS", basicWaterPct: "SH.H2O.BASW.ZS",
  homicideRate: "VC.IHR.PSRC.P5", railKm: "IS.RRS.TOTL.KM", railPassengerKm: "IS.RRS.PASG.KM", railFreightTonKm: "IS.RRS.GOOD.MT.K6", roadKm: "IS.ROD.TOTL.KM", roadPavedPct: "IS.ROD.PAVE.ZS", roadDensity: "IS.ROD.DNST.K2", airPassengers: "IS.AIR.PSGR", portTeu: "IS.SHP.GOOD.TU", lpi: "LP.LPI.OVRL.XQ",
  internetPct: "IT.NET.USER.ZS", mobilePer100: "IT.CEL.SETS.P2", rdPctGdp: "GB.XPD.RSDV.GD.ZS", patentsResident: "IP.PAT.RESD", highTechExportsPct: "TX.VAL.TECH.MF.ZS", povertyPct: "SI.POV.DDAY", literacyPct: "SE.ADT.LITR.ZS", educationSpendPct: "SE.XPD.TOTL.GD.ZS", infantMortality: "SP.DYN.IMRT.IN",
  energyUsePerCapita: "EG.USE.PCAP.KG.OE", renewableElecPct: "EG.ELC.RNEW.ZS", fossilElecPct: "EG.ELC.FOSL.ZS", nuclearElecPct: "EG.ELC.NUCL.ZS", hydroElecPct: "EG.ELC.HYRO.ZS" };
/** Returns Map iso3 -> { value, year } using the most recent non-empty value. */
export function parseIndicator(raw) {
  if (!Array.isArray(raw) || !Array.isArray(raw[1])) throw new Error("unexpected World Bank response");
  const out = new Map();
  for (const r of raw[1]) { if (r.value === null || r.value === undefined || !r.countryiso3code) continue; const year = Number(r.date); const cur = out.get(r.countryiso3code); if (!cur || year > cur.year) out.set(r.countryiso3code, { value: Number(r.value), year }); }
  return out;
}
export async function fetchIndicator(key) {
  const code = INDICATORS[key]; if (!code) throw new Error("unknown indicator");
  const raw = await fetchJson(`https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&per_page=400&mrnev=1`, { id: ID });
  const out = parseIndicator(raw); registry.ok(ID, "PERIODIC"); return out;
}

/** Time series for ONE country and indicator (annual). Returns [{year,value}] ascending. */
export function parseSeries(raw) {
  if (!Array.isArray(raw) || !Array.isArray(raw[1])) throw new Error("unexpected World Bank response");
  return raw[1].filter((r) => r.value !== null && r.value !== undefined).map((r) => ({ year: Number(r.date), value: Number(r.value) })).sort((a, b) => a.year - b.year);
}
export async function fetchCountrySeries(iso2, key, years = 40) {
  const code = INDICATORS[key]; if (!code) throw new Error("unknown indicator");
  if (!/^[A-Za-z]{2,3}$/.test(iso2)) throw new Error("bad country");
  const raw = await fetchJson(`https://api.worldbank.org/v2/country/${iso2}/indicator/${code}?format=json&per_page=${years}`, { id: ID });
  const out = parseSeries(raw); registry.ok(ID, "PERIODIC"); return out;
}
