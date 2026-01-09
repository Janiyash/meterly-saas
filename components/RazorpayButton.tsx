"use client";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayButton() {
  async function upgradeWithRazorpay() {
    try {
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
      });

      // ✅ IMPORTANT CHECK
      if (!res.ok) {
        const text = await res.text();
        console.error("Order API failed:", text);
        alert("Unable to start payment. Please try again.");
        return;
      }

      const order = await res.json();

      if (!order?.id) {
        alert("Invalid Razorpay order");
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: "Your SaaS",
        description: "PRO Plan",
        handler: () => {
          alert("Payment successful! Plan will activate shortly.");
        },
        theme: {
          color: "#22c55e",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Razorpay error:", error);
      alert("Something went wrong. Please try again.");
    }
  }

  return (
    <button onClick={upgradeWithRazorpay} className="monthly-upgrade-btn">
      Upgrade Plan
    </button>
  );
}
