import { ui } from "./ui";

const defaultLang = "es";

type AppDictionary = (typeof ui)[typeof defaultLang];

type TxKeyPath<T extends object> = {
  [K in keyof T & (string | number)]: T[K] extends any[]
    ? `${K}`
    : T[K] extends object
    ? `${K}` | `${K}.${TxKeyPath<T[K]>}`
    : `${K}`;
}[keyof T & (string | number)];

type TxPathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? TxPathValue<T[K], Rest>
    : never
  : P extends keyof T
  ? T[P]
  : never;

type TranslationKey = TxKeyPath<AppDictionary>;

export function getTranslations(lang: keyof typeof ui) {
  return function t<K extends TranslationKey>(
    key: K
  ): TxPathValue<AppDictionary, K> {
    const keys = key.split(".");
    let value: any = ui[lang] ?? ui[defaultLang];

    for (const k of keys) {
      if (value === undefined || value === null) break;
      value = (value as any)[k];
    }

    if (value !== undefined) return value;

    let valueEs: any = ui[defaultLang];
    for (const k of keys) {
      if (valueEs === undefined || valueEs === null) break;
      valueEs = (valueEs as any)[k];
    }

    return (valueEs ?? key) as TxPathValue<AppDictionary, K>;
  };
}
