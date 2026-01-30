-- Fix the integrity check function - column is 'payload' not 'details'
CREATE OR REPLACE FUNCTION public.run_integrity_check(p_time_window_minutes integer DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_anomalies INTEGER := 0;
  v_suspicious JSONB := '[]'::JSONB;
  v_result JSONB;
  v_transactions_checked INTEGER := 0;
  rec RECORD;
BEGIN
  -- Check scoring requests for anomalies
  FOR rec IN
    SELECT 
      sr.id,
      sr.phone_number,
      sr.score,
      sr.created_at,
      'Duplicate phone in short window' as reason
    FROM scoring_requests sr
    WHERE sr.created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL
    GROUP BY sr.id, sr.phone_number, sr.score, sr.created_at
    HAVING COUNT(*) > 3
  LOOP
    v_anomalies := v_anomalies + 1;
    v_suspicious := v_suspicious || jsonb_build_object(
      'type', 'scoring_duplicate',
      'id', rec.id,
      'reason', rec.reason,
      'created_at', rec.created_at
    );
  END LOOP;
  
  -- Check for fraud alerts
  SELECT COUNT(*) INTO v_transactions_checked
  FROM scoring_requests
  WHERE created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL;
  
  -- Check for velocity breaches (using 'payload' column instead of 'details')
  FOR rec IN
    SELECT 
      sa.id,
      sa.alert_type,
      sa.severity,
      sa.payload,
      sa.created_at
    FROM security_alerts sa
    WHERE sa.created_at > NOW() - (p_time_window_minutes || ' minutes')::INTERVAL
      AND sa.alert_type IN ('velocity_breach', 'fraud_detected', 'suspicious_pattern')
  LOOP
    v_anomalies := v_anomalies + 1;
    v_suspicious := v_suspicious || jsonb_build_object(
      'type', 'security_alert',
      'id', rec.id,
      'alert_type', rec.alert_type,
      'severity', rec.severity,
      'created_at', rec.created_at
    );
  END LOOP;
  
  -- Build result
  v_result := jsonb_build_object(
    'passed', v_anomalies = 0,
    'transactions_checked', v_transactions_checked,
    'anomalies_found', v_anomalies,
    'suspicious_entries', v_suspicious,
    'checked_at', NOW(),
    'time_window_minutes', p_time_window_minutes
  );
  
  -- Store result
  INSERT INTO integrity_check_results (
    check_type,
    time_window_minutes,
    transactions_checked,
    anomalies_found,
    suspicious_entries,
    passed,
    checked_by
  ) VALUES (
    'pre_unlock',
    p_time_window_minutes,
    v_transactions_checked,
    v_anomalies,
    v_suspicious,
    v_anomalies = 0,
    auth.uid()
  );
  
  RETURN v_result;
END;
$function$;