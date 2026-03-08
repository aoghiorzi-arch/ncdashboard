import { AnimatedPage } from '@/components/AnimatedPage';
import { PredictiveAnalytics } from '@/components/PredictiveAnalytics';

export default function ForecastingPage() {
  return (
    <AnimatedPage>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Predictive Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Forecasts, velocity tracking, and early warning alerts based on your current data.
          </p>
        </div>
        <PredictiveAnalytics />
      </div>
    </AnimatedPage>
  );
}
