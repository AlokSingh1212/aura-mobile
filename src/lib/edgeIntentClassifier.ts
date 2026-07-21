/**
 * Client-Side Edge AI Micro-Intent Classifier.
 * Evaluates real-time scroll velocity, dwell time, and micro-gestures locally in < 2ms
 * to re-rank the upcoming feed buffer without network latency.
 */

export type UserMicroIntent = 'DEEP_FOCUS' | 'SACCADIC_BROWSING' | 'NEUTRAL';

export interface TouchTelemetryEvent {
  itemId: string;
  category: string;
  dwellMs: number;
  scrollVelocityPxPerMs: number;
  timestamp: number;
}

export interface CandidateFeedItem {
  id: string;
  category: string;
  title: string;
  originalRank: number;
  adjustedScore: number;
}

export class EdgeIntentClassifier {
  private history: TouchTelemetryEvent[] = [];
  private readonly maxHistoryLength = 10;

  /**
   * Records a user interaction telemetry sample.
   */
  public recordSample(sample: TouchTelemetryEvent): void {
    this.history.push(sample);
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
  }

  /**
   * Classifies current user micro-intent based on recent telemetry window.
   * Execution time budget: < 2ms.
   */
  public classifyIntent(): { intent: UserMicroIntent; confidence: number; focusCategory?: string } {
    if (this.history.length === 0) {
      return { intent: 'NEUTRAL', confidence: 1.0 };
    }

    const recent = this.history[this.history.length - 1];
    
    // 1. Deep Focus Detection (Deceleration + Dwell > 1200ms)
    if (recent.dwellMs >= 1200 && recent.scrollVelocityPxPerMs < 0.5) {
      return {
        intent: 'DEEP_FOCUS',
        confidence: Math.min(1.0, recent.dwellMs / 2500),
        focusCategory: recent.category,
      };
    }

    // 2. Saccadic Browsing Detection (Rapid Scroll > 3.5 px/ms across last 3 samples)
    const avgVelocity =
      this.history.reduce((sum, s) => sum + s.scrollVelocityPxPerMs, 0) /
      this.history.length;

    if (avgVelocity > 3.5 || (recent.scrollVelocityPxPerMs > 4.5 && recent.dwellMs < 300)) {
      return {
        intent: 'SACCADIC_BROWSING',
        confidence: Math.min(1.0, avgVelocity / 6.0),
      };
    }

    return { intent: 'NEUTRAL', confidence: 0.8 };
  }

  /**
   * Re-ranks upcoming candidate feed buffer on device based on classified micro-intent.
   */
  public rerankBuffer(
    candidates: CandidateFeedItem[]
  ): CandidateFeedItem[] {
    const { intent, focusCategory } = this.classifyIntent();

    if (intent === 'NEUTRAL' || candidates.length <= 1) {
      return candidates;
    }

    return candidates
      .map((item) => {
        let boost = 1.0;

        if (intent === 'DEEP_FOCUS' && focusCategory && item.category === focusCategory) {
          // 80% affinity boost for focused category
          boost = 1.8;
        } else if (intent === 'SACCADIC_BROWSING') {
          // Penalize repeated categories, boost novel/random items
          boost = Math.random() * 0.5 + 1.2;
        }

        return {
          ...item,
          adjustedScore: (100 - item.originalRank) * boost,
        };
      })
      .sort((a, b) => b.adjustedScore - a.adjustedScore);
  }
}

export const edgeIntentClassifier = new EdgeIntentClassifier();
