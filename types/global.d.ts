export {};

declare global {
  interface Window {
    __USER_ID__?: string;
    Razorpay: any;
  }
}
