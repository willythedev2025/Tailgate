export interface TeamInfo {
  slug: string;
  name: string;
  abbr: string;
  city: string;
  color: string;   // primary color for left rail / accents
  color2?: string; // secondary
  conference?: string;
  division?: string;
}

export const NFL_TEAMS: TeamInfo[] = [
  { slug: "ari", name: "Cardinals",    abbr: "ARI", city: "Arizona",       color: "#97233F", color2: "#000000", conference: "NFC", division: "West" },
  { slug: "atl", name: "Falcons",      abbr: "ATL", city: "Atlanta",       color: "#A71930", color2: "#000000", conference: "NFC", division: "South" },
  { slug: "bal", name: "Ravens",       abbr: "BAL", city: "Baltimore",     color: "#241773", color2: "#9E7C0C", conference: "AFC", division: "North" },
  { slug: "buf", name: "Bills",        abbr: "BUF", city: "Buffalo",       color: "#00338D", color2: "#C60C30", conference: "AFC", division: "East" },
  { slug: "car", name: "Panthers",     abbr: "CAR", city: "Carolina",      color: "#0085CA", color2: "#101820", conference: "NFC", division: "South" },
  { slug: "chi", name: "Bears",        abbr: "CHI", city: "Chicago",       color: "#0B162A", color2: "#C83803", conference: "NFC", division: "North" },
  { slug: "cin", name: "Bengals",      abbr: "CIN", city: "Cincinnati",    color: "#FB4F14", color2: "#000000", conference: "AFC", division: "North" },
  { slug: "cle", name: "Browns",       abbr: "CLE", city: "Cleveland",     color: "#311D00", color2: "#FF3C00", conference: "AFC", division: "North" },
  { slug: "dal", name: "Cowboys",      abbr: "DAL", city: "Dallas",        color: "#003594", color2: "#869397", conference: "NFC", division: "East" },
  { slug: "den", name: "Broncos",      abbr: "DEN", city: "Denver",        color: "#FB4F14", color2: "#002244", conference: "AFC", division: "West" },
  { slug: "det", name: "Lions",        abbr: "DET", city: "Detroit",       color: "#0076B6", color2: "#B0B7BC", conference: "NFC", division: "North" },
  { slug: "gb",  name: "Packers",      abbr: "GB",  city: "Green Bay",     color: "#203731", color2: "#FFB612", conference: "NFC", division: "North" },
  { slug: "hou", name: "Texans",       abbr: "HOU", city: "Houston",       color: "#03202F", color2: "#A71930", conference: "AFC", division: "South" },
  { slug: "ind", name: "Colts",        abbr: "IND", city: "Indianapolis",  color: "#002C5F", color2: "#A2AAAD", conference: "AFC", division: "South" },
  { slug: "jax", name: "Jaguars",      abbr: "JAX", city: "Jacksonville",  color: "#101820", color2: "#D7A22A", conference: "AFC", division: "South" },
  { slug: "kc",  name: "Chiefs",       abbr: "KC",  city: "Kansas City",   color: "#E31837", color2: "#FFB81C", conference: "AFC", division: "West" },
  { slug: "lv",  name: "Raiders",      abbr: "LV",  city: "Las Vegas",     color: "#000000", color2: "#A5ACAF", conference: "AFC", division: "West" },
  { slug: "lac", name: "Chargers",     abbr: "LAC", city: "Los Angeles",   color: "#0080C6", color2: "#FFC20E", conference: "AFC", division: "West" },
  { slug: "lar", name: "Rams",         abbr: "LAR", city: "Los Angeles",   color: "#003594", color2: "#FFA300", conference: "NFC", division: "West" },
  { slug: "mia", name: "Dolphins",     abbr: "MIA", city: "Miami",         color: "#008E97", color2: "#FC4C02", conference: "AFC", division: "East" },
  { slug: "min", name: "Vikings",      abbr: "MIN", city: "Minnesota",     color: "#4F2683", color2: "#FFC62F", conference: "NFC", division: "North" },
  { slug: "ne",  name: "Patriots",     abbr: "NE",  city: "New England",   color: "#002244", color2: "#C60C30", conference: "AFC", division: "East" },
  { slug: "no",  name: "Saints",       abbr: "NO",  city: "New Orleans",   color: "#D3BC8D", color2: "#101820", conference: "NFC", division: "South" },
  { slug: "nyg", name: "Giants",       abbr: "NYG", city: "New York",      color: "#0B2265", color2: "#A71930", conference: "NFC", division: "East" },
  { slug: "nyj", name: "Jets",         abbr: "NYJ", city: "New York",      color: "#125740", color2: "#000000", conference: "AFC", division: "East" },
  { slug: "phi", name: "Eagles",       abbr: "PHI", city: "Philadelphia",  color: "#004C54", color2: "#A5ACAF", conference: "NFC", division: "East" },
  { slug: "pit", name: "Steelers",     abbr: "PIT", city: "Pittsburgh",    color: "#FFB612", color2: "#101820", conference: "AFC", division: "North" },
  { slug: "sf",  name: "49ers",        abbr: "SF",  city: "San Francisco", color: "#AA0000", color2: "#B3995D", conference: "NFC", division: "West" },
  { slug: "sea", name: "Seahawks",     abbr: "SEA", city: "Seattle",       color: "#002244", color2: "#69BE28", conference: "NFC", division: "West" },
  { slug: "tb",  name: "Buccaneers",   abbr: "TB",  city: "Tampa Bay",     color: "#D50A0A", color2: "#FF7900", conference: "NFC", division: "South" },
  { slug: "ten", name: "Titans",       abbr: "TEN", city: "Tennessee",     color: "#0C2340", color2: "#4B92DB", conference: "AFC", division: "South" },
  { slug: "wsh", name: "Commanders",   abbr: "WSH", city: "Washington",    color: "#5A1414", color2: "#FFB612", conference: "NFC", division: "East" },
];

