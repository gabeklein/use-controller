import React from 'react';
import { Oops } from '../src/context';

import { Consumer, Model, Provider, render } from './adapter';

class Foo extends Model {
  value?: string = undefined;
}
class Bar extends Model {}
class Baz extends Bar {}

describe("Provider", () => {
  it("will provide instance of model", () => {
    const instance = Foo.create();

    render(
      <Provider of={instance}>
        <Consumer of={Foo} get={i => expect(i).toStrictEqual(instance)} />
      </Provider>
    );
  })

  it("will create instance of given model", () => {
    render(
      <Provider of={Foo}>
        <Consumer of={Foo} get={i => expect(i).toBeInstanceOf(Foo)} />
      </Provider>
    );
  })

  it("will destroy instance of given model", async () => {
    const didUnmount = jest.fn();

    const result = render(
      <Provider of={Foo}>
        <Consumer of={Foo} has={i => i.willDestroy = didUnmount} />
      </Provider>
    );

    result.unmount();

    expect(didUnmount).toHaveBeenCalled()
  });

  it("will accept render function for given model", () => {
    render(
      <Provider of={Foo}>
        {(instance) => {
          return <Consumer of={Foo} get={i => {
            // instance injected should be a subscribe-clone.
            expect(i).not.toStrictEqual(instance);
            // get actual instance via circular-get property.
            expect(i).toStrictEqual(instance.get);
          }} />
        }}
      </Provider>
    );
  })

  it("will assign props to instance", () => {
    render(
      <Provider of={Foo} value="foobar">
        <Consumer of={Foo} has={i => expect(i.value).toStrictEqual("foobar")} />
      </Provider>
    );
  })

  it("will not assign foreign props to controller", () => {
    render(
      // @ts-ignore - type-checking warns against this
      <Provider of={Foo} nonValue="foobar">
        <Consumer of={Foo} has={i => {
          // @ts-ignore
          expect(i.nonValue).toBeUndefined();
        }} />
      </Provider>
    );
  })

  it("will create all models in given object", () => {
    render(
      <Provider of={{ Foo, Bar }}>
        <Consumer of={Foo} get={i => expect(i).toBeInstanceOf(Foo)} />
        <Consumer of={Bar} get={i => expect(i).toBeInstanceOf(Bar)} />
      </Provider>
    )
  })

  it("will destroy created model on unmount", () => {
    const didDestroy = jest.fn();

    class Test extends Model {
      destroy = didDestroy
    }

    const rendered = render(
      <Provider of={Test}>
        <Consumer of={Test} get={i => expect(i).toBeInstanceOf(Test)} />
      </Provider>
    );

    rendered.unmount();
    expect(didDestroy).toBeCalled();
  })

  it("will destroy multiple created on unmount", () => {
    const didDestroy = jest.fn();

    class Test extends Model {
      willDestroy = didDestroy;
    }

    const rendered = render(
      <Provider of={{ Test }}>
        <Consumer of={Test} get={i => expect(i).toBeInstanceOf(Test)} />
      </Provider>
    );

    rendered.unmount();
    expect(didDestroy).toBeCalled();
  })

  it("will not destroy multiple passed on unmount", () => {
    const didDestroy = jest.fn();

    class Test extends Model {
      willDestroy = didDestroy;
    }

    const instance = Test.create();

    const rendered = render(
      <Provider of={{ instance }}>
        <Consumer of={Test} get={i => expect(i).toStrictEqual(instance)} />
      </Provider>
    );

    rendered.unmount();
    expect(didDestroy).not.toBeCalled();
  })


  it("will create all models in given array", () => {
    render(
      <Provider of={[ Foo, Bar ]}>
        <Consumer of={Foo} get={i => expect(i).toBeInstanceOf(Foo)} />
        <Consumer of={Bar} get={i => expect(i).toBeInstanceOf(Bar)} />
      </Provider>
    )
  })

  it("will provide a mix of state and models", () => {
    const foo = Foo.create();

    render(
      <Provider of={{ foo, Bar }}>
        <Consumer of={Foo} get={i => expect(i).toStrictEqual(foo)} />
        <Consumer of={Bar} get={i => expect(i).toBeInstanceOf(Bar)} />
      </Provider>
    )
  })

  it("will throw if no `of` or `for` prop given", () => {
    // @ts-ignore
    const test = () => render(<Provider />);

    expect(test).toThrow(Oops.BadProviderProps());
  })
})

describe("Consumer", () => {
  it("will handle complex arrangement", () => {
    const instance = Foo.create();

    render(
      <Provider of={instance}>
        <Provider of={Baz}>
          <Provider of={{ Bar }}>
            <Consumer of={Foo} get={i => expect(i).toStrictEqual(instance)} />
            <Consumer of={Bar} get={i => expect(i).toBeInstanceOf(Bar)} />
            <Consumer of={Baz} get={i => expect(i).toBeInstanceOf(Baz)} />
          </Provider>
        </Provider>
      </Provider>
    )
  })

  it("will render with instance for child-function", async () => {
    class Test extends Model {
      value = "foobar";
    }

    const instance = Test.create();
    const didRender = jest.fn();

    function onRender(instance: Test){
      const { value } = instance;
      didRender(value);
      return <span>{value}</span>;
    }

    render(
      <Provider of={instance}>
        <Consumer of={Test}>
          {onRender}
        </Consumer>
      </Provider>
    )

    expect(didRender).toBeCalledWith("foobar");
  })

  it("will pass undefined if not found for get-prop", () => {
    render(
      <Consumer of={Bar} get={i => expect(i).toBeUndefined()} />
    )
  })

  it("will throw if not found for has-prop", () => {
    const test = () => render(
      <Consumer of={Bar} has={i => void i} />
    )

    expect(test).toThrow(
      Oops.NothingInContext(Bar.name)
    );
  })

  it("will eagerly select extension", () => {
    render(
      <Provider of={Baz}>
        <Consumer of={Bar} get={i => expect(i).toBeInstanceOf(Baz)} />
      </Provider>
    )
  })

  it("will select closest instance of same type", () => {
    render(
      <Provider of={Foo} value="outer">
        <Provider of={Foo} value="inner">
          <Consumer of={Foo} has={i => expect(i.value).toStrictEqual("inner")} />
        </Provider>
      </Provider>
    )
  });

  it("will select closest match over best match", () => {
    render(
      <Provider of={Bar}>
        <Provider of={Baz}>
          <Consumer of={Bar} get={i => expect(i).toBeInstanceOf(Baz)} />
        </Provider>
      </Provider>
    )
  })
});