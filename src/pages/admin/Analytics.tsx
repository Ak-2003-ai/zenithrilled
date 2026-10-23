import { useAnalytics } from '../../lib/hooks'
import { DayBars, EmptyState, HBars, Spinner, fmtMoney } from '../../components/ui'

export default function Analytics() {
  const { data, loading } = useAnalytics()

  if (loading) return <Spinner label="Crunching the numbers" />
  if (!data) return null

  const top = data.topProducts.map((t) => ({ name: t.name, value: t.sold }))
  const dayOrderTotals = data.last14Days.reduce((s, d) => s + d.orders, 0)

  return (
    <>
      <div className="head-row">
        <div>
          <h1 className="page-title">What's selling</h1>
          <p className="page-sub">
            Sales across all time, and a look at the last two weeks. Cancelled orders are left out of revenue.
          </p>
        </div>
      </div>

      <div className="tiles section-gap">
        <div className="tile">
          <div className="tile-num">{data.totalOrders}</div>
          <div className="tile-label">Orders, all time</div>
        </div>
        <div className="tile">
          <div className="tile-num">{data.totalItems}</div>
          <div className="tile-label">Pieces sold</div>
        </div>
        <div className="tile">
          <div className="tile-num">{fmtMoney(data.revenue)}</div>
          <div className="tile-label">Revenue, all time</div>
        </div>
        <div className="tile">
          <div className="tile-num">{dayOrderTotals}</div>
          <div className="tile-label">Orders in the last 14 days</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <div className="panel chart-card">
          <div className="chart-title">Orders, last 14 days</div>
          <div className="chart-sub">Bars are orders; the number above each bar is the count.</div>
          <DayBars days={data.last14Days} />
        </div>

        <div className="panel chart-card">
          <div className="chart-title">Most sold pieces</div>
          <div className="chart-sub">Units sold per product, all time.</div>
          {top.length === 0 ? (
            <EmptyState title="No sales yet" body="Once an order comes through, the leaders show up here." />
          ) : (
            <HBars rows={top} />
          )}
        </div>
      </div>

      <div className="panel chart-card section-gap">
        <div className="chart-title">Orders by status</div>
        <div className="chart-sub">Where every order is sitting right now.</div>
        <HBars
          rows={[
            { name: 'New', value: data.byStatus.new },
            { name: 'In progress', value: data.byStatus.in_progress },
            { name: 'Shipped', value: data.byStatus.shipped },
            { name: 'Delivered', value: data.byStatus.delivered },
            { name: 'Cancelled', value: data.byStatus.cancelled },
          ].filter((r) => r.value > 0)}
        />
      </div>
    </>
  )
}
