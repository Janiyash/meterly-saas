"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayButton({
  plan,
  className = "btn btn-line",
  label,
}: {
  plan: "PRO" | "ENTERPRISE";
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function upgradeWithRazorpay() {
    setLoading(true);
    try {
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to create order");
        return;
      }

      const order = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: order.amount,
        currency: "INR",
        order_id: order.id,
        name: "Meterly",
        description: `${plan} Plan`,

        handler: async (response: any) => {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, plan }),
          });

          const data = await verifyRes.json();

          if (!verifyRes.ok) {
            console.error("VERIFY FAILED:", data);
            alert("Payment verification failed");
            return;
          }

          alert("Payment successful — your plan has been updated.");
          router.refresh();
        },

        theme: { color: "#34d399" },
      };

      if (!window.Razorpay) {
        alert("Payment could not start — checkout script hasn't loaded yet. Please try again in a moment.");
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={upgradeWithRazorpay} className={className} disabled={loading}>
      {loading ? "Starting checkout…" : (label ?? `Upgrade to ${plan}`)}
    </button>
  );
}
