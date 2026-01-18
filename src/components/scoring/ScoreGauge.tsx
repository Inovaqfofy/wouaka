import { motion } from 'framer-motion';
import { RISK_CATEGORY_LABELS } from '@/lib/scoring-types';

interface ScoreGaugeProps {
  score: number;
  riskCategory: string;
  confidence: number;
}

export function ScoreGauge({ score, riskCategory, confidence }: ScoreGaugeProps) {
  // Calculate angle for gauge (score 0-100 maps to 0-180 degrees)
  const normalizedScore = Math.min(100, Math.max(0, score)) / 100;
  const angle = normalizedScore * 180;
  
  const categoryInfo = RISK_CATEGORY_LABELS[riskCategory] || RISK_CATEGORY_LABELS.fair;
  
  // Get color based on score (0-100 scale)
  const getScoreColor = () => {
    if (score >= 80) return '#22c55e'; // green - Excellent (A+)
    if (score >= 70) return '#10b981'; // emerald - Très bon (A)
    if (score >= 50) return '#eab308'; // yellow - Correct (B/B+)
    if (score >= 30) return '#f97316'; // orange - Faible (C/C+)
    return '#ef4444'; // red - Très faible (D/E)
  };

  return (
    <div className="flex flex-col items-center">
      {/* Gauge */}
      <div className="relative w-64 h-32 mb-4">
        {/* Background arc */}
        <svg className="w-full h-full" viewBox="0 0 200 100">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          
          {/* Background track */}
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.3"
          />
          
          {/* Animated progress arc */}
          <motion.path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke={getScoreColor()}
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: normalizedScore }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          
          {/* Score labels */}
          <text x="15" y="98" className="text-xs fill-muted-foreground">0</text>
          <text x="180" y="98" className="text-xs fill-muted-foreground">100</text>
        </svg>
        
        {/* Needle */}
        <motion.div
          className="absolute bottom-0 left-1/2 origin-bottom"
          style={{ width: '2px', height: '70px', marginLeft: '-1px' }}
          initial={{ rotate: -90 }}
          animate={{ rotate: angle - 90 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <div 
            className="w-full h-full rounded-full"
            style={{ backgroundColor: getScoreColor() }}
          />
          <div 
            className="absolute bottom-0 left-1/2 w-4 h-4 -ml-2 rounded-full border-4 border-background"
            style={{ backgroundColor: getScoreColor() }}
          />
        </motion.div>
      </div>
      
      {/* Score value */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-6xl font-display font-bold" style={{ color: getScoreColor() }}>
          {score}
        </div>
        <div className="text-sm text-muted-foreground">sur 100</div>
      </motion.div>
      
      {/* Risk category badge */}
      <motion.div
        className={`mt-4 px-4 py-2 rounded-full ${categoryInfo.bgColor}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
      >
        <span className={`font-semibold ${categoryInfo.color}`}>
          {categoryInfo.label}
        </span>
      </motion.div>
      
      {/* Confidence indicator */}
      <motion.div
        className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <span>Fiabilité:</span>
        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 1, delay: 1 }}
          />
        </div>
        <span className="font-medium">{confidence}%</span>
      </motion.div>
    </div>
  );
}
