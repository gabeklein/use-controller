import { useEffect, useState } from 'react';

import { Controller } from './controller';
import { Callback, LivecycleEvent } from './types';

export type UpdateTrigger = Callback;

export const useManualRefresh = <T extends {}>(init?: () => T) => {
  const [ state, update ] = useState<T>(init || {} as any);
  const refresh = () => update(Object.assign({}, state));
  return [ state, refresh ] as const;
}

export function useEventDrivenController<T extends Controller>(
  init: (requestUpdate: UpdateTrigger) => T
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