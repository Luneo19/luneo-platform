# A/B Test Plan: Widget Conversion Optimization

**Date:** November 16, 2025  
**Objective:** Measure and optimize conversion rates from preview → AR → checkout  
**Duration:** 4-6 weeks  
**Traffic Split:** 50/50 (A/B)

---

## 1. Test Overview

### Primary Goal
Increase conversion rate from widget preview to checkout completion.

### Key Metrics
- **Preview → AR conversion rate** (target: +25%)
- **AR → Checkout conversion rate** (target: +30%)
- **Overall widget → purchase conversion rate** (target: +20%)
- **Time to conversion** (target: -15%)

### Secondary Metrics
- Engagement rate (prompt submissions)
- Regeneration rate
- Average session duration
- Bounce rate

---

## 2. Test Variations

### Test 1: Button Copy & CTA Placement

**Hypothesis:** More action-oriented copy and prominent CTAs will increase conversion.

#### Variant A (Control)
- Generate button: `Générer avec l'IA`
- AR tab: `Réalité Augmentée`
- No checkout CTA in preview

#### Variant B (Treatment)
- Generate button: `Créer mon design`
- AR tab: `Essayer en AR`
- Prominent "Ajouter au panier" button in preview

**Expected Impact:** +15% conversion rate

**Success Criteria:** Variant B shows ≥10% improvement in checkout conversion

---

### Test 2: AR Entry Flow

**Hypothesis:** Better AR onboarding and discoverability will increase AR usage and conversion.

#### Variant A (Control)
- AR tab only (current implementation)
- No onboarding overlay
- Generic error messages

#### Variant B (Treatment)
- AR onboarding overlay on first use
- Prominent "Essayer en AR" button in preview
- Progressive camera permission request
- Better error handling with recovery steps

**Expected Impact:** +30% AR usage, +25% AR → checkout conversion

**Success Criteria:** Variant B shows ≥20% improvement in AR engagement

---

### Test 3: Loading States & Progress Feedback

**Hypothesis:** Better loading feedback reduces drop-off during generation.

#### Variant A (Control)
- Generic "Génération en cours..."
- No time estimate
- Basic spinner

#### Variant B (Treatment)
- Progressive messages: "Analyse..." → "Création..." → "Finalisation..."
- Time estimate: "~15 secondes"
- Animated progress indicator

**Expected Impact:** -20% drop-off during generation

**Success Criteria:** Variant B shows ≥15% reduction in generation abandonment

---

### Test 4: Prompt Input UX

**Hypothesis:** Better prompt guidance increases engagement and quality.

#### Variant A (Control)
- Generic placeholder: "Décrivez votre {product} idéal..."
- Generic suggestions: "Logo moderne", "Poster événement"
- Character counter always visible

#### Variant B (Treatment)
- Example placeholder: `Ex: "Un t-shirt bleu avec un logo minimaliste"`
- Product-specific suggestions
- Character counter hidden until 80% used
- Helper text: "💡 Astuce: Plus de détails = meilleur résultat"

**Expected Impact:** +25% prompt submission rate, +10% generation success rate

**Success Criteria:** Variant B shows ≥15% improvement in prompt submissions

---

### Test 5: Error Messages & Recovery

**Hypothesis:** User-friendly error messages with recovery actions reduce frustration.

#### Variant A (Control)
- Technical error messages
- Generic "Réessayer" button
- No context or help

#### Variant B (Treatment)
- User-friendly error messages
- Contextual recovery actions
- Helpful tooltips and links
- Toast notifications for success

**Expected Impact:** -30% error-related drop-offs

**Success Criteria:** Variant B shows ≥20% reduction in error abandonment

---

## 3. Test Execution Plan

### Phase 1: Setup (Week 1)
- [ ] Implement A/B testing framework
- [ ] Set up analytics tracking
- [ ] Create variant components
- [ ] Deploy to staging for QA

### Phase 2: Test 1 & 2 (Weeks 2-3)
- [ ] Launch Test 1 (Button Copy & CTA)
- [ ] Launch Test 2 (AR Entry Flow)
- [ ] Monitor metrics daily
- [ ] Collect qualitative feedback

### Phase 3: Test 3 & 4 (Weeks 3-4)
- [ ] Launch Test 3 (Loading States)
- [ ] Launch Test 4 (Prompt Input UX)
- [ ] Continue monitoring previous tests
- [ ] Analyze early results

### Phase 4: Test 5 (Weeks 4-5)
- [ ] Launch Test 5 (Error Messages)
- [ ] Monitor all tests
- [ ] Collect final data

### Phase 5: Analysis & Rollout (Week 6)
- [ ] Statistical analysis of all tests
- [ ] Identify winning variants
- [ ] Plan rollout strategy
- [ ] Document learnings

---

## 4. Implementation Details

### A/B Testing Framework

```typescript
// apps/widget/src/lib/ab-test.ts
export interface ABTestConfig {
  testId: string;
  variant: 'A' | 'B';
  userId?: string;
  sessionId?: string;
}

export function getVariant(testId: string, userId?: string): 'A' | 'B' {
  // Consistent assignment based on userId or sessionId
  const seed = userId || sessionId || Math.random().toString();
  const hash = hashString(seed + testId);
  return hash % 2 === 0 ? 'A' : 'B';
}

export function trackEvent(
  testId: string,
  variant: 'A' | 'B',
  event: string,
  properties?: Record<string, unknown>
): void {
  // Send to analytics
  analytics.track('ab_test_event', {
    testId,
    variant,
    event,
    ...properties,
  });
}
```

