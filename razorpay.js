window.startRazorpayPayment = function (amount, successCallback) {
  const options = {
    key: "rzp_test_ScrS9eJ3YGRoRg",
    amount: amount * 100,
    currency: "INR",
    name: "HALORA",
    description: "Payment",
    handler: function (response) {
      alert("Payment Successful: " + response.razorpay_payment_id);
      if (successCallback) successCallback(response);
    },
    theme: {
      color: "#0ea5e9"
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
};
