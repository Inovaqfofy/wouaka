import React from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  Banknote,
  Zap,
  Phone,
  MapPin,
  Users,
  Brain,
  TrendingUp,
  Wheat,
  FileCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const dataSources = [
  {
    id: "banking",
    icon: Banknote,
    label: "Bancaire",
    description: "Relevés, transactions, soldes moyens",
    color: "bg-blue-500/20 text-blue-600",
  },
  {
    id: "mobile-money",
    icon: Smartphone,
    label: "Mobile Money",
    description: "Orange, MTN, Wave, Moov",
    color: "bg-orange-500/20 text-orange-600",
  },
  {
    id: "utilities",
    icon: Zap,
    label: "Factures",
    description: "Électricité, eau, loyer",
    color: "bg-yellow-500/20 text-yellow-600",
  },
  {
    id: "telecom",
    icon: Phone,
    label: "Télécom",
    description: "Ancienneté SIM, recharges, stabilité",
    color: "bg-green-500/20 text-green-600",
  },
  {
    id: "location",
    icon: MapPin,
    label: "Géolocalisation",
    description: "Stabilité résidentielle, zone économique",
    color: "bg-red-500/20 text-red-600",
  },
  {
    id: "social",
    icon: Users,
    label: "Capital social",
    description: "Tontines, coopératives, associations",
    color: "bg-purple-500/20 text-purple-600",
  },
  {
    id: "psychometric",
    icon: Brain,
    label: "Psychométrie",
    description: "Comportement, littératie financière",
    color: "bg-pink-500/20 text-pink-600",
  },
  {
    id: "economic",
    icon: TrendingUp,
    label: "Contexte économique",
    description: "Indicateurs locaux, saisonnalité",
    color: "bg-indigo-500/20 text-indigo-600",
  },
  {
    id: "agriculture",
    icon: Wheat,
    label: "Agriculture",
    description: "Calendrier agricole, rendements",
    color: "bg-emerald-500/20 text-emerald-600",
  },
  {
    id: "identity",
    icon: FileCheck,
    label: "Identité",
    description: "Documents, RCCM, registres officiels",
    color: "bg-slate-500/20 text-slate-600",
  },
];

interface DataSourcesShowcaseProps {
  variant?: "compact" | "detailed" | "grid";
  showDescription?: boolean;
  maxItems?: number;
  className?: string;
}

export function DataSourcesShowcase({
  variant = "compact",
  showDescription = false,
  maxItems,
  className = "",
}: DataSourcesShowcaseProps) {
  const items = maxItems ? dataSources.slice(0, maxItems) : dataSources;

  if (variant === "compact") {
    return (
      <div className={`flex flex-wrap gap-3 justify-center ${className}`}>
        {items.map((source, index) => (
          <motion.div
            key={source.id}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
          >
            <Badge
              variant="secondary"
              className={`gap-2 py-2 px-3 ${source.color} border-0`}
            >
              <source.icon className="w-4 h-4" />
              {source.label}
            </Badge>
          </motion.div>
        ))}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={`space-y-3 ${className}`}>
        {items.map((source, index) => (
          <motion.div
            key={source.id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-xl ${source.color} flex items-center justify-center flex-shrink-0`}
            >
              <source.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">{source.label}</p>
              {showDescription && (
                <p className="text-xs text-muted-foreground">
                  {source.description}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // Grid variant
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 ${className}`}>
      {items.map((source, index) => (
        <motion.div
          key={source.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="p-4 text-center hover:shadow-md transition-shadow">
            <div
              className={`w-12 h-12 rounded-xl ${source.color} flex items-center justify-center mx-auto mb-3`}
            >
              <source.icon className="w-6 h-6" />
            </div>
            <p className="font-medium text-sm">{source.label}</p>
            {showDescription && (
              <p className="text-xs text-muted-foreground mt-1">
                {source.description}
              </p>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export { dataSources };
