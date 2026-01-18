import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Certificate distribution by trust level (Bronze/Silver/Gold)
const certificateDistribution = [
  { range: "Bronze (<50%)", count: 85, label: "Certitude faible" },
  { range: "Argent (50-75%)", count: 245, label: "Certitude moyenne" },
  { range: "Or (>75%)", count: 170, label: "Haute certitude" },
];

const monthlyCertificates = [
  { month: "Jan", certificates: 120, avgCertitude: 58 },
  { month: "Fév", certificates: 145, avgCertitude: 61 },
  { month: "Mar", certificates: 168, avgCertitude: 64 },
  { month: "Avr", certificates: 189, avgCertitude: 67 },
  { month: "Mai", certificates: 210, avgCertitude: 69 },
  { month: "Juin", certificates: 245, avgCertitude: 72 },
];

const sourceBreakdown = [
  { name: "Télécom", value: 35, color: "hsl(153, 100%, 15%)" },
  { name: "Commercial", value: 25, color: "hsl(87, 72%, 52%)" },
  { name: "Géographique", value: 20, color: "hsl(153, 60%, 35%)" },
  { name: "RCCM", value: 12, color: "hsl(87, 60%, 65%)" },
  { name: "Autres", value: 8, color: "hsl(180, 50%, 50%)" },
];

interface ChartProps {
  title?: string;
  className?: string;
}

export const CertificateDistributionChart = ({ title = "Distribution des certifications", className }: ChartProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={certificateDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const MonthlyCertificatesChart = ({ title = "Certificats mensuels", className }: ChartProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyCertificates}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="certificates"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.2)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const DataSourcePieChart = ({ title = "Sources de données", className }: ChartProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center">
          <ResponsiveContainer width="50%" height="100%">
            <PieChart>
              <Pie
                data={sourceBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {sourceBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {sourceBreakdown.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground flex-1">{item.name}</span>
                <span className="text-sm font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const CertitudeTrendChart = ({ title = "Tendance de certitude", className }: ChartProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyCertificates}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[50, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`${value}%`, "Certitude moyenne"]}
              />
              <Line
                type="monotone"
                dataKey="avgCertitude"
                stroke="hsl(var(--secondary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Keep legacy exports for backward compatibility
export const ScoreDistributionChart = CertificateDistributionChart;
export const MonthlyScoresChart = MonthlyCertificatesChart;
export const ScoreTrendChart = CertitudeTrendChart;
