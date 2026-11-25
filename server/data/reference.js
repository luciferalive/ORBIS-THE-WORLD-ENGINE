// BUNDLED REFERENCE SNAPSHOT. Approximate figures (circa 2023) entered by hand so the app works offline.
// They are NOT live. Status is "DEMO" until replaced by the World Bank provider (PERIODIC, annual).
// c = [iso2, iso3, name, region, lat, lon, popM, gdpBn, gdpGrowth%, inflation%, currency, stockIndex, government, industries[], exports[], energyNote]
const C = [
  ["US","USA","United States","North America",39.8,-98.6,335,27360,2.5,4.1,"USD","S&P 500","Federal presidential republic",["Technology","Finance","Healthcare","Energy","Aerospace"],["Refined petroleum","Crude oil","Machinery","Aircraft"],"Largest oil and gas producer"],
  ["CN","CHN","China","Asia",35.9,104.2,1410,17790,5.2,0.2,"CNY","SSE Composite","One-party socialist republic",["Manufacturing","Electronics","Construction","Solar","Batteries"],["Electronics","Machinery","Textiles","Vehicles"],"Largest coal consumer and solar manufacturer"],
  ["JP","JPN","Japan","Asia",36.2,138.3,124,4210,1.9,3.3,"JPY","Nikkei 225","Parliamentary constitutional monarchy",["Automotive","Electronics","Robotics","Machinery"],["Vehicles","Machinery","Electronics"],"Major LNG importer"],
  ["DE","DEU","Germany","Europe",51.2,10.5,84,4460,-0.3,5.9,"EUR","DAX","Federal parliamentary republic",["Automotive","Machinery","Chemicals","Engineering"],["Vehicles","Machinery","Chemicals"],"Energy transition (Energiewende)"],
  ["IN","IND","India","Asia",20.6,78.9,1428,3550,8.2,5.4,"INR","NIFTY 50","Federal parliamentary republic",["IT services","Pharmaceuticals","Agriculture","Textiles"],["Refined petroleum","Pharmaceuticals","IT services","Gems"],"Fast-growing coal, solar and oil demand"],
  ["GB","GBR","United Kingdom","Europe",55.4,-3.4,68,3340,0.1,7.3,"GBP","FTSE 100","Parliamentary constitutional monarchy",["Finance","Pharmaceuticals","Aerospace","Creative industries"],["Machinery","Vehicles","Precious metals"],"North Sea oil and gas, offshore wind"],
  ["FR","FRA","France","Europe",46.2,2.2,68,3030,0.9,5.7,"EUR","CAC 40","Semi-presidential republic",["Aerospace","Luxury goods","Nuclear energy","Agriculture"],["Aircraft","Machinery","Beverages"],"Nuclear-dominated electricity"],
  ["IT","ITA","Italy","Europe",41.9,12.6,59,2250,0.9,5.9,"EUR","FTSE MIB","Parliamentary republic",["Machinery","Fashion","Automotive","Food"],["Machinery","Pharmaceuticals","Vehicles"],"Gas importer"],
  ["BR","BRA","Brazil","South America",-14.2,-51.9,216,2170,2.9,4.6,"BRL","Bovespa","Federal presidential republic",["Agriculture","Mining","Oil","Aerospace"],["Soybeans","Iron ore","Crude oil","Beef"],"Hydropower and offshore oil"],
  ["CA","CAN","Canada","North America",56.1,-106.3,40,2140,1.1,3.9,"CAD","S&P/TSX","Federal parliamentary monarchy",["Energy","Mining","Forestry","Finance"],["Crude oil","Vehicles","Gold"],"Oil sands and hydropower"],
  ["RU","RUS","Russia","Europe",61.5,105.3,144,2020,3.6,5.9,"RUB","MOEX","Federal semi-presidential republic",["Oil and gas","Mining","Defence","Grain"],["Crude oil","Natural gas","Wheat","Fertilisers"],"Major oil, gas and coal exporter"],
  ["KR","KOR","South Korea","Asia",35.9,127.8,52,1710,1.4,3.6,"KRW","KOSPI","Presidential republic",["Semiconductors","Automotive","Shipbuilding","Electronics"],["Semiconductors","Vehicles","Ships"],"Imports most of its energy"],
  ["AU","AUS","Australia","Oceania",-25.3,133.8,26,1720,2.0,5.6,"AUD","S&P/ASX 200","Federal parliamentary monarchy",["Mining","Agriculture","Education","Energy"],["Iron ore","Coal","LNG","Gold"],"Major LNG and coal exporter"],
  ["MX","MEX","Mexico","North America",23.6,-102.6,128,1790,3.2,5.5,"MXN","S&P/BMV IPC","Federal presidential republic",["Automotive","Electronics","Oil","Agriculture"],["Vehicles","Electronics","Crude oil"],"State oil company Pemex"],
  ["ES","ESP","Spain","Europe",40.5,-3.7,48,1580,2.5,3.5,"EUR","IBEX 35","Parliamentary monarchy",["Tourism","Renewables","Automotive","Agriculture"],["Vehicles","Pharmaceuticals","Food"],"Leading solar and wind capacity"],
  ["ID","IDN","Indonesia","Asia",-0.8,113.9,277,1370,5.0,3.7,"IDR","IDX Composite","Presidential republic",["Mining","Palm oil","Manufacturing","Nickel processing"],["Coal","Palm oil","Nickel","Gas"],"Largest coal exporter by volume"],
  ["NL","NLD","Netherlands","Europe",52.1,5.3,18,1120,0.1,4.1,"EUR","AEX","Parliamentary constitutional monarchy",["Semiconductor equipment","Logistics","Agriculture","Chemicals"],["Machinery","Refined petroleum","Food"],"Major energy trading hub"],
  ["SA","SAU","Saudi Arabia","Asia",23.9,45.1,36,1070,-0.8,2.3,"SAR","Tadawul All Share","Absolute monarchy",["Oil and gas","Petrochemicals","Mining"],["Crude oil","Petrochemicals"],"Largest crude exporter"],
  ["TR","TUR","Turkey","Asia",38.96,35.2,85,1110,4.5,53.9,"TRY","BIST 100","Presidential republic",["Textiles","Automotive","Construction","Tourism"],["Vehicles","Textiles","Machinery"],"Energy importer, transit hub"],
  ["CH","CHE","Switzerland","Europe",46.8,8.2,9,885,0.7,2.1,"CHF","SMI","Federal directorial republic",["Pharmaceuticals","Finance","Watches","Machinery"],["Pharmaceuticals","Gold","Watches"],"Hydropower"],
  ["PL","POL","Poland","Europe",51.9,19.1,37,810,0.2,11.4,"PLN","WIG20","Parliamentary republic",["Manufacturing","Coal","Automotive","Services"],["Machinery","Vehicles","Food"],"Coal-reliant, shifting to gas and nuclear plans"],
  ["TW","TWN","Taiwan","Asia",23.7,121.0,23,755,1.3,2.5,"TWD","TAIEX","Semi-presidential republic",["Semiconductors","Electronics"],["Semiconductors","Electronics"],"Imports nearly all energy"],
  ["AR","ARG","Argentina","South America",-38.4,-63.6,46,640,-1.6,133,"ARS","MERVAL","Federal presidential republic",["Agriculture","Lithium","Oil and gas"],["Soybean products","Maize","Vehicles"],"Vaca Muerta shale"],
  ["SE","SWE","Sweden","Europe",60.1,18.6,10.5,590,-0.2,5.9,"SEK","OMX Stockholm 30","Parliamentary monarchy",["Engineering","Telecom","Forestry","Gaming"],["Machinery","Vehicles","Paper"],"Hydro and nuclear power"],
  ["TH","THA","Thailand","Asia",15.9,100.99,72,515,1.9,1.2,"THB","SET Index","Parliamentary monarchy",["Tourism","Automotive","Electronics","Agriculture"],["Vehicles","Electronics","Rubber"],"Gas-heavy power"],
  ["IL","ISR","Israel","Asia",31.0,34.9,9.8,510,2.0,4.2,"ILS","TA-35","Parliamentary republic",["Technology","Defence","Diamonds","Pharmaceuticals"],["Diamonds","Electronics","Pharmaceuticals"],"Offshore gas"],
  ["NO","NOR","Norway","Europe",60.5,8.5,5.5,485,0.5,5.5,"NOK","OSE Benchmark","Parliamentary monarchy",["Oil and gas","Shipping","Seafood"],["Natural gas","Crude oil","Fish"],"Hydropower and North Sea gas"],
  ["AE","ARE","United Arab Emirates","Asia",23.4,53.8,9.5,510,3.6,1.6,"AED","ADX General","Federal absolute monarchy",["Oil and gas","Trade","Aviation","Finance"],["Crude oil","Gold","Re-exports"],"Large oil exporter diversifying"],
  ["NG","NGA","Nigeria","Africa",9.1,8.7,224,365,2.9,24.7,"NGN","NGX All-Share","Federal presidential republic",["Oil","Agriculture","Telecom"],["Crude oil","LNG"],"Major oil exporter, power shortages"],
  ["EG","EGY","Egypt","Africa",26.8,30.8,112,395,3.8,33.9,"EGP","EGX 30","Semi-presidential republic",["Tourism","Gas","Agriculture","Suez Canal"],["Gas","Gold","Fertilisers"],"Gas and Suez Canal revenues"],
  ["ZA","ZAF","South Africa","Africa",-30.6,22.9,60,380,0.6,6.0,"ZAR","JSE Top 40","Parliamentary republic",["Mining","Automotive","Finance"],["Platinum","Gold","Coal","Vehicles"],"Coal-dependent power, load-shedding"],
  ["PH","PHL","Philippines","Asia",12.9,121.8,117,440,5.5,6.0,"PHP","PSEi","Presidential republic",["Business process outsourcing","Electronics","Agriculture"],["Electronics","Coconut products"],"Coal and geothermal"],
  ["BD","BGD","Bangladesh","Asia",23.7,90.4,173,437,5.8,9.0,"BDT","DSEX","Parliamentary republic",["Garments","Agriculture"],["Garments"],"Gas-dependent power"],
  ["VN","VNM","Vietnam","Asia",14.1,108.3,99,430,5.0,3.3,"VND","VN-Index","One-party socialist republic",["Electronics","Textiles","Agriculture"],["Electronics","Textiles","Footwear"],"Rapid power demand growth"],
  ["MY","MYS","Malaysia","Asia",4.2,102.0,34,400,3.7,2.5,"MYR","FTSE Bursa KLCI","Federal constitutional monarchy",["Electronics","Palm oil","Oil and gas"],["Electronics","Palm oil","LNG"],"LNG exporter"],
  ["SG","SGP","Singapore","Asia",1.35,103.8,5.9,500,1.1,4.8,"SGD","Straits Times Index","Parliamentary republic",["Finance","Shipping","Electronics","Refining"],["Refined petroleum","Electronics"],"Imports nearly all energy"],
  ["PK","PAK","Pakistan","Asia",30.4,69.3,240,340,-0.2,29.2,"PKR","KSE-100","Federal parliamentary republic",["Textiles","Agriculture"],["Textiles","Rice"],"Energy importer with debt stress"],
  ["CL","CHL","Chile","South America",-35.7,-71.5,19.6,335,0.2,7.6,"CLP","S&P IPSA","Presidential republic",["Copper mining","Lithium","Agriculture"],["Copper","Lithium","Fruit"],"Largest copper producer"],
  ["CO","COL","Colombia","South America",4.6,-74.3,52,363,0.6,11.7,"COP","COLCAP","Presidential republic",["Oil","Coal","Coffee"],["Crude oil","Coal","Coffee"],"Oil and coal exports"],
  ["QA","QAT","Qatar","Asia",25.4,51.2,2.7,213,1.2,3.0,"QAR","QE Index","Absolute monarchy",["LNG","Finance","Petrochemicals"],["LNG","Crude oil"],"Top LNG exporter"],
  ["UA","UKR","Ukraine","Europe",48.4,31.2,38,178,5.3,12.9,"UAH","PFTS","Semi-presidential republic",["Agriculture","Metals","IT"],["Grain","Sunflower oil","Iron"],"Energy infrastructure heavily affected by war"],
];
export const COUNTRIES = C.map(([iso2, iso3, name, region, lat, lon, popM, gdpBn, gdpGrowth, inflation, currency, stockIndex, government, industries, exports, energy]) =>
  ({ iso2, iso3, name, region, lat, lon, population: Math.round(popM * 1e6), gdp: gdpBn * 1e9, gdpGrowth, inflation, currency, stockIndex, government, industries, exports, energy }));
