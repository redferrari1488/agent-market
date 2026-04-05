import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { constructWebhookEvent } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, supabase);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice, supabase);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabase);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error handling ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createServiceClient>
) {
  const userId = session.metadata?.user_id;
  const agentId = session.metadata?.agent_id;
  const purchaseType =
    (session.metadata?.purchase_type as "subscription" | "one_time") ||
    "subscription";

  if (!userId || !agentId) {
    console.error("Missing metadata in checkout session:", session.id);
    return;
  }

  const isSubscription = purchaseType === "subscription";

  const subscriptionId = isSubscription
    ? typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id
    : null;

  const paymentIntentId = !isSubscription
    ? typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id
    : null;

  const { error } = await supabase.from("subscriptions").insert({
    user_id: userId,
    agent_id: agentId,
    purchase_type: purchaseType,
    stripe_subscription_id: subscriptionId,
    stripe_payment_intent_id: paymentIntentId,
    status: "pending_setup",
    started_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Failed to create subscription:", error);
    throw error;
  }

  // Обновляем stripe_customer_id в профиле
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  if (customerId) {
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", userId)
      .is("stripe_customer_id", null);
  }

  // Увеличиваем счётчик покупок агента
  await supabase.rpc("increment_purchases_count", { agent_uuid: agentId });
}

async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  supabase: ReturnType<typeof createServiceClient>
) {
  // Stripe v22: subscription в parent.subscription_details
  const subDetails = invoice.parent?.subscription_details;
  const subscriptionId =
    typeof subDetails?.subscription === "string"
      ? subDetails.subscription
      : subDetails?.subscription?.id;

  if (!subscriptionId) return;

  const expiresAt = invoice.period_end
    ? new Date(invoice.period_end * 1000).toISOString()
    : null;

  const { error } = await supabase
    .from("subscriptions")
    .update({
      ...(expiresAt && { expires_at: expiresAt }),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error("Failed to update subscription on invoice.paid:", error);
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createServiceClient>
) {
  const { data: sub, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id, container_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (fetchError || !sub) {
    console.error("Subscription not found for:", subscription.id);
    return;
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sub.id);

  if (error) {
    console.error("Failed to cancel subscription:", error);
  }

  // TODO: остановить Docker-контейнер (День 5)
}
