import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  Loader2,
  Shield,
  ArrowRight,
  XCircle,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      verifyPayment(sessionId);
    } else {
      setStatus("error");
    }
  }, [searchParams]);

  const verifyPayment = async (sessionId) => {
    try {
      const response = await axios.get(`${API}/subscriptions/status/${sessionId}`);
      setPaymentData(response.data);
      
      if (response.data.payment_status === "paid") {
        setStatus("success");
      } else if (response.data.payment_status === "unpaid") {
        setStatus("pending");
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error("Payment verification failed:", error);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="bg-surface border-white/10">
          <CardContent className="p-8 text-center">
            {status === "loading" && (
              <>
                <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
                <h1 className="font-secondary font-bold text-xl tracking-tight uppercase mb-2">
                  VERIFYING PAYMENT
                </h1>
                <p className="text-white/50 font-primary">
                  Please wait while we confirm your subscription...
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-secondary" />
                </div>
                <h1 className="font-secondary font-bold text-2xl tracking-tight uppercase mb-2">
                  SUBSCRIPTION <span className="text-secondary">ACTIVATED</span>
                </h1>
                <p className="text-white/50 font-primary mb-6">
                  Welcome to {paymentData?.plan?.charAt(0).toUpperCase() + paymentData?.plan?.slice(1)}! 
                  Your subscription is now active.
                </p>
                
                {paymentData && (
                  <div className="p-4 bg-black/40 rounded-sm mb-6 text-left">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/60 font-primary text-sm">Plan</span>
                      <span className="font-bold capitalize">{paymentData.plan}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/60 font-primary text-sm">Billing</span>
                      <span className="capitalize">{paymentData.billing_cycle}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-white/60 font-primary text-sm">Amount Paid</span>
                      <span className="font-bold text-secondary">
                        ${paymentData.amount?.toFixed(2)} {paymentData.currency?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => navigate("/dashboard")}
                  className="w-full bg-primary hover:bg-primary/90 font-bold"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}

            {status === "pending" && (
              <>
                <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="w-10 h-10 text-accent animate-spin" />
                </div>
                <h1 className="font-secondary font-bold text-xl tracking-tight uppercase mb-2">
                  PAYMENT PENDING
                </h1>
                <p className="text-white/50 font-primary mb-6">
                  Your payment is being processed. This may take a moment.
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-white/20"
                >
                  Refresh Status
                </Button>
              </>
            )}

            {status === "error" && (
              <>
                <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-10 h-10 text-destructive" />
                </div>
                <h1 className="font-secondary font-bold text-xl tracking-tight uppercase mb-2">
                  VERIFICATION FAILED
                </h1>
                <p className="text-white/50 font-primary mb-6">
                  We couldn't verify your payment. Please contact support if you believe this is an error.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate("/pricing")}
                    variant="outline"
                    className="flex-1 border-white/20"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={() => navigate("/dashboard")}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    Dashboard
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 mt-6">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-xs text-white/40 font-primary">
            Secure payment by Stripe
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionSuccess;
