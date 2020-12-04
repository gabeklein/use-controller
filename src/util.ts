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
  getOwnPropertyDescriptors,
  keys,
  values
}

export {
  assignSpecific,
  define,
  defineLazy,
  entriesIn,
  isFn,
  listAccess,
  memoize,
  squash,
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
  return target;
}

function isFn(x: any): x is Function {
  return typeof x == "function";
}

function entriesIn<T>(object: T){
  return entries(getOwnPropertyDescriptors(object))
}

function listAccess(
  available: string[],
  processor: (x: Recursive) => void){

  const found = new Set<string>();
  const spy = {} as Recursive;

  for(const key of available)
    defineProperty(spy, key, {
      get: () => (found.add(key), spy)
    });

  processor(spy);

  return Array.from(found);
}

function squash(callback: Callback){
  let squash: undefined | boolean;
  return () => {
    if(squash)
      return;
      
    squash = true;
    callback();
    setImmediate(() => {
      squash = false;
    })
  }
}

function assignSpecific(
  target: InstanceType<Class>,
  source: BunchOf<any>, 
  only?: string[]){

  const values = within(target);
  const proto = target.constructor.prototype;
  const select = only || keys(source);
  const defer: string[] = [];

  for(const key of select){
    const descriptor = getOwnPropertyDescriptor(proto, key);

    if(descriptor && descriptor.set)
      defer.push(key)
    else
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
function within<T>(object: T): Any;
function within<T>(object: T, key: undefined): Any;
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
type Compute<R, A extends any[]> = (...args: A) => R;

function memoize<R, A extends any[]>(compute: Compute<R, A>, ...args: A): R;
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