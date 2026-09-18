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

export function adminActionHasFeedback(state: AdminActionState, pending: boolean) {
  return pending || Boolean(state.message) || Boolean(state.error);
}

export function adminActionShowsSubmit(allowSubmit: boolean, pending: boolean) {
  return allowSubmit || pending;
}

export type FormAccessActionState = AdminActionState & {
  granted: boolean;
};
