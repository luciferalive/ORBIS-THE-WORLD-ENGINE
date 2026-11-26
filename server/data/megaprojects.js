// Hand-curated reference list. Statuses change: each entry has an as-of date and a source. Labelled REFERENCE in the UI.
// Statuses: ANNOUNCED PROPOSED PLANNED FUNDED UNDER CONSTRUCTION TESTING OPERATIONAL DELAYED SUSPENDED CANCELLED
export const AS_OF = "2025-06";
export const MEGAPROJECTS = [
  { id: "iter", name: "ITER fusion reactor", category: "fusion", country: "FR", status: "UNDER CONSTRUCTION", note: "International tokamak at Cadarache; schedule re-baselined with first plasma now targeted later this decade.", source: "https://www.iter.org" },
  { id: "artemis", name: "NASA Artemis programme", category: "space", country: "US", status: "TESTING", note: "Crewed lunar return programme; Artemis I flew uncrewed in 2022. Later missions have been rescheduled several times.", source: "https://www.nasa.gov/humans-in-space/artemis/" },
  { id: "starship", name: "SpaceX Starship", category: "space", country: "US", status: "TESTING", note: "Fully reusable launch system in flight-test phase.", source: "https://www.spacex.com/vehicles/starship/" },
  { id: "gaganyaan", name: "ISRO Gaganyaan", category: "space", country: "IN", status: "TESTING", note: "Indian crewed orbital programme in uncrewed test-flight and system qualification phase.", source: "https://www.isro.gov.in" },
  { id: "chinese-station", name: "Tiangong space station", category: "space", country: "CN", status: "OPERATIONAL", note: "Crewed Chinese modular space station in low Earth orbit.", source: "https://www.cmse.gov.cn" },
  { id: "hs2", name: "HS2 high-speed rail", category: "high-speed rail", country: "GB", status: "DELAYED", note: "UK line London-Birmingham under construction with delays and cost increases; northern extension cancelled in 2023.", source: "https://www.hs2.org.uk" },
  { id: "chsr", name: "California High-Speed Rail", category: "high-speed rail", country: "US", status: "UNDER CONSTRUCTION", note: "Central Valley segment under construction; cost and schedule challenges widely reported.", source: "https://hsr.ca.gov" },
  { id: "mahsr", name: "Mumbai-Ahmedabad High-Speed Rail", category: "high-speed rail", country: "IN", status: "UNDER CONSTRUCTION", note: "India's first high-speed rail corridor.", source: "https://nhsrcl.in" },
  { id: "gerd", name: "Grand Ethiopian Renaissance Dam", category: "renewable energy", country: "ET", status: "OPERATIONAL", note: "Nile hydropower dam; downstream water-sharing disputes remain.", source: "https://www.ethiopia.gov.et" },
  { id: "3gorges", name: "Three Gorges Dam", category: "renewable energy", country: "CN", status: "OPERATIONAL", note: "Largest hydropower station by installed capacity.", source: "https://www.ctg.com.cn" },
  { id: "gotthard", name: "Gotthard Base Tunnel", category: "tunnel", country: "CH", status: "OPERATIONAL", note: "Longest railway tunnel in the world, opened 2016.", source: "https://www.sbb.ch" },
  { id: "hzmb", name: "Hong Kong-Zhuhai-Macau Bridge", category: "bridge", country: "CN", status: "OPERATIONAL", note: "Bridge-tunnel sea link opened 2018.", source: "https://www.hzmb.gov.hk" },
  { id: "channel", name: "Channel Tunnel", category: "tunnel", country: "GB", status: "OPERATIONAL", note: "Undersea rail link between the UK and France, opened 1994.", source: "https://www.eurotunnel.com" },
  { id: "panama", name: "Panama Canal expansion", category: "port/canal", country: "PA", status: "OPERATIONAL", note: "Third set of locks opened 2016; drought has at times limited transits.", source: "https://pancanal.com" },
  { id: "neom", name: "NEOM / The Line", category: "smart city", country: "SA", status: "DELAYED", note: "Saudi giga-project; scope and timeline reported as scaled back and under review.", source: "https://www.neom.com" },
  { id: "stargate", name: "Stargate AI data-centre initiative", category: "AI data centers", country: "US", status: "ANNOUNCED", note: "Announced 2025 plan for large AI infrastructure investment; sites under development. Verify current status.", source: "https://openai.com" },
  { id: "tsmc-az", name: "TSMC Arizona fabs", category: "semiconductor factory", country: "US", status: "UNDER CONSTRUCTION", note: "Multi-fab semiconductor investment; first fab producing, further phases under construction.", source: "https://pr.tsmc.com" },
];
export const CHOKEPOINTS = [
  { name: "Strait of Hormuz", connects: "Persian Gulf and Gulf of Oman", note: "Principal export route for Gulf oil and LNG." },
  { name: "Strait of Malacca", connects: "Indian Ocean and South China Sea", note: "Main shipping lane between the Indian Ocean and East Asia." },
  { name: "Suez Canal", connects: "Mediterranean and Red Sea", note: "Shortcut between Europe and Asia; disruptions reroute ships around Africa." },
  { name: "Bab-el-Mandeb", connects: "Red Sea and Gulf of Aden", note: "Southern gateway to the Suez route." },
  { name: "Panama Canal", connects: "Atlantic and Pacific", note: "Americas transit; water levels can limit capacity." },
  { name: "Turkish Straits (Bosporus)", connects: "Black Sea and Mediterranean", note: "Grain, oil and other exports from the Black Sea region." },
  { name: "Danish Straits", connects: "Baltic Sea and North Sea", note: "Baltic access." },
  { name: "Cape of Good Hope route", connects: "Atlantic and Indian Oceans", note: "Alternative route when Suez/Red Sea is avoided." },
];
export const METEOR_SHOWERS = [["Quadrantids", "Jan 3-4"], ["Lyrids", "Apr 22"], ["Eta Aquariids", "May 5-6"], ["Perseids", "Aug 12-13"], ["Orionids", "Oct 21"], ["Leonids", "Nov 17-18"], ["Geminids", "Dec 13-14"], ["Ursids", "Dec 22"]];
