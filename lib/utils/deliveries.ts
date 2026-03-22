import { SaleDTO } from '../types/sales'
import { DeliveryDTO } from '../types/delivery'

export const convertSaleDTOToDeliveryDTO = (
  saleDTO: SaleDTO
): DeliveryDTO[] => {
  return saleDTO.deliveries.map((delivery) => ({
    ...delivery,
    sale: saleDTO,
  }))
}
