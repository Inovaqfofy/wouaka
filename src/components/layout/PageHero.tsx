import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LucideIcon, Phone } from "lucide-react";

interface CTAButton {
  label: string;
  href: string;
  variant?: "default" | "secondary" | "outline";
  icon?: LucideIcon;
}

interface PageHeroProps {
  badge: {
    icon: LucideIcon;
    text: string;
  };
  title: string;
  titleHighlight?: string;
  description: string;
  primaryCTA?: CTAButton;
  secondaryCTA?: CTAButton;
  children?: ReactNode;
}

export function PageHero({
  badge,
  title,
  titleHighlight,
  description,
  primaryCTA,
  secondaryCTA,
  children,
}: PageHeroProps) {
  const BadgeIcon = badge.icon;

  return (
    <section className="pt-32 pb-16 bg-hero text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6">
            <BadgeIcon className="w-3 h-3 mr-1" />
            {badge.text}
          </Badge>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
            {title}
            {titleHighlight && (
              <span className="block text-secondary">{titleHighlight}</span>
            )}
          </h1>
          <p className="text-lg md:text-xl opacity-80 max-w-2xl mx-auto mb-8">
            {description}
          </p>
          
          {(primaryCTA || secondaryCTA) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {primaryCTA && (
                <Button size="lg" variant="secondary" className="gap-2" asChild>
                  <Link to={primaryCTA.href}>
                    {primaryCTA.icon && <primaryCTA.icon className="w-4 h-4" />}
                    {primaryCTA.label}
                  </Link>
                </Button>
              )}
              {secondaryCTA && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" 
                  asChild
                >
                  <Link to={secondaryCTA.href}>
                    {secondaryCTA.icon && <secondaryCTA.icon className="w-4 h-4 mr-2" />}
                    {secondaryCTA.label}
                  </Link>
                </Button>
              )}
            </div>
          )}
          
          {children}
        </div>
      </div>
    </section>
  );
}
