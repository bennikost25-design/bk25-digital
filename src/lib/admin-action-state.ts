export type AdminActionState = {
  ok: boolean;
  message: string | null;
  error: string | null;
};

export const emptyAdminActionState: AdminActionState = {
  ok: false,
  message: null,
  error: null,
};

export type FormAccessActionState = AdminActionState & {
  granted: boolean;
};
