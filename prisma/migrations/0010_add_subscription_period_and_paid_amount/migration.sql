-- 方案A：User 增加权威订阅周期（webhook 支付成功时写入，替代从最近一笔订单反查）
ALTER TABLE "User" ADD COLUMN "subscriptionPeriod" TEXT;

-- 付款记录双金额：实付金额/币种（支付平台回调写入），用于与 amount（网站应收）比对展示
ALTER TABLE "PaymentOrder" ADD COLUMN "paidAmount" INTEGER;
ALTER TABLE "PaymentOrder" ADD COLUMN "paidCurrency" TEXT;
