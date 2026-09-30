"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Droplet,
  Package,
  Activity,
  Boxes,
  RefreshCw,
  Truck,
  MapPin,
  Clock,
  Eye,
} from "lucide-react";

interface ResourceItem {
  id: string;
  resourceId?: string;
  name: string;
  owner: string;
  quantity: number;
  unit: string;
  status: "Available" | "Low stock";
  category?: string;
  icon: "water" | "food" | "medicine";
}

interface RawResource {
  _id?: string;
  resourceId?: string;
  name: string;
  district?: string;
  quantity?: number;
  unit?: string;
  minimumThreshold?: number;
  category?: string;
}

export interface DispatchedOrder {
  id: string;
  destination: string;
  resources: string;
  agencyTeam: string;
  eta: string;
  status: "IN_TRANSIT" | "DISPATCHED" | "DELIVERED";
  lastLocation: string;
}

const DEFAULT_RESOURCES: ResourceItem[] = [
  {
    id: "res-1",
    resourceId: "RES-WATER-01",
    name: "Water",
    owner: "Government",
    quantity: 5000,
    unit: "units",
    status: "Available",
    category: "WATER",
    icon: "water",
  },
  {
    id: "res-2",
    resourceId: "RES-FOOD-01",
    name: "Food",
    owner: "NGO — Red Cross",
    quantity: 2000,
    unit: "units",
    status: "Available",
    category: "FOOD",
    icon: "food",
  },
  {
    id: "res-3",
    resourceId: "RES-MED-01",
    name: "Medicine",
    owner: "Armed Forces",
    quantity: 800,
    unit: "units",
    status: "Low stock",
    category: "MEDICAL",
    icon: "medicine",
  },
];

const DEFAULT_DISPATCHES: DispatchedOrder[] = [
  {
    id: "DISP-2026-0042",
    destination: "Colombo (Kolonnawa Relief Hub)",
    resources: "Clean Bottled Water (3,000 units), Rations (1,500 packs)",
    agencyTeam: "Sri Lanka Navy & Red Cross Joint Taskforce",
    eta: "~35 mins remaining",
    status: "IN_TRANSIT",
    lastLocation: "Peliyagoda Bridge Intersection",
  },
  {
    id: "DISP-2026-0039",
    destination: "Kalutara (Millaniya District Center)",
    resources: "Clean Bottled Water (2,000 units), Meal Packs (1,000 packs)",
    agencyTeam: "Armed Forces Logistic Wing",
    eta: "~1 hr 20 mins",
    status: "DISPATCHED",
    lastLocation: "Panadura Logistic Hub Checkpoint",
  },
  {
    id: "DISP-2026-0031",
    destination: "Gampaha (Kelaniya Community Shelter)",
    resources: "Emergency Dry Rations (2,500 packs), Hygiene Kits (600)",
    agencyTeam: "Civil Defence Force & Response Squad",
    eta: "Delivered",
    status: "DELIVERED",
    lastLocation: "Kelaniya Community Shelter Gate #1",
  },
];

