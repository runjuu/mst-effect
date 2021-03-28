<p align="center">
  <a href="https://github.com/Runjuu/mst-effect">
    <img width="150px" src="https://user-images.githubusercontent.com/12002941/111877518-b2c60900-89de-11eb-8f28-d5fd95897258.png" alt="mst-effect" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/Runjuu/mst-effect/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/mst-effect?colorA=373737&colorB=0A70E9&style=flat" alt="GitHub license" />
  </a>
  <a href="https://www.npmjs.com/package/mst-effect">
    <img src="https://img.shields.io/npm/v/mst-effect?colorA=373737&colorB=0A70E9&style=flat" alt="NPM version" />
  </a>
  <a href="https://bundlephobia.com/result?p=mst-effect">
    <img src="https://img.shields.io/bundlephobia/min/mst-effect?label=bundle%20size&colorA=373737&colorB=0A70E9&style=flat" alt="Bundle size" />
  </a>
  <a href="https://coveralls.io/github/Runjuu/mst-effect?branch=main">
    <img src="https://img.shields.io/coveralls/github/Runjuu/mst-effect?colorA=373737&colorB=0A70E9&style=flat" alt="Coverage Status" />
  </a>
  <a href="https://discord.gg/GguVg7JxNb">
    <img src="https://img.shields.io/discord/822723953465360435?style=flat&colorA=373737&colorB=0A70E9&label=discord&logo=discord&logoColor=FFF" alt="Discord" />
  </a>
</p>

`mst-effect` is designed to be used with <a href="https://github.com/mobxjs/mobx-state-tree">MobX-State-Tree</a> to create asynchronous actions using <a href="https://github.com/ReactiveX/rxjs">RxJS</a>. In case you haven't used them before:

> `MobX-State-Tree` is a full-featured reactive state management library that can **structure the state model** super intuitively.<br /> > `RxJS` is a library for composing asynchronous and event-based programs that provides the best practice to **manage async codes**.

If you are still hesitant about learning `RxJS`, check the examples below and play around with them. I assure you that you'll be amazed by what it can do and how clean the code could be.

Already using `MobX-State-Tree`? Awesome! `mst-effect` is 100% compatible with your current project.

## Examples

