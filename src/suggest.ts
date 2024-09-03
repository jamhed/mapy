import { type Cache, FileCache } from './cache';
import { baseUrl } from './config';
import logger from './logger';

export async function request(
  params: Partial<Request> = { count: 5, lang: 'en' },
  cacher: Cache = new FileCache()
): Promise<Result[]> {
  const url = new URL(baseUrl + '/suggest');
  const key = cacher.key({ ...params, request: url });
  if (cacher.is(key)) return cacher.get(key);
  logger.info({ url }, 'fetching');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value.toString()));
  const response = await fetch(url);
  logger.info(response);
  const decodedResponse = (await response.json()) as Response;
  cacher.set(key, decodedResponse.result);
  return decodedResponse.result;
}

export interface Request {
  count: number;
  phrase: string;
  lang: string;
}

export interface Response {
  deletedFromBack: number;
  hasCategory: number;
  hasGeo: number;
  hasService: number;
  id: string;
  queryType: string;
  result: Result[];
  sortToUserOnCategory: boolean;
}

export interface Result {
  category: string;
  highlight: any[];
  sentence: string;
  userData: UserData;
}

export interface UserData {
  badge: number;
  bbox: number[];
  correctedResult: boolean;
  country: string;
  countryId: number;
  district: string;
  enabled: boolean;
  evidenceNumber: string;
  hasAddress: boolean;
  highlight: number[];
  highlightSecond: any[];
  houseNumber: string;
  iconType: string;
  id: number;
  img: string;
  importance: number;
  latitude: number;
  longitude: number;
  mmid: string;
  mmsource: string;
  mmtype: string;
  muniId: string;
  municipality: string;
  nuts: string;
  poiType: string;
  poiTypeId: number;
  popularity: number;
  premiseIds: any[];
  profileQuality: number;
  quarter: string;
  region: string;
  relevance: number;
  resultType: string;
  ruianId: number;
  source: string;
  street: string;
  streetNumber: string;
  suggestFirstRow: string;
  suggestSecondRow: string;
  suggestThirdRow: string;
  ward: string;
  wikiId: string;
  zipCode: string;
}
