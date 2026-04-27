import { HeroMark3D } from "@/components/branding/HeroMark3D";

export const metadata = {
  title: "3D mark preview",
  robots: { index: false, follow: false },
};

export default function Preview3DPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-background p-8">
      <div className="aspect-[4/3] w-full max-w-3xl">
        <HeroMark3D />
      </div>
    </div>
  );
}
