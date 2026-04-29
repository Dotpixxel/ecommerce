# iyzico SDK & Authentication

Integration with iyzico requires official SDKs or direct API calls using specific authentication headers (PKI String).

## 1. SDK Installation (Node.js)

```bash
npm install iyzipay
```

### 1.5 TypeScript Support

The official SDK is written in JavaScript. For TypeScript support, install the community-maintained type definitions:

```bash
npm install --save-dev @types/iyzipay
```

Then you can import it in your TypeScript files:

```typescript
import Iyzipay from 'iyzipay';

const iyzipay = new Iyzipay({
    apiKey: process.env.IYZICO_API_KEY!,
    secretKey: process.env.IYZICO_SECRET_KEY!,
    uri: process.env.IYZICO_BASE_URL!
});
```

## 3. Credential Management

- **Sandbox:** Create an account at [iyzico Sandbox](https://sandbox-pos.iyzico.com/) to get test keys.
- **Environment Variables:** Always store keys in `.env`:
  - `IYZICO_API_KEY`
  - `IYZICO_SECRET_KEY`
  - `IYZICO_BASE_URL`

## 4. PKI String Generation (Advanced)

If not using an SDK, you must generate an `Authorization` header using a PKI (Public Key Infrastructure) string.

1. **Concatenate:** `apiKey` + `randomString` + `secretKey` + `payload`.
2. **Hash:** Use SHA-1 on the concatenated string.
3. **Encode:** Base64 encode the result.
4. **Header Format:** `IYZWS <apiKey>:<base64-signature>`

> [!IMPORTANT]
> The order of parameters in the payload matters for the PKI string. Consult the [Official API Docs](https://docs.iyzico.com/api) for the exact sequence for each endpoint.
