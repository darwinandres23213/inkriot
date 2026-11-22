import { lookRepository } from '../models/lookRepository.js';

export async function listLooks(repository = lookRepository) {
  const looks = await repository.findAll();
  return looks
    .filter((look) => look.published)
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
    .map(({ id, title, description, imageUrl, imageAlt, detail }) => ({
      id, title, description, imageUrl, imageAlt, detail,
    }));
}
