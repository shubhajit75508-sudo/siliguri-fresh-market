import { create } from "zustand";

interface OtpState {
  phone: string;
  step: "phone" | "verify" | "done";
  setPhone: (phone: string) => void;
  sendCode: () => boolean;
  verifyCode: (code: string) => boolean;
  reset: () => void;
}

export const useOtpStore = create<OtpState>()(
  (set) => ({
    phone: "",
    step: "phone",

    setPhone: (phone) => set({ phone }),

    sendCode: () => {
      set({ step: "verify" });
      return true;
    },

    verifyCode: (code) => {
      if (code) {
        set({ step: "done" });
        return true;
      }
      return false;
    },

    reset: () => set({ phone: "", step: "phone" }),
  })
);
