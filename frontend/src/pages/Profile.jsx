import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const INITIAL_PROFILE = {
  age: '',
  heightCm: '',
  weightKg: '',
  targetWeightKg: '',
  fitnessGoal: 'GENERAL_FITNESS',
  experience: 'BEGINNER',
  equipment: [],
};

const FITNESS_GOALS = [
  {
    value: 'GENERAL_FITNESS',
    label: 'General Fitness',
    description: 'Improve overall fitness and consistency',
  },
  {
    value: 'FAT_LOSS',
    label: 'Fat Loss',
    description: 'Focus on sustainable weight reduction',
  },
  {
    value: 'MUSCLE_GAIN',
    label: 'Muscle Gain',
    description: 'Build muscle and increase training volume',
  },
  {
    value: 'STRENGTH',
    label: 'Strength',
    description: 'Improve strength and progressive overload',
  },
  {
    value: 'ENDURANCE',
    label: 'Endurance',
    description: 'Improve cardio capacity and stamina',
  },
];

const EXPERIENCE_LEVELS = [
  {
    value: 'BEGINNER',
    label: 'Beginner',
    description: 'New to structured training',
  },
  {
    value: 'INTERMEDIATE',
    label: 'Intermediate',
    description: 'Consistent training experience',
  },
  {
    value: 'ADVANCED',
    label: 'Advanced',
    description: 'Experienced with structured programming',
  },
];

const DEFAULT_EQUIPMENT = [
  'Dumbbells',
  'Barbell',
  'Bench',
  'Resistance Bands',
  'Treadmill',
  'Cable Machine',
  'Pull-up Bar',
];

function normalizeProfile(profile) {
  return {
    age: profile?.age ?? '',
    heightCm: profile?.heightCm ?? '',
    weightKg: profile?.weightKg ?? '',
    targetWeightKg: profile?.targetWeightKg ?? '',
    fitnessGoal: profile?.fitnessGoal || 'GENERAL_FITNESS',
    experience: profile?.experience || 'BEGINNER',
    equipment: Array.isArray(profile?.equipment)
      ? profile.equipment
      : [],
  };
}

