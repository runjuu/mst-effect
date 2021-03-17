<h1 align="center">mst-effect 💫</h1>

<h4 align="center">
  Designed to be used with <a href="https://github.com/mobxjs/mobx-state-tree">MobX-State-Tree</a> to compose asynchronous programs using <a href="https://github.com/ReactiveX/rxjs">RxJS</a>.
</h4>

<p align="center">
  <a href="https://github.com/runjuu/mst-effect/blob/main/LICENSE">
    <img height="20" alt="GitHub license" src="https://badgen.net/badge/license/MIT/cyan" />
  </a>
  <a href="https://github.com/runjuu/mst-effect/discussions">
    <img height="20" alt="discussions" src="https://badgen.net/badge/join%20the%20discussion/on%20github/purple?icon=github" />
  </a>
  <a href="#contributing">
    <img height="20" alt="PRs Welcome" src="https://badgen.net/badge/PRs/welcome/green" />
  </a>
  <a href="https://www.npmjs.com/package/mst-effect">
    <img height="20" alt="npm version" src="https://badgen.net/npm/v/mst-effect" />
  </a>
  <a href="https://www.npmjs.com/package/mst-effect">
    <img height="20" alt="types" src="https://badgen.net/npm/types/mst-effect" />
  </a>
  <a href="https://bundlephobia.com/result?p=mst-effect">
    <img height="20" alt="minzipped size" src="https://badgen.net/bundlephobia/minzip/mst-effect" />
  </a>
</p>

[Why use RxJS?](http://reactivex.io/intro.html)

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

## Examples
- [Fetch data](https://codesandbox.io/s/fetch-data-i9hqb?file=/src/app.tsx)
- [Handle user input](https://codesandbox.io/s/handle-user-input-ef1pt?file=/src/app.tsx)
- [Mutually exclusive actions](https://codesandbox.io/s/mutually-exclusive-actions-ylqlf?file=/src/app.tsx)

## Basics
__`effect`__ is the core method of `mst-effect`. It can automatically manage subscriptions and execute the emitted actions. For example:

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

The second parameter, a factory function, can be thought of as the `Epic` of [redux-observable](https://redux-observable.js.org/docs/basics/Epics.html). The factory function is called only once at model creation. It takes a stream of payloads and returns a stream of actions. — __Payloads in, actions out.__

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
type ValidEffectActions = null | EffectAction | (null | EffectAction)[] // `null` for doing nothing

function effect<P>(
  self: AnyInstance,
  fn: (payload$: Observable<P>) => Observable<ValidEffectActions>,
): (payload: P) => void
```

`payload$` emits data synchronously when the function returned by the effect is called. The returned `Observable<ValidEffectActions>` will automatically subscribed by `effect`

##### When using an observable

```ts
type ValidEffectActions = null | EffectAction | (null | EffectAction)[]

function effect(
  self: AnyInstance,
  observable: Observable<ValidEffectActions>,
): void
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
