import React from "react";
import { PageLayout } from "@shared/ui/Layout";
import { CardLight } from "@shared/ui/Card";
import { colors } from "@shared/ui/tokens";

export function FavoritesScreen() {
  return (
    <PageLayout title="Избранное" backPath="/profile">
      <CardLight
        padding="48px"
        style={{ margin: "24px 16px", textAlign: "center" }}
      >
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>⭐</div>
        <p style={{ color: colors.white, fontWeight: 600, marginBottom: "8px" }}>
          Скоро
        </p>
        <p style={{ color: colors.silver, fontSize: "14px" }}>
          Здесь появятся сохранённые сервисы и товары
        </p>
      </CardLight>
    </PageLayout>
  );
}
