export {};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open(): void;
      on(event: string, cb: (response: unknown) => void): void;
    };
  }
}
