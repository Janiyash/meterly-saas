                                                                           //
"use client";

import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayButton({
  plan,
}: {
  plan: "PRO" | "ENTERPRISE";
}) {
  const router = useRouter();

  async function upgradeWithRazorpay() {
    const res = await fetch("/api/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });

    if (!res.ok) {
      alert("Failed to create order");
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
          body: JSON.stringify({
            ...response,
            plan, // ✅ SEND PLAN NAME
          }),
        });

        const data = await verifyRes.json();

        if (!verifyRes.ok) {
          console.error("VERIFY FAILED:", data);
          alert("Payment verification failed");
          return;
        }

        alert("Payment successful! Plan updated.");
        router.refresh();
      },

      theme: { color: "#22c55e" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  return (
    <button onClick={upgradeWithRazorpay} className="monthly-upgrade-btn">
      Upgrade to {plan}
    </button>
  );
}
