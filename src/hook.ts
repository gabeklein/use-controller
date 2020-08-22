import { useEffect, useState } from 'react';

import { Controller } from './controller';

export const useManualRefresh = <T extends {}>(init?: () => T) => {
  const [ state, update ] = useState<T>(init || {} as any);
  const refresh = () => update(Object.assign({}, state));
  return [ state, refresh ] as const;
}

export type LivecycleEvent =
  | "willMount"
  | "willUpdate"
  | "willRender"
  | "didRender"
  | "willReset"
  | "didMount"
  | "willUnmount"
  | "componentWillMount"
  | "componentWillUpdate"
  | "componentWillRender"
  | "componentDidMount"
  | "componentWillUnmount"
  | "elementWillMount"
  | "elementWillUpdate"
  | "elementWillRender"
  | "elementDidMount"
  | "elementWillUnmount";

export const lifecycleEvents = [
  "willReset",
  "willCycle",
  "willRender",
  "willUpdate",
  "willMount",
  "willUnmount",
  "didRender",
  "didMount"
];

const eventsFor = (prefix: string) => {
  const map = {} as BunchOf<string>;
  for(const name of lifecycleEvents)
    map[name] = prefix + name[0].toUpperCase() + name.slice(1);
  return map;
}

export const subscriberLifecycle = eventsFor("element");
export const componentLifecycle = eventsFor("component");
export const allLifecycleEvents = [
  ...lifecycleEvents,
  ...Object.values(subscriberLifecycle),
  ...Object.values(componentLifecycle)
];

export function useEventDrivenController<T extends Controller>(
  init: (requestUpdate: Callback) => T
){
  const [ state, update ] = useState({} as {
    current: T,
    onEvent: (name: LivecycleEvent) => void
  });

  let control = state.current;
  let trigger = state.onEvent;

  if(!control){
    const refresh = () => update({ ...state });
    control = init(refresh);
    trigger = state.onEvent = (name) => control.onEvent(name);
  }

  if(state.current)
    trigger("willUpdate");
  else {
    state.current = control;
    trigger("willMount");
  }

  trigger("willRender");

  useEffect(() => {
    trigger("didRender");

    return () =>
      trigger("willReset")
  })

  useEffect(() => {
    trigger("didMount");

    return () =>
      trigger("willUnmount");
  }, [])

  return control;
}