const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: "rzp_test_vDzQAMl55qzZHV",
  key_secret: "qjCQt0X1CAXaVxOeXo9Pp6DX"
});

razorpay.orders.create({
  amount: 500,
  currency: "INR",
  receipt: "receipt_test_1"
}).then((order) => {
  console.log("✅ Key Working! Order ID:", order.id);
}).catch((err) => {
  console.log("❌ Key Not Working!", err.error.description);
});
