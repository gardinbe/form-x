export type KeyedMap<K, V> = ReadonlyMap<K, V> | [K, V][];

/**
 * Merges multiple maps together, and returns an array of their values.
 * @param maps - Maps to merge.
 * @returns Array of values.
 */
export const mergeMapsToArray = <T>(...maps: KeyedMap<unknown, T>[]): T[] => {
  return [...new Map(maps.flatMap((map) => [...map])).values()];
};
