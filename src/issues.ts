type MessageVariable = string | number | boolean | null;
type Messages = BunchOf<(...args: MessageVariable[]) => string>;
type Params<T> = T extends (... args: infer T) => any ? T : never;
type Issues<M extends Messages> = {
  readonly [P in keyof M]: (...args: Params<M[P]>) => Issue;
}

class Issue extends Error {
  // drop first line of stack trace; not relevant.
  stack = this.stack.replace(/\n.+/, "") as string;

  warn = () => console.warn(this.message);

  static factory<O extends Messages>(register: O){
    const Library = {} as Issues<O>;
    
    for(const name in register)
      (Library[name] as any) = (...args: MessageVariable[]) => 
        new Issue(register[name].apply(null, args));
  
    return Library;
  }
}

export default Issue.factory({
  NothingInContext: (name) =>
    `Couldn't find controller for ${name} in context; did you forget to use a Provider?`,

  HasPropertyUndefined: (control, property) =>
    `${control}.${property} is marked as required for this render.`,

  CantAttachGlobal: (parent, child) =>
    `Singleton '${parent}' attempted to attach '${child}'. This is not possible because '${child}' is not also a singleton.`,

  AssignToGetter: (name) => 
    `Property ${name} is a getter only. Assignment was skipped.`,

  ComputeFailed: (parent, property, initial) =>
    `An exception was thrown while ${initial ? "getting initial value of" : "refreshing"} ${parent}.${property}. Property will be skipped.`,

  ComputedEarly: (property) => 
    `Note: Computed values are usually only calculated after first access, except where accessed implicitly by "on" or "export". Your '${property}' getter may have run earlier than intended because of that.`,

  BadEffectCallback: () =>
    `Callback for property-update may only return a function.`,

  DestroyNotPossible: (name) =>
    `${name}.destory() was called on an instance which is not active. This is an antipattern and may caused unexpected behavior.`,

  GlobalExists: (type) =>
    `Shared instance of ${type} already exists! '${type}.use(...)' may only be mounted once at any one time.`,

  GlobalDoesNotExist: (name) =>
    `Tried to access singleton ${name} but one does not exist! Did you forget to initialize?\nCall ${name}.create() before attempting to access, or consider using ${name}.use() here instead.`,

  BadHOCArgument: () =>
    `Argument for hoc() is not a component.`,

  StrictUpdate: () => 
    `Strict requestUpdate() did not find pending updates.`,

  NoObserver: (className) =>
    `No observer exists for this instance of ${className}. Does it extend Model?`,

  AmbientRequired: (requested, requester, key) =>
    `Attempted to find an instance of ${requested} in context. It is required for ${requester}.${key} but could not be found.`,

  ParentRequired: (expects, child) => 
    `New ${child} created standalone but requires parent of type ${expects}. Did you remember to create via use(${child})?`,

  UnexpectedParent: (expects, child, got) =>
    `New ${child} created as child of ${got} but must be instanceof ${expects}`,

  SetActionProperty: (key) =>
    `Attempted assignment of ${key}. This is not allowed because an action-property.`,

  DuplicateAction: (key) =>
    `Invoked action ${key} but one is already active.`,

  BadProviderProps: () =>
    `Provider expects either 'of' or 'for' props.`,

  BindNotAvailable: () =>
    `Bind proxies are only available from a subscriber. Did you accessnode  outside of a component?`
});