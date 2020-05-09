import { ownContext } from './context';
import { Controller, Singleton } from './controller';
import { Dispatch } from './dispatch';
import { useSubscriber } from './subscriber';
import { defineOnAccess } from './util';

export const GLOBAL_INSTANCE = Symbol("controller_singleton");

export const controllerIsGlobalError = (name: string) => new Error(
  `Controller ${name} is tagged as global. Context API does not apply.`
)

export class PeerController {
  constructor(
    private type: typeof Controller
  ){}

  get context(){
    return ownContext(this.type);
  }

  attachNowIfGlobal(parent: Controller, key: string){
    const { type } = this;

    if(type.global){
      defineOnAccess(parent, key, () => globalController(type))
      return
    }
      
    if(parent instanceof Singleton)
      throw new Error(
        `Global controller '${parent.constructor.name}' attempted to attach '${type.name}'. ` +
        `This is not possible because '${type.name}' is not also global. ` + 
        `Did you forget to extend 'Singleton'?`
      )
  }
}

export function useGlobalController(
  type: typeof Controller,
  args: any[]){

  let global = globalController(type, args);
  return useSubscriber(global, args, true);
}

export function globalController(
  type: typeof Controller, args: any[] = []){

  let instance = type[GLOBAL_INSTANCE];

  if(instance)
    return instance;

  instance = new (type as any)(...args) as Singleton;
  type[GLOBAL_INSTANCE] = instance;

  Dispatch.readyFor(instance);

  return instance;
}