export default function ReliefResourcesDashboard() {
  const router = useRouter();
  const [resources, setResources] = useState<ResourceItem[]>(DEFAULT_RESOURCES);
  const [dispatches] = useState<DispatchedOrder[]>(DEFAULT_DISPATCHES);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({
    total: 12450,
    available: 8230,
    distributed: 4220,
  });

  useEffect(() => {
    let isMounted = true;
    fetch("/api/relief-resources")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data || !data.resources || data.resources.length === 0) return;
        const mapped: ResourceItem[] = data.resources.map((r: RawResource) => {
          const qty = r.quantity || 0;
          const isLow = qty <= (r.minimumThreshold || 100);
          let iconType: "water" | "food" | "medicine" = "food";
          if (r.category === "WATER" || r.name.toLowerCase().includes("water")) {
            iconType = "water";
          } else if (r.category === "MEDICAL" || r.name.toLowerCase().includes("med")) {
            iconType = "medicine";
          }

          return {
            id: r._id || r.resourceId || ("res-" + Math.random()),
            resourceId: r.resourceId,
            name: r.name,
            owner: r.district ? (r.district + " Secretariat") : "Government",
            quantity: qty,
            unit: r.unit || "units",
            status: isLow ? "Low stock" : "Available",
            category: r.category,
            icon: iconType,
          };
        });

        setResources(mapped.length >= 3 ? mapped : DEFAULT_RESOURCES);
        const sumAvailable = mapped.reduce(
          (acc: number, curr: ResourceItem) => acc + curr.quantity,
          0
        );
        setTotals({
          total: sumAvailable > 0 ? sumAvailable + 4220 : 12450,
          available: sumAvailable > 0 ? sumAvailable : 8230,
          distributed: 4220,
        });
      })
      .catch(() => {
        // Keep initial state on error
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetch("/api/relief-resources")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !data.resources || data.resources.length === 0) return;
        const mapped: ResourceItem[] = data.resources.map((r: RawResource) => {
          const qty = r.quantity || 0;
          const isLow = qty <= (r.minimumThreshold || 100);
          let iconType: "water" | "food" | "medicine" = "food";
          if (r.category === "WATER" || r.name.toLowerCase().includes("water")) {
            iconType = "water";
          } else if (r.category === "MEDICAL" || r.name.toLowerCase().includes("med")) {
            iconType = "medicine";
          }

          return {
            id: r._id || r.resourceId || ("res-" + Math.random()),
            resourceId: r.resourceId,
            name: r.name,
            owner: r.district ? (r.district + " Secretariat") : "Government",
            quantity: qty,
            unit: r.unit || "units",
            status: isLow ? "Low stock" : "Available",
            category: r.category,
            icon: iconType,
          };
        });

        setResources(mapped.length >= 3 ? mapped : DEFAULT_RESOURCES);
      })
      .finally(() => setLoading(false));
  };

  const renderIcon = (iconType: "water" | "food" | "medicine") => {
    switch (iconType) {
      case "water":
        return <Droplet className="w-4 h-4 text-blue-400" />;
      case "food":
        return <Package className="w-4 h-4 text-amber-400" />;
      case "medicine":
        return <Activity className="w-4 h-4 text-red-400" />;
      default:
        return <Boxes className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleDistributeClick = (item: ResourceItem) => {
    router.push(
      "/dmc/relief-resources/create?name=" + encodeURIComponent(item.name) + "&stock=" + item.quantity + "&owner=" + encodeURIComponent(item.owner)
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Relief Resource Dashboard
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor stock levels, initiate distributions, and track dispatched relief convoys in real time.
        </p>
      </div>

      {/* Top Stat Cards Grid (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Resources */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            TOTAL RESOURCES
          </span>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {totals.total.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 block pt-1">
            units across all categories
          </span>
        </div>

        {/* Card 2: Available */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            AVAILABLE
          </span>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {totals.available.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 block pt-1">
            ready to distribute
          </span>
        </div>

        {/* Card 3: Distributed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            DISTRIBUTED
          </span>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {totals.distributed.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 block pt-1">
            sent to districts so far
          </span>
        </div>
      </div>

      {/* Resource Inventory Table Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Resource inventory
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Resources currently registered under the relief program.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            title="Refresh Inventory"
          >
            <RefreshCw className={"w-4 h-4 " + (loading ? "animate-spin" : "")} />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-semibold">
            Loading resource inventory...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">RESOURCE</th>
                  <th className="py-4 px-6">OWNER ORGANIZATION</th>
                  <th className="py-4 px-6">AVAILABLE QUANTITY</th>
                  <th className="py-4 px-6">STATUS</th>
                  <th className="py-4 px-6 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {resources.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Resource Name with Icon */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5 font-bold text-sm text-white">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          {renderIcon(item.icon)}
                        </div>
                        <span>{item.name}</span>
                      </div>
                    </td>

                    {/* Owner Organization */}
                    <td className="py-4 px-6 text-slate-300 font-medium text-xs">
                      {item.owner}
                    </td>

                    {/* Available Quantity */}
                    <td className="py-4 px-6 font-semibold text-slate-200 text-xs">
                      {item.quantity.toLocaleString()} {item.unit}
                    </td>

                    {/* Status Pill */}
                    <td className="py-4 px-6">
                      {item.status === "Available" ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Low stock
                        </span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDistributeClick(item)}
                        className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all active:scale-95"
                      >
                        Distribute
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dispatched Relief Orders & Live Tracking Section */}
      <div id="dispatches" className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Truck className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Dispatched Relief Orders & Live Tracking
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active relief convoys and field distribution operations currently en route to affected areas.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {dispatches.length} Dispatched Order(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">DISPATCH ID</th>
                <th className="py-4 px-6">DESTINATION</th>
                <th className="py-4 px-6">RESOURCES</th>
                <th className="py-4 px-6">AGENCY / TEAM</th>
                <th className="py-4 px-6">ETA</th>
                <th className="py-4 px-6">STATUS</th>
                <th className="py-4 px-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {dispatches.map((dispatch) => (
                <tr
                  key={dispatch.id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  {/* Dispatch ID */}
                  <td className="py-4 px-6 font-mono font-bold text-white">
                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-blue-400" />
                      <span>{dispatch.id}</span>
                    </div>
                  </td>

                  {/* Destination */}
                  <td className="py-4 px-6">
                    <div className="font-semibold text-white flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>{dispatch.destination}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 pl-4">
                      Last: {dispatch.lastLocation}
                    </div>
                  </td>

                  {/* Resources */}
                  <td className="py-4 px-6 text-slate-300 font-medium max-w-xs">
                    {dispatch.resources}
                  </td>

                  {/* Responsible Agency / Team */}
                  <td className="py-4 px-6 text-slate-300">
                    {dispatch.agencyTeam}
                  </td>

                  {/* ETA */}
                  <td className="py-4 px-6 font-mono font-bold text-emerald-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{dispatch.eta}</span>
                    </div>
                  </td>

                  {/* Status Pill */}
                  <td className="py-4 px-6">
                    {dispatch.status === "IN_TRANSIT" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        In Transit
                      </span>
                    ) : dispatch.status === "DISPATCHED" ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Dispatched
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Delivered
                      </span>
                    )}
                  </td>

                  {/* Track Dispatch Action Button */}
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() =>
                        router.push("/dmc/relief-resources/track/" + dispatch.id)
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Track Dispatch</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
