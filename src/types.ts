export type PrimitiveValue = string|number|boolean|null;
export type SimpleObject = Record<string, PrimitiveValue|Record<string, PrimitiveValue>|Array<PrimitiveValue>>;
