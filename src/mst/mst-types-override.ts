import { types as mstTypes } from 'mobx-state-tree'

import { EFFECT_ACTIONS_HANDLER } from '../const'
import { runActions } from '../effect/run-actions'

export const types: typeof mstTypes = {
  ...mstTypes,
  model(...params: any[]) {
    return mstTypes.model(...params).actions(() => ({
      [EFFECT_ACTIONS_HANDLER]: runActions,
    }))
  },
}
