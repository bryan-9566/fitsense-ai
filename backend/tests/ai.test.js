const {
  coach,
  adaptiveRecommendation,
} = require('../src/services/ai.service');

describe('AI Service', () => {
  test('rejects an empty coach question', async () => {
    await expect(
      coach({
        question: '',
        metrics: {},
        profile: {},
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'QUESTION_REQUIRED',
    });
  });

  test('recommends progression when target is exceeded', async () => {
    const result =
      await adaptiveRecommendation({
        plannedWeight: 60,
        actualBestWeight: 60,
        plannedReps: 8,
        actualBestReps: 10,
        intensity: 7,
      });

    expect(result.decision)
      .toBe('PROGRESS');

    expect(result.recommendation)
      .toContain('increase');
  });

  test('recommends regression when performance is below target', async () => {
    const result =
      await adaptiveRecommendation({
        plannedWeight: 60,
        actualBestWeight: 60,
        plannedReps: 10,
        actualBestReps: 6,
        intensity: 7,
      });

    expect(result.decision)
      .toBe('REGRESS');

    expect(result.recommendation)
      .toContain('reduce');
  });

  test('recommends recovery when intensity is very high', async () => {
    const result =
      await adaptiveRecommendation({
        plannedWeight: 60,
        actualBestWeight: 60,
        plannedReps: 8,
        actualBestReps: 8,
        intensity: 9,
      });

    expect(result.decision)
      .toBe('RECOVER');
  });

  test('maintains load when performance meets the target without progression criteria', async () => {
    const result =
      await adaptiveRecommendation({
        plannedWeight: 0,
        actualBestWeight: 0,
        plannedReps: 8,
        actualBestReps: 8,
        intensity: 6,
      });

    expect(result.decision)
      .toBe('MAINTAIN');
  });
});