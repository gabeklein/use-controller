import Oops from './issues';

const {
  assign,
  create,
  defineProperty,
  entries,
  getPrototypeOf,
  getOwnPropertyDescriptor,
  getOwnPropertyDescriptors,
  keys,
  values
} = Object;

export {
  assign,
  create,
  defineProperty,
  entries,
  getPrototypeOf,
  getOwnPropertyDescriptor,
  keys,
  values
}

export {
  allEntriesIn,
  assignSpecific,
  createEffect,
  debounce,
  define,
  defineLazy,
  entriesIn,
  fn,
  memoize,
  selectFrom,
  setDisplayName,
  within
}

function define(target: {}, values: {}): void;
function define(target: {}, key: string | symbol, value: any): void;
function define(target: {}, kv: {} | string | symbol, v?: {}){
  if(typeof kv == "string" || typeof kv == "symbol")
    defineProperty(target, kv, { value: v })
  else
    for(const [key, value] of entries(kv))
      defineProperty(target, key, { value });
}

function fn(x: any): x is Function {
  return typeof x == "function";
}

function setDisplayName<T extends Function>(fn: T, name: string){
  (fn as { displayName?: string }).displayName = name;
}

function entriesIn(object: {}): [string, PropertyDescriptor][] {
  return entries(getOwnPropertyDescriptors(object))
}

function allEntriesIn(object: {}, until: {}){
  let layer = object;

  return <IterableIterator<[string, PropertyDescriptor][]>>{
    [Symbol.iterator](){ return this },
    next(){
      if(layer === until || layer.constructor === until)
        return { done: true };

      const value = entriesIn(layer);
      layer = getPrototypeOf(layer);
      return { value }; 
    }
  }
}

function debounce(callback: Callback){
  let throttle: undefined | boolean;
  return () => {
    if(throttle)
      return;

    throttle = true;
    callback();
    setImmediate(() => {
      throttle = false;
    })
  }
}

function assignSpecific(
  target: InstanceType<Class>,
  source: BunchOf<any>, 
  only?: string[]){

  const values = within(target);
  const proto = target.constructor.prototype;
  const defer: string[] = [];

  for(const key of only || keys(source)){
    if(only && !(key in source))
      continue;

    const descriptor = getOwnPropertyDescriptor(proto, key);

    if(descriptor && descriptor.set)
      defer.push(key)
    else if(target.hasOwnProperty(key))
      values[key] = source[key];
  }

  for(const key of defer)
    values[key] = source[key];
}

type DefineMultiple<T> = { [key: string]: (this: T) => any };

function defineLazy<T>(object: T, property: string | symbol, init: (this: T) => any): void;
function defineLazy<T>(object: T, property: DefineMultiple<T>): void;
function defineLazy<T>(
  object: T, 
  property: string | symbol | DefineMultiple<T>, 
  init?: (this: T) => any){

  if(typeof property === "object")
    for(const k in property)
      defineLazy(object, k, property[k]);
  else
    defineProperty(object, property, { 
      configurable: true,
      get: function(){
        const value = init!.call(this);
        defineProperty(this, property, { value });
        return value;
      }
    });
}

/**
 * "I don't care about strict property access."
 */
function within<T>(object: T): BunchOf<any>;
function within<T>(object: T, key: undefined): BunchOf<any>;
function within<T>(object: T, key?: string | symbol): any;
function within<T, V>(object: T, key: string | symbol, value: V): V;
function within(
  source: any,
  key?: string | symbol,
  value?: any){

  if(value)
    return source[key!] = value;
  if(key)
    return source[key];
  else
    return source;
}

const CACHE = new Map<any, any>();

function memoize<R, A extends any[]>(
  compute: (...args: A) => R, ...args: A
): R;

function memoize(...args: any[]){
  let cache: any = CACHE;
  const first = args[0];
  const last = args[args.length - 1];

  for(const k of args)
    if(cache.has(k))
      cache = cache.get(k);
    else
      cache.set(k, 
        cache = k === last
          ? first(...args.slice(1)) : new Map()
      );

  return cache;
}

function createEffect(callback: EffectCallback<any>){
  let unSet: Callback | Promise<any> | void;

  return (value: any, callee = value) => {
    typeof unSet == "function" && unSet();
    unSet = callback.call(callee, value);

    if(unSet instanceof Promise)
      unSet = undefined;

    if(unSet && !fn(unSet))
      throw Oops.BadEffectCallback()
  }
}

function selectFrom(keys: string[], invoke: Function){
  const found = new Set<string>();
  const spy = {} as Recursive<any>;

  for(const key of keys)
    defineProperty(spy, key, {
      get(){
        found.add(key);
        return spy;
      }
    });

  invoke(spy);

  return Array.from(found);
}