import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { PageLayout } from "@shared/ui/Layout";
import { Card, CardLight } from "@shared/ui/Card";
import { Button } from "@shared/ui/Button";
import { Input } from "@shared/ui/Input";
import { useToast } from "@shared/ui/Toast";
import { colors } from "@shared/ui/tokens";
import { useCartStore } from "./store";
import { createOrder } from "./api";
import { useAuthStore } from "@features/auth/store";

type DeliveryType = "delivery" | "pickup";

export function CartScreen() {
  const navigate = useNavigate();
  const toast    = useToast();
  const { session } = useAuthStore();
  const { items, setQty, removeItem, clear, totalPrice } = useCartStore();
  const total = totalPrice();

  const [step, setStep]         = useState<"cart" | "checkout" | "payment" | "done">("cart");
  const [delivType, setDelivType] = useState<DeliveryType>("delivery");
  const [address,  setAddress]  = useState("");
  const [phone,    setPhone]    = useState(session.phone || "");
  const [name,     setName]     = useState(session.name  || "");

  const orderMut = useMutation({
    mutationFn: async () => {
      const storeId = items[0]?.storeId ?? "unknown";
      return createOrder({
        store_id: storeId,
        buyer_id: session.id && session.authenticated ? session.id : undefined,
        customer_name: name,
        customer_phone: phone,
        items: items.map((i) => ({ product_id: i.productId, product_title: i.title, quantity: i.quantity, unit_price: i.price })),
        total_amount: total,
        status: "new",
        delivery_type: delivType,
        delivery_address: delivType === "delivery" ? address : "",
        payment_status: "pending",
      });
    },
    onSuccess: () => {
      clear();
      setStep("done");
      toast.push("Заказ оформлен!", "success");
    },
    onError: (err) => toast.push((err as Error).message, "error"),
  });

  if (items.length === 0 && step !== "done") {
    return (
      <PageLayout title="Корзина" backPath="/market">
        <CardLight padding="40px" style={{ margin: "24px 16px", textAlign: "center" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🛍️</div>
          <p style={{ color: colors.silver }}>Корзина пуста</p>
          <Button style={{ marginTop: "16px" }} onClick={() => navigate("/market")}>Перейти в маркет</Button>
        </CardLight>
      </PageLayout>
    );
  }

  if (step === "done") {
    return (
      <PageLayout title="Заказ оформлен" hideNav>
        <div style={{ padding: "40px 24px", textAlign: "center", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: "72px" }}>✅</div>
          <h2 style={{ color: colors.white, margin: 0 }}>Заказ принят!</h2>
          <p style={{ color: colors.silver }}>Продавец свяжется с вами по номеру <strong style={{ color: colors.white }}>{phone}</strong></p>
          <Button fullWidth onClick={() => navigate("/orders")}>Мои заказы</Button>
          <Button fullWidth variant="ghost" onClick={() => navigate("/market")}>Продолжить покупки</Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Корзина" backPath="/market">
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* Список товаров */}
        {step === "cart" && (
          <>
            {items.map((item) => (
              <Card key={item.productId} padding="14px">
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.title} style={{ width: "56px", height: "56px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} />
                    : <div style={{ width: "56px", height: "56px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>🔩</div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: colors.white, fontWeight: 600, fontSize: "14px", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                    <p style={{ color: colors.neonCyan, fontWeight: 700, margin: 0 }}>{(item.price * item.quantity).toLocaleString()} сом.</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <button onClick={() => setQty(item.productId, item.quantity - 1)} style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(255,255,255,0.08)", border: "none", color: colors.white, cursor: "pointer", fontSize: "18px" }}>−</button>
                    <span style={{ color: colors.white, fontWeight: 700, minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                    <button onClick={() => setQty(item.productId, item.quantity + 1)} style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(6,182,212,0.2)", border: "none", color: colors.neonCyan, cursor: "pointer", fontSize: "18px" }}>+</button>
                    <button onClick={() => removeItem(item.productId)} style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(239,68,68,0.12)", border: "none", color: colors.danger, cursor: "pointer", fontSize: "16px" }}>✕</button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Итог */}
            <Card glow="cyan" padding="16px">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ color: colors.silver, margin: 0 }}>Итого ({items.length} позиц.):</p>
                <p style={{ color: colors.white, fontWeight: 800, fontSize: "20px", margin: 0 }}>{total.toLocaleString()} сом.</p>
              </div>
            </Card>

            <Button fullWidth size="lg" onClick={() => setStep("checkout")}>Оформить заказ →</Button>
          </>
        )}

        {/* Оформление */}
        {step === "checkout" && (
          <>
            <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <Input label="Ваше имя" value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя и фамилия" />
              <Input label="Телефон" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+992..." />

              <div>
                <p style={{ color: colors.silver, fontSize: "12px", fontWeight: 600, margin: "0 0 8px" }}>Способ получения</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["delivery", "pickup"] as DeliveryType[]).map((t) => (
                    <button key={t} onClick={() => setDelivType(t)}
                      style={{ flex: 1, padding: "10px", borderRadius: "12px", background: delivType === t ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${delivType === t ? "rgba(6,182,212,0.4)" : "rgba(255,255,255,0.1)"}`, color: delivType === t ? colors.neonCyan : colors.silver, fontWeight: delivType === t ? 700 : 500, cursor: "pointer", fontSize: "14px" }}>
                      {t === "delivery" ? "🚚 Доставка" : "🏪 Самовывоз"}
                    </button>
                  ))}
                </div>
              </div>

              {delivType === "delivery" && (
                <Input label="Адрес доставки" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Улица, дом, квартира" />
              )}
            </Card>

            {/* Итог */}
            <Card glow="cyan" padding="16px">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={{ color: colors.silver, margin: 0 }}>Сумма заказа:</p>
                <p style={{ color: colors.white, fontWeight: 800, fontSize: "20px", margin: 0 }}>{total.toLocaleString()} сом.</p>
              </div>
            </Card>

            <Button fullWidth size="lg" loading={orderMut.isPending}
              disabled={!name.trim() || !phone.trim() || (delivType === "delivery" && !address.trim())}
              onClick={() => orderMut.mutate()}>
              Подтвердить заказ ✓
            </Button>
            <Button fullWidth variant="ghost" onClick={() => setStep("cart")}>← Назад</Button>
          </>
        )}

      </div>
    </PageLayout>
  );
}
