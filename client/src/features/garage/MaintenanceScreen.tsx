import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@shared/ui/Layout";
import { Card, CardLight } from "@shared/ui/Card";
import { Button } from "@shared/ui/Button";
import { Input, Select } from "@shared/ui/Input";
import { useToast } from "@shared/ui/Toast";
import { colors } from "@shared/ui/tokens";
import { useAuthStore } from "@features/auth/store";
import { fetchMaintenance, saveMaintenance } from "./api";
import type { MaintenanceRecord } from "@shared/api/types";

const TYPES = ["Замена масла","Замена фильтра","Тормозные колодки","Шиномонтаж","Диагностика","ТО плановое","Другое"];

export function MaintenanceScreen() {
  const { carId } = useParams<{ carId?: string }>();
  const { session, cars } = useAuthStore();
  const car = cars.find((c) => c.id === carId) ?? cars[0];
  const toast = useToast();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: records = [] } = useQuery({
    queryKey: ["maintenance", session.id, car?.id],
    queryFn: () => fetchMaintenance(session.id, car?.id ?? ""),
    enabled: !!car?.id && session.authenticated,
  });

  const addMut = useMutation({
    mutationFn: async (rec: Omit<MaintenanceRecord, "id">) => {
      const next = [{ ...rec, id: `maint-${Date.now()}` }, ...records];
      await saveMaintenance(session.id, next);
      return next;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      setShowAdd(false);
      toast.push("Запись добавлена", "success");
    },
    onError: (err) => toast.push((err as Error).message, "error"),
  });

  return (
    <PageLayout title={`ТО: ${car?.make} ${car?.model}`} backPath="/garage">
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <Button fullWidth variant="secondary" onClick={() => setShowAdd(!showAdd)}>+ Добавить запись ТО</Button>

        {showAdd && <AddMaintenanceForm carId={car?.id ?? ""} onAdd={(rec) => addMut.mutate(rec)} loading={addMut.isPending} />}

        {records.length === 0 && !showAdd
          ? <CardLight padding="32px" style={{ textAlign: "center" }}><div style={{ fontSize: "48px", marginBottom: "12px" }}>🔧</div><p style={{ color: colors.silver }}>История ТО пуста</p></CardLight>
          : records.map((r) => (
              <Card key={r.id} padding="14px">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ color: colors.white, fontWeight: 600, margin: "0 0 4px" }}>{r.type}</p>
                    <p style={{ color: colors.silver, fontSize: "13px", margin: "0 0 4px" }}>{r.date}</p>
                    {r.mileage && <p style={{ color: colors.silver, fontSize: "12px", margin: 0 }}>Пробег: {r.mileage.toLocaleString()} км</p>}
                    {r.description && <p style={{ color: colors.silver, fontSize: "12px", margin: "4px 0 0" }}>{r.description}</p>}
                  </div>
                  {r.price > 0 && <p style={{ color: colors.neonCyan, fontWeight: 700, margin: 0, flexShrink: 0 }}>{r.price.toLocaleString()} сом.</p>}
                </div>
              </Card>
            ))
        }
      </div>
    </PageLayout>
  );
}

function AddMaintenanceForm({ carId, onAdd, loading }: { carId: string; onAdd: (r: Omit<MaintenanceRecord,"id">) => void; loading: boolean }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ type: "Замена масла", date: today, mileage: "", price: "", description: "" });
  const f = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Card glow="cyan" padding="20px" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <Select label="Тип работы" value={form.type} onChange={(e) => f("type", e.target.value)} options={TYPES.map((t) => ({ value: t, label: t }))} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <Input label="Дата" type="date" value={form.date} onChange={(e) => f("date", e.target.value)} />
        <Input label="Пробег (км)" type="number" value={form.mileage} onChange={(e) => f("mileage", e.target.value)} placeholder="78000" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <Input label="Стоимость (сом.)" type="number" value={form.price} onChange={(e) => f("price", e.target.value)} placeholder="350" />
        <Input label="Описание" value={form.description} onChange={(e) => f("description", e.target.value)} placeholder="Детали" />
      </div>
      <Button fullWidth loading={loading} onClick={() => onAdd({ car_id: carId, type: form.type, date: form.date, mileage: form.mileage ? Number(form.mileage) : undefined, price: Number(form.price) || 0, description: form.description })}>
        Сохранить
      </Button>
    </Card>
  );
}
