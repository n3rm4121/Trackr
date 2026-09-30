import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  // Optional: a card that only carries a title, blurb and one link.
  children?: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex justify-center px-4 py-10 sm:py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          {/* shadcn's CardTitle is a div, so the role and level are set here.
              Without it a screen reader has no heading to jump between and the
              page reads as an unlabelled form. */}
          <CardTitle role="heading" aria-level={2} className="text-xl">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {children ? <CardContent>{children}</CardContent> : null}
        <CardFooter className="text-muted-foreground text-sm">
          {footer}
        </CardFooter>
      </Card>
    </div>
  );
}