export const FLAG = (iso2) => String.fromCodePoint(...[...iso2].map((c) => 127397 + c.charCodeAt(0)));

// Approximate metro populations (millions), circa 2023.
export const CITIES = [
  ["Tokyo","JP",35.7,139.7,37.0],["Delhi","IN",28.6,77.2,33.0],["Shanghai","CN",31.2,121.5,29.0],["Dhaka","BD",23.8,90.4,23.0],["Sao Paulo","BR",-23.6,-46.6,22.6],
  ["Cairo","EG",30.0,31.2,22.0],["Mexico City","MX",19.4,-99.1,22.0],["Beijing","CN",39.9,116.4,21.5],["Mumbai","IN",19.1,72.9,21.0],["Osaka","JP",34.7,135.5,19.0],
  ["New York","US",40.7,-74.0,18.9],["Karachi","PK",24.9,67.0,17.0],["Lagos","NG",6.5,3.4,16.0],["Istanbul","TR",41.0,29.0,15.8],["Manila","PH",14.6,121.0,14.0],
  ["London","GB",51.5,-0.1,9.6],["Paris","FR",48.9,2.4,11.2],["Moscow","RU",55.8,37.6,12.6],["Seoul","KR",37.6,127.0,9.9],["Jakarta","ID",-6.2,106.8,11.0],
  ["Los Angeles","US",34.1,-118.2,12.5],["Singapore","SG",1.35,103.8,5.9],["Dubai","AE",25.2,55.3,3.6],["Sydney","AU",-33.9,151.2,5.3],["Johannesburg","ZA",-26.2,28.0,6.1],
  ["Frankfurt","DE",50.1,8.7,2.3],["Toronto","CA",43.7,-79.4,6.3],["Hong Kong","CN",22.3,114.2,7.5],["Doha","QA",25.3,51.5,1.2],["Mumbai Port (JNPT)","IN",18.95,72.95,0],
].map(([name, iso2, lat, lon, popM]) => ({ name, iso2, lat, lon, population: Math.round(popM * 1e6) })).filter((c) => c.population > 0);

