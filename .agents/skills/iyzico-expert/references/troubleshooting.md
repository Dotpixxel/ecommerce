# Troubleshooting & Testing

## 1. Common Error Codes

| Code | Description | Action |
| :--- | :--- | :--- |
| `10` | Invalid signature | Check API keys and PKI string generation logic. |
| `12` | Card not authorized | User should check with their bank. |
| `51` | Insufficient funds | User should use a different card or top up balance. |
| `100` | General Error | Check request parameters and logs. |

## 2. Sandbox Testing

Use these test cards in the Sandbox environment:

- **Success Card:** `5437 7100 0000 0001`, Exp: `12/30`, CVC: `123`
- **3D Secure:** Most test cards trigger 3D Secure simulation in Sandbox. Use any 6-digit code (e.g., `123456`) for the SMS code.

## 3. Debugging PKI Strings

If you get "Invalid Signature" (Error 10):
1. Print the exact string being hashed on the backend.
2. Compare it with the order required in the [iyzico documentation](https://docs.iyzico.com/).
3. Ensure no trailing/leading whitespaces or hidden characters.

## 4. Webhooks

iyzico sends webhooks for various events (Subscription updates, payment status). 
- **Validation:** Always validate the `iyzi-signature` header in webhooks to ensure they come from iyzico.
