export type OrderStatus = 'Новый' | 'Готовится' | 'Готов' | 'Доставлен' | 'Отменён'
export type OrderChannel = 'Самовывоз' | 'Доставка' | 'В зале'
export type ProductCategory = 'Бургеры' | 'Закуски' | 'Напитки' | 'Десерты'

export interface Order {
  id: string
  clientId: string
  clientName: string
  phone: string
  items: string
  total: number
  status: OrderStatus
  channel: OrderChannel
  createdAt: string
}

export interface Client {
  id: string
  name: string
  phone: string
  email: string
  orders: number
  spent: number
  lastOrder: string
  note: string
}

export interface Product {
  id: string
  name: string
  category: ProductCategory
  price: number
  description: string
  emoji: string
  available: boolean
}

export interface Task {
  id: string
  title: string
  description: string
  time: string
  done: boolean
}

export interface Promotion {
  id: string
  title: string
  description: string
  discount: number
  enabled: boolean
  audience: string
}

export interface AppData {
  orders: Order[]
  clients: Client[]
  products: Product[]
  tasks: Task[]
  promotions: Promotion[]
}

export type PageId = 'Главная' | 'Заказы' | 'Клиенты' | 'Меню' | 'Аналитика' | 'Акции' | 'Настройки'

export type ModalState =
  | { type: 'order' }
  | { type: 'client'; client?: Client }
  | { type: 'product'; product?: Product }
  | { type: 'promotion' }
  | { type: 'task' }
  | null
