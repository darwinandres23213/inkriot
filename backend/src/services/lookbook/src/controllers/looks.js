import { listLooks } from '../services/listLooks.js';

export async function getLooks(_request, response) {
  response.json(await listLooks());
}