export const INDUSTRIES = ["Technology","Semiconductors","Finance","Energy","Oil and gas","Mining","Agriculture","Automotive","Aerospace","Pharmaceuticals","Shipping","Renewables","Defence","Manufacturing","Tourism"];

// Reference world population (billions). Rounded UN-style estimates; 2030+ are medium-variant PROJECTIONS.
export const WORLD_POP = { history: [[1950,2.49],[1960,3.02],[1970,3.69],[1980,4.46],[1990,5.33],[2000,6.17],[2010,6.99],[2020,7.84],[2024,8.16]], projection: [[2030,8.5],[2040,9.2],[2050,9.7],[2060,10.1],[2070,10.3],[2080,10.3],[2100,10.2]],
  anchor: { date: "2024-07-01T00:00:00Z", population: 8.16e9, birthsPerYear: 132e6, deathsPerYear: 62e6,
    note: "Model parameters are rounded approximations of UN World Population Prospects 2024 and should be verified against the source before publication." },
  regions: [["Asia",4.75],["Africa",1.48],["Europe",0.74],["Latin America & Caribbean",0.66],["North America",0.38],["Oceania",0.045]],
  urban: [[1950,0.30],[1970,0.37],[1990,0.43],[2010,0.52],[2020,0.56],[2024,0.58]] };

