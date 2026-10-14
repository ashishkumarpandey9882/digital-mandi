import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./BuyerOrders.css";

function BuyerOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [payingOrderId, setPayingOrderId] = useState(null);

  // ================= FETCH ORDERS =================

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders/my-orders");

      console.log("My Orders:", response.data);

      setOrders(
        response.data.orders ||
          response.data.data ||
          []
      );
    } catch (error) {
      console.error(
        "Failed to fetch orders:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to load your orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Load Razorpay Checkout SDK only when needed
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // Create gateway order, open checkout, then verify payment on our backend
  const handlePayment = async (order) => {
    setPaymentError("");
    setPayingOrderId(order._id);

    try {
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        throw new Error("Unable to load Razorpay Checkout. Check your internet connection and try again.");
      }

      const createResponse = await api.post(
        `/payments/create-order/${order._id}`
      );
      const payment = createResponse.data.payment;

      if (!payment?.keyId || !payment?.gatewayOrderId) {
        throw new Error("Payment setup response is incomplete. Please check the backend configuration.");
      }

      const checkout = new window.Razorpay({
        key: payment.keyId,
        amount: payment.amount,
        currency: payment.currency,
        name: "Digital Mandi",
        description: `Payment for ${order.product?.cropName || order.cropName || "agricultural order"}`,
        order_id: payment.gatewayOrderId,
        notes: {
          digitalMandiOrderId: order._id,
        },
        handler: async (checkoutResponse) => {
          try {
            const verifyResponse = await api.post("/payments/verify", {
              orderId: order._id,
              razorpay_order_id: checkoutResponse.razorpay_order_id,
              razorpay_payment_id: checkoutResponse.razorpay_payment_id,
              razorpay_signature: checkoutResponse.razorpay_signature,
            });

            if (verifyResponse.data.success) {
              window.alert("Payment verified successfully!");
              await fetchOrders();
            } else {
              setPaymentError(verifyResponse.data.message || "Payment verification failed.");
            }
          } catch (verificationError) {
            console.error("Payment verification failed:", verificationError);
            setPaymentError(
              verificationError.response?.data?.message ||
                "Payment was submitted, but verification failed. Refresh your orders before retrying."
            );
          } finally {
            setPayingOrderId(null);
          }
        },
        modal: {
          ondismiss: () => setPayingOrderId(null),
        },
        theme: {
          color: "#166534",
        },
      });

      checkout.on("payment.failed", (event) => {
        console.error("Razorpay payment failed:", event.error);
        setPaymentError(
          event.error?.description || "Payment failed. Please try again."
        );
        setPayingOrderId(null);
      });

      checkout.open();
    } catch (paymentRequestError) {
      console.error("Unable to initiate payment:", paymentRequestError);
      setPaymentError(
        paymentRequestError.response?.data?.message ||
          paymentRequestError.message ||
          "Unable to start payment. Please try again."
      );
      setPayingOrderId(null);
    }
  };

  // ================= STATUS =================

  const getStatusClass = (status) => {
    return `order-status ${
      status?.toLowerCase() || "pending"
    }`;
  };

  // ================= DATE =================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ================= STATUS COUNTS =================

  const pendingOrders = orders.filter(
    (order) =>
      order.status?.toLowerCase() === "pending"
  ).length;

  const acceptedOrders = orders.filter(
    (order) =>
      order.status?.toLowerCase() === "accepted"
  ).length;

  const rejectedOrders = orders.filter(
    (order) =>
      order.status?.toLowerCase() === "rejected"
  ).length;

  // ================= TOTAL ORDER VALUE =================

  const totalOrderValue = orders.reduce(
    (total, order) =>
      total + Number(order.totalAmount || 0),
    0
  );

  // ================= LOADING =================

  if (loading) {
    return (
      <div className="buyer-orders-page">

        <div className="orders-loading">

          <div className="loading-spinner"></div>

          <h2>
            Loading your orders...
          </h2>

          <p>
            Please wait while we fetch your
            order history.
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="buyer-orders-page">

      {/* ================= HEADER ================= */}

      <div className="buyer-orders-header">

        <div>

          <span className="orders-eyebrow">
            BUYER PANEL
          </span>

          <h1>
            My Orders 📦
          </h1>

          <p>
            Track your purchases and view
            complete order details.
          </p>

        </div>

        <button
          className="orders-marketplace-btn"
          onClick={() => navigate("/products")}
        >
          ← Continue Shopping
        </button>

      </div>


      {/* ================= ERROR ================= */}

      {error && (
        <div className="orders-error">

          <span>
            ⚠️
          </span>

          <div>

            <strong>
              Unable to load orders
            </strong>

            <p>
              {error}
            </p>

          </div>

          <button
            onClick={fetchOrders}
          >
            Retry
          </button>

        </div>
      )}


      {paymentError && (
        <div className="orders-error payment-error" role="alert">
          <span>⚠️</span>
          <div>
            <strong>Payment update</strong>
            <p>{paymentError}</p>
          </div>
          <button onClick={() => setPaymentError("")}>Dismiss</button>
        </div>
      )}

      {/* ================= STATS ================= */}

      {!error && (
        <div className="orders-stats">

          {/* Total Orders */}

          <div className="order-stat-card">

            <div className="stat-icon">
              📦
            </div>

            <div>

              <span>
                Total Orders
              </span>

              <strong>
                {orders.length}
              </strong>

            </div>

          </div>


          {/* Pending */}

          <div className="order-stat-card">

            <div className="stat-icon">
              ⏳
            </div>

            <div>

              <span>
                Pending
              </span>

              <strong>
                {pendingOrders}
              </strong>

            </div>

          </div>


          {/* Accepted */}

          <div className="order-stat-card">

            <div className="stat-icon">
              ✅
            </div>

            <div>

              <span>
                Accepted
              </span>

              <strong>
                {acceptedOrders}
              </strong>

            </div>

          </div>


          {/* Total Order Value */}

          <div className="order-stat-card">

            <div className="stat-icon">
              ₹
            </div>

            <div>

              <span>
                Total Order Value
              </span>

              <strong>
                ₹
                {totalOrderValue.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

          </div>

        </div>
      )}


      {/* ================= EMPTY STATE ================= */}

      {!error &&
        orders.length === 0 && (
          <div className="orders-empty">

            <div className="empty-icon">
              🛒
            </div>

            <h2>
              No Orders Yet
            </h2>

            <p>
              You haven't placed any orders yet.
              Explore the marketplace and find
              products directly from farmers.
            </p>

            <button
              onClick={() =>
                navigate("/products")
              }
            >
              Explore Marketplace →
            </button>

          </div>
        )}


      {/* ================= ORDERS ================= */}

      {!error &&
        orders.length > 0 && (
          <div className="orders-list">

            {/* Orders Heading */}

            <div className="orders-list-heading">

              <div>

                <span>
                  ORDER HISTORY
                </span>

                <h2>
                  Your Purchases
                </h2>

              </div>

              <button
                onClick={fetchOrders}
                disabled={loading}
              >
                ↻ Refresh
              </button>

            </div>


            {/* Order Cards */}

            {orders.map((order) => {

              const product =
                order.product || {};

              const cropName =
                product.cropName ||
                order.cropName ||
                "Agricultural Product";

              const quantity =
                order.quantity || 0;

              const mspPrice =
                order.mspPrice ||
                order.price ||
                product.currentMsp?.price ||
                0;

              const distance =
                order.distance || 0;

              const transportationCost =
                order.transportationCost ||
                order.transportCost ||
                0;

              const buyerTransportShare =
                order.buyerTransportShare ||
                0;

              const totalAmount =
                order.totalAmount || 0;

              const status =
                order.status?.toLowerCase() ||
                "pending";


              return (
                <div
                  className="buyer-order-card"
                  key={order._id}
                >

                  {/* ================= ORDER TOP ================= */}

                  <div className="buyer-order-top">

                    <div className="buyer-order-product">

                      <div className="order-crop-icon">
                        {cropName
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>

                        <span>
                          PRODUCT
                        </span>

                        <h3>
                          {cropName}
                        </h3>

                        <p>
                          Order ID:{" "}
                          {order._id}
                        </p>

                      </div>

                    </div>


                    {/* Status */}

                    <div
                      className={getStatusClass(
                        status
                      )}
                    >
                      {status}
                    </div>

                  </div>


                  {/* ================= ORDER DETAILS ================= */}

                  <div className="buyer-order-details">

                    {/* Quantity */}

                    <div className="order-detail">

                      <span>
                        Quantity
                      </span>

                      <strong>
                        {quantity} units
                      </strong>

                    </div>


                    {/* MSP */}

                    <div className="order-detail">

                      <span>
                        MSP Price
                      </span>

                      <strong>
                        ₹
                        {Number(
                          mspPrice
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>


                    {/* Distance */}

                    <div className="order-detail">

                      <span>
                        Distance
                      </span>

                      <strong>
                        {Number(
                          distance
                        ).toFixed(2)}{" "}
                        km
                      </strong>

                    </div>


                    {/* Transport */}

                    <div className="order-detail">

                      <span>
                        Transport Cost
                      </span>

                      <strong>
                        ₹
                        {Number(
                          transportationCost
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>


                    {/* Buyer Transport Share */}

                    <div className="order-detail">

                      <span>
                        Your Transport Share
                      </span>

                      <strong>
                        ₹
                        {Number(
                          buyerTransportShare
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>


                    {/* Date */}

                    <div className="order-detail">

                      <span>
                        Order Date
                      </span>

                      <strong>
                        {formatDate(
                          order.createdAt
                        )}
                      </strong>

                    </div>

                  </div>


                  {/* ================= BOTTOM ================= */}

                  <div className="buyer-order-bottom">

                    <div>

                      <span>
                        FINAL AMOUNT
                      </span>

                      <strong>
                        ₹
                        {Number(
                          totalAmount
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>


                    {/* Status Message */}

                    <div className="order-info">

                      {status === "pending" && (
                        <>
                          ⏳ Waiting for farmer
                          approval
                        </>
                      )}

                      {status === "accepted" && (
                        <>
                          ✅ Order accepted by
                          farmer
                        </>
                      )}

                      {status === "rejected" && (
                        <>
                          ❌ Order rejected by
                          farmer
                        </>
                      )}

                    </div>

                    <div className="order-payment-actions">
                      {order.payment?.status === "paid" ? (
                        <span className="payment-status-paid">✓ Payment completed</span>
                      ) : status === "accepted" ? (
                        <button
                          className="pay-now-btn"
                          onClick={() => handlePayment(order)}
                          disabled={payingOrderId !== null}
                        >
                          {payingOrderId === order._id ? "Opening checkout..." : `Pay ₹${Number(totalAmount).toLocaleString("en-IN")}`}
                        </button>
                      ) : status === "pending" ? (
                        <span className="payment-status-note">Payment available after farmer approval</span>
                      ) : null}
                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

    </div>
  );
}

export default BuyerOrders;