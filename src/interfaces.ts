export interface Root {
  poi: Poi;
  status: number;
  statusMessage: string;
}

export interface Poi {
  action: any[];
  desc: Desc;
  description: string;
  descriptionLang: string;
  extend: Extend;
  gallery: Gallery[];
  geom: Geom;
  houseNumber: string;
  id: number;
  isMuni: boolean;
  mark: Mark2;
  multiAddress: string[];
  multiTitle: string[];
  origin: string;
  parents: Parent[];
  profileQuality: number;
  regionType: string;
  review: Review;
  rodice: Rodice[];
  source: string;
  sources: string[];
  title: string;
  titleVars: TitleVars;
  typeId: number;
  typeName: string;
}

export interface Desc {
  source: Source;
  text: string;
}

export interface Source {
  text: string;
  url: string;
}

export interface Extend {
  _s: string;
  _sources: number;
  address: Address;
  bbox: Bbox;
  contact: Contact;
  osm: Osm;
  osm_country_id: number;
  poi: Poi2;
  wiki_importance: WikiImportance;
  wikidata_id: string;
}

export interface Address {
  city: string;
  country: string;
  country_iso: string;
  country_iso_alpha: string;
  country_native: string;
  poi: string;
  regions: string[];
  regions_native: string[];
  street: string;
  street_num: string;
  uniqueLevel: number;
  zip: string;
}

export interface Bbox {
  leftBottomLatitude: number;
  leftBottomLongitude: number;
  rightTopLatitude: number;
  rightTopLongitude: number;
}

export interface Contact {
  phone: Phone;
}

export interface Phone {
  label: string;
  value: Value[];
}

export interface Value {
  number: string;
}

export interface Osm {
  'addr:city': string;
  'addr:country': string;
  'addr:housenumber': string;
  'addr:postcode': string;
  'addr:street': string;
  ele: string;
  operator: string;
  tourism: string;
  wheelchair: string;
  wikidata: string;
  wikipedia: string;
}

export interface Poi2 {
  contact: Contact2;
  description: Description;
  elevation: number;
  keyval: Keyval[];
  keyval_tags: KeyvalTag[];
  name: string;
  wikipedia: Wikipedia;
}

export interface Contact2 {
  phone: string;
}

export interface Description {
  descriptionLang: string;
  source: Source2;
  text: string;
}

export interface Source2 {
  text: string;
  url: string;
}

export interface Keyval {
  'mountain range'?: MountainRange;
  'elevation above sea level'?: string;
  operator?: string;
}

export interface MountainRange {
  srcId: number;
  srcSource: string;
  title: string;
  type: string;
}

export interface KeyvalTag {
  icon: string;
  state: string;
  tag: string;
  text: string;
}

export interface Wikipedia {
  de: string;
}

export interface WikiImportance {
  de: number;
}

export interface Gallery {
  media: Medum[];
  sequence: number;
  total: number;
  type: string;
}

export interface Medum {
  approval: boolean;
  authorId: number;
  authorImage: string;
  authorName: string;
  beautyScore: number;
  createDate: string;
  description: string;
  entityId: number;
  entitySource: string;
  id: number;
  language?: string;
  license: string;
  likes: Likes;
  mark: Mark;
  markCamera?: MarkCamera;
  mediaSource: string;
  name: string;
  origin: string;
  ratios: Ratios;
  rotation: number;
  size: number[];
  takeDate: string;
  type: string;
  urls: Urls;
  userPublicId: string;
  visits: number;
  extra?: Extra;
}

export interface Likes {
  count: number;
  id: string;
  rawCount: number;
  voted: boolean;
}

export interface Mark {
  lat: number;
  lon: number;
}

export interface MarkCamera {
  lat: number;
  lon: number;
}

export interface Ratios {}

export interface Urls {
  '16x9': string;
  '1x1': string;
  default: string;
}

export interface Extra {
  wikimedia: Wikimedia;
}

export interface Wikimedia {
  author: string;
  license: string;
  license_url: string;
}

export interface Geom {
  data: string[];
  type: string;
}

export interface Mark2 {
  inaccurate: boolean;
  lat: number;
  lon: number;
}

export interface Parent {
  countryId: number;
  id: number;
  levelId: number;
  name: string;
  regionType: string;
}

export interface Review {
  badge: string;
  caption: string;
  own_review: any;
  review_rating: number;
  review_rating_caption: string;
  review_rating_stars: number;
  review_tier: string;
  review_tier_threshold: number;
  review_weight: number;
  structured_rating: any[];
  target_stars: number;
  total: number;
  type: string;
  use_rating: boolean;
  use_total: boolean;
}

export interface Rodice {
  countryId: number;
  id: number;
  levelId: number;
  name: string;
  regionType: string;
}

export interface TitleVars {
  locationMain1: string;
  locationMain2: string[];
  locationMain3: string[];
  locationSub1: string;
  locationSub2: string[];
  locationSub3: string[];
  specification: string;
  titleMain: string;
  titleMapMain: string;
  titleMapSub: string;
  titleSmartMain: string;
  titleSmartSub: string;
  titleSub: string;
}