export const HISTORY = [
  [-2560,"Construction of the Great Pyramid of Giza completed","science",["EG"],"Engineering"],[-480,"Battle of Thermopylae","war",["GR"],"Greco-Persian Wars"],[1215,"Magna Carta sealed","politics",["GB"],""],
  [1347,"Black Death reaches Europe","pandemic",["IT"],"Killed an estimated third of Europe's population"],[1440,"Gutenberg develops movable-type printing in Europe","technology",["DE"],""],[1492,"Columbus reaches the Americas","politics",["ES"],""],
  [1687,"Newton publishes the Principia","science",["GB"],""],[1760,"First Industrial Revolution begins","industry",["GB"],"Mechanised textile production and steam power"],[1776,"US Declaration of Independence","politics",["US"],""],[1789,"French Revolution begins","politics",["FR"],""],
  [1865,"US Civil War ends","war",["US"],""],[1871,"Second Industrial Revolution: electricity, steel, chemicals","industry",["DE","US"],""],[1914,"World War I begins","war",["GB","DE","FR","RU"],"About 20 million deaths"],
  [1918,"Influenza pandemic","pandemic",[],"Estimated 50 million deaths"],[1929,"Wall Street Crash and the Great Depression","crash",["US"],""],[1939,"World War II begins","war",["DE","GB","PL"],"Deadliest conflict in history"],
  [1945,"Atomic bombs used; United Nations founded","war",["US","JP"],""],[1947,"Transistor invented (1947), enabling modern electronics","technology",["US"],""],[1957,"Sputnik launched, the Space Age begins","science",["RU"],""],
  [1969,"Apollo 11 lands humans on the Moon","science",["US"],""],[1971,"End of the Bretton Woods gold standard","economics",["US"],""],[1973,"OPEC oil embargo and oil shock","crash",["SA","US"],""],
  [1989,"Fall of the Berlin Wall","politics",["DE"],""],[1991,"Dissolution of the Soviet Union; World Wide Web released","politics",["RU"],""],[1997,"Asian financial crisis","crash",["TH","ID","KR"],""],
  [2001,"September 11 attacks","war",["US"],""],[2007,"Smartphone era begins with the iPhone","technology",["US"],""],[2008,"Global Financial Crisis","crash",["US","GB"],"Lehman Brothers collapse"],
  [2009,"Bitcoin network launched","technology",[],""],[2011,"Fukushima nuclear disaster; Tohoku earthquake and tsunami","disaster",["JP"],""],[2015,"Paris Climate Agreement adopted","politics",["FR"],""],
  [2016,"Brexit referendum","politics",["GB"],""],[2020,"COVID-19 pandemic declared","pandemic",["CN"],"Global lockdowns and market crash"],[2022,"Russian invasion of Ukraine; global energy and food price shock","war",["RU","UA"],""],
  [2022.9,"Large language models reach the public (ChatGPT, Nov 2022)","technology",["US"],""],
].map(([year, title, category, countries, note]) => ({ year, title, category, countries, note }));

