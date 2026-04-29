---
name: iyzico-expert
description: Specialized knowledge for integrating iyzico payments. Use when an agent needs to implement, debug, or configure iyzico products such as Checkout Form, Pay with iyzico, or Subscription management. Triggers on queries about "iyzico integration", "iyzico error codes", "PKI string generation", or "iyzico SDK setup".
---

# iyzico Expert Skill

This skill provides procedural knowledge for integrating iyzico payment products into web and mobile applications.

## Core Products

- **Checkout Form:** A secure, iyzico-hosted payment page. Recommended for most integrations.
- **Pay with iyzico (PWI):** Payment via iyzico balance or stored cards.
- **Direct API:** Full control over the payment flow.
- **Subscription:** Recurring billing management.

## Workflows

### 1. Integration Setup
Initialize the iyzico client using official SDKs. See [auth-sdk.md](references/auth-sdk.md) for configuration details and PKI string logic.

### 2. Implementing Checkout Flow
The standard flow involves initializing a checkout form and handling the callback. See [checkout-form.md](references/checkout-form.md) for the detailed step-by-step implementation.

### 3. Testing and Debugging
Use the iyzico Sandbox environment for testing. If you encounter errors or signature issues, refer to [troubleshooting.md](references/troubleshooting.md).

## Best Practices

- **Security:** Never expose `secretKey` on the frontend. All iyzico client initializations must happen on the backend.
- **Validation:** Always verify the payment status using the `retrieve` method after a callback or webhook.
- **Locale:** Use `Iyzipay.LOCALE.TR` for Turkish users to ensure the UI and error messages are localized correctly.
