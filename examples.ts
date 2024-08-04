import { suggest } from "./api.ts";
import { Coord } from "./coords.ts";
import { Poi } from "./interfaces.ts";
import { xfrpc } from "./request.ts";

async function route(args: any) {
  return await xfrpc("alterRoute", args, { url: "https://pro.mapy.cz/tplanner" });
}

async function detail(args: any): Promise<Poi> {
  const re = await xfrpc("detail", args, { url: "https://pro.mapy.cz/poiagg" });
  return re.poi as Poi;
}

async function lookupbox(args: any, hints: any) {
  return await xfrpc("lookupbox", args, { url: "https://pro.mapy.cz/poiagg", hints });
}

async function getbase() {
  return await xfrpc("getBase", [], { url: "https://pro.mapy.cz/mapybox-ng" });
}

console.log(Coord.stringToCoords("9dobgxLg21hx5fOBibUfZIFKdFugmH1zSeq23WA3Tz3wvb77fhi3Ctf4k"))

async function tests() {
  const wz = new Coord(12.933840507579781, 47.571277723252614)
  const ig = new Coord(12.8870615, 47.5015969)
  console.log(wz, Coord.coordsToString([wz]))
  console.log(ig, Coord.coordsToString([ig]))
  console.log(Coord.coordsToString([wz, ig]))
  console.log(Coord.stringToCoords("9dobZxLgIN9d5A4xLLpX"))

  let re = route(
    [
      [
        { "source": "coor", "geometry": "9dob4xLgIF", "routeParams": { "criterion": 131 } },
        { "source": "coor", "geometry": "9d5A4xLLpX" }
      ],
      {
        "tollExcludeCountries": [],
        "isPlanable": true,
        "publicPlanable": true,
        "useTraffic": false,
        "alter": true
      }
    ]
  )
  console.log(JSON.stringify(re, null, 2))

  re = lookupbox([9.315224066376686, 46.83289152408602, 15.028114691376686, 49.67734646145269,
    { "zoom": 8, "mapsetId": 3, "pixelSize": 406.5309222787855, "lang": ["en", "cs"] }
  ], { "0": "float", "1": "float", "2": "float", "3": "float", "4.pixelSize": "float" }
  )
  console.log(re)

  re = getbase();
  console.log(re)



  let re1 = await detail(["osm", 94972657, {
    "fetchPhoto": true, "ratios": ["default", "1x1", "16x9"],
    "wikimedia": true,
    "lang": ["en", "cs"]
  }])
  console.log(re1)
}

const re = await suggest({ phrase: "Watzmannhaus" })
console.log(re)



