export type AuthMode = "login" | "signup"
export type FeedbackType = "error" | "success" | "info"

export interface AuthFeedback {
  type: FeedbackType
  message: string
  action?: { label: string; onClick: () => void }
}

export const DEFAULT_FORM = {
  email: "",
  password: "",
  username: "",
}
