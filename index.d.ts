import {
    Component,
    FunctionComponent,
    PropsWithChildren,
    ReactElement,
    RefObject
} from 'react';

type Callback = () => void;
type BunchOf<T> = { [key: string]: T };
type Similar<T> = { [X in keyof T]?: T[X] };

type Recursive<T> = { [P in keyof T]: Recursive<T> };
type Selector<T> = (select: Recursive<T>) => void;

type Class = new (...args: any[]) => void;
type Expecting<A extends any[]> = new(...args: A) => any;
type Instance<T> = T extends { prototype: infer U } ? U : never

type UpdateCallback<T extends object, P extends keyof T> = 
    (this: T, value: T[P], changed: P) => void;

/**
 * Subscribed Controller
 * 
 * Target receives properties which assist in destructuring.
 */
type Accessible<T extends {}> = T & {
    get: T;
    set: T;
}

/**
 * Observable Instance
 * 
 * Implements internal value tracking. 
 * Able to be subscribed to, per-value to know when updated.
 */
interface Observable {
    on<P extends keyof this>(property: P | Selector<this>, listener: UpdateCallback<this, P>): Callback;
  
    once<P extends keyof this>(property: P | Selector<this>, listener: UpdateCallback<this, P>): void;
    once<P extends keyof this>(property: P | Selector<this>): Promise<this[P]>;

    effect(
        callback: (this: this, self: this) => ((() => void) | void), 
        select?: (keyof this)[] | Selector<this>
    ): Callback;

    export(): { [P in keyof this]: this[P] };
    export<P extends keyof this>(select: P[] | Selector<this>): Pick<this, P>;

    update(entries: Partial<this>): void;
    update(keys: Selector<this>): void;
    update<K extends keyof this>(keys: K[]): void;
    update<K extends keyof this>(...keys: K[]): void;

    requestUpdate(): Promise<string[]>;
    requestUpdate(cb: (keys: string[]) => void): void;
}

/**
 * Model Lifecycle
 * 
 * Target contains available lifecycle callbacks. 
 * A controller, when subscribed to within a component, will run 
 * these callbacks appropriately during that component's lifecycle.
 */
interface WithLifecycle {
    didCreate?(): void;
    didMount?(...args: any[]): void;
    didRender?(...args: any[]): void;

    willRender?(...args: any[]): void;
    willReset?(...args: any[]): void;
    willUpdate?(...args: any[]): void;
    willMount?(...args: any[]): void;
    willUnmount?(...args: any[]): void;
    willDestroy(callback?: Callback): void;

    elementDidMount?(...args: any[]): void;
    elementWillRender?(...args: any[]): void;
    elementWillUpdate?(...args: any[]): void;
    elementWillMount?(...args: any[]): void;
    elementWillUnmount?(...args: any[]): void;

    componentDidMount?(...args: any[]): void;
    componentWillRender?(...args: any[]): void;
    componentWillUpdate?(...args: any[]): void;
    componentWillMount?(...args: any[]): void;
    componentWillUnmount?(...args: any[]): void;
}

/**
 * React Controller
 * 
 * Containing helper components which are bound to the controller.
 */
interface WithReact {
    Provider: FunctionComponent<PropsWithChildren<Partial<this>>>;
    Input: FunctionComponent<{ to: string }>;
    Value: FunctionComponent<{ of: string }>;
}

interface Controller extends Observable, WithLifecycle, WithReact {
    parent?: Controller;

    tap(): Accessible<this>;
    tap<K extends keyof this>(key?: K): this[K];
    tap(...keys: string[]): any;

    sub(...args: any[]): Accessible<this>;

    destroy(): void;
}

declare abstract class Controller {
    static use <A extends any[], T extends Expecting<A>> (this: T, ...args: A): Accessible<InstanceType<T>>;

    static uses <T extends Class, I extends Instance<T>, D extends Similar<I>> (this: T, data: D): Accessible<I>;
    static using <T extends Class, I extends Instance<T>, D extends Similar<I>> (this: T, data: D): Accessible<I>;

    static get <T extends Class> (this: T): Accessible<Instance<T>>;
    static get <T extends Class, I extends Instance<T>, K extends keyof I> (this: T, key: K): I[K];
    
    public tap (): Accessible<this>;
    public tap <K extends keyof this> (key: K): this[K];

    static tap <T extends Class> (this: T): Accessible<Instance<T>>;
    static tap <T extends Class, I extends Instance<T>, K extends keyof I> (this: T, key: K): I[K];

    static tap (...keys: string[]): any;

    static has <T extends Class, I extends Instance<T>, K extends keyof I> (this: T, key: K): Exclude<I[K], undefined>;

    public sub (...args: any[]): Accessible<this>;
    static sub <T extends Class> (this: T, ...args: any[]): Accessible<Instance<T>>;

    static meta <T extends Class>(this: T): Accessible<T & Observable>;
    static meta (...keys: string[]): any;

    static find <T extends Class>(this: T): Instance<T>;

    static create <A extends any[], T extends Expecting<A>> (this: T, args?: A): InstanceType<T>;

    public destroy(): void;

    static isTypeof<T extends Class>(this: T, maybe: any): maybe is T;

    static Provider: FunctionComponent<PropsWithChildren<{}>>;
}

declare class Singleton extends Controller {
    static current?: Singleton;
}

interface ControllableFC <T extends Controller, P> {
    (props: P, context: T): JSX.Element | ReactElement | null
}

interface ControllableCC <T extends Controller, P> {
    new (props: P, context: T): Component<P, any>
}

type ControllableComponent<T extends Controller, P> =
    | ControllableFC<T, P>
    | ControllableCC<T, P>

declare function use <T extends Class> (Peer: T, callback?: (i: Instance<T>) => void): Instance<T> 
declare function get <T extends Class> (type: T): Instance<T>;
declare function set <T = any> (onValue: (current: T) => Callback | void): T | undefined;
declare function ref <T = HTMLElement> (onValue?: (current: T) => Callback | void): RefObject<T>;
declare function event (callback?: () => Callback | void): Callback;
declare function memo <T> (compute: () => T): T;
declare function hoc <T extends Controller, P> (component: ControllableComponent<T, P>): typeof component;

type Provider<T = typeof Controller> = 
    FunctionComponent<{ of: Array<T> | BunchOf<T> }>

export {
    WithLifecycle,
    ControllableFC,
    ControllableCC,
    Observable,
    Instance,
    Selector,
    UpdateCallback
}

export {
    Controller,
    Controller as VC,
    Controller as default,
    Singleton,
    Singleton as GC,
    Provider
}

export {
    use,
    get,
    set,
    ref,
    event,
    memo,
    hoc,
    hoc as wrap,
}