- [Fetch data](https://codesandbox.io/s/fetch-data-i9hqb?file=/src/app.tsx)
- [Fetch with token](https://codesandbox.io/s/fetch-with-token-rbveh?file=/src/app.tsx)
- [Handle user input](https://codesandbox.io/s/handle-user-input-ef1pt?file=/src/app.tsx)
- [Mutually exclusive actions](https://codesandbox.io/s/mutually-exclusive-actions-ylqlf?file=/src/app.tsx)
- [Back pressure](https://codesandbox.io/s/backpressure-ulu1y?file=/src/app.tsx)

## Installation

`mst-effect` has peer dependencies of [mobx](https://www.npmjs.com/package/mobx), [mobx-state-tree](https://www.npmjs.com/package/mobx-state-tree) and [rxjs](https://www.npmjs.com/package/rxjs), which will have to be installed as well.

##### Using [yarn](https://yarnpkg.com/en/package/mst-effect):

```bash
yarn add mst-effect
```

##### Or via [npm](https://www.npmjs.com/package/mst-effect):

```bash
npm install mst-effect --save
```

## Basics

**`effect`** is the core method of `mst-effect`. It can automatically manage subscriptions and execute the emitted actions. For example:

```ts
import { types, effect, action } from 'mst-effect'
import { map, switchMap } from 'rxjs/operators'

const Model = types
  .model({
    value: types.string,
  })
  .actions((self) => ({
    fetch: effect<string>(self, (payload$) => {
      function setValue(value: string) {
        self.value = value
      }

      return payload$.pipe(
        switchMap((url) => fetch$(url)),
        map((value) => action(setValue, value)),
      )
    }),
  }))
```

#### Import location

As you can see in the example above, `types` need to be imported from `mst-effect`([Why?](#why-we-need-to-import-types-from-mst-effect)).

#### The definition of the `effect`

The first parameter is the model instance, as `effect` needs to unsubscribe the [`Observable`](https://rxjs-dev.firebaseapp.com/api/index/class/Observable) when the model is destroyed.

The second parameter, a factory function, can be thought of as the `Epic` of [redux-observable](https://redux-observable.js.org/docs/basics/Epics.html). The factory function is called only once at model creation. It takes a stream of payloads and returns a stream of actions. — **Payloads in, actions out.**

Finally, `effect` returns a function to feed a new value to the `payload$`. In actual implementation code, it's just an alias to `subject.next`.

#### What is `action`?

`action` can be considered roughly as a higher-order function that takes a callback function and the arguments for the callback function. But instead of executing immediately, it returns a new function. Action will be immediately invoked when emitted.

```ts
function action(callback, ...params): EffectAction {
  return () => callback(...params)
}
```

## API Reference

### [👾](https://github.com/Runjuu/mst-effect/blob/main/src/effect/effect.ts) effect

`effect` is used to manage subscriptions automatically.

##### When using a factory function

```ts
type ValidEffectActions = EffectAction | EffectAction[]

function effect<P, R>(
  self: AnyInstance,
  fn: (payload$: Observable<P>) => Observable<ValidEffectActions>,
): <RR = R>(payload: P, handler?: (resolve$: Observable<R>) => Observable<RR>) => Promise<RR>
```

`payload$` emits data synchronously when the function returned by the effect is called. The returned `Observable<ValidEffectActions>` will automatically subscribed by `effect`

##### When using an observable

```ts
type ValidEffectActions = EffectAction | EffectAction[]

function effect(self: AnyInstance, observable: Observable<ValidEffectActions>): void
```

`effect` also accepts an `Observable`, most of which behaves identity with `factory function`. The only difference is that it doesn't return a function.

### [👾](https://github.com/Runjuu/mst-effect/blob/main/src/signal/index.ts) signal

```ts
export function signal<P, R = P>(
  self: AnyInstance,
  fn?: (payload$: Observable<P>) => Observable<R>,
): [Observable<R>, (payload: P) => void]
```

`signal` is an encapsulation of the [`Subject`](https://rxjs-dev.firebaseapp.com/api/index/class/Subject). You can use the second parameter to do some processing of the output data.

### [👾](https://github.com/Runjuu/mst-effect/blob/main/src/reaction$/index.ts) reaction$

```ts
export function reaction$<T>(
  expression: (r: IReactionPublic) => T,
  opts?: IReactionOptions,
): Observable<{ current: T; prev: T; r: IReactionPublic }>
```

`reaction$` encapsulates the [`reaction`](https://mobx.js.org/reactions.html#reaction) method from `mobx`. When the returned value changes, it will emit the corresponding data to the returned `Observable`.

## Recipes

#### Error Handling

When an error occurred in `Observable`, `effect` will re-subscribe the `Observable` (will not re-run the factory function). The common practice is to use the [`catchError`](https://rxjs-dev.firebaseapp.com/api/operators/catchError) operator for error handling. Check [fetch data](https://codesandbox.io/s/fetch-data-i9hqb?file=/src/app.tsx) example for more detail.

#### Cancellation

You can combine `signal` and [`takeUntil()`](https://rxjs-dev.firebaseapp.com/api/operators/takeUntil) operator to cancel an `Observable`. Check [mutually exclusive actions](https://codesandbox.io/s/mutually-exclusive-actions-ylqlf?file=/src/app.tsx) example for more detail.

## FAQ

#### Why we need to import `types` from `mst-effect`

Currently, `mobx-state-tree` does not support modifying the model outside of actions.
`mst-effect` overrides `types.model` so that the model can be modified in an asynchronous process.
Because `mst-effect` re-export all the variables and types in `mobx-state-tree`, you can simply change the import location to `mst-effect`.

```diff
- import { types, Instance } from 'mobx-state-tree'
+ import { types, Instance } from 'mst-effect'
```