export default function Profile() {
  const { user } = useAuth();

  const [form, setForm] = useState(
    normalizeProfile(user?.profile || {})
  );

  const [originalForm, setOriginalForm] = useState(
    normalizeProfile(user?.profile || {})
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [customEquipment, setCustomEquipment] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError('');

        const { data } = await api.get('/users/me');

        const profile = normalizeProfile(data.profile);

        setForm(profile);
        setOriginalForm(profile);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Unable to load your profile.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const bmi = useMemo(() => {
    const height = Number(form.heightCm);
    const weight = Number(form.weightKg);

    if (!height || !weight || height <= 0 || weight <= 0) {
      return null;
    }

    const heightMeters = height / 100;
    return weight / (heightMeters * heightMeters);
  }, [form.heightCm, form.weightKg]);

  const bmiInfo = useMemo(() => {
    if (bmi === null) {
      return {
        label: 'Not available',
        className: 'neutral',
      };
    }

    if (bmi < 18.5) {
      return {
        label: 'Below reference range',
        className: 'warning',
      };
    }

    if (bmi < 25) {
      return {
        label: 'Within reference range',
        className: 'good',
      };
    }

    if (bmi < 30) {
      return {
        label: 'Above reference range',
        className: 'warning',
      };
    }

    return {
      label: 'High',
      className: 'warning',
    };
  }, [bmi]);

  const weightProgress = useMemo(() => {
    const current = Number(form.weightKg);
    const target = Number(form.targetWeightKg);

    if (
      !current ||
      !target ||
      current <= 0 ||
      target <= 0 ||
      current === target
    ) {
      return null;
    }

    const startingWeight = Math.max(current, target);
    const totalDistance = Math.abs(current - target);

    if (totalDistance === 0) return 100;

    return Math.min(
      100,
      Math.max(
        0,
        Math.round(
          ((startingWeight - current) / totalDistance) * 100
        )
      )
    );
  }, [form.weightKg, form.targetWeightKg]);

  const profileCompleteness = useMemo(() => {
    const fields = [
      form.age,
      form.heightCm,
      form.weightKg,
      form.targetWeightKg,
      form.fitnessGoal,
      form.experience,
      form.equipment?.length > 0,
    ];

    const completed = fields.filter(Boolean).length;

    return Math.round(
      (completed / fields.length) * 100
    );
  }, [form]);

  const selectedGoal = FITNESS_GOALS.find(
    (goal) => goal.value === form.fitnessGoal
  );

  const selectedExperience = EXPERIENCE_LEVELS.find(
    (level) => level.value === form.experience
  );

  const hasChanges =
    JSON.stringify(form) !== JSON.stringify(originalForm);

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage('');
    setError('');
  }

  function toggleEquipment(item) {
    setForm((current) => {
      const equipment = current.equipment || [];

      if (equipment.includes(item)) {
        return {
          ...current,
          equipment: equipment.filter(
            (equipmentItem) => equipmentItem !== item
          ),
        };
      }

      return {
        ...current,
        equipment: [...equipment, item],
      };
    });

    setMessage('');
    setError('');
  }

  function addCustomEquipment(event) {
    event.preventDefault();

    const value = customEquipment.trim();

    if (!value) return;

    const exists = form.equipment.some(
      (item) => item.toLowerCase() === value.toLowerCase()
    );

    if (!exists) {
      setForm((current) => ({
        ...current,
        equipment: [...current.equipment, value],
      }));
    }

    setCustomEquipment('');
    setMessage('');
    setError('');
  }

  function removeEquipment(item) {
    setForm((current) => ({
      ...current,
      equipment: current.equipment.filter(
        (equipmentItem) => equipmentItem !== item
      ),
    }));
  }

  function resetChanges() {
    setForm(originalForm);
    setMessage('');
    setError('');
  }

  async function saveProfile(event) {
    event.preventDefault();

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        age:
          form.age === ''
            ? undefined
            : Number(form.age),

        heightCm:
          form.heightCm === ''
            ? undefined
            : Number(form.heightCm),

        weightKg:
          form.weightKg === ''
            ? undefined
            : Number(form.weightKg),

        targetWeightKg:
          form.targetWeightKg === ''
            ? undefined
            : Number(form.targetWeightKg),

        fitnessGoal: form.fitnessGoal,
        experience: form.experience,
        equipment: form.equipment,
      };

      await api.put('/users/me/profile', payload);

      const updatedProfile = normalizeProfile(payload);

      setForm(updatedProfile);
      setOriginalForm(updatedProfile);

      setMessage(
        'Profile updated successfully.'
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to save your profile.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-dot" />
        <p>Loading your fitness profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="page-header profile-header">
        <div>
          <p className="eyebrow">Personal setup</p>
          <h1>My Profile</h1>

          <p className="page-description">
            Build your fitness profile so FitSense AI can
            personalize your recommendations.
          </p>
        </div>
      </header>

      {(error || message) && (
        <div
          className={
            error
              ? 'alert error'
              : 'alert success'
          }
        >
          {error || message}
        </div>
      )}

      <div className="profile-grid">
        {/* =========================
            PROFILE SUMMARY
        ========================= */}
        <section className="panel profile-summary">
          <div className="profile-avatar">
            {(user?.name || 'U')
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="profile-summary-main">
            <h2>{user?.name || 'FitSense User'}</h2>

            <p className="profile-email">
              {user?.email || 'No email available'}
            </p>

            <span className="profile-role">
              {user?.role || 'USER'}
            </span>
          </div>

          <div className="profile-completeness">
            <div className="profile-completeness-header">
              <span>Profile completeness</span>
              <strong>
                {profileCompleteness}%
              </strong>
            </div>

            <div className="progress">
              <div
                style={{
                  width: `${profileCompleteness}%`,
                }}
              />
            </div>

            <p>
              A complete profile helps the AI generate
              more relevant recommendations.
            </p>
          </div>
        </section>

        {/* =========================
            FITNESS SNAPSHOT
        ========================= */}
        <section className="profile-metrics">
          <div className="profile-stat">
            <span>Current weight</span>
            <strong>
              {form.weightKg
                ? `${form.weightKg} kg`
                : '--'}
            </strong>
          </div>

          <div className="profile-stat">
            <span>Target weight</span>
            <strong>
              {form.targetWeightKg
                ? `${form.targetWeightKg} kg`
                : '--'}
            </strong>
          </div>

          <div className="profile-stat">
            <span>Experience</span>
            <strong>
              {selectedExperience?.label ||
                'Not set'}
            </strong>
          </div>

          <div className="profile-stat">
            <span>Primary goal</span>
            <strong>
              {selectedGoal?.label ||
                'Not set'}
            </strong>
          </div>
        </section>

        {/* =========================
            MAIN FORM
        ========================= */}
        <form
          className="panel profile-form"
          onSubmit={saveProfile}
        >
          <div className="profile-section-heading">
            <div>
              <p className="eyebrow">
                Body metrics
              </p>
              <h2>Fitness information</h2>
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="age">
                Age
              </label>

              <input
                id="age"
                name="age"
                type="number"
                min="13"
                max="100"
                placeholder="e.g. 21"
                value={form.age}
                onChange={(e) =>
                  updateField(
                    'age',
                    e.target.value
                  )
                }
              />
            </div>

            <div className="field">
              <label htmlFor="heightCm">
                Height
              </label>

              <div className="input-suffix">
                <input
                  id="heightCm"
                  name="heightCm"
                  type="number"
                  min="50"
                  max="250"
                  step="0.1"
                  placeholder="e.g. 175"
                  value={form.heightCm}
                  onChange={(e) =>
                    updateField(
                      'heightCm',
                      e.target.value
                    )
                  }
                />

                <span>cm</span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="weightKg">
                Current weight
              </label>

              <div className="input-suffix">
                <input
                  id="weightKg"
                  name="weightKg"
                  type="number"
                  min="20"
                  max="500"
                  step="0.1"
                  placeholder="e.g. 72.5"
                  value={form.weightKg}
                  onChange={(e) =>
                    updateField(
                      'weightKg',
                      e.target.value
                    )
                  }
                />

                <span>kg</span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="targetWeightKg">
                Target weight
              </label>

              <div className="input-suffix">
                <input
                  id="targetWeightKg"
                  name="targetWeightKg"
                  type="number"
                  min="20"
                  max="500"
                  step="0.1"
                  placeholder="e.g. 68"
                  value={form.targetWeightKg}
                  onChange={(e) =>
                    updateField(
                      'targetWeightKg',
                      e.target.value
                    )
                  }
                />

                <span>kg</span>
              </div>
            </div>

            {/* BMI */}
            <div className="profile-insight-card full">
              <div>
                <span className="insight-label">
                  BMI
                </span>

                <strong>
                  {bmi !== null
                    ? bmi.toFixed(1)
                    : '--'}
                </strong>
              </div>

              <span
                className={`insight-badge ${bmiInfo.className}`}
              >
                {bmiInfo.label}
              </span>

              <p>
                BMI is displayed as a general reference
                metric, not a medical diagnosis.
              </p>
            </div>
          </div>

          {/* =========================
              FITNESS GOAL
          ========================= */}
          <div className="profile-section">
            <p className="eyebrow">
              Primary objective
            </p>

            <h2>What are you training for?</h2>

            <div className="selection-grid">
              {FITNESS_GOALS.map((goal) => (
                <button
                  type="button"
                  key={goal.value}
                  className={
                    form.fitnessGoal ===
                    goal.value
                      ? 'selection-card selected'
                      : 'selection-card'
                  }
                  onClick={() =>
                    updateField(
                      'fitnessGoal',
                      goal.value
                    )
                  }
                >
                  <span className="selection-card-title">
                    {goal.label}
                  </span>

                  <span className="selection-card-description">
                    {goal.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* =========================
              EXPERIENCE
          ========================= */}
          <div className="profile-section">
            <p className="eyebrow">
              Training level
            </p>

            <h2>Experience level</h2>

            <div className="selection-grid experience-grid">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  type="button"
                  key={level.value}
                  className={
                    form.experience ===
                    level.value
                      ? 'selection-card selected'
                      : 'selection-card'
                  }
                  onClick={() =>
                    updateField(
                      'experience',
                      level.value
                    )
                  }
                >
                  <span className="selection-card-title">
                    {level.label}
                  </span>

                  <span className="selection-card-description">
                    {level.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* =========================
              EQUIPMENT
          ========================= */}
          <div className="profile-section">
            <p className="eyebrow">
              Training environment
            </p>

            <h2>Available equipment</h2>

            <p className="section-description">
              Select the equipment you actually have
              access to. FitSense AI will use this when
              generating workout plans.
            </p>

            <div className="equipment-grid">
              {DEFAULT_EQUIPMENT.map((item) => {
                const selected =
                  form.equipment.includes(item);

                return (
                  <button
                    type="button"
                    key={item}
                    className={
                      selected
                        ? 'equipment-chip selected'
                        : 'equipment-chip'
                    }
                    onClick={() =>
                      toggleEquipment(item)
                    }
                  >
                    <span>
                      {selected ? '✓' : '+'}
                    </span>

                    {item}
                  </button>
                );
              })}
            </div>

            <form
              className="custom-equipment-form"
              onSubmit={addCustomEquipment}
            >
              <input
                type="text"
                placeholder="Add custom equipment"
                value={customEquipment}
                onChange={(e) =>
                  setCustomEquipment(
                    e.target.value
                  )
                }
              />

              <button
                type="submit"
                className="btn btn-secondary"
              >
                Add
              </button>
            </form>

            {form.equipment.length > 0 && (
              <div className="selected-equipment">
                {form.equipment.map((item) => (
                  <span
                    className="selected-equipment-tag"
                    key={item}
                  >
                    {item}

                    <button
                      type="button"
                      onClick={() =>
                        removeEquipment(item)
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* =========================
              WEIGHT PROGRESS
          ========================= */}
          <div className="profile-section">
            <p className="eyebrow">
              Goal progress
            </p>

            <h2>Target weight</h2>

            {weightProgress !== null ? (
              <>
                <div className="weight-progress-header">
                  <span>
                    {form.weightKg} kg
                  </span>

                  <strong>
                    {form.targetWeightKg} kg
                  </strong>
                </div>

                <div className="progress large">
                  <div
                    style={{
                      width: `${weightProgress}%`,
                    }}
                  />
                </div>

                <p className="section-description">
                  Your current and target weight are
                  stored as fitness-tracking data and
                  can be used by the recommendation
                  system.
                </p>
              </>
            ) : (
              <div className="profile-placeholder">
                Add your current and target weight to
                see a progress indicator.
              </div>
            )}
          </div>

          {/* =========================
              SAVE BAR
          ========================= */}
          <div className="profile-save-bar">
            <div>
              <strong>
                {hasChanges
                  ? 'Unsaved changes'
                  : 'Profile is up to date'}
              </strong>

              <span>
                {hasChanges
                  ? 'Save your changes before leaving this page.'
                  : 'Your fitness information is saved.'}
              </span>
            </div>

            <div className="profile-save-actions">
              {hasChanges && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetChanges}
                  disabled={saving}
                >
                  Discard changes
                </button>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  saving || !hasChanges
                }
              >
                {saving
                  ? 'Saving profile...'
                  : 'Save profile'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}