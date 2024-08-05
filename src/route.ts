import { baseUrl } from "./config";
import { Coord } from "./coords";
import { xfrpc } from "./request";

export interface Point {
  source: string | undefined
  id: number | undefined
  x: number
  y: number
}

function makeSource(p: Point) {
  if (!p.id || !p.source) {
    return { "source": "coor", "id": [p.x, p.y].join(",") }
  }
  return { "source": p.source, "id": p.id }
}

export interface Options {
  "tollExcludeCountries": [],
  "isPlanable": boolean,
  "publicPlanable": boolean,
  "useTraffic": boolean,
  "alter": boolean
}

const routeTypeMap = {
  "fast_notoll": 111,
  "fast": 112,
  "short": 113,
  "short_notoll": 114,
  "bike1": 121,
  "bike2": 122,
  "bike3": 122,
  "turist1": 131,
  "turist2": 132,
  "bus": 191,
}

type ValueAsKey<T> = keyof T
export type RouteType = ValueAsKey<typeof routeTypeMap>;

export function routeType(criterion: RouteType) {
  return routeTypeMap[criterion];
}

export async function request(
  startPoint: Point,
  endPoint: Point,
  criterion: RouteType,
  options: Partial<Options> = {}
): Promise<Response> {
  const start = Coord.toString([new Coord(startPoint.x, startPoint.y)])
  const end = Coord.toString([new Coord(endPoint.x, endPoint.y)])

  return await xfrpc("alterRoute", [
    [
      { ...makeSource(startPoint), ...{ "geometry": start, "routeParams": { "criterion": routeType(criterion) } } },
      { ...makeSource(endPoint), ... { "geometry": end } }
    ],
    {
      ...{
        "tollExcludeCountries": [],
        "isPlanable": true,
        "publicPlanable": true,
        "useTraffic": false,
        "alter": true
      }, ...options
    }
  ], { url: baseUrl + "/tplanner" });
}


export interface Response {
  status: number
  statusMessage: string
  altRoutes: AltRoute[]
  planableCriterions: number[]
}

export interface AltRoute {
  totalTime: number
  totalLength: number
  countryData: CountryDaum[]
  routes: Route[]
  popupIndex: number
  popupMark: number[]
  popupAzimuth: number
  routeWaypoints: string
  altitude: Altitude
}

export interface CountryDaum {
  iso3: string
  payedLength: number
  totalLength: number
  name: string
}

export interface Route {
  source: string
  id: number
  geometry: string
  routeParams?: RouteParams
  name: string
  commerce: Commerce
  routes: Route2[]
}

export interface RouteParams {
  criterion: number
}

export interface Commerce {
  country: string
  areaTypes?: string[]
}

export interface Route2 {
  data: Data
  status: number
  statusMessage: string
}

export interface Data {
  id: any
  length: number
  time: number
  status: number
  geometry: string
  closures: any[]
  warnings: any[]
  pois: any[]
  poisTitle: string
}

export interface Altitude {
  altitude: number[]
  geometryCode: string
  elevationGain: number
  elevationLoss: number
  lengths: number[]
}
