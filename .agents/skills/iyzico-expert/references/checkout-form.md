# iyzico Checkout Form Integration

The Checkout Form is the most common integration method, providing a secure, iyzico-hosted payment page.

## Integration Flow

### 1. Initialize (Backend)

Request a checkout form token from iyzico.

```javascript
var request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: '123456789',
    price: '1.0',
    paidPrice: '1.2',
    currency: Iyzipay.CURRENCY.TRY,
    basketId: 'B67832',
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    callbackUrl: 'https://www.merchant.com/callback',
    enabledInstallments: [2, 3, 6, 9],
    buyer: { ... },
    shippingAddress: { ... },
    billingAddress: { ... },
    basketItems: [ ... ]
};

iyzipay.checkoutFormInitialize.create(request, function (err, result) {
    // result.checkoutFormContent contains the HTML/JS snippet
    // result.token is the unique identifier for this transaction
});
```

### 2. Display Form (Frontend)

Inject the `checkoutFormContent` received from the backend into your page. iyzico will handle the UI.

### 3. Handle Callback (Backend)

iyzico will POST to your `callbackUrl` with the `token`. You must then retrieve the payment result.

```javascript
iyzipay.checkoutForm.retrieve({
    locale: Iyzipay.LOCALE.TR,
    conversationId: '123456789',
    token: 'token-from-callback'
}, function (err, result) {
    if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
        // Payment successful
    }
});
```

> [!TIP]
> Use `Pay with iyzico` (PWI) by ensuring `enabledInstallments` and other parameters are correctly set to allow iyzico balance payments.