### Event Tracking

Track these events for each variant:

```typescript
// Widget events
'widget_loaded'
'prompt_started'
'prompt_submitted'
'generation_started'
'generation_completed'
'generation_failed'
'preview_viewed'
'ar_tab_clicked'
'ar_started'
'ar_completed'
'checkout_initiated'
'checkout_completed'
'error_occurred'
'error_recovered'
```

### Analytics Integration

```typescript
// Example: Track conversion funnel
trackEvent('test_1', variant, 'preview_viewed');
trackEvent('test_1', variant, 'ar_tab_clicked', { source: 'preview' });
trackEvent('test_1', variant, 'checkout_initiated', { source: 'ar' });
trackEvent('test_1', variant, 'checkout_completed');
```

---

## 5. Statistical Analysis

### Sample Size Calculation

For 80% power and 95% confidence:
- **Baseline conversion:** 5%
- **Minimum detectable effect:** 20% relative increase (5% → 6%)
- **Required sample size:** ~3,800 users per variant
- **Test duration:** ~2 weeks per test (assuming 300 users/day)

### Success Metrics

Each test is considered successful if:
1. **Statistical significance:** p-value < 0.05
2. **Practical significance:** ≥10% improvement in primary metric
3. **No negative impact:** No significant decrease in secondary metrics
4. **Stability:** Results consistent across segments (mobile/desktop, new/returning)

### Analysis Methods

- **Chi-square test** for conversion rates
- **T-test** for continuous metrics (time, session duration)
- **Cohort analysis** by user segment
- **Funnel analysis** for drop-off points

---

## 6. Risk Mitigation

### Risks

1. **Negative impact on conversion**
   - **Mitigation:** Start with small traffic (10%), gradually increase
   - **Rollback plan:** Immediate switch to control variant

2. **Technical issues**
   - **Mitigation:** Thorough QA before launch
   - **Monitoring:** Real-time error tracking

3. **Seasonal variations**
   - **Mitigation:** Run tests for minimum 2 weeks
   - **Analysis:** Compare same time periods

4. **User confusion**
   - **Mitigation:** Clear variant differences, not too many changes
   - **Feedback:** Collect qualitative feedback

---

## 7. Reporting Dashboard

### Daily Metrics
- Conversion rates by variant
- Sample sizes
- Statistical significance
- Error rates

### Weekly Summary
- Test progress
- Key findings
- Recommendations
- Next steps

### Final Report
- Executive summary
- Detailed results
- Statistical analysis
- Recommendations for rollout
- Learnings and insights

---

## 8. Success Criteria Summary

### Test 1: Button Copy & CTA
- ✅ ≥10% improvement in checkout conversion
- ✅ No decrease in engagement rate

### Test 2: AR Entry Flow
- ✅ ≥20% improvement in AR engagement
- ✅ ≥15% improvement in AR → checkout conversion

### Test 3: Loading States
- ✅ ≥15% reduction in generation abandonment
- ✅ Improved user satisfaction (qualitative)

### Test 4: Prompt Input UX
- ✅ ≥15% improvement in prompt submissions
- ✅ ≥5% improvement in generation success rate

### Test 5: Error Messages
- ✅ ≥20% reduction in error abandonment
- ✅ Improved error recovery rate

---

## 9. Post-Test Actions

### Winning Variants
1. Roll out to 100% traffic
2. Document learnings
3. Update design system
4. Share results with team

### Losing Variants
1. Analyze why they didn't work
2. Document learnings
3. Consider alternative approaches
4. Archive for future reference

### Inconclusive Tests
1. Extend test duration
2. Increase sample size
3. Consider segment-specific analysis
4. Re-test with modifications

---

## 10. Tools & Infrastructure

### Required Tools
- **Analytics:** Google Analytics, Mixpanel, or Amplitude
- **A/B Testing:** Custom implementation or Optimizely/VWO
- **Error Tracking:** Sentry or similar
- **Session Recording:** Hotjar or FullStory (optional)

### Implementation Checklist
- [ ] Set up analytics tracking
- [ ] Implement A/B test framework
- [ ] Create variant components
- [ ] Set up error tracking
- [ ] Create reporting dashboard
- [ ] Document test plan
- [ ] Get stakeholder approval
- [ ] Launch tests

---

## 11. Timeline

| Week | Activity |
|------|----------|
| 1 | Setup & implementation |
| 2-3 | Tests 1 & 2 running |
| 3-4 | Tests 3 & 4 running |
| 4-5 | Test 5 running |
| 6 | Analysis & reporting |

**Total Duration:** 6 weeks

---

## 12. Next Steps After Tests

1. **Implement winning variants** across all traffic
2. **Iterate on learnings** - run follow-up tests
3. **Optimize further** - test new hypotheses
4. **Scale successful patterns** to other features
5. **Document best practices** for future tests

---

## Appendix: Example Implementation

See `apps/widget/src/components/ABTestWrapper.tsx` for example implementation of A/B test wrapper component.
