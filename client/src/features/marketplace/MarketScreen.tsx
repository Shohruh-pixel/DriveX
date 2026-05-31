import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@shared/ui/Layout";
import { Card, CardLight } from "@shared/ui/Card";
import { Button } from "@shared/ui/Button";
import { useToast } from "@shared/ui/Toast";
import { colors } from "@shared/ui/tokens";
import { useCartStore } from "./store";
import { fetchProducts } from "./api";
import type { Product } from "@shared/api/types";

const CATEGORIES = [
  { id: "all", label: "Все", emoji: "🏪" },
  { id: "oils", label: "Масла", emoji: "🛢️" },
  { id: "filters", label: "Фильтры", emoji: "🔘" },
  { id: "brakes", label: "Тормоза", emoji: "🔴" },
  { id: "batteries", label: "АКБ", emoji: "🔋" },
  { id: "tires", label: "Шины", emoji: "⭕" },
  { id: "accessories", label: "Аксессуары", emoji: "✨" },
];

export function MarketScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const { addItem, totalCount } = useCartStore();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", category, query],
    queryFn: () => fetchProducts({ category: category === "all" ? undefined : category, query: query || undefined }),
    staleTime: 3 * 60 * 1000,
  });

  const handleAddToCart = (p: Product) => {
    addItem({ productId: p.id, storeId: p.store_id, title: p.title, price: p.price, imageUrl: p.image_url ?? "" });
    toast.push(`${p.title} добавлен в корзину`, "success");
  };

  return (
    <PageLayout
      title="Маркет"
      headerRight={
        totalCount() > 0 ? (
          <button onClick={() => navigate("/market/cart")} style={{ position: "relative", background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: "12px", padding: "8px 14px", color: colors.white, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
            🛍️ {totalCount()}
          </button>
        ) : undefined
      }
    >
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Поиск */}
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск товаров..."
          style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", color: colors.white, fontSize: "15px", outline: "none", boxSizing: "border-box" }}
        />

        {/* Категории */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}>
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              style={{ flexShrink: 0, padding: "8px 14px", borderRadius: "20px", background: category === cat.id ? colors.neonCyan : "rgba(255,255,255,0.06)", border: category === cat.id ? "none" : "1px solid rgba(255,255,255,0.1)", color: category === cat.id ? colors.black : colors.silver, fontWeight: category === cat.id ? 700 : 500, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Товары */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "32px", color: colors.silver }}>Загрузка...</div>
        ) : products.length === 0 ? (
          <CardLight padding="32px" style={{ textAlign: "center" }}>
            <p style={{ color: colors.silver }}>Товары не найдены</p>
          </CardLight>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={() => handleAddToCart(p)} />
            ))}
          </div>
        )}

      </div>
    </PageLayout>
  );
}

function ProductCard({ product: p, onAddToCart }: { product: Product; onAddToCart: () => void }) {
  return (
    <Card padding="12px" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Фото */}
      <div style={{ aspectRatio: "4/3", borderRadius: "12px", overflow: "hidden", background: "rgba(255,255,255,0.05)", position: "relative" }}>
        {p.image_url ? (
          <img src={p.image_url} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "40px" }}>🔩</div>
        )}
        {p.badge && (
          <span style={{ position: "absolute", top: "8px", left: "8px", background: "rgba(6,182,212,0.9)", color: "#000", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "8px" }}>{p.badge}</span>
        )}
      </div>

      {/* Инфо */}
      <div style={{ flex: 1 }}>
        <p style={{ color: colors.white, fontWeight: 600, fontSize: "13px", margin: "0 0 6px", lineHeight: 1.3 }}>{p.title}</p>
        {p.rating > 0 && (
          <p style={{ color: colors.silver, fontSize: "11px", margin: "0 0 8px" }}>⭐ {p.rating} ({p.reviews_count})</p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: colors.neonCyan, fontWeight: 800, fontSize: "15px" }}>{p.price} сом.</span>
          {p.old_price && <span style={{ color: colors.silver, fontSize: "12px", textDecoration: "line-through" }}>{p.old_price}</span>}
        </div>
      </div>

      <Button size="sm" fullWidth onClick={onAddToCart} disabled={p.stock_qty === 0}>
        {p.stock_qty === 0 ? "Нет в наличии" : "В корзину"}
      </Button>
    </Card>
  );
}
