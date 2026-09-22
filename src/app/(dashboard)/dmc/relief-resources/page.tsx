"use client";

import React, { useState } from "react";
import { Boxes, MinusCircle, CheckCircle2 } from "lucide-react";

export default function ReliefResourcesPage() {
  const [stock, setStock] = useState(500);
  const [deductQty, setDeductQty] = useState(50);
  const [success, setSuccess] = useState(false);

  const handleDistribute = async () => {
    try {
      const res = await fetch("/api/relief-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId: "RES-FOOD-01", quantity: deductQty, district: "Colombo" }),
      });
      if (res.ok) {
        setStock((prev) => Math.max(0, prev - deductQty));
        setSuccess(true);
      }
    } catch {
      alert("Distribution failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Boxes className="w-6 h-6 text-emerald-500" />
          Relief Resource Distribution Hub (Member 4 Stub)
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Scaffold page for Member 4. Track central warehouse inventory stock and log distributions.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Resource: Dry Rations Food Packs</h3>
            <span className="text-xs text-slate-400">Colombo Central Warehouse</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Available Stock</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{stock} Packs</span>
          </div>
        </div>

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Successfully logged distribution of {deductQty} packs! Stock updated.</span>
          </div>
        )}

        <div className="flex items-center gap-4 pt-2">
          <input
            type="number"
            min={1}
            max={stock}
            value={deductQty}
            onChange={(e) => setDeductQty(Number(e.target.value))}
            className="w-32 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold font-mono"
          />
          <button
            onClick={handleDistribute}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2"
          >
            <MinusCircle className="w-4 h-4" />
            <span>Distribute & Deduct Stock</span>
          </button>
        </div>
      </div>
    </div>
  );
}
