-- Allow 'absent' records in work_hours to bypass time and future-date validation

-- Override validate_work_hours_insert to skip strict checks for status = 'absent'
CREATE OR REPLACE FUNCTION validate_work_hours_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- For normal statuses, enforce standard validation
  IF NEW.status IS DISTINCT FROM 'absent' THEN
    IF NOT validate_work_hours(NEW.start_time, NEW.end_time, NEW.date) THEN
      RAISE EXCEPTION 'Orari non validi: end_time deve essere dopo start_time e la data non può essere nel futuro';
    END IF;
  END IF;

  -- Auto-calculate total_hours when missing
  IF NEW.total_hours IS NULL THEN
    IF NEW.status = 'absent' THEN
      NEW.total_hours := 0;
    ELSE
      NEW.total_hours := calculate_hours_from_times(NEW.start_time, NEW.end_time);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Override validate_work_hours_update similarly
CREATE OR REPLACE FUNCTION validate_work_hours_update()
RETURNS TRIGGER AS $$
BEGIN
  -- For normal statuses, enforce standard validation
  IF NEW.status IS DISTINCT FROM 'absent' THEN
    IF NOT validate_work_hours(NEW.start_time, NEW.end_time, NEW.date) THEN
      RAISE EXCEPTION 'Orari non validi: end_time deve essere dopo start_time e la data non può essere nel futuro';
    END IF;
  END IF;

  -- Recalculate total_hours only for non-absent when times change
  IF NEW.status IS DISTINCT FROM 'absent' AND (OLD.start_time IS DISTINCT FROM NEW.start_time OR OLD.end_time IS DISTINCT FROM NEW.end_time) THEN
    NEW.total_hours := calculate_hours_from_times(NEW.start_time, NEW.end_time);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


