import { types as mstTypes } from 'mobx-state-tree'

import { HANDLE_MST_EFFECT_ACTIONS } from './const'
import { runActions } from './actions'

export const types: typeof mstTypes = {
  ...mstTypes,
  model(...params: any[]) {
    return mstTypes.model(...params).actions(() => ({
      [HANDLE_MST_EFFECT_ACTIONS]: runActions,
    }))
  },
}
