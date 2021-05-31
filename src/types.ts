import type { IAnyModelType, Instance } from 'mobx-state-tree'

export type IsAny<T> = 0 extends 1 & T ? true : false // https://stackoverflow.com/questions/55541275/typescript-check-for-the-any-type

export type IsNever<T> = [T] extends [never] ? true : false

export type IsEmptyPayload<P> = IsNever<P> extends true
  ? false
  : P extends void
  ? true
  : IsAny<P> extends true
  ? false
  : unknown extends P
  ? true
  : false

export type IsOptionalPayload<Payload> = undefined extends Payload
  ? true
  : void extends Payload
  ? true
  : false

export type NormalizeOptionalPayload<Payload> = IsOptionalPayload<Payload> extends true
  ? Exclude<Payload, void> | undefined
  : Payload

export type PayloadFunc<Payload, ReturnType> = IsEmptyPayload<Payload> extends true
  ? () => ReturnType
  : IsOptionalPayload<Payload> extends true
  ? (payload?: NormalizeOptionalPayload<Payload>) => ReturnType
  : (payload: Payload) => ReturnType

export type AnyInstance = Instance<IAnyModelType>
