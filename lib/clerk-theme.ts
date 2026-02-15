export const clerkTheme = {
  baseTheme: undefined,
  variables: {
    colorPrimary: "#10B981",
    colorBackground: "#FFFFFF",
    colorInputBackground: "#F8FAFC",
    colorInputText: "#0B1220",
    colorNeutral: "#64748B",
    colorDanger: "#DC2626",
    colorSuccess: "#16A34A",
    colorWarning: "#F59E0B",
    borderRadius: "12px",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    rootBox: {
      width: "100%",
    },
    card: {
      boxShadow: "none",
      border: "1px solid #E2E8F0",
      borderRadius: "16px",
      padding: "32px",
    },
    headerTitle: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#0B1220",
    },
    headerSubtitle: {
      fontSize: "14px",
      color: "#64748B",
    },
    formButtonPrimary: {
      backgroundColor: "#10B981",
      color: "#FFFFFF",
      fontSize: "14px",
      fontWeight: "600",
      padding: "12px 16px",
      borderRadius: "12px",
      "&:hover": {
        backgroundColor: "#059669",
      },
      "&:focus": {
        boxShadow: "0 0 0 2px #10B981",
      },
      "&:active": {
        backgroundColor: "#047857",
      },
    },
    formButtonSecondary: {
      backgroundColor: "#F1F5F9",
      color: "#0B1220",
      fontSize: "14px",
      fontWeight: "600",
      padding: "12px 16px",
      borderRadius: "12px",
      border: "1px solid #E2E8F0",
      "&:hover": {
        backgroundColor: "#E2E8F0",
      },
    },
    formFieldInput: {
      fontSize: "14px",
      padding: "12px 16px",
      borderRadius: "12px",
      border: "1px solid #E2E8F0",
      backgroundColor: "#FFFFFF",
      "&:focus": {
        borderColor: "#10B981",
        boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.2)",
      },
    },
    formFieldLabel: {
      fontSize: "13px",
      fontWeight: "600",
      color: "#0B1220",
      marginBottom: "8px",
    },
    formFieldAction: {
      color: "#10B981",
      fontSize: "13px",
      fontWeight: "600",
      "&:hover": {
        color: "#059669",
      },
    },
    footerActionLink: {
      color: "#10B981",
      fontWeight: "600",
      "&:hover": {
        color: "#059669",
      },
    },
    footerActionText: {
      fontSize: "14px",
      color: "#64748B",
    },
    dividerLine: {
      backgroundColor: "#E2E8F0",
    },
    dividerText: {
      color: "#64748B",
      fontSize: "13px",
    },
    socialButtonsBlockButton: {
      backgroundColor: "#FFFFFF",
      border: "1px solid #E2E8F0",
      borderRadius: "12px",
      padding: "12px 16px",
      "&:hover": {
        backgroundColor: "#F8FAFC",
      },
    },
    socialButtonsBlockButtonText: {
      color: "#0B1220",
      fontWeight: "600",
    },
    identityPreview: {
      backgroundColor: "#F8FAFC",
      borderRadius: "12px",
      border: "1px solid #E2E8F0",
    },
    formFieldInfoText: {
      fontSize: "13px",
      color: "#64748B",
    },
    alert: {
      borderRadius: "12px",
      fontSize: "14px",
    },
    formResendCodeLink: {
      color: "#10B981",
      fontWeight: "600",
    },
    otpCodeFieldInput: {
      borderRadius: "10px",
      border: "1px solid #E2E8F0",
      fontSize: "20px",
      fontWeight: "600",
      "&:focus": {
        borderColor: "#10B981",
        boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.2)",
      },
    },
  },
} as const

export const userButtonTheme = {
  variables: {
    colorPrimary: "#10B981",
    colorBackground: "#FFFFFF",
    colorNeutral: "#64748B",
    borderRadius: "12px",
  },
  elements: {
    rootBox: {
      position: "relative",
    },
    userButtonTriggerBox: {
      borderRadius: "10px",
      "&:focus": {
        boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.4)",
      },
    },
    userButtonAvatarBox: {
      width: "36px",
      height: "36px",
    },
    popoverCard: {
      borderRadius: "16px",
      border: "1px solid #E2E8F0",
      boxShadow: "0 6px 18px rgba(2, 6, 23, 0.10)",
      padding: "8px",
    },
    popoverActionButton: {
      borderRadius: "10px",
      fontSize: "14px",
      fontWeight: "500",
      color: "#0B1220",
      "&:hover": {
        backgroundColor: "#F1F5F9",
      },
    },
    popoverActionButtonIcon: {
      color: "#64748B",
    },
    userPreviewMainIdentifier: {
      fontWeight: "600",
      color: "#0B1220",
    },
    userPreviewSecondaryIdentifier: {
      color: "#64748B",
      fontSize: "13px",
    },
    userPreview: {
      padding: "12px",
      borderRadius: "10px",
      backgroundColor: "#F8FAFC",
    },
    dividerLine: {
      backgroundColor: "#E2E8F0",
      margin: "8px 0",
    },
  },
} as const
