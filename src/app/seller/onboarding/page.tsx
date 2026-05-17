import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getUser } from "@/lib/auth-server";
import { OnboardingForm } from "@/components/seller/OnboardingForm";

export const dynamic = "force-dynamic";

export default async function SellerOnboardingPage() {
  const user = await getUser();
  if (!user) {
    redirect("/auth/login?next=/seller/onboarding");
  }

  const [profile] = await db
    .select({
      role: profiles.role,
      yookassaAccountId: profiles.yookassaAccountId,
      cryptoWallets: profiles.cryptoWallets,
      onboardingData: profiles.onboardingData,
      onboardingStatus: profiles.onboardingStatus,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || (profile.role !== "seller" && profile.role !== "admin")) {
    redirect("/seller");
  }

  return (
    <section className="mx-auto max-w-3xl px-5 sm:px-6">
      <div className="py-10 sm:py-14">
        <div className="mb-8">
          <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Продавцам · Выплаты
          </p>
          <h1 className="mt-3 text-[1.75rem] font-bold leading-[1.05] tracking-[-0.025em] sm:text-[2.25rem]">
            Настройка выплат
          </h1>
          <p className="mt-2 max-w-[64ch] text-[14px] leading-relaxed text-muted-foreground">
            Нужно только когда захочешь вывести деньги. Можно отложить — публикуй агентов и копи баланс, реквизиты добавишь перед выплатой.
          </p>
        </div>

        <OnboardingForm
          initial={{
            yookassaAccountId: profile.yookassaAccountId,
            cryptoWallets: profile.cryptoWallets,
            onboardingData: profile.onboardingData as Record<string, unknown> | null,
            onboardingStatus: profile.onboardingStatus,
          }}
        />
      </div>
    </section>
  );
}
