import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import {
  Activity, ArrowRight, BarChart3, Bell, BookOpen,
  Check, CheckCircle2, ChefHat, ChevronDown, ChevronRight, CircleHelp,
  Clock3, Download, FileJson, Gift, Home, Menu as MenuIcon, Moon, MoreHorizontal,
  Package, Pencil, Plus, Search, Settings, ShoppingBag, ShoppingCart,
  Sparkles, Sun, Tag, Trash2, TrendingUp, Truck, Users, Wallet, X, Zap,
} from 'lucide-react'
import { createDemoData } from './data'
import type { AppData, Client, ModalState, Order, OrderStatus, PageId, Product, ProductCategory, Promotion } from './types'
import { dayLabel, downloadFile, initials, isAppData, money, safeRead, safeWrite, time, toCsv } from './utils'

const DATA_KEY = 'burger-crm-data-v2'
const THEME_KEY = 'burger-crm-theme-v2'
const STATUS_OPTIONS: OrderStatus[] = ['Новый', 'Готовится', 'Готов', 'Доставлен', 'Отменён']
const NAV_ITEMS: Array<{ label: PageId; icon: typeof Home }> = [
  { label: 'Главная', icon: Home },
  { label: 'Заказы', icon: ShoppingBag },
  { label: 'Клиенты', icon: Users },
  { label: 'Меню', icon: BookOpen },
  { label: 'Аналитика', icon: BarChart3 },
  { label: 'Акции', icon: Tag },
]

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function App() {
  const [data, setData] = useState<AppData>(() => safeRead(DATA_KEY, createDemoData(), isAppData))
  const [dark, setDark] = useState(() => safeRead(THEME_KEY, true, (value): value is boolean => typeof value === 'boolean'))
  const [storageWarning, setStorageWarning] = useState(false)
  const [page, setPage] = useState<PageId>('Главная')
  const [query, setQuery] = useState('')
  const [orderFilter, setOrderFilter] = useState('Все')
  const [menuCategory, setMenuCategory] = useState('Все')
  const [period, setPeriod] = useState('7 дней')
  const [modal, setModal] = useState<ModalState>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    setStorageWarning(!safeWrite(DATA_KEY, data))
  }, [data])

  useEffect(() => {
    safeWrite(THEME_KEY, dark)
  }, [dark])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
        window.setTimeout(() => document.getElementById('global-search')?.focus(), 0)
      }
      if (event.key === 'Escape') {
        setModal(null)
        setNotificationsOpen(false)
        setMobileNavOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const todayKey = new Date().toDateString()
  const todayOrders = useMemo(() => data.orders.filter((order) => new Date(order.createdAt).toDateString() === todayKey), [data.orders, todayKey])
  const todayRevenue = todayOrders.filter((order) => order.status !== 'Отменён').reduce((sum, order) => sum + order.total, 0)
  const completedToday = todayOrders.filter((order) => order.status === 'Доставлен').length
  const averageCheck = todayOrders.length ? Math.round(todayRevenue / Math.max(1, todayOrders.filter((order) => order.status !== 'Отменён').length)) : 0
  const activeOrderCount = todayOrders.filter((order) => !['Доставлен', 'Отменён'].includes(order.status)).length

  const filteredOrders = useMemo(() => data.orders
    .filter((order) => `${order.id} ${order.clientName} ${order.phone} ${order.items}`.toLowerCase().includes(query.toLowerCase()))
    .filter((order) => orderFilter === 'Все' || order.status === orderFilter)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [data.orders, orderFilter, query])

  const filteredClients = useMemo(() => data.clients
    .filter((client) => `${client.name} ${client.phone} ${client.email}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.spent - a.spent), [data.clients, query])

  const filteredProducts = useMemo(() => data.products
    .filter((product) => (menuCategory === 'Все' || product.category === menuCategory))
    .filter((product) => `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase())), [data.products, menuCategory, query])

  const showToast = (message: string) => setToast(message)
  const navigate = (nextPage: PageId) => {
    setPage(nextPage)
    setQuery('')
    setMobileNavOpen(false)
    setNotificationsOpen(false)
  }

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setData((current) => ({ ...current, orders: current.orders.map((order) => order.id === id ? { ...order, status } : order) }))
    showToast(`Заказ ${id}: ${status.toLocaleLowerCase('ru-RU')}`)
  }

  const toggleProduct = (id: string) => {
    const product = data.products.find((item) => item.id === id)
    setData((current) => ({ ...current, products: current.products.map((item) => item.id === id ? { ...item, available: !item.available } : item) }))
    showToast(product?.available ? 'Позиция скрыта из меню' : 'Позиция снова доступна')
  }

  const toggleTask = (id: string) => {
    setData((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task) }))
  }

  const submitModal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!modal) return
    const form = new FormData(event.currentTarget)
    const value = (key: string) => String(form.get(key) ?? '').trim()

    if (modal.type === 'order') {
      const product = data.products.find((item) => item.id === value('productId'))
      const quantity = Math.max(1, Math.min(99, Number(value('quantity')) || 1))
      const clientName = value('clientName')
      const phoneInput = value('phone')
      if (!product || !clientName) return
      const phoneDigits = phoneInput.replace(/\D/g, '')
      const existingClient = (phoneDigits.length >= 7
        ? data.clients.find((client) => client.phone.replace(/\D/g, '') === phoneDigits)
        : undefined) ?? data.clients.find((client) => !phoneDigits && client.name.trim().toLocaleLowerCase('ru-RU') === clientName.toLocaleLowerCase('ru-RU'))
      const resolvedClientName = existingClient?.name ?? clientName
      const phone = phoneInput || existingClient?.phone || ''
      const clientId = existingClient?.id ?? newId('guest')
      const createdOrder: Order = {
        id: `#${Math.max(1054, ...data.orders.map((order) => Number(order.id.replace('#', '')) || 0)) + 1}`,
        clientId,
        clientName: resolvedClientName,
        phone,
        items: `${product.name} × ${quantity}`,
        total: product.price * quantity,
        status: 'Новый',
        channel: value('channel') as Order['channel'],
        createdAt: new Date().toISOString(),
      }
      setData((current) => ({
        ...current,
        orders: [createdOrder, ...current.orders],
        clients: existingClient
          ? current.clients.map((client) => client.id === clientId ? { ...client, orders: client.orders + 1, spent: client.spent + createdOrder.total, lastOrder: 'Сегодня' } : client)
          : [{ id: clientId, name: clientName, phone, email: '', orders: 1, spent: createdOrder.total, lastOrder: 'Сегодня', note: '' }, ...current.clients],
      }))
      setModal(null)
      navigate('Заказы')
      showToast(`Заказ ${createdOrder.id} создан`)
      return
    }

    if (modal.type === 'client') {
      const client: Client = {
        id: modal.client?.id ?? newId('guest'),
        name: value('name'),
        phone: value('phone'),
        email: value('email'),
        note: value('note'),
        orders: modal.client?.orders ?? 0,
        spent: modal.client?.spent ?? 0,
        lastOrder: modal.client?.lastOrder ?? 'Пока нет заказов',
      }
      setData((current) => ({ ...current, clients: modal.client ? current.clients.map((item) => item.id === client.id ? client : item) : [client, ...current.clients] }))
      setModal(null)
      showToast(modal.client ? 'Карточка гостя обновлена' : 'Новый гость добавлен')
      return
    }

    if (modal.type === 'product') {
      const category = value('category') as ProductCategory
      const emojiByCategory: Record<ProductCategory, string> = { Бургеры: '🍔', Закуски: '🍟', Напитки: '🥤', Десерты: '🍰' }
      const product: Product = {
        id: modal.product?.id ?? newId('food'),
        name: value('name'),
        category,
        price: Math.max(1, Number(value('price')) || 1),
        description: value('description'),
        emoji: modal.product?.emoji ?? emojiByCategory[category],
        available: modal.product?.available ?? true,
      }
      setData((current) => ({ ...current, products: modal.product ? current.products.map((item) => item.id === product.id ? product : item) : [...current.products, product] }))
      setModal(null)
      showToast(modal.product ? 'Блюдо обновлено' : 'Блюдо добавлено в меню')
      return
    }

    if (modal.type === 'promotion') {
      const promotion: Promotion = {
        id: newId('promo'),
        title: value('title'),
        description: value('description'),
        discount: Math.max(1, Math.min(90, Number(value('discount')) || 1)),
        enabled: true,
        audience: value('audience') || 'Все гости',
      }
      setData((current) => ({ ...current, promotions: [promotion, ...current.promotions] }))
      setModal(null)
      showToast('Акция создана')
      return
    }

    if (modal.type === 'task') {
      const title = value('title')
      if (!title) return
      setData((current) => ({ ...current, tasks: [...current.tasks, { id: newId('task'), title, description: value('description'), time: value('time') || 'Без времени', done: false }] }))
      setModal(null)
      showToast('Задача добавлена')
    }
  }

  const exportOrders = () => {
    const rows = data.orders.map((order) => ({
      Номер: order.id, Гость: order.clientName, Телефон: order.phone, Состав: order.items,
      Сумма: order.total, Статус: order.status, Получение: order.channel,
      Время: new Date(order.createdAt).toLocaleString('ru-RU'),
    }))
    downloadFile('burger-crm-orders.csv', toCsv(rows), 'text/csv;charset=utf-8')
    showToast('Файл с заказами подготовлен')
  }

  const exportClients = () => {
    const rows = data.clients.map((client) => ({
      Имя: client.name, Телефон: client.phone, Почта: client.email,
      Заказы: client.orders, Потрачено: client.spent, Последний_заказ: client.lastOrder,
    }))
    downloadFile('burger-crm-clients.csv', toCsv(rows), 'text/csv;charset=utf-8')
    showToast('Список гостей выгружен')
  }

  const exportBackup = () => {
    downloadFile('burger-crm-backup.json', JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2), 'application/json;charset=utf-8')
    showToast('Резервная копия скачана')
  }

  const resetDemo = () => {
    if (!window.confirm('Вернуть демонстрационные данные? Все изменения в этом браузере будут заменены.')) return
    setData(createDemoData())
    setQuery('')
    showToast('Демонстрационные данные восстановлены')
  }

  const openProductDelete = (product: Product) => {
    if (!window.confirm(`Удалить «${product.name}» из меню?`)) return
    setData((current) => ({ ...current, products: current.products.filter((item) => item.id !== product.id) }))
    showToast('Позиция удалена')
  }

  const todayLabel = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
  const pendingNotifications = data.orders.filter((order) => order.status === 'Новый' || order.status === 'Готов').length

  return (
    <div className={`app-shell ${dark ? 'dark' : 'light'}`}>
      {mobileNavOpen && <button className="mobile-scrim" aria-label="Закрыть меню" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><span>🍔</span><Sparkles size={12} /></div>
          <div className="brand-name"><strong>Бургерная</strong></div>
          <span className="brand-accent" />
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">Б</div>
          <div className="workspace-copy"><strong>Бургерная</strong><small>Демо-пространство</small></div>
          <ChevronDown size={15} />
        </div>

        <div className="nav-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
        <nav className="nav-list" aria-label="Основная навигация">
          {NAV_ITEMS.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${page === label ? 'active' : ''}`} onClick={() => navigate(label)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {label === 'Заказы' && activeOrderCount > 0 && <em>{activeOrderCount}</em>}
            </button>
          ))}
        </nav>
        <div className="nav-label nav-label-secondary">ПАРАМЕТРЫ</div>
        <button className={`nav-item ${page === 'Настройки' ? 'active' : ''}`} onClick={() => navigate('Настройки')}>
          <Settings size={18} strokeWidth={1.8} /><span>Настройки</span>
        </button>

        <div className="sidebar-spacer" />
        <div className="branch-card">
          <div className="branch-card-top"><span className="live-dot" /> Демо-пространство активно <MoreHorizontal size={16} /></div>
          <strong>Основная точка</strong>
          <small>Ежедневно · 10:00–23:00</small>
          <div className="branch-progress"><i /></div>
          <div className="branch-foot"><span>Режим работы</span><b>До 23:00</b></div>
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">АС</div>
          <div className="user-copy"><strong>Алексей Смирнов</strong><small>Владелец · демо-профиль</small></div>
          <button className="icon-button tiny" title="Подсказка" onClick={() => showToast('Это демонстрационный профиль владельца')}><CircleHelp size={16} /></button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" aria-label="Открыть меню" onClick={() => setMobileNavOpen(true)}><MenuIcon size={19} /></button>
            <div className="breadcrumbs"><span>Бургерная</span><ChevronRight size={14} /><b>{page}</b></div>
          </div>
          <div className="topbar-actions">
            <label className={`global-search ${searchOpen ? 'search-expanded' : ''}`}>
              <Search size={16} />
              <input
                id="global-search"
                value={query}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => { if (!query) setSearchOpen(false) }}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Найти заказ, гостя или блюдо"
                aria-label="Поиск по текущему разделу"
              />
              {!query && <kbd>⌘ K</kbd>}
              {query && <button type="button" aria-label="Очистить поиск" onClick={() => setQuery('')}><X size={14} /></button>}
            </label>
            <button className={`icon-button notification-trigger ${notificationsOpen ? 'pressed' : ''}`} aria-label="Уведомления" onClick={() => setNotificationsOpen((value) => !value)}>
              <Bell size={17} />{pendingNotifications > 0 && <i />}
            </button>
            <div className="topbar-user"><div className="user-avatar">АС</div><div><strong>Алексей</strong><small>Владелец</small></div><ChevronDown size={14} /></div>
          </div>
        </header>

        {notificationsOpen && <>
          <button className="popover-scrim" aria-label="Закрыть уведомления" onClick={() => setNotificationsOpen(false)} />
          <div className="notification-popover">
            <div className="popover-title"><strong>Что нового</strong><span>{pendingNotifications} события</span></div>
            {data.orders.filter((order) => ['Новый', 'Готов'].includes(order.status)).slice(0, 4).map((order) => (
              <button className="notification-row" key={order.id} onClick={() => { navigate('Заказы'); setNotificationsOpen(false) }}>
                <span className="notification-icon"><ShoppingBag size={16} /></span>
                <span><b>{order.status === 'Новый' ? 'Новый заказ' : 'Заказ готов' } {order.id}</b><small>{order.clientName} · {time(order.createdAt)}</small></span>
              </button>
            ))}
            {pendingNotifications === 0 && <div className="empty-small">Пока всё спокойно. Новые события появятся здесь.</div>}
          </div>
        </>}

        <div className="content-wrap">
          {page === 'Главная' && <Dashboard
            data={data}
            todayLabel={todayLabel}
            todayRevenue={todayRevenue}
            todayOrders={todayOrders}
            completedToday={completedToday}
            averageCheck={averageCheck}
            period={period}
            setPeriod={setPeriod}
            onNavigate={navigate}
            onNewOrder={() => setModal({ type: 'order' })}
            onToggleTask={toggleTask}
            onAddTask={() => setModal({ type: 'task' })}
          />}
          {page === 'Заказы' && <OrdersPage orders={filteredOrders} filter={orderFilter} setFilter={setOrderFilter} onStatus={updateOrderStatus} onNew={() => setModal({ type: 'order' })} onExport={exportOrders} />}
          {page === 'Клиенты' && <ClientsPage clients={filteredClients} onNew={() => setModal({ type: 'client' })} onEdit={(client) => setModal({ type: 'client', client })} onExport={exportClients} />}
          {page === 'Меню' && <MenuPage products={filteredProducts} category={menuCategory} setCategory={setMenuCategory} onNew={() => setModal({ type: 'product' })} onEdit={(product) => setModal({ type: 'product', product })} onToggle={toggleProduct} onDelete={openProductDelete} />}
          {page === 'Аналитика' && <AnalyticsPage data={data} period={period} setPeriod={setPeriod} onExport={exportOrders} />}
          {page === 'Акции' && <PromotionsPage promotions={data.promotions} onNew={() => setModal({ type: 'promotion' })} onToggle={(id) => setData((current) => ({ ...current, promotions: current.promotions.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item) }))} onToast={showToast} />}
          {page === 'Настройки' && <SettingsPage dark={dark} setDark={setDark} onBackup={exportBackup} onReset={resetDemo} onToast={showToast} storageWarning={storageWarning} />}
        </div>
      </main>

      {modal && <AppModal modal={modal} products={data.products.filter((product) => product.available)} onClose={() => setModal(null)} onSubmit={submitModal} />}
      {toast && <div className="toast" role="status"><span><Check size={15} /></span>{toast}</div>}
    </div>
  )
}

function PageHeading({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action && <div className="page-heading-action">{action}</div>}</div>
}

function Dashboard({ data, todayLabel, todayRevenue, todayOrders, completedToday, averageCheck, period, setPeriod, onNavigate, onNewOrder, onToggleTask, onAddTask }: {
  data: AppData; todayLabel: string; todayRevenue: number; todayOrders: Order[]; completedToday: number; averageCheck: number;
  period: string; setPeriod: (value: string) => void; onNavigate: (page: PageId) => void; onNewOrder: () => void;
  onToggleTask: (id: string) => void; onAddTask: () => void;
}) {
  const activeOrders = todayOrders.filter((order) => !['Доставлен', 'Отменён'].includes(order.status))
  const week = getPeriodStats(data.orders, period)
  const latest = [...data.orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 4)
  const completedTasks = data.tasks.filter((task) => task.done).length

  return <>
    <section className="welcome-banner">
      <div className="welcome-copy">
        <div className="welcome-date"><span className="live-dot" /> {todayLabel.toLocaleUpperCase('ru-RU')}</div>
        <h1>Привет, Алексей! <span>✌️</span></h1>
        <p>Пусть сегодня будет много довольных гостей и сочных бургеров.</p>
        <div className="welcome-actions">
          <button className="button-primary" onClick={onNewOrder}><Plus size={17} /> Новый заказ</button>
          <button className="button-quiet" onClick={() => onNavigate('Аналитика')}>Открыть отчёт <ArrowRight size={15} /></button>
        </div>
      </div>
      <div className="welcome-art" aria-hidden="true">
        <div className="art-glow" /><div className="art-burger">🍔</div>
        <div className="art-ring ring-one" /><div className="art-ring ring-two" />
        <div className="floating-note note-love">Сделано с любовью <span>♥</span></div>
        <div className="floating-note note-taste"><Sparkles size={13} /> Вкус дня</div>
      </div>
      <div className="welcome-bottom"><span><span className="live-dot" /> Демо-пространство активно</span><span>Демо-режим</span></div>
    </section>

    <div className="metrics-grid">
      <Metric icon={<Wallet />} label="Выручка сегодня" value={money(todayRevenue)} change="За сегодня" note="По текущим заказам" tone="orange" />
      <Metric icon={<ShoppingBag />} label="Заказов сегодня" value={String(todayOrders.length)} change={`${activeOrders.length} в работе`} note={`${completedToday} уже выдано`} tone="peach" />
      <Metric icon={<Users />} label="Гостей в базе" value={String(data.clients.length)} change="Всего гостей" note="В клиентской базе" tone="purple" />
      <Metric icon={<TrendingUp />} label="Средний чек" value={money(averageCheck)} change="За сегодня" note="По неотменённым заказам" tone="blue" />
    </div>

    <div className="dashboard-grid">
      <section className="panel sales-panel">
        <PanelHeader title="Как идут дела" subtitle="Выручка по дням" action={<Segmented value={period} options={['7 дней', '30 дней', '90 дней']} onChange={setPeriod} />} />
        <SalesChart data={week} period={period} />
      </section>
      <section className="panel order-status-panel">
        <PanelHeader title="Заказы сегодня" subtitle="Статусы на одной странице" action={<button className="icon-button" aria-label="Все заказы" onClick={() => onNavigate('Заказы')}><ArrowRight size={16} /></button>} />
        <div className="status-overview">
          <div className="donut-chart" style={{ '--p1': `${todayOrders.filter((order) => order.status === 'Доставлен').length / Math.max(todayOrders.length, 1) * 100}%`, '--p2': `${todayOrders.filter((order) => order.status === 'Готовится').length / Math.max(todayOrders.length, 1) * 100}%` } as CSSProperties}>
            <div><strong>{todayOrders.length}</strong><span>заказов</span></div>
          </div>
          <div className="status-legend">
            <StatusLegend color="green" label="Выдано" count={todayOrders.filter((order) => order.status === 'Доставлен').length} />
            <StatusLegend color="orange" label="Готовятся" count={todayOrders.filter((order) => order.status === 'Готовится').length} />
            <StatusLegend color="yellow" label="Новые и готовы" count={todayOrders.filter((order) => ['Новый', 'Готов'].includes(order.status)).length} />
          </div>
        </div>
        <button className="text-link" onClick={() => onNavigate('Заказы')}>Перейти к заказам <ArrowRight size={14} /></button>
      </section>
      <section className="panel recent-panel">
        <PanelHeader title="Последние заказы" subtitle="Что происходит прямо сейчас" action={<button className="text-link" onClick={() => onNavigate('Заказы')}>Все заказы <ArrowRight size={14} /></button>} />
        {latest.length ? <div className="recent-list">{latest.map((order) => <OrderRow key={order.id} order={order} compact />)}</div> : <EmptyState title="Заказов пока нет" description="Создайте первый заказ, и он появится здесь." />}
      </section>
      <section className="panel tasks-panel">
        <PanelHeader title="На сегодня" subtitle="Небольшие дела для большого вкуса" action={<span className="task-count">{completedTasks}/{data.tasks.length}</span>} />
        <div className="task-list">
          {data.tasks.map((task) => <button className={`task-row ${task.done ? 'task-done' : ''}`} key={task.id} onClick={() => onToggleTask(task.id)}>
            <span className="task-check">{task.done && <Check size={13} />}</span>
            <span className="task-copy"><b>{task.title}</b><small>{task.description}</small></span>
            <time>{task.time}</time>
          </button>)}
        </div>
        <button className="task-add" onClick={onAddTask}><Plus size={14} /> Добавить задачу</button>
      </section>
    </div>

    <section className="growth-banner">
      <div className="growth-icon"><Gift size={20} /></div>
      <div className="growth-copy"><span>ИДЕЯ ДЛЯ РОСТА</span><strong>Гость, который возвращается, — лучший комплимент.</strong><small>Посмотрите, кто давно не заказывал, и напомните о себе приятным предложением.</small></div>
      <button onClick={() => onNavigate('Клиенты')}>Открыть базу гостей <ArrowRight size={15} /></button>
      <span className="growth-emoji" aria-hidden="true">🍟</span>
    </section>
  </>
}

function getPeriodStats(orders: Order[], period: string) {
  const days = period === '90 дней' ? 90 : period === '30 дней' ? 30 : 7
  const bucketSize = days === 7 ? 1 : days === 30 ? 5 : 15
  const bucketCount = days / bucketSize
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const start = new Date(today)
  start.setDate(start.getDate() - days + 1)
  start.setHours(0, 0, 0, 0)
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const from = new Date(start)
    from.setDate(from.getDate() + index * bucketSize)
    const to = new Date(from)
    to.setDate(to.getDate() + bucketSize)
    const amount = orders.filter((order) => {
      const created = new Date(order.createdAt)
      return created >= from && created < to && order.status !== 'Отменён'
    }).reduce((sum, order) => sum + order.total, 0)
    const end = new Date(to)
    end.setDate(end.getDate() - 1)
    const label = days === 7
      ? dayLabel(from)
      : days === 30
        ? `${from.getDate()}–${end.getDate()}`
        : new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(from).replace('.', '')
    return { label, amount }
  })
  const max = Math.max(...buckets.map((item) => item.amount), 1000)
  return buckets.map((item) => ({ ...item, height: Math.max(8, item.amount / max * 100) }))
}

function getCategoryStats(data: AppData) {
  const categories: ProductCategory[] = ['Бургеры', 'Закуски', 'Напитки', 'Десерты']
  const colors: Record<ProductCategory, string> = { Бургеры: 'orange', Закуски: 'sand', Напитки: 'purple', Десерты: 'blue' }
  const totals: Record<ProductCategory, number> = { Бургеры: 0, Закуски: 0, Напитки: 0, Десерты: 0 }

  data.orders.filter((order) => order.status !== 'Отменён').forEach((order) => {
    order.items.split(',').forEach((entry) => {
      const match = entry.trim().match(/^(.*?)\s*[×x]\s*(\d+)$/i)
      const productName = (match?.[1] ?? entry).trim()
      const quantity = Math.max(1, Number(match?.[2]) || 1)
      const product = data.products.find((item) => item.name === productName)
      if (product) totals[product.category] += quantity
    })
  })

  const total = Object.values(totals).reduce((sum, value) => sum + value, 0)
  return categories.map((name) => ({
    name,
    value: total ? Math.round(totals[name] / total * 100) : 0,
    color: colors[name],
  }))
}

function Metric({ icon, label, value, change, note, tone }: { icon: ReactNode; label: string; value: string; change: string; note: string; tone: string }) {
  return <article className="metric-card">
    <div className="metric-top"><span className={`metric-icon ${tone}`}>{icon}</span><span className="metric-label">{label}</span><span className="metric-menu" aria-hidden="true"><MoreHorizontal size={16} /></span></div>
    <strong className="metric-value">{value}</strong>
    <div className="metric-bottom"><span className="metric-change neutral">{change}</span><span className="metric-note">{note}</span></div>
  </article>
}

function PanelHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="panel-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>
}

function Segmented({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return <div className="segmented-control">{options.map((option) => <button key={option} className={value === option ? 'selected' : ''} onClick={() => onChange(option)}>{option}</button>)}</div>
}

function StatusLegend({ color, label, count }: { color: string; label: string; count: number }) {
  return <div className="legend-row"><span className={`legend-dot ${color}`} />{label}<b>{count}</b></div>
}

function SalesChart({ data, period }: { data: Array<{ label: string; amount: number; height: number }>; period: string }) {
  const total = data.reduce((sum, item) => sum + item.amount, 0)
  return <div className="sales-chart">
    <div className="chart-summary"><strong>{money(total)}</strong><span>демонстрационные данные за период</span></div>
    <div className="chart-columns" style={{ gridTemplateColumns: `31px repeat(${data.length}, minmax(0, 1fr))` }}>
      <div className="chart-scale"><span>макс.</span><span>средне</span><span>0 ₽</span></div>
      {data.map((item, index) => <div className="chart-column" key={`${item.label}-${index}`}>
        <div className="chart-bar-wrap"><div className={`chart-bar ${index === data.length - 1 ? 'bar-today' : ''}`} style={{ height: `${item.height}%` }} title={`${item.label}: ${money(item.amount)}`}><span>{money(item.amount)}</span></div></div>
        <small>{item.label}</small>
      </div>)}
    </div>
    <div className="chart-footnote"><span><i /> Выручка</span><span>Период: {period}</span></div>
  </div>
}

function OrderRow({ order, compact = false }: { order: Order; compact?: boolean }) {
  return <div className={`order-row ${compact ? 'compact' : ''}`}>
    <div className="order-avatar">{initials(order.clientName)}</div>
    <div className="order-person"><strong>{order.clientName}</strong><small>{order.id} · {order.channel}</small></div>
    <div className="order-summary"><strong>{order.items}</strong><small>{time(order.createdAt)}</small></div>
    <div className="order-row-end"><b>{money(order.total)}</b><StatusBadge status={order.status} /></div>
  </div>
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const tone: Record<OrderStatus, string> = { Новый: 'new', Готовится: 'cooking', Готов: 'ready', Доставлен: 'done', Отменён: 'cancelled' }
  return <span className={`status-badge ${tone[status]}`}><i />{status}</span>
}

function OrdersPage({ orders, filter, setFilter, onStatus, onNew, onExport }: { orders: Order[]; filter: string; setFilter: (value: string) => void; onStatus: (id: string, status: OrderStatus) => void; onNew: () => void; onExport: () => void }) {
  const filters = ['Все', ...STATUS_OPTIONS]
  return <>
    <PageHeading eyebrow="ВСЁ ПОД КОНТРОЛЕМ" title="Заказы" subtitle="Следите за каждым заказом — от первого клика до выдачи." action={<><button className="button-secondary" onClick={onExport}><Download size={16} /> Выгрузить</button><button className="button-primary" onClick={onNew}><Plus size={17} /> Новый заказ</button></>} />
    <div className="orders-summary-row">
      <div className="summary-tile"><span className="summary-icon orange"><ShoppingBag size={17} /></span><div><small>Всего в списке</small><strong>{orders.length}</strong></div></div>
      <div className="summary-tile"><span className="summary-icon yellow"><Clock3 size={17} /></span><div><small>Новые и готовятся</small><strong>{orders.filter((order) => ['Новый', 'Готовится'].includes(order.status)).length}</strong></div></div>
      <div className="summary-tile"><span className="summary-icon green"><CheckCircle2 size={17} /></span><div><small>Выданы</small><strong>{orders.filter((order) => order.status === 'Доставлен').length}</strong></div></div>
    </div>
    <section className="panel data-panel">
      <div className="table-toolbar"><div className="filter-tabs">{filters.map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><span className="table-count">Показано: {orders.length}</span></div>
      {orders.length ? <div className="responsive-table"><table className="orders-table"><thead><tr><th>Заказ / гость</th><th>Состав</th><th>Получение</th><th>Время</th><th>Сумма</th><th>Статус</th></tr></thead><tbody>
        {orders.map((order) => <tr key={order.id}>
          <td><div className="table-person"><span className="table-avatar">{initials(order.clientName)}</span><span><b>{order.id}</b><small>{order.clientName}</small></span></div></td>
          <td className="items-cell">{order.items}</td><td><span className="channel-label">{order.channel === 'Доставка' ? <Truck size={14} /> : order.channel === 'В зале' ? <ChefHat size={14} /> : <ShoppingBag size={14} />}{order.channel}</span></td>
          <td className="muted-cell">{time(order.createdAt)}</td><td><b className="table-money">{money(order.total)}</b></td>
          <td><select className={`status-select status-${order.status}`} value={order.status} onChange={(event) => onStatus(order.id, event.target.value as OrderStatus)} aria-label={`Статус заказа ${order.id}`}>{STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}</select></td>
        </tr>)}
      </tbody></table></div> : <EmptyState title="Ничего не нашлось" description="Попробуйте изменить фильтр или поисковый запрос." />}
    </section>
    <p className="demo-disclaimer">Это демонстрационные заказы. Изменения сохраняются только в локальном хранилище текущего браузера.</p>
  </>
}

function ClientsPage({ clients, onNew, onEdit, onExport }: { clients: Client[]; onNew: () => void; onEdit: (client: Client) => void; onExport: () => void }) {
  const totalSpent = clients.reduce((sum, client) => sum + client.spent, 0)
  const totalOrders = clients.reduce((sum, client) => sum + client.orders, 0)
  return <>
    <PageHeading eyebrow="ГОСТИ — САМОЕ ВАЖНОЕ" title="Клиенты" subtitle="Помните предпочтения гостей и помогайте им возвращаться." action={<><button className="button-secondary" onClick={onExport}><Download size={16} /> Выгрузить</button><button className="button-primary" onClick={onNew}><Plus size={17} /> Добавить гостя</button></>} />
    <div className="client-stats"><div className="client-stat"><span className="summary-icon purple"><Users size={17} /></span><div><small>Гостей в базе</small><strong>{clients.length}</strong></div><span className="stat-note">Все контакты</span></div><div className="client-stat"><span className="summary-icon orange"><ShoppingCart size={17} /></span><div><small>Заказов всего</small><strong>{totalOrders.toLocaleString('ru-RU')}</strong></div><span className="stat-note">По истории гостей</span></div><div className="client-stat"><span className="summary-icon green"><Wallet size={17} /></span><div><small>Потратили всего</small><strong>{money(totalSpent)}</strong></div><span className="stat-note">Сумма по карточкам</span></div></div>
    <section className="panel data-panel"><div className="table-toolbar"><div><h2>База гостей</h2><p>Контакты и история покупок</p></div><span className="table-count">{clients.length} записей</span></div>
      {clients.length ? <div className="responsive-table"><table className="clients-table"><thead><tr><th>Гость</th><th>Контакты</th><th>Заказов</th><th>Потрачено</th><th>Последний заказ</th><th /></tr></thead><tbody>{clients.map((client, index) => <tr key={client.id}>
        <td><div className="table-person"><span className={`table-avatar avatar-${index % 5}`}>{initials(client.name)}</span><span><b>{client.name}</b><small>{client.note || 'Пока без заметок'}</small></span></div></td>
        <td><span className="contact-cell">{client.phone}<small>{client.email || 'Почта не указана'}</small></span></td><td><b>{client.orders}</b></td><td><b className="table-money">{money(client.spent)}</b></td><td className="muted-cell">{client.lastOrder}</td>
        <td><button className="icon-button table-action" aria-label={`Изменить ${client.name}`} onClick={() => onEdit(client)}><Pencil size={15} /></button></td>
      </tr>)}</tbody></table></div> : <EmptyState title="Пока нет гостей" description="Добавьте первого гостя или очистите поисковый запрос." />}
    </section>
  </>
}

function MenuPage({ products, category, setCategory, onNew, onEdit, onToggle, onDelete }: { products: Product[]; category: string; setCategory: (value: string) => void; onNew: () => void; onEdit: (product: Product) => void; onToggle: (id: string) => void; onDelete: (product: Product) => void }) {
  const categories = ['Все', 'Бургеры', 'Закуски', 'Напитки', 'Десерты']
  return <>
    <PageHeading eyebrow="ВКУС — ЭТО ГЛАВНОЕ" title="Наше меню" subtitle="Добавляйте блюда, меняйте цены и следите за наличием." action={<button className="button-primary" onClick={onNew}><Plus size={17} /> Добавить блюдо</button>} />
    <div className="menu-toolbar"><div className="menu-count"><span className="chef-icon"><ChefHat size={18} /></span><span>В меню <b>{products.length} позиций</b></span></div><div className="menu-updated"><span className="live-dot" /> Демо-меню · изменения сохраняются</div></div>
    <div className="filter-tabs menu-category-tabs">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
    {products.length ? <div className="product-grid">{products.map((product) => <article className={`product-card ${!product.available ? 'product-unavailable' : ''}`} key={product.id}>
      <div className={`product-illustration category-${product.category}`}><span>{product.emoji}</span><small>{product.category}</small><div className="product-card-actions"><button className="icon-button" aria-label="Изменить блюдо" onClick={() => onEdit(product)}><Pencil size={14} /></button><button className="icon-button" aria-label="Удалить блюдо" onClick={() => onDelete(product)}><Trash2 size={14} /></button></div></div>
      <div className="product-details"><strong>{product.name}</strong><p>{product.description}</p><div className="product-bottom"><b>{money(product.price)}</b><button className={`availability ${product.available ? 'available' : ''}`} onClick={() => onToggle(product.id)}><i />{product.available ? 'В продаже' : 'Нет в наличии'}</button></div></div>
    </article>)}</div> : <EmptyState title="В этой категории пока пусто" description="Добавьте новое блюдо или выберите другую категорию." />}
  </>
}

function AnalyticsPage({ data, period, setPeriod, onExport }: { data: AppData; period: string; setPeriod: (value: string) => void; onExport: () => void }) {
  const nonCancelled = data.orders.filter((order) => order.status !== 'Отменён')
  const revenue = nonCancelled.reduce((sum, order) => sum + order.total, 0)
  const average = nonCancelled.length ? revenue / nonCancelled.length : 0
  const weekly = getPeriodStats(data.orders, period)
  const categoryStats = getCategoryStats(data)
  return <>
    <PageHeading eyebrow="ЦИФРЫ БЕЗ СЛОЖНОСТЕЙ" title="Аналитика" subtitle="Понятная картина бизнеса — без бесконечных таблиц." action={<><Segmented value={period} options={['7 дней', '30 дней', '90 дней']} onChange={setPeriod} /><button className="button-secondary" onClick={onExport}><Download size={16} /> Выгрузить</button></>} />
    <div className="analytics-metrics"><Metric icon={<Wallet />} label="Выручка за всё время" value={money(revenue)} change="Демо-данные" note="Без отменённых заказов" tone="orange" /><Metric icon={<ShoppingBag />} label="Заказов в истории" value={String(nonCancelled.length)} change="За весь период" note="Без отменённых" tone="peach" /><Metric icon={<Wallet />} label="Средний чек" value={money(average)} change="По всей истории" note="Без отменённых заказов" tone="purple" /></div>
    <div className="analytics-grid"><section className="panel analytics-chart-panel"><PanelHeader title="Динамика выручки" subtitle="По дням на основе демонстрационной истории" action={<span className="chart-period-label">{period}</span>} /><SalesChart data={weekly} period={period} /></section><section className="panel category-panel"><PanelHeader title="Что выбирают гости" subtitle="Доля позиций в заказах" /><div className="category-bars">{categoryStats.map((item) => <div className="category-progress" key={item.name}><div><span>{item.name}</span><b>{item.value}%</b></div><i><span className={item.color} style={{ width: `${item.value}%` }} /></i></div>)}</div><div className="analytics-note"><Activity size={15} /> Распределение рассчитывается по составу заказов, кроме отменённых.</div></section></div>
    <div className="insight-strip"><span className="insight-icon"><Zap size={18} /></span><div><b>Небольшая подсказка</b><p>Отслеживайте не только выручку, но и повторные заказы: постоянные гости помогают бизнесу расти устойчивее.</p></div></div>
  </>
}

function PromotionsPage({ promotions, onNew, onToggle, onToast }: { promotions: Promotion[]; onNew: () => void; onToggle: (id: string) => void; onToast: (message: string) => void }) {
  return <>
    <PageHeading eyebrow="ПОВОД ВЕРНУТЬСЯ" title="Акции и забота" subtitle="Небольшие приятности превращают гостей в постоянных клиентов." action={<button className="button-primary" onClick={onNew}><Plus size={17} /> Новая акция</button>} />
    <div className="promo-intro-grid"><div className="promo-hero-card"><div className="promo-hero-art">🍔</div><span className="promo-kicker">АКЦИЯ НЕДЕЛИ</span><h2>Больше вкуса — больше поводов вернуться</h2><p>Пробуйте небольшие предложения, наблюдайте за откликом гостей и оставляйте только то, что работает.</p><button onClick={onNew}>Придумать предложение <ArrowRight size={15} /></button></div><div className="loyalty-card"><span className="loyalty-icon"><Gift size={20} /></span><span className="promo-kicker">ИДЕЯ ДЛЯ ПОСТОЯННЫХ ГОСТЕЙ</span><h2>Каждый пятый заказ — с приятным бонусом</h2><p>Пример программы лояльности для тех, кто выбирает вас снова.</p><button className="button-secondary" onClick={() => onToast('Идея сохранена в демонстрационном списке акций')}>Сохранить идею</button></div></div>
    <section className="panel campaign-panel"><PanelHeader title="Ваши предложения" subtitle="Включайте и приостанавливайте акции одним нажатием" action={<span className="table-count">{promotions.filter((item) => item.enabled).length} активны</span>} />
      {promotions.map((promotion) => <div className="campaign-row" key={promotion.id}><span className="campaign-emoji">{promotion.discount >= 10 ? '🍔' : '💛'}</span><div className="campaign-copy"><strong>{promotion.title}</strong><small>{promotion.description}</small><em>{promotion.audience} · скидка {promotion.discount}%</em></div><span className={`campaign-state ${promotion.enabled ? 'is-on' : ''}`}><i />{promotion.enabled ? 'Активна' : 'На паузе'}</span><button className={`toggle ${promotion.enabled ? 'on' : ''}`} aria-label={`${promotion.enabled ? 'Отключить' : 'Включить'} акцию ${promotion.title}`} onClick={() => onToggle(promotion.id)}><i /></button></div>)}
      {!promotions.length && <EmptyState title="Акций пока нет" description="Создайте первое предложение для гостей." />}
    </section>
  </>
}

function SettingsPage({ dark, setDark, onBackup, onReset, onToast, storageWarning }: { dark: boolean; setDark: (value: boolean) => void; onBackup: () => void; onReset: () => void; onToast: (message: string) => void; storageWarning: boolean }) {
  return <>
    <PageHeading eyebrow="ПРОСТО И ПОНЯТНО" title="Настройки" subtitle="Настройте рабочее пространство и сохранность данных." />
    <div className="settings-grid">
      <section className="panel settings-panel"><PanelHeader title="Внешний вид" subtitle="Выберите атмосферу рабочего пространства" />
        <div className="setting-row"><span className="setting-symbol"><Moon size={18} /></span><div><strong>Тёмная тема</strong><small>Тёплый шоколадный фон и янтарные акценты</small></div><button className={`toggle ${dark ? 'on' : ''}`} onClick={() => setDark(true)} aria-label="Включить тёмную тему"><i /></button></div>
        <div className="setting-row"><span className="setting-symbol"><Sun size={18} /></span><div><strong>Светлая тема</strong><small>Мягкая светлая палитра для дневной работы</small></div><button className={`toggle ${!dark ? 'on' : ''}`} onClick={() => setDark(false)} aria-label="Включить светлую тему"><i /></button></div>
      </section>
      <section className="panel settings-panel"><PanelHeader title="Данные и резервные копии" subtitle="Управляйте демонстрационными данными" />
        <div className="setting-row"><span className="setting-symbol"><FileJson size={18} /></span><div><strong>Скачать резервную копию</strong><small>Заказы, гости, меню, задачи и акции в JSON</small></div><button className="button-secondary compact-button" onClick={onBackup}><Download size={14} /> Скачать</button></div>
        <div className="setting-row"><span className="setting-symbol"><Package size={18} /></span><div><strong>Вернуть демо-данные</strong><small>Заменить изменения исходным примером</small></div><button className="text-link danger-link" onClick={onReset}>Сбросить</button></div>
      </section>
      <section className="panel settings-panel"><PanelHeader title="О заведении" subtitle="Информация для демонстрации интерфейса" />
        <div className="setting-row"><span className="setting-symbol"><Home size={18} /></span><div><strong>Бургерная</strong><small>Демонстрационная точка · адрес не указан</small></div><span className="read-only-label">Демо</span></div>
        <div className="setting-row"><span className="setting-symbol"><Clock3 size={18} /></span><div><strong>Часы работы</strong><small>Ежедневно, 10:00–23:00</small></div><button className="text-link" onClick={() => onToast('Настройки графика добавят на следующем этапе')}>Подробнее</button></div>
      </section>
      <section className="panel settings-panel"><PanelHeader title="Прототип и приватность" subtitle="Что важно знать перед публикацией" />
        {storageWarning && <div className="privacy-warning" role="alert">Браузер запретил локальное хранилище. Изменения доступны до закрытия вкладки, но не сохраняются после перезапуска.</div>}
        <div className="privacy-note"><span><CheckCircle2 size={17} /></span><div><strong>Демонстрационные данные</strong><p>Все имена, контакты, заказы и показатели вымышлены. Данные хранятся только в localStorage этого браузера.</p></div></div>
        <div className="privacy-note"><span><CircleHelp size={17} /></span><div><strong>Нет серверной части</strong><p>Авторизация, роли, синхронизация между устройствами и подключение к кассе пока не реализованы.</p></div></div>
      </section>
    </div>
  </>
}

function AppModal({ modal, products, onClose, onSubmit }: { modal: Exclude<ModalState, null>; products: Product[]; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const title = modal.type === 'order' ? 'Новый заказ' : modal.type === 'client' ? (modal.client ? 'Карточка гостя' : 'Новый гость') : modal.type === 'product' ? (modal.product ? 'Изменить блюдо' : 'Новое блюдо') : modal.type === 'promotion' ? 'Новая акция' : 'Новая задача'
  const submitLabel = modal.type === 'order' ? 'Создать заказ' : modal.type === 'client' ? (modal.client ? 'Сохранить' : 'Добавить гостя') : modal.type === 'product' ? (modal.product ? 'Сохранить блюдо' : 'Добавить в меню') : modal.type === 'promotion' ? 'Создать акцию' : 'Добавить задачу'

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-header"><div><span className="modal-kicker">БУРГЕРНАЯ</span><h2 id="modal-title">{title}</h2><p>{modal.type === 'order' ? 'Заполните только самое нужное — остальное можно добавить позже.' : 'Все поля можно изменить после создания.'}</p></div><button className="icon-button" aria-label="Закрыть" onClick={onClose}><X size={18} /></button></div>
      <form className="modal-form" onSubmit={onSubmit}>
        {modal.type === 'order' && <>
          <label>Имя гостя<input name="clientName" autoFocus required placeholder="Например, Алексей Смирнов" /></label>
          <label>Телефон <span className="optional">необязательно</span><input name="phone" placeholder="+7 (999) 000-00-00" /></label>
          <div className="form-two-columns"><label>Блюдо<select name="productId" required defaultValue={products[0]?.id ?? ''}>{products.map((product) => <option value={product.id} key={product.id}>{product.name} — {money(product.price)}</option>)}</select></label><label>Количество<input name="quantity" type="number" min="1" max="99" defaultValue="1" required /></label></div>
          <label>Как получит заказ?<select name="channel" defaultValue="Самовывоз"><option>Самовывоз</option><option>Доставка</option><option>В зале</option></select></label>
          {!products.length && <p className="form-hint">Сначала добавьте хотя бы одно блюдо в меню.</p>}
        </>}
        {modal.type === 'client' && <>
          <label>Имя и фамилия<input name="name" autoFocus required defaultValue={modal.client?.name ?? ''} placeholder="Например, Алексей Смирнов" /></label>
          <label>Номер телефона<input name="phone" required defaultValue={modal.client?.phone ?? ''} placeholder="+7 (999) 000-00-00" /></label>
          <label>Электронная почта <span className="optional">необязательно</span><input name="email" type="email" defaultValue={modal.client?.email ?? ''} placeholder="name@example.com" /></label>
          <label>Заметка <span className="optional">необязательно</span><textarea name="note" rows={3} defaultValue={modal.client?.note ?? ''} placeholder="Предпочтения, любимые блюда…" /></label>
        </>}
        {modal.type === 'product' && <>
          <label>Название блюда<input name="name" autoFocus required defaultValue={modal.product?.name ?? ''} placeholder="Например, Бургер с беконом" /></label>
          <div className="form-two-columns"><label>Категория<select name="category" defaultValue={modal.product?.category ?? 'Бургеры'}><option>Бургеры</option><option>Закуски</option><option>Напитки</option><option>Десерты</option></select></label><label>Цена, ₽<input name="price" type="number" min="1" required defaultValue={modal.product?.price ?? 390} /></label></div>
          <label>Описание<textarea name="description" rows={3} defaultValue={modal.product?.description ?? ''} placeholder="Коротко о составе и вкусе" /></label>
        </>}
        {modal.type === 'promotion' && <>
          <label>Название акции<input name="title" autoFocus required placeholder="Например, Счастливые часы" /></label>
          <label>Описание<textarea name="description" rows={3} required placeholder="Что получает гость и на каких условиях" /></label>
          <div className="form-two-columns"><label>Скидка, %<input name="discount" type="number" min="1" max="90" defaultValue="10" required /></label><label>Для кого<select name="audience"><option>Все гости</option><option>Постоянные гости</option><option>Новые гости</option></select></label></div>
        </>}
        {modal.type === 'task' && <>
          <label>Что нужно сделать?<input name="title" autoFocus required placeholder="Например, проверить остатки" /></label>
          <label>Подробности <span className="optional">необязательно</span><textarea name="description" rows={3} placeholder="Короткое пояснение к задаче" /></label>
          <label>Время <span className="optional">необязательно</span><input name="time" type="time" /></label>
        </>}
        <div className="modal-actions"><button type="button" className="button-quiet modal-cancel" onClick={onClose}>Отмена</button><button type="submit" className="button-primary" disabled={modal.type === 'order' && products.length === 0}><Plus size={16} />{submitLabel}</button></div>
      </form>
    </section>
  </div>
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><span><ShoppingBag size={21} /></span><strong>{title}</strong><p>{description}</p></div>
}

export default App