export const CFB_TEAMS: TeamInfo[] = [
  { slug: "alabama",    name: "Crimson Tide",  abbr: "ALA",  city: "Alabama",        color: "#9E1B32" },
  { slug: "ohio-state", name: "Buckeyes",      abbr: "OSU",  city: "Ohio State",     color: "#BB0000" },
  { slug: "georgia",    name: "Bulldogs",      abbr: "UGA",  city: "Georgia",        color: "#BA0C2F" },
  { slug: "michigan",   name: "Wolverines",    abbr: "MICH", city: "Michigan",       color: "#00274C" },
  { slug: "texas",      name: "Longhorns",     abbr: "TEX",  city: "Texas",          color: "#BF5700" },
  { slug: "clemson",    name: "Tigers",        abbr: "CLEM", city: "Clemson",        color: "#F66733" },
  { slug: "lsu",        name: "Tigers",        abbr: "LSU",  city: "LSU",            color: "#461D7C" },
  { slug: "oklahoma",   name: "Sooners",       abbr: "OU",   city: "Oklahoma",       color: "#841617" },
  { slug: "penn-state", name: "Nittany Lions", abbr: "PSU",  city: "Penn State",     color: "#041E42" },
  { slug: "florida",    name: "Gators",        abbr: "FLA",  city: "Florida",        color: "#0021A5" },
  { slug: "notre-dame", name: "Fighting Irish",abbr: "ND",   city: "Notre Dame",     color: "#0C2340" },
  { slug: "auburn",     name: "Tigers",        abbr: "AUB",  city: "Auburn",         color: "#0C2340", color2: "#E87722" },
  { slug: "tamu",       name: "Aggies",        abbr: "TAMU", city: "Texas A&M",      color: "#500000" },
  { slug: "oregon",     name: "Ducks",         abbr: "ORE",  city: "Oregon",         color: "#154733" },
  { slug: "utah",       name: "Utes",          abbr: "UTAH", city: "Utah",           color: "#CC0000" },
  { slug: "bama-alt",   name: "Roll Tide",     abbr: "BAMA", city: "Alabama Alt",    color: "#9E1B32" },
  { slug: "miami-fl",   name: "Hurricanes",    abbr: "MIA",  city: "Miami (FL)",     color: "#005030" },
  { slug: "florida-st", name: "Seminoles",     abbr: "FSU",  city: "Florida State",  color: "#782F40" },
  { slug: "wisconsin",  name: "Badgers",       abbr: "WIS",  city: "Wisconsin",      color: "#C5050C" },
  { slug: "iowa",       name: "Hawkeyes",      abbr: "IOWA", city: "Iowa",           color: "#FFCD00", color2: "#000000" },
  { slug: "tcu",        name: "Horned Frogs",  abbr: "TCU",  city: "TCU",            color: "#4D1979" },
  { slug: "baylor",     name: "Bears",         abbr: "BAY",  city: "Baylor",         color: "#003015" },
  { slug: "kansas-st",  name: "Wildcats",      abbr: "KSU",  city: "Kansas State",   color: "#512888" },
  { slug: "cincinnati", name: "Bearcats",      abbr: "CIN",  city: "Cincinnati",     color: "#E00122" },
  { slug: "pitt",       name: "Panthers",      abbr: "PITT", city: "Pittsburgh",     color: "#003594" },
  { slug: "wake-forest",name: "Demon Deacons", abbr: "WAKE", city: "Wake Forest",    color: "#9E0000" },
  { slug: "kentucky",   name: "Wildcats",      abbr: "UK",   city: "Kentucky",       color: "#0033A0" },
  { slug: "nc-state",   name: "Wolfpack",      abbr: "NCST", city: "NC State",       color: "#CC0000" },
  { slug: "mississippi",name: "Rebels",        abbr: "MISS", city: "Ole Miss",       color: "#CE1126" },
  { slug: "tennessee",  name: "Volunteers",    abbr: "TENN", city: "Tennessee",      color: "#FF8200" },
  { slug: "virginia",   name: "Cavaliers",     abbr: "UVA",  city: "Virginia",       color: "#232D4B" },
  { slug: "north-carolina", name: "Tar Heels", abbr: "UNC",  city: "North Carolina", color: "#4B9CD3" },
  { slug: "duke",       name: "Blue Devils",   abbr: "DUKE", city: "Duke",           color: "#003087" },
  { slug: "usc",        name: "Trojans",       abbr: "USC",  city: "USC",            color: "#990000" },
  { slug: "ucla",       name: "Bruins",        abbr: "UCLA", city: "UCLA",           color: "#2D68C4" },
  { slug: "stanford",   name: "Cardinal",      abbr: "STAN", city: "Stanford",       color: "#8C1515" },
  { slug: "washington", name: "Huskies",       abbr: "WASH", city: "Washington",     color: "#33006F" },
  { slug: "colorado",   name: "Buffaloes",     abbr: "COL",  city: "Colorado",       color: "#CFB87C", color2: "#000000" },
  { slug: "arizona-st", name: "Sun Devils",    abbr: "ASU",  city: "Arizona State",  color: "#8C1D40" },
  { slug: "boise-st",   name: "Broncos",       abbr: "BSU",  city: "Boise State",    color: "#0033A0" },
];

export const ALL_TEAMS: TeamInfo[] = [...NFL_TEAMS, ...CFB_TEAMS];

export function getTeam(slug: string): TeamInfo | undefined {
  return ALL_TEAMS.find((t) => t.slug === slug);
}

export function getTeamColor(slug: string): string {
  return getTeam(slug)?.color ?? "#252A33";
}
