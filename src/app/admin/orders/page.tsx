"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useOrderStore } from "@/store/order-store";
import { useDeliveryStore } from "@/store/delivery-store";
import { Eye, X, RotateCcw, Truck, Loader2, CheckCircle, XCircle, MapPin, Phone, User, Package } from "lucide-react";

const statusColors: Record<string, "default" | "blue" | "fresh" | "orange" | "red"> = {
  received: "default",
  out_for_delivery: "blue",
  delivered: "fresh",
  cancelled: "red",
};

const paymentBadge: Record<string, "fresh" | "orange" | "red"> = {
  paid: "fresh",
  unpaid: "orange",
};

const tabs = ["all", "received", "out_for_delivery", "delivered", "cancelled"] as const;

export default function AdminOrdersPage() {
  const { orders, loaded, loadOrders, updateStatus, assignDeliveryBoy, approveReturn, cancelOrder } = useOrderStore();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<typeof orders[number] | null>(null);
  const [returnModal, setReturnModal] = useState<typeof orders[number] | null>(null);
  const [assignModal, setAssignModal] = useState<typeof orders[number] | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const filtered = activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab);

  if (!loaded) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Orders</h2>
          <p className="text-sm text-muted">{orders.length} total · {orders.filter((o) => o.status === "received").length} pending</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors capitalize ${
              activeTab === tab ? "bg-brand-dark text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.replace(/_/g, " ")} ({tab === "all" ? orders.length : orders.filter((o) => o.status === tab).length})
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">Order ID</th>
              <th className="px-4 py-3 font-medium text-gray-500">Customer</th>
              <th className="px-4 py-3 font-medium text-gray-500">Items</th>
              <th className="px-4 py-3 font-medium text-gray-500">Total</th>
              <th className="px-4 py-3 font-medium text-gray-500">Payment</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500">Delivery</th>
              <th className="px-4 py-3 font-medium text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">No orders yet.</td></tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{order.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-xs text-muted">{order.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3">{order.items.reduce((n, i) => n + i.quantity, 0)} items</td>
                  <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs capitalize">{order.paymentMethod}</span>
                      <Badge variant={paymentBadge[order.paymentStatus] ?? "orange"}>
                        {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={statusColors[order.status] ?? "default"}>
                        {order.status.replace(/_/g, " ")}
                      </Badge>
                      {order.returnRequested && !order.returnApproved && (
                        <Badge variant="orange"><RotateCcw className="mr-1 h-3 w-3" /> Return</Badge>
                      )}
                      {order.returnApproved && <Badge variant="fresh">Returned</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {order.deliveryBoyName ? (
                      <div className="text-xs">
                        <p className="text-brand-fresh font-medium"><Truck className="mr-1 inline h-3 w-3" />{order.deliveryBoyName}</p>
                        <p className="text-muted">{order.deliveryStatus?.replace(/_/g, " ")}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setSelectedOrder(order)} className="rounded-lg p-1.5 hover:bg-gray-100" title="View details">
                        <Eye className="h-4 w-4 text-gray-500" />
                      </button>
                      {order.status === "received" && (
                        <>
                          <Button variant="default" size="sm" onClick={() => setAssignModal(order)}>
                            <Truck className="mr-1 h-3 w-3" /> Assign
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setConfirmCancel(order.id)} className="text-brand-red border-brand-red/30 hover:bg-brand-red/5">
                            <XCircle className="mr-1 h-3 w-3" /> Cancel
                          </Button>
                        </>
                      )}
                      {order.status === "out_for_delivery" && (
                        <>
                          <Button variant="default" size="sm" onClick={() => updateStatus(order.id, "delivered")}>
                            <CheckCircle className="mr-1 h-3 w-3" /> Delivered
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setConfirmCancel(order.id)} className="text-brand-red border-brand-red/30 hover:bg-brand-red/5">
                            <XCircle className="mr-1 h-3 w-3" /> Cancel
                          </Button>
                        </>
                      )}
                      {order.status === "delivered" && !order.returnRequested && (
                        <Button variant="outline" size="sm" onClick={() => setReturnModal(order)} className="text-xs">
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

      {/* Cancel confirm modal */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setConfirmCancel(null)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Cancel Order</h3>
            <p className="mt-2 text-sm text-muted">Are you sure you want to cancel order <span className="font-mono font-semibold text-brand-dark">{confirmCancel}</span>?</p>
            <div className="mt-6 flex gap-3">
              <Button variant="default" onClick={() => { cancelOrder(confirmCancel); setConfirmCancel(null); }} className="bg-brand-red hover:bg-brand-red/80">
                <XCircle className="mr-1 h-4 w-4" /> Yes, Cancel
              </Button>
              <Button variant="outline" onClick={() => setConfirmCancel(null)}>No</Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{selectedOrder.id}</h3>
              <button onClick={() => setSelectedOrder(null)} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted" />
                <span className="font-medium">{selectedOrder.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted" />
                <span>{selectedOrder.customerPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted">Email:</span>
                <span>{selectedOrder.customerEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted">Payment:</span>
                <span className="capitalize">{selectedOrder.paymentMethod}</span>
                <Badge variant={paymentBadge[selectedOrder.paymentStatus] ?? "orange"}>
                  {selectedOrder.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted">Status:</span>
                <Badge variant={statusColors[selectedOrder.status] ?? "default"}>
                  {selectedOrder.status.replace(/_/g, " ")}
                </Badge>
              </div>
              {selectedOrder.deliveryBoyName && (
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted" />
                  <span>{selectedOrder.deliveryBoyName}</span>
                  <span className="text-xs text-muted">({selectedOrder.deliveryStatus?.replace(/_/g, " ")})</span>
                </div>
              )}
              <div>
                <span className="text-muted flex items-center gap-1 mb-1"><MapPin className="h-3.5 w-3.5" /> Address:</span>
                <div className="rounded-lg bg-surface p-3 text-xs space-y-0.5">
                  <p>{selectedOrder.address.line1}</p>
                  {selectedOrder.address.area && <p>Area: {selectedOrder.address.area}</p>}
                  {selectedOrder.address.landmark && <p>Near: {selectedOrder.address.landmark}</p>}
                  {selectedOrder.address.building && <p>{selectedOrder.address.building}{selectedOrder.address.flat ? `, Flat ${selectedOrder.address.flat}` : ""}{selectedOrder.address.floor ? `, Floor ${selectedOrder.address.floor}` : ""}</p>}
                  <p>{selectedOrder.address.city} — {selectedOrder.address.pincode}</p>
                  {selectedOrder.address.lat && selectedOrder.address.lng && (
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedOrder.address.lat},${selectedOrder.address.lng}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-brand-blue underline">
                      <MapPin className="h-3 w-3" /> Open in Maps
                    </a>
                  )}
                </div>
              </div>
              <div>
                <span className="text-muted flex items-center gap-1 mb-1"><Package className="h-3.5 w-3.5" /> Products:</span>
                <ul className="space-y-1">
                  {selectedOrder.items.map((item, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
                      <span>{item.product.name}</span>
                      <span className="font-medium">{item.quantity} × {formatPrice(item.product.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm font-bold">
                <span>Total</span>
                <span className="text-brand-dark">{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              {selectedOrder.status === "received" && (
                <>
                  <Button variant="default" onClick={() => { setAssignModal(selectedOrder); setSelectedOrder(null); }}>
                    <Truck className="mr-1 h-3 w-3" /> Assign Delivery
                  </Button>
                  <Button variant="outline" onClick={() => { setConfirmCancel(selectedOrder.id); setSelectedOrder(null); }} className="text-brand-red border-brand-red/30">
                    <XCircle className="mr-1 h-3 w-3" /> Cancel Order
                  </Button>
                </>
              )}
              {selectedOrder.status === "out_for_delivery" && (
                <>
                  <Button variant="default" onClick={() => { updateStatus(selectedOrder.id, "delivered"); setSelectedOrder(null); }}>
                    <CheckCircle className="mr-1 h-3 w-3" /> Mark Delivered
                  </Button>
                  <Button variant="outline" onClick={() => { setConfirmCancel(selectedOrder.id); setSelectedOrder(null); }} className="text-brand-red border-brand-red/30">
                    <XCircle className="mr-1 h-3 w-3" /> Cancel Order
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {assignModal && (
        <AssignModal
          order={assignModal}
          onAssign={async (boyId, boyName, boyEmail) => {
            const result = await assignDeliveryBoy(assignModal.id, boyId, boyName, boyEmail);
            if (result?.assignment) {
              const store = useDeliveryStore.getState();
              store.setAssignments([...store.assignments, result.assignment]);
            }
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
              <button onClick={() => setReturnModal(null)} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-3 text-sm text-muted">Customer <span className="font-semibold text-brand-dark">{returnModal.customerName}</span> has requested a return for order {returnModal.id}.</p>
            <div className="mt-4 rounded-xl bg-surface p-3 text-sm">
              <p className="font-medium">{returnModal.customerName}</p>
              <p className="mt-1 text-muted">{returnModal.customerPhone}</p>
              <p className="text-muted">{returnModal.address.line1}</p>
              {returnModal.address.area && <p className="text-muted">Area: {returnModal.address.area}</p>}
              {returnModal.address.landmark && <p className="text-muted">Near: {returnModal.address.landmark}</p>}
              {returnModal.address.building && <p className="text-muted">{returnModal.address.building}{returnModal.address.flat ? `, Flat ${returnModal.address.flat}` : ""}{returnModal.address.floor ? `, Floor ${returnModal.address.floor}` : ""}</p>}
              <p className="text-muted">{returnModal.address.city} — {returnModal.address.pincode}</p>
            </div>
            <div className="mt-4 flex gap-3">
              <Button variant="default" onClick={() => { approveReturn(returnModal.id); setReturnModal(null); }}>Approve Return</Button>
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
  onAssign: (boyId: string, boyName: string, boyEmail?: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
    const deliveryBoys = useDeliveryStore((s) => s.deliveryBoys);
    const boys = deliveryBoys.map((b) => ({ id: b.id, name: b.name, phone: b.phone ?? "", area: b.area || "", isActive: true, email: b.email }));

  const allBoys = boys.filter((b) => b.isActive !== false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Assign Delivery</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <p className="mt-2 text-sm text-muted">Order: {order.id}</p>
        {allBoys.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No delivery boys available. Add one in Delivery Boys section.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {allBoys.map((boy) => (
              <button key={boy.id} onClick={() => setSelected(boy.id)}
                className={`w-full rounded-xl border p-3 text-left text-sm transition-all ${selected === boy.id ? "border-brand-dark bg-brand-dark/5" : "border-border hover:border-gray-300"}`}>
                <p className="font-medium">{boy.name}</p>
                <p className="text-muted">{boy.phone} · {boy.area}</p>
              </button>
            ))}
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <Button variant="default" disabled={!selected}
            onClick={() => { const boy = allBoys.find((b) => b.id === selected); if (boy) onAssign(boy.id, boy.name, boy.email); }}>
            Assign
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