export const COMMODITY_FACTS = {
  Oil: { producers: ["United States", "Saudi Arabia", "Russia"], consumers: ["United States", "China", "India"], note: "Priced in USD; OPEC+ policy moves supply." },
  "Natural gas": { producers: ["United States", "Russia", "Iran"], consumers: ["United States", "Russia", "China"], note: "LNG links regional markets." },
  Copper: { producers: ["Chile", "Peru", "DR Congo"], consumers: ["China", "United States", "Germany"], note: "Electrification demand." },
  Lithium: { producers: ["Australia", "Chile", "China"], consumers: ["China", "South Korea", "Japan"], note: "Battery supply chain." },
  Gold: { producers: ["China", "Australia", "Russia"], consumers: ["China", "India", "United States"], note: "Safe-haven and central bank reserve asset." },
  Silver: { producers: ["Mexico", "China", "Peru"], consumers: ["India", "China", "United States"], note: "Industrial and investment demand." },
  Uranium: { producers: ["Kazakhstan", "Canada", "Namibia"], consumers: ["United States", "France", "China"], note: "Nuclear fuel." },
  Wheat: { producers: ["China", "India", "Russia"], consumers: ["China", "India", "European Union"], note: "Black Sea exports matter for food security." },
  Corn: { producers: ["United States", "China", "Brazil"], consumers: ["United States", "China", "Brazil"], note: "Feed and ethanol." },
};
