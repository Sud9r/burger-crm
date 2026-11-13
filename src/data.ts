import type { AppData } from './types'

const ago = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
const dateAgo = (days: number, hour = 13) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, 20, 0, 0)
  return date.toISOString()
}

export function createDemoData(): AppData {
  const clients = [
    { id: 'guest-01', name: 'Алексей Смирнов', phone: '+7 (999) 000-00-01', email: 'alex@example.com', orders: 18, spent: 12450, lastOrder: 'Сегодня', note: 'Любит классический бургер и острый соус.' },
    { id: 'guest-02', name: 'Екатерина Кузнецова', phone: '+7 (999) 000-00-02', email: 'kate@example.com', orders: 12, spent: 8960, lastOrder: 'Сегодня', note: 'Предпочитает доставку.' },
    { id: 'guest-03', name: 'Павел Морозов', phone: '+7 (999) 000-00-03', email: 'pavel@example.com', orders: 9, spent: 6740, lastOrder: 'Вчера', note: '' },
    { id: 'guest-04', name: 'Мария Волкова', phone: '+7 (999) 000-00-04', email: 'maria@example.com', orders: 7, spent: 5230, lastOrder: 'Вчера', note: 'Часто заказывает на двоих.' },
    { id: 'guest-05', name: 'Дмитрий Орлов', phone: '+7 (999) 000-00-05', email: 'dmitry@example.com', orders: 6, spent: 4890, lastOrder: '12 ноя', note: '' },
    { id: 'guest-06', name: 'Анна Белова', phone: '+7 (999) 000-00-06', email: 'anna@example.com', orders: 4, spent: 3120, lastOrder: '10 ноя', note: '' },
  ]

  return {
    clients,
    orders: [
      { id: '#1054', clientId: clients[0].id, clientName: clients[0].name, phone: clients[0].phone, items: 'Классический бургер × 1, Картофель фри × 1', total: 580, status: 'Готовится', channel: 'Самовывоз', createdAt: ago(0.2) },
      { id: '#1053', clientId: clients[1].id, clientName: clients[1].name, phone: clients[1].phone, items: 'Двойной чизбургер × 1, Лимонад × 1', total: 700, status: 'Новый', channel: 'Доставка', createdAt: ago(0.35) },
      { id: '#1052', clientId: clients[2].id, clientName: clients[2].name, phone: clients[2].phone, items: 'Бургер BBQ × 1, Наггетсы × 1', total: 720, status: 'Готов', channel: 'Самовывоз', createdAt: ago(0.65) },
      { id: '#1051', clientId: clients[3].id, clientName: clients[3].name, phone: clients[3].phone, items: 'Чизбургер × 2, Домашний лимонад × 2', total: 1360, status: 'Доставлен', channel: 'Доставка', createdAt: ago(1.1) },
      { id: '#1050', clientId: clients[4].id, clientName: clients[4].name, phone: clients[4].phone, items: 'Классический бургер × 2', total: 780, status: 'Доставлен', channel: 'В зале', createdAt: ago(2.1) },
      { id: '#1049', clientId: clients[5].id, clientName: clients[5].name, phone: clients[5].phone, items: 'Картофель фри × 1, Морс ягодный × 1', total: 340, status: 'Отменён', channel: 'Самовывоз', createdAt: ago(3.2) },
      { id: '#1048', clientId: clients[0].id, clientName: clients[0].name, phone: clients[0].phone, items: 'Двойной чизбургер × 1', total: 520, status: 'Доставлен', channel: 'Доставка', createdAt: dateAgo(1, 19) },
      { id: '#1047', clientId: clients[1].id, clientName: clients[1].name, phone: clients[1].phone, items: 'Бургер BBQ × 1, Картофель фри × 1', total: 660, status: 'Доставлен', channel: 'Самовывоз', createdAt: dateAgo(2, 18) },
      { id: '#1046', clientId: clients[2].id, clientName: clients[2].name, phone: clients[2].phone, items: 'Классический бургер × 2, Лимонад × 1', total: 960, status: 'Доставлен', channel: 'В зале', createdAt: dateAgo(3, 14) },
      { id: '#1045', clientId: clients[3].id, clientName: clients[3].name, phone: clients[3].phone, items: 'Чизбургер × 1, Наггетсы × 1', total: 770, status: 'Доставлен', channel: 'Доставка', createdAt: dateAgo(4, 20) },
      { id: '#1044', clientId: clients[4].id, clientName: clients[4].name, phone: clients[4].phone, items: 'Бургер BBQ × 2', total: 940, status: 'Доставлен', channel: 'Самовывоз', createdAt: dateAgo(5, 17) },
      { id: '#1043', clientId: clients[5].id, clientName: clients[5].name, phone: clients[5].phone, items: 'Классический бургер × 1, Морс ягодный × 1', total: 510, status: 'Доставлен', channel: 'В зале', createdAt: dateAgo(6, 13) },
    ],
    products: [
      { id: 'food-01', name: 'Классический бургер', category: 'Бургеры', price: 390, description: 'Сочная котлета, чеддер, свежий салат и фирменный соус.', emoji: '🍔', available: true },
      { id: 'food-02', name: 'Двойной чизбургер', category: 'Бургеры', price: 520, description: 'Две котлеты, двойной чеддер и карамелизированный лук.', emoji: '🍔', available: true },
      { id: 'food-03', name: 'Бургер BBQ', category: 'Бургеры', price: 470, description: 'Бекон, хрустящий лук и дымный соус барбекю.', emoji: '🥓', available: true },
      { id: 'food-04', name: 'Картофель фри', category: 'Закуски', price: 190, description: 'Золотистый картофель с морской солью.', emoji: '🍟', available: true },
      { id: 'food-05', name: 'Наггетсы', category: 'Закуски', price: 250, description: 'Куриные кусочки в хрустящей панировке.', emoji: '🍗', available: false },
      { id: 'food-06', name: 'Домашний лимонад', category: 'Напитки', price: 180, description: 'Лимон, мята и немного свежести.', emoji: '🍋', available: true },
      { id: 'food-07', name: 'Морс ягодный', category: 'Напитки', price: 150, description: 'Домашний морс из лесных ягод.', emoji: '🫐', available: true },
      { id: 'food-08', name: 'Чизкейк', category: 'Десерты', price: 260, description: 'Нежный сливочный десерт к кофе.', emoji: '🍰', available: true },
    ],
    tasks: [
      { id: 'task-01', title: 'Позвонить поставщику', description: 'Уточнить время доставки булочек.', time: '18:00', done: false },
      { id: 'task-02', title: 'Проверить остатки', description: 'Сыр, булочки и картофель.', time: '19:30', done: false },
      { id: 'task-03', title: 'Обновить меню на стойке', description: 'Добавить сезонный морс.', time: '20:00', done: true },
    ],
    promotions: [
      { id: 'promo-01', title: 'Бургер дня', description: 'Скидка на классический бургер по будням с 12:00 до 16:00.', discount: 10, enabled: true, audience: 'Все гости' },
      { id: 'promo-02', title: 'Снова рады видеть', description: 'Персональная скидка для гостей, которые возвращаются чаще трёх раз.', discount: 7, enabled: false, audience: 'Постоянные гости' },
    ],
  }
}
