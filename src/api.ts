import { Result, SuggestRequest, SuggestResponse } from './api_i';
import { baseUrl } from './config';

export async function suggest(
  params: Partial<SuggestRequest> = { count: 5, lang: 'en' }
): Promise<Result[]> {
  const url = new URL(baseUrl + '/suggest');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value.toString()));
  const response = await fetch(url);
  const decodedResponse = (await response.json()) as SuggestResponse;
  return decodedResponse.result;
}
