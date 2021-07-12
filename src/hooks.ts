import { useLayoutEffect, useMemo, useState } from 'react';

import { Stateful } from './controller';
import { issues } from './issues';
import { Event, forAlias, Lifecycle as Cycle } from './lifecycle';
import { Model } from './model';
import { usePeers } from './peer';
import { Subscriber } from './subscriber';
import { fn } from './util';

export const Oops = issues({
  HasPropertyUndefined: (control, property) =>
    `${control}.${property} is marked as required for this render.`
})

const subscriberEvent = forAlias("element");
const componentEvent = forAlias("component");

class Hook extends Subscriber {
  alias!: (from: Event) => Event;
  tag?: Key;

  at(name: Event){
    const also = this.alias(name);

    for(const key of [name, also]){
      const on: any = this.subject;
      const handle = on[key];
  
      handle && handle.call(on, this.tag);
      this.parent.update(key);
    }
  }

  useLifecycle(){
    this.at(Cycle.WILL_RENDER);
    this.at(this.active
      ? Cycle.WILL_UPDATE
      : Cycle.WILL_MOUNT  
    )

    useLayoutEffect(() => {
      this.listen();
      this.at(Cycle.DID_MOUNT);

      return () => {
        this.at(Cycle.WILL_UNMOUNT);
        this.release();
      }
    })
  }

  focus(key: string, expect?: boolean){
    const source = this.subject;

    this.watch(key, () => {
      let value = source[key];

      if(value instanceof Model){
        const child = new Subscriber(value, this.callback);
        this.proxy = child.proxy as any;
        return child;
      }

      if(expect && value === undefined)
        throw Oops.HasPropertyUndefined(
          source.constructor.name, key
        );

      this.proxy = value;
    });
  }
}

function useRefresh<T>(
  init: (trigger: Callback) => T){

  const [ state, update ] = useState((): T[] => [
    init(() => update(state.concat()))
  ]);

  return state[0];
}

export function useLazy(
  Type: typeof Model, args: any[]){

  const instance = useMemo(() => Type.create(...args), []);

  useLayoutEffect(() => () => instance.destroy(), []);

  return instance;
}

export function usePassive<T extends typeof Model>(
  target: T,
  select?: boolean | string | Select){

  const instance = target.find(!!select);

  if(!instance)
    return;

  if(fn(select))
    return select(instance);

  if(typeof select == "string")
    return (instance as any)[select];
  
  return instance;
}

export function useWatcher(
  target: Stateful,
  path?: string | Select,
  expected?: boolean){

  const hook = useRefresh(trigger => {
    const sub = new Hook(target, trigger);

    if(fn(path)){
      const available: BunchOf<string> = {};

      for(const key in target)
        available[key] = key;

      path = path(available);
    }

    if(path)
      sub.focus(path, expected);

    return sub;
  });

  useLayoutEffect(hook.listen, []);

  return hook.proxy;
}

export function useSubscriber<T extends Stateful>(
  target: T, tag?: Key | KeyFactory<T>){

  const hook = useRefresh(trigger => {
    const sub = new Hook(target, trigger);

    sub.alias = subscriberEvent;
    sub.tag = fn(tag) ? tag(target) : tag || 0;

    return sub;
  });

  hook.useLifecycle();
  
  return hook.proxy;
}

export function useModel(
  Type: typeof Model,
  args: any[], 
  callback?: (instance: Model) => void){

  const hook = useRefresh(trigger => {
    const instance = Type.create(...args);
    const sub = new Hook(instance, trigger);

    sub.alias = componentEvent;

    if(callback)
      callback(instance);

    instance.on("willUnmount", () => {
      instance.destroy();
    });

    return sub;
  });

  usePeers(hook.subject);
  hook.useLifecycle();

  return hook.proxy;
}