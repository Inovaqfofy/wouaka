-- Create payment_transactions table for CinetPay
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id),
  transaction_id TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_url TEXT,
  payment_token TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  cinetpay_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own payment transactions"
ON public.payment_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own transactions
CREATE POLICY "Users can insert their own payment transactions"
ON public.payment_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service role can update (for webhook)
CREATE POLICY "Super admins can manage all payment transactions"
ON public.payment_transactions
FOR ALL
USING (has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

-- Index for fast lookups
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_transaction_id ON public.payment_transactions(transaction_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);

-- Trigger to update updated_at
CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
