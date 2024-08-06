# mapy.cz interface library

To build this interface requires decoding `fastrpc` protocol (see `fastrpc.ts`), adopted by `mapy.cz` for RPC,
and encoding/decoding geo coordinates to/from strings (see `coords.ts`).

## Routes on the map

Build route of given type (see `Route.RouteType`) from start point to end point on the map:

```ts
import { Route } from "mapy";

const response = await Route.request({x: 12.933840,y: 47.571277}, {x:12.8870615, y:47.5015969}, "turist2");
```

## Point of interest

Look up POI by name:

```ts
import { Suggest } from "mapy";

const results = await Suggest.request({ phrase: "Watzmannhaus", lang: "en" });
const obj = results[0].userData;
console.log(obj.longitude, obj.latitude, obj.id, obj.source);
```

Get details (Wikidata, mostly) for POI:

```ts
import { Detail } from "mapy";

const source = "osm"; // see Suggest.request output
const id = 129440502; // see Suggest.request output

const details = await Detail.request(source, id, {
  "fetchPhoto": true, "ratios": ["default", "1x1", "16x9"],
  "wikimedia": true,
  "lang": ["en"]
});
```
