import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Shield,
  Check,
  Zap,
  Crown,
  Sparkles,
  ArrowLeft,
  CreditCard,
  Loader2,
  Clock,
  Mic,
  Code,
  Brain,
  Star,
  Users,
  FileText,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PricingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [checkoutDialog, setCheckoutDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [email, setEmail] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPlans();
    
    // Check for success return from Stripe
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      checkPaymentStatus(sessionId);
    }
  }, [searchParams]);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/plans`);
      setPlans(response.data.plans);
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (sessionId) => {
    try {
      const response = await axios.get(`${API}/subscriptions/status/${sessionId}`);
      if (response.data.payment_status === "paid") {
        toast.success(`Successfully subscribed to ${response.data.plan}!`);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Payment status check failed:", error);
    }
  };

  const getPrice = (plan) => {
    if (billingCycle === "monthly") return plan.price_monthly;
    if (billingCycle === "quarterly") return plan.price_quarterly;
    return plan.price_yearly;
  };

  const getPerMonthPrice = (plan) => {
    if (billingCycle === "monthly") return plan.price_monthly;
    if (billingCycle === "quarterly") return (plan.price_quarterly / 3).toFixed(2);
    return (plan.price_yearly / 12).toFixed(2);
  };

  const getSavings = (plan) => {
    if (billingCycle === "monthly") return null;
    const monthly = plan.price_monthly;
    if (billingCycle === "quarterly") {
      const savings = (monthly * 3) - plan.price_quarterly;
      return savings > 0 ? savings.toFixed(2) : null;
    }
    const savings = (monthly * 12) - plan.price_yearly;
    return savings > 0 ? savings.toFixed(2) : null;
  };

  const handleSubscribe = (plan) => {
    if (plan.id === "free") {
      navigate("/dashboard");
      return;
    }
    setSelectedPlan(plan);
    setCheckoutDialog(true);
  };

  const processCheckout = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post(`${API}/subscriptions/checkout`, {
        email,
        plan: selectedPlan.id,
        billing_cycle: billingCycle,
        origin_url: window.location.origin,
      });

      // Redirect to Stripe checkout
      window.location.href = response.data.checkout_url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout. Please try again.");
      setProcessing(false);
    }
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case "free": return Zap;
      case "beginner": return Sparkles;
      case "advanced": return Crown;
      case "executive": return Star;
      default: return Shield;
    }
  };

  const getPlanColor = (planId) => {
    switch (planId) {
      case "free": return "text-white/60";
      case "beginner": return "text-primary";
      case "advanced": return "text-secondary";
      case "executive": return "text-accent";
      default: return "text-white";
    }
  };

  const getPlanBorder = (planId) => {
    switch (planId) {
      case "free": return "border-white/10";
      case "beginner": return "border-primary/30";
      case "advanced": return "border-secondary/30";
      case "executive": return "border-accent/50 ring-2 ring-accent/20";
      default: return "border-white/10";
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              data-testid="back-btn"
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-white/70 hover:text-white hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-secondary font-bold tracking-tight">
                STEALTH<span className="text-primary">INTERVIEW</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-secondary font-black text-4xl sm:text-5xl tracking-tight uppercase mb-4">
              CHOOSE YOUR <span className="text-primary">PLAN</span>
            </h1>
            <p className="text-white/50 font-primary max-w-2xl mx-auto text-lg">
              Unlock your interview potential with AI-powered assistance
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-12"
          >
            <Tabs value={billingCycle} onValueChange={setBillingCycle} className="w-auto">
              <TabsList className="bg-surface border border-white/10">
                <TabsTrigger value="monthly" className="data-[state=active]:bg-primary/20">
                  Monthly
                </TabsTrigger>
                <TabsTrigger value="quarterly" className="data-[state=active]:bg-primary/20">
                  Quarterly
                  <Badge className="ml-2 bg-secondary/20 text-secondary text-xs">10% OFF</Badge>
                </TabsTrigger>
                <TabsTrigger value="yearly" className="data-[state=active]:bg-primary/20">
                  Yearly
                  <Badge className="ml-2 bg-accent/20 text-accent text-xs">25% OFF</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          {/* Pricing Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[500px] bg-surface border border-white/10 rounded-sm animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan, i) => {
                const Icon = getPlanIcon(plan.id);
                const isPopular = plan.id === "advanced";
                const isExecutive = plan.id === "executive";
                
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                  >
                    <Card className={`h-full bg-surface ${getPlanBorder(plan.id)} relative overflow-hidden`}>
                      {isPopular && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-secondary text-white font-bold">POPULAR</Badge>
                        </div>
                      )}
                      {isExecutive && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-accent text-black font-bold">BEST VALUE</Badge>
                        </div>
                      )}
                      
                      <CardHeader className="pb-4">
                        <div className={`w-12 h-12 rounded-sm ${plan.id === 'free' ? 'bg-white/10' : plan.id === 'beginner' ? 'bg-primary/20' : plan.id === 'advanced' ? 'bg-secondary/20' : 'bg-accent/20'} flex items-center justify-center mb-4`}>
                          <Icon className={`w-6 h-6 ${getPlanColor(plan.id)}`} />
                        </div>
                        <CardTitle className="font-secondary font-bold text-xl tracking-tight uppercase">
                          {plan.name}
                        </CardTitle>
                        <div className="mt-4">
                          <div className="flex items-baseline gap-1">
                            <span className="font-secondary font-black text-4xl">
                              ${getPrice(plan) === 0 ? "0" : getPerMonthPrice(plan)}
                            </span>
                            <span className="text-white/40 font-primary">/mo</span>
                          </div>
                          {billingCycle !== "monthly" && getPrice(plan) > 0 && (
                            <p className="text-xs text-white/40 mt-1">
                              ${getPrice(plan).toFixed(2)} billed {billingCycle}
                              {getSavings(plan) && (
                                <span className="text-secondary ml-1">
                                  (Save ${getSavings(plan)})
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-6">
                        {/* Key Limits */}
                        <div className="space-y-3 pb-4 border-b border-white/5">
                          <div className="flex items-center gap-2 text-sm">
                            <Mic className="w-4 h-4 text-primary" />
                            <span className="font-primary">
                              {plan.live_interviews === -1 ? "Unlimited" : plan.live_interviews} live interviews
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-secondary" />
                            <span className="font-primary">
                              {plan.session_duration_minutes} min sessions
                            </span>
                          </div>
                        </div>
                        
                        {/* Features */}
                        <ul className="space-y-2">
                          {plan.features.slice(0, isExecutive ? 12 : 6).map((feature, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm">
                              <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${feature.startsWith('🌟') ? 'text-accent' : 'text-white/40'}`} />
                              <span className={`font-primary ${feature.startsWith('🌟') ? 'text-accent font-semibold' : 'text-white/70'}`}>
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                        
                        {/* CTA Button */}
                        <Button
                          data-testid={`subscribe-${plan.id}-btn`}
                          onClick={() => handleSubscribe(plan)}
                          className={`w-full font-bold ${
                            plan.id === 'free' 
                              ? 'bg-white/10 hover:bg-white/20 text-white' 
                              : plan.id === 'executive'
                              ? 'bg-accent hover:bg-accent/90 text-black'
                              : plan.id === 'advanced'
                              ? 'bg-secondary hover:bg-secondary/90 text-white'
                              : 'bg-primary hover:bg-primary/90 text-white'
                          }`}
                        >
                          {plan.id === 'free' ? 'Get Started Free' : 'Subscribe Now'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Executive Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <div className="text-center mb-8">
              <h2 className="font-secondary font-bold text-2xl tracking-tight uppercase">
                <span className="text-accent">EXECUTIVE</span> EXCLUSIVE BENEFITS
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="bg-surface border-accent/30">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="font-secondary font-bold text-sm uppercase mb-2">Personal Interview Coach AI</h3>
                  <p className="text-white/50 text-xs font-primary">
                    AI-powered coaching that learns your style and provides personalized improvement suggestions
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-surface border-accent/30">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="font-secondary font-bold text-sm uppercase mb-2">Resume Optimization Assistant</h3>
                  <p className="text-white/50 text-xs font-primary">
                    AI analyzes and optimizes your resume to match job descriptions and industry standards
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-surface border-accent/30">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="font-secondary font-bold text-sm uppercase mb-2">1-on-1 Expert Review Sessions</h3>
                  <p className="text-white/50 text-xs font-primary">
                    Monthly sessions with industry experts to review your interview performance and strategy
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Payment Methods */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <p className="text-white/40 text-sm font-primary mb-4">Secure payments powered by Stripe</p>
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-white/30">
                <CreditCard className="w-5 h-5" />
                <span className="text-xs font-mono">Visa</span>
              </div>
              <div className="flex items-center gap-2 text-white/30">
                <CreditCard className="w-5 h-5" />
                <span className="text-xs font-mono">Mastercard</span>
              </div>
              <div className="flex items-center gap-2 text-white/30">
                <span className="text-xs font-mono">Affirm</span>
              </div>
              <div className="flex items-center gap-2 text-white/30">
                <span className="text-xs font-mono">Venmo</span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialog} onOpenChange={setCheckoutDialog}>
        <DialogContent className="bg-surface border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-secondary font-bold tracking-tight uppercase flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              CHECKOUT - {selectedPlan?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="p-4 bg-black/40 rounded-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/60 font-primary text-sm">Plan</span>
                <span className="font-bold">{selectedPlan?.name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/60 font-primary text-sm">Billing</span>
                <span className="capitalize">{billingCycle}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-white/60 font-primary text-sm">Total</span>
                <span className="font-bold text-lg">
                  ${selectedPlan ? getPrice(selectedPlan).toFixed(2) : "0.00"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white/70 font-primary text-sm uppercase tracking-wide">
                Email Address
              </Label>
              <Input
                data-testid="checkout-email-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/40 border-white/10 focus:border-primary/50"
              />
            </div>

            <Button
              data-testid="proceed-checkout-btn"
              onClick={processCheckout}
              disabled={processing}
              className="w-full bg-primary hover:bg-primary/90 font-bold"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              {processing ? "Processing..." : "Proceed to Payment"}
            </Button>

            <p className="text-xs text-white/30 text-center font-primary">
              You'll be redirected to Stripe's secure checkout
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingPage;
