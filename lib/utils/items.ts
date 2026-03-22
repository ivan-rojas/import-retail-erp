import { ItemCondition } from '../enums'

export const getConditionLabel = (condition: ItemCondition): string => {
  switch (condition) {
    case 'new':
      return 'Nuevo'
    case 'used':
      return 'Usado'
    case 'refurbished':
      return 'Reacondicionado'
    default:
      return condition
  }
}
