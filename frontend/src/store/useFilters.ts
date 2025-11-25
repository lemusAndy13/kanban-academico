import { create } from "zustand";

type FiltersState = {
  q: string;
  labelId: string | number | "";
  assignee: "all" | "me" | number;
  dueBefore: string; // YYYY-MM-DD
  dueAfter: string;  // YYYY-MM-DD
  set: (patch: Partial<Omit<FiltersState, "set">>) => void;
  reset: () => void;
};

export const useFilters = create<FiltersState>((set) => ({
  q: "",
  labelId: "",
  assignee: "all",
  dueBefore: "",
  dueAfter: "",
  set: (patch) => set((s) => ({ ...s, ...patch })),
  reset: () =>
    set({
      q: "",
      labelId: "",
      assignee: "all",
      dueBefore: "",
      dueAfter: "",
    }),
}));

