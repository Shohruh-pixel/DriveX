import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@shared/ui/Layout";
import { Card, CardLight } from "@shared/ui/Card";
import { Button } from "@shared/ui/Button";
import { Input, Select } from "@shared/ui/Input";
import { useToast } from "@shared/ui/Toast";
import { colors } from "@shared/ui/tokens";
import { useAuthStore } from "@features/auth/store";
import { fetchDocuments, uploadDocument } from "./api";
import type { Car, Document } from "@shared/api/types";

// ── Экран гаража ──────────────────────────────────────────────────────────

export function GarageScreen() {
  const { session, cars, activeCarId, addCar, setActiveCarId } = useAuthStore();
  const [showAdd, setShowAdd] = useState(false);
  const navigate = useNavigate();

  return (
    <PageLayout title="Мой гараж" backPath="/">
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>

        {/* Список машин */}
        {cars.map((car) => (
          <Card
            key={car.id}
            glow={activeCarId === car.id ? "cyan" : "none"}
            onClick={() => setActiveCarId(car.id)}
            style={{ cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ fontSize: "40px" }}>🚗</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: colors.white, fontWeight: 700, margin: "0 0 4px", fontSize: "16px" }}>
                  {car.make} {car.model}
                </p>
                <p style={{ color: colors.silver, fontSize: "13px", margin: 0 }}>
                  {car.year} {car.plate ? `• ${car.plate}` : ""} {car.mileage ? `• ${car.mileage.toLocaleString()} км` : ""}
                </p>
              </div>
              {activeCarId === car.id && (
                <span style={{ color: colors.neonCyan, fontSize: "12px", fontWeight: 700, background: "rgba(6,182,212,0.12)", padding: "4px 10px", borderRadius: "20px" }}>Активна</span>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
              <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); navigate(`/garage/docs/${car.id}`); }} style={{ flex: 1 }}>📄 Документы</Button>
              <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); navigate(`/garage/maintenance/${car.id}`); }} style={{ flex: 1 }}>🔧 История ТО</Button>
            </div>
          </Card>
        ))}

        {cars.length === 0 && (
          <CardLight padding="32px" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🚗</div>
            <p style={{ color: colors.silver, fontSize: "14px" }}>Гараж пуст. Добавьте первый автомобиль.</p>
          </CardLight>
        )}

        <Button fullWidth size="lg" variant="secondary" onClick={() => setShowAdd(!showAdd)}>
          + Добавить автомобиль
        </Button>

        {showAdd && <AddCarForm onAdd={(car) => { addCar(car); setShowAdd(false); }} />}
      </div>
    </PageLayout>
  );
}

// ── Форма добавления авто ─────────────────────────────────────────────────

const CAR_MAKES = ["Toyota","Chevrolet","Hyundai","Kia","BMW","Mercedes","Daewoo","Другое"];
const CAR_MODELS: Record<string, string[]> = {
  Toyota:    ["Camry","Corolla","RAV4","Land Cruiser","Prius"],
  Chevrolet: ["Cobalt","Nexia","Lacetti","Captiva"],
  Hyundai:   ["Elantra","Tucson","Accent","Santa Fe"],
  Kia:       ["Rio","Sportage","Ceed","K5"],
  BMW:       ["3 Series","5 Series","X5","X6"],
  Mercedes:  ["C-Class","E-Class","GLE"],
  Daewoo:    ["Matiz","Nexia","Lacetti"],
  Другое:    ["Другая модель"],
};

function AddCarForm({ onAdd }: { onAdd: (car: Car) => void }) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plate, setPlate] = useState("");
  const toast = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!make || !model) { toast.push("Выберите марку и модель", "error"); return; }
    onAdd({ id: `car-${Date.now()}`, make, model, year, plate, addedAt: new Date().toISOString() });
    toast.push("Автомобиль добавлен!", "success");
  };

  return (
    <Card glow="cyan" padding="20px">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <Select label="Марка" value={make} onChange={(e) => { setMake(e.target.value); setModel(""); }}
            options={[{ value: "", label: "Выбрать..." }, ...CAR_MAKES.map((m) => ({ value: m, label: m }))]} />
          <Select label="Модель" value={model} onChange={(e) => setModel(e.target.value)} disabled={!make}
            options={[{ value: "", label: "Выбрать..." }, ...(CAR_MODELS[make] ?? []).map((m) => ({ value: m, label: m }))]} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <Input label="Год" type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2019" min="1990" max={String(new Date().getFullYear())} />
          <Input label="Госномер" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="TJ 0000 AB" />
        </div>
        <Button type="submit" fullWidth>Добавить</Button>
      </form>
    </Card>
  );
}

// ── Документы авто ────────────────────────────────────────────────────────

export function CarDocumentsScreen({ carId }: { carId: string }) {
  const { session, cars } = useAuthStore();
  const car = cars.find((c) => c.id === carId);
  const toast = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingType, setUploadingType] = useState<Document["doc_type"] | null>(null);

  const { data: docs = [] } = useQuery({
    queryKey: ["docs", session.id, carId],
    queryFn: () => fetchDocuments(session.id),
    enabled: session.authenticated,
  });

  const uploadMut = useMutation({
    mutationFn: async ({ type, file }: { type: Document["doc_type"]; file: File }) => {
      return uploadDocument(session.id, carId, type, file);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["docs", session.id] });
      toast.push("Документ загружен", "success");
    },
    onError: (err) => toast.push((err as Error).message, "error"),
  });

  const carDocs = docs.filter((d) => d.car_id === carId);
  const docTypes: Array<{ type: Document["doc_type"]; label: string; emoji: string }> = [
    { type: "registration", label: "Техпаспорт", emoji: "📋" },
    { type: "inspection",   label: "Техосмотр",  emoji: "🔍" },
    { type: "insurance",    label: "Страховка",   emoji: "🛡️" },
  ];

  return (
    <PageLayout title={`Документы: ${car?.make} ${car?.model}`} backPath="/garage">
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {docTypes.map(({ type, label, emoji }) => {
          const existing = carDocs.find((d) => d.doc_type === type);
          return (
            <Card key={type} padding="16px">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "32px" }}>{emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: colors.white, fontWeight: 600, margin: "0 0 4px" }}>{label}</p>
                  <p style={{ color: existing ? colors.success : colors.silver, fontSize: "13px", margin: 0 }}>
                    {existing ? `✓ Загружен ${existing.created_at.slice(0,10)}` : "Не загружен"}
                  </p>
                </div>
                <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadMut.mutate({ type, file });
                    e.target.value = "";
                  }}
                />
                <Button size="sm" variant={existing ? "ghost" : "secondary"} loading={uploadMut.isPending && uploadingType === type}
                  onClick={() => { setUploadingType(type); fileRef.current?.click(); }}>
                  {existing ? "Обновить" : "Загрузить"}
                </Button>
              </div>
              {existing && (
                <img src={existing.file_url} alt={label} style={{ width: "100%", borderRadius: "12px", marginTop: "12px", maxHeight: "200px", objectFit: "cover" }} />
              )}
            </Card>
          );
        })}
      </div>
    </PageLayout>
  );
}
