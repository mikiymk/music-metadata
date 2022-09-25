import type { Unit } from "../type/unit";

type TupleIndex<T extends readonly [] | readonly unknown[]> = Extract<keyof T, number>;

type UnitsResult<Units extends readonly [] | readonly Unit<unknown, Error>[]> = {
  [key in keyof Units]: Units[key] extends Unit<infer U, Error> ? U : never;
};

type UnitsMapObject<Units extends readonly [] | readonly unknown[], Obj extends Record<string, TupleIndex<Units>>> = {
  [key in keyof Obj]: Units[Obj[key]] extends Unit<infer U, Error> ? U : never;
};

export const sequenceToObject = <
  Units extends readonly [] | readonly Unit<unknown, Error>[],
  Obj extends Record<string, TupleIndex<Units>>
>(
  obj: Obj,
  ...units: Units
): Unit<UnitsMapObject<Units, Obj>, Error> => {
  let totalSize = 0;
  for (const [size] of units) {
    totalSize += size;
  }

  return [
    totalSize,
    (buffer, offset) => {
      const results = [];
      for (const [size, reader] of units) {
        const result = reader(buffer, offset);
        if (result instanceof Error) return result;
        results.push(result);
        offset += size;
      }

      const results2 = {} as UnitsMapObject<Units, Obj>;
      for (const key in obj) {
        if (!Object.hasOwn(obj, key)) continue;
        results2[key] = (results as UnitsResult<Units>)[obj[key]];
      }
      return results2;
    },
  ];
};
