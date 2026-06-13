import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OtpState {
  phone: string;
  step: "phone" | "verify" | "done";
  setPhone: (phone: string) => void;
  sendCode: () => boolean;
  verifyCode: (code: string) => boolean;
  reset: () => void;
}

const MOCK_CODE = "1234";

export const useOtpStore = create<OtpState>()(
  persist(
    (set, get) => ({
      phone: "",
      step: "phone",

      setPhone: (phone) => set({ phone }),

      sendCode: () => {
        set({ step: "verify" });
        return true;
      },

      verifyCode: (code) => {
        if (code === MOCK_CODE) {
          set({ step: "done" });
          return true;
        }
        return false;
      },

      reset: () => set({ phone: "", step: "phone" }),
    }),
    { name: "sfm-otp" }
  )
);
