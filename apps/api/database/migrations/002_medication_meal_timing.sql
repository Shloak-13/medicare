BEGIN;

ALTER TABLE medications
ADD COLUMN IF NOT EXISTS meal_timing TEXT;

ALTER TABLE medications
DROP CONSTRAINT IF EXISTS medications_meal_timing_check;

ALTER TABLE medications
ADD CONSTRAINT medications_meal_timing_check
CHECK (
    meal_timing IS NULL OR meal_timing IN (
        'before_breakfast',
        'after_breakfast',
        'before_lunch',
        'after_lunch',
        'before_dinner',
        'after_dinner',
        'with_food',
        'empty_stomach',
        'not_applicable'
    )
);

COMMIT;

