"use client";

import { useMemo, useState } from "react";
import { CartItemSelection, MenuItem } from "@/lib/types";
import { priceForSelections, validateSelections, formatGBP } from "@/lib/pricing";

interface ExistingSelection {
  quantity: number;
  selections: CartItemSelection[];
  specialInstructions?: string;
}

interface CustomizerSheetProps {
  item: MenuItem;
  existing?: ExistingSelection;
  onClose: () => void;
  onSubmit: (selections: CartItemSelection[], quantity: number, specialInstructions?: string) => void;
}

export default function CustomizerSheet({ item, existing, onClose, onSubmit }: CustomizerSheetProps) {
  const [selections, setSelections] = useState<CartItemSelection[]>(
    existing?.selections ?? item.modifierGroups.map((g) => ({ groupId: g.groupId, optionIds: [] }))
  );
  const [quantity, setQuantity] = useState(existing?.quantity ?? 1);
  const [notes, setNotes] = useState(existing?.specialInstructions ?? "");
  const [error, setError] = useState<string | null>(null);

  const unitPrice = useMemo(() => priceForSelections(item, selections), [item, selections]);
  const totalPrice = unitPrice * quantity;

  function optionIdsFor(groupId: string) {
    return selections.find((s) => s.groupId === groupId)?.optionIds ?? [];
  }

  function setOptionIds(groupId: string, optionIds: string[]) {
    setSelections((prev) => {
      const next = prev.filter((s) => s.groupId !== groupId);
      next.push({ groupId, optionIds });
      return next;
    });
  }

  function toggleRadio(groupId: string, optionId: string) {
    setOptionIds(groupId, [optionId]);
  }

  function toggleCheckbox(groupId: string, optionId: string, max: number) {
    const current = optionIdsFor(groupId);
    if (current.includes(optionId)) {
      setOptionIds(groupId, current.filter((id) => id !== optionId));
    } else if (current.length < max) {
      setOptionIds(groupId, [...current, optionId]);
    }
  }

  function handleSubmit() {
    const err = validateSelections(item, selections);
    if (err) {
      setError(err);
      return;
    }
    onSubmit(selections, quantity, notes.trim() || undefined);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-black/50"
      />
      <div className="animate-sheet-up relative flex max-h-[85vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-2xl">
        <div className="flex justify-center pt-3">
          <div className="h-1.5 w-10 rounded-full bg-stone-300" />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4 pt-4">
          <div className="flex items-start gap-3">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt=""
                className="size-14 shrink-0 rounded-2xl object-cover shadow-sm"
              />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-600 text-2xl shadow-sm">
                {item.emoji}
              </span>
            )}
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="text-lg font-bold leading-tight text-stone-900">
                {existing ? "Edit" : "Customize"} {item.name}
              </h2>
              <p className="mt-0.5 text-sm text-stone-500">Base Price: {formatGBP(item.basePrice)}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-stone-600">{item.description}</p>

          {item.modifierGroups.map((group) => (
            <div key={group.groupId} className="mt-6">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  {group.title} {group.required && <span className="text-orange-600">(Required)</span>}
                  {!group.required && group.maxSelections > 1 && (
                    <span className="text-stone-400"> (Optional · up to {group.maxSelections})</span>
                  )}
                </span>
              </div>
              <div className="overflow-hidden rounded-lg border border-stone-200">
                {group.options.map((opt, idx) => {
                  const isSingle = group.maxSelections === 1;
                  const selected = optionIdsFor(group.groupId).includes(opt.id);
                  const atMax = !isSingle && optionIdsFor(group.groupId).length >= group.maxSelections;
                  return (
                    <label
                      key={opt.id}
                      className={`tap-target flex items-center justify-between gap-3 px-4 py-3 transition-colors ${
                        idx !== 0 ? "border-t border-stone-200" : ""
                      } ${selected ? "bg-orange-50" : "bg-stone-50"}`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type={isSingle ? "radio" : "checkbox"}
                          name={group.groupId}
                          checked={selected}
                          disabled={!selected && atMax}
                          onChange={() =>
                            isSingle
                              ? toggleRadio(group.groupId, opt.id)
                              : toggleCheckbox(group.groupId, opt.id, group.maxSelections)
                          }
                          className="size-4 accent-orange-600"
                        />
                        <span className={selected ? "font-medium text-stone-900" : "text-stone-800"}>
                          {opt.name}
                        </span>
                      </span>
                      {opt.price > 0 && (
                        <span className="text-sm text-stone-500">+{formatGBP(opt.price)}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-6">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Special Instructions
            </span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. sauce on the side..."
              className="tap-target w-full rounded-xl border border-stone-300 px-3.5 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Quantity</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="tap-target tap-press rounded-full border border-stone-300 text-lg font-semibold text-stone-700"
              >
                −
              </button>
              <span className="w-6 text-center font-semibold text-stone-900">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                className="tap-target tap-press rounded-full border border-stone-300 text-lg font-semibold text-stone-700"
              >
                +
              </button>
            </div>
          </div>

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <div className="safe-bottom border-t border-stone-200 bg-white px-6 pt-4">
          <button
            onClick={handleSubmit}
            className="tap-target tap-press w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-orange-900/20"
          >
            {existing ? "Save Changes" : "Add to Order"} · {formatGBP(totalPrice)}
          </button>
        </div>
      </div>
    </div>
  );
}
