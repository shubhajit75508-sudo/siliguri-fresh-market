"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useOrderStore } from "@/store/order-store";
import { useDeliveryStore } from "@/store/delivery-store";
import { Navigation, Eye, X, RotateCcw, Truck, Loader2 } from "lucide-react";

const statusColors: Record<string, "default" | "blue" | "fresh" | "orange"> = {
  received: "default",
  out_for_delivery: "blue",
  delivered: "fresh",
};

export default function AdminOrdersPage() {
  const { orders, loaded, loadOrders, updateStatus, assignDeliveryBoy, approveReturn } = useOrderStore();
  const { assignments } = useDeliveryStore();
  const deliveryBoys = useDeliveryStore((s) => {
    const state = s as { boy: unknown; assignments: unknown[]; loginWithCode: unknown; loginAsBoy: unknown; logout: unknown; confirmDelivery: unknown; setAssignments: unknown };
    return [];
  });
  const [selectedOrder, setSelectedOrder] = useState<typeof orders[number] | null>(null);
  const [returnModal, setReturnModal] = useState<typeof orders[number] | null>(null);
  const [assignModal, setAssignModal] = useState<typeof orders[number] | null>(null);

  useEffect(() => { loadOrders(); }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Orders ({orders.length})</h2>

      <div className="mt-6 overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">Order ID</th>
              <th className="px-4 py-3 font-medium text-gray-500">Customer</th>
              <th className="px-4 py-3 font-medium text-gray-500">Items</th>
              <th className="px-4 py-3 font-medium text-gray-500">Total</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500">Delivery</th>
              <th className="px-4 py-3 font-medium text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{order.id}</td>
                  <td className="px-4 py-3">{order.customerName}</td>
                  <td className="px-4 py-3">{order.items.length}</td>
                  <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={statusColors[order.status] ?? "default"}>
                        {order.status.replace(/_/g, " ")}
                      </Badge>
                      {order.returnRequested && !order.returnApproved && (
                        <Badge variant="orange">
                          <RotateCcw className="mr-1 h-3 w-3" /> Return
                        </Badge>
                      )}
                      {order.returnApproved && (
                        <Badge variant="fresh">Returned</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {order.deliveryBoyId ? (
                      <span className="text-xs text-brand-fresh">
                        <Truck className="mr-1 inline h-3 w-3" />
                        {order.deliveryStatus?.replace(/_/g, " ")}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-lg p-1.5 hover:bg-gray-100"
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </button>
                      {order.status === "received" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setAssignModal(order)}
                        >
                          <Truck className="mr-1 h-3 w-3" /> Assign
                        </Button>
                      )}
                      {order.status !== "delivered" && order.deliveryBoyId && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            const next = order.status === "received" ? "out_for_delivery" : "delivered";
                            updateStatus(order.id, next);
                          }}
                        >
                          {order.status === "out_for_delivery" ? "Complete" : "Dispatch"}
                        </Button>
                      )}
                      {order.status === "delivered" && !order.returnRequested && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReturnModal(order)}
                          className="text-xs"
                        >
                          <RotateCcw className="mr-1 h-3 w-3" /> Return
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <p><span className="text-muted">Customer:</span> {selectedOrder.customerName}</p>
              <p><span className="text-muted">Phone:</span> {selectedOrder.customerPhone}</p>
              <p><span className="text-muted">Address:</span> {selectedOrder.address.line1}, {selectedOrder.address.city} — {selectedOrder.address.pincode}</p>
              {selectedOrder.address.lat && selectedOrder.address.lng && (
                <p>
                  <span className="text-muted">Live Location:</span>{" "}
                  <span className="text-blue-600">{selectedOrder.address.lat}, {selectedOrder.address.lng}</span>
                </p>
              )}
              <p><span className="text-muted">Payment:</span> {selectedOrder.paymentMethod}</p>
              <p><span className="text-muted">Status:</span> {selectedOrder.status.replace(/_/g, " ")}</p>
              <p><span className="text-muted">Delivery:</span> {selectedOrder.deliveryStatus?.replace(/_/g, " ") ?? "Not assigned"}</p>
              <p><span className="text-muted">Total:</span> {formatPrice(selectedOrder.total)}</p>
              <div>
                <span className="text-muted">Products:</span>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  {selectedOrder.items.map((item, i) => (
                    <li key={i}>{item.product.name} × {item.quantity}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              {selectedOrder.status === "received" && (
                <Button variant="default" onClick={() => { setAssignModal(selectedOrder); setSelectedOrder(null); }}>
                  <Truck className="mr-1 h-3 w-3" /> Assign Delivery
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {assignModal && (
        <AssignModal
          order={assignModal}
          onAssign={(boyId, boyName) => {
            assignDeliveryBoy(assignModal.id, boyId, boyName);
            setAssignModal(null);
          }}
          onClose={() => setAssignModal(null)}
        />
      )}

      {returnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setReturnModal(null)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Return Request</h3>
              <button onClick={() => setReturnModal(null)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-3 text-sm text-muted">
              Customer <span className="font-semibold text-brand-dark">{returnModal.customerName}</span> has requested a return for order {returnModal.id}.
            </p>
            <div className="mt-4 rounded-xl bg-surface p-3 text-sm">
              <p className="font-medium">{returnModal.customerName}</p>
              <p className="mt-1 text-muted">{returnModal.customerPhone}</p>
              <p className="text-muted">{returnModal.address.line1}</p>
            </div>
            <div className="mt-4 flex gap-3">
              <Button variant="default" onClick={() => { approveReturn(returnModal.id); setReturnModal(null); }}>
                Approve Return
              </Button>
              <Button variant="outline" onClick={() => setReturnModal(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignModal({ order, onAssign, onClose }: {
  order: { id: string };
  onAssign: (boyId: string, boyName: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [boys, setBoys] = useState<{ id: string; name: string; phone: string; area: string; isActive: boolean }[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sfm-delivery-boys");
      if (raw) setBoys(JSON.parse(raw));
    } catch {}
  }, []);

  const allBoys = boys.filter((b: { isActive: boolean }) => b.isActive !== false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Assign Delivery</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">Order: {order.id}</p>
        {allBoys.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No delivery boys available. Add one in Delivery Boys section.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {allBoys.map((boy: { id: string; name: string; phone: string; area: string }) => (
              <button
                key={boy.id}
                onClick={() => setSelected(boy.id)}
                className={`w-full rounded-xl border p-3 text-left text-sm transition-all ${
                  selected === boy.id ? "border-brand-dark bg-brand-dark/5" : "border-border hover:border-gray-300"
                }`}
              >
                <p className="font-medium">{boy.name}</p>
                <p className="text-muted">{boy.phone} · {boy.area}</p>
              </button>
            ))}
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <Button
            variant="default"
            disabled={!selected}
            onClick={() => {
              const boy = allBoys.find((b: { id: string }) => b.id === selected);
              if (boy) onAssign(boy.id, boy.name);
            }}
          >
            Assign
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}