import { useLayoutEffect } from 'react';

import { values, Values } from './util';

export const Lifecycle = {
  WILL_RENDER: "willRender",
  WILL_UPDATE: "willUpdate",
  WILL_MOUNT: "willMount",
  WILL_UNMOUNT: "willUnmount",
  DID_MOUNT: "didMount"
} as const;

export type Event = Values<typeof Lifecycle>;

export const lifecycleEvents = [
  "didCreate",
  "willDestroy",
  ...values(Lifecycle)
];

export function forAlias(prefix: string){
  const map = new Map<Event, string>();

  for(const name of values(Lifecycle)){
    const alias = prefix + name[0].toUpperCase() + name.slice(1);

    lifecycleEvents.push(alias);
    map.set(name, alias);
  }

  return (name: Event) => map.get(name) as Event;
}

export function useLifecycleEffect(
  event: (name: Event) => void){

  event(Lifecycle.WILL_RENDER);

  useLayoutEffect(() => {
    event(Lifecycle.DID_MOUNT);
    return () => event(Lifecycle.WILL_UNMOUNT);
  }, [])
}