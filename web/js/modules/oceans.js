import { h, fill, fmt, badge, box, state, loading } from "../components/ui.js";
import { api } from "../services/api.js";
import { table } from "../components/table.js";
import { head } from "./common.js";
import { sourcesBox } from "../components/sources.js";
export async function render(el) {
  fill(el, head("Oceans", "Sea surface temperature and waves"), loading()); const O = await api.oceans();
  fill(el, head("Oceans", "Modelled conditions at fixed open-ocean points", O.meta), h("div", { class: "banner" }, h("b", null, "MODEL"), "Values are Open-Meteo ocean/wave model output at ten fixed sample points, not buoy readings or a global map. Currents, tides, salinity, acidity, coral and seafloor data are not integrated (planned: NOAA CO-OPS/NDBC, Copernicus Marine, GEBCO)."),
    O.available ? box("Open-ocean sample points", table([{ key: "name", label: "Point" }, { key: "seaTempC", label: "Sea surface °C", num: true, render: (p) => (p.seaTempC == null ? "n/a" : p.seaTempC.toFixed(1)) }, { key: "waveHeightM", label: "Wave height m", num: true, render: (p) => (p.waveHeightM == null ? "n/a" : p.waveHeightM.toFixed(1)) }, { key: "wavePeriodS", label: "Period s", num: true, render: (p) => (p.wavePeriodS == null ? "n/a" : p.wavePeriodS.toFixed(0)) }, { key: "lat", label: "Lat/Lon", sort: (p) => p.lat, render: (p) => p.lat + "°, " + p.lon + "°" }], O.points, { sortKey: "name", desc: false }), { meta: O.meta }) : box("Ocean conditions", state("Source unavailable", O.error || "no data")),
    h("div", { style: { height: "10px" } }), sourcesBox(["openmeteo", "copernicus-marine", "gebco", "obis"]));
}
