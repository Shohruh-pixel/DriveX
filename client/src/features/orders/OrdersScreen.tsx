import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@shared/ui/Layout";
import { Card, CardLight } from "@shared/ui/Card";
import { colors } from "@shared/ui/tokens";
import { useAuthStore } from "@features/auth/store";
import { fetchBuyerOrders } from "@features/marketplace/api";
import type { Order } from "@shared/api/types";

const STATUS_LABEL: Record<string, string> = {
  new: "Новый", confirmed: "Подтверждён", delivery: "В доставке",
  pickup_ready: "Готов к выдаче", completed: "Завершён", cancelled: "Отменён",
};
const STATUS_COLOR: Record<string, string> = {
  new: colors.neonCyan, confirmed: colors.electricBlue, delivery: colors.warning,
  pickup_ready: colors.success, completed: colors.success, cancelled: colors.danger,
};

export function OrdersScreen() {
  const { session } = useAuthStore();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["buyer-orders", session.id],
    queryFn: () => fetchBuyerOrders(session.id),
    enabled: session.authenticated,
  });

  if (!session.authenticated) {
    return (
      <PageLayout title="Мои заказы" backPath="/profile">
        <CardLight padding="40px" style={{ margin: "24px 16px", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
          <p style={{ color: colors.silver }}>Войдите чтобы видеть заказы</p>
        </CardLight>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Мои заказы" backPath="/profile">
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {isLoading
          ? <p style={{ color: colors.silver, textAlign: "center", padding: "32px" }}>Загрузка...</p>
          : orders.length === 0
            ? <CardLight padding="40px" style={{ textAlign: "center" }}><div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div><p style={{ color: colors.silver }}>Заказов пока нет</p></CardLight>
            : orders.map((order) => <OrderCard key={order.id} order={order} />)
        }
      </div>
    </PageLayout>
  );
}

function OrderCard({ order }: { order: Order }) {
  const statusColor = STATUS_COLOR[order.status] ?? colors.silver;
  return (
    <Card padding="16px">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div>
          <p style={{ color: colors.white, fontWeight: 700, fontSize: "14px", margin: "0 0 4px" }}>
            Заказ #{order.id.slice(-8).toUpperCase()}
          </p>
          <p style={{ color: colors.silver, fontSize: "12px", margin: 0 }}>
            {new Date(order.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <span style={{ color: statusColor, fontWeight: 700, fontSize: "12px", background: "rgba(255,255,255,0.06)", padding: "4px 10px", borderRadius: "20px" }}>
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      <div style={{ marginBottom: "10px" }}>
        {order.items.map((item) => (
          <p key={item.product_id} style={{ color: colors.silver, fontSize: "13px", margin: "0 0 4px" }}>
            {item.product_title} × {item.quantity} = <strong style={{ color: colors.white }}>{(item.quantity * item.unit_price).toLocaleString()} сом.</strong>
          </p>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px" }}>
        <span style={{ color: colors.silver, fontSize: "13px" }}>
          {order.delivery_type === "pickup" ? "🏪 Самовывоз" : "🚚 Доставка"}
          {order.delivery_address ? ` • ${order.delivery_address}` : ""}
        </span>
        <span style={{ color: colors.neonCyan, fontWeight: 800, fontSize: "16px" }}>
          {order.total_amount.toLocaleString()} сом.
        </span>
      </div>
    </Card>
  );
}
