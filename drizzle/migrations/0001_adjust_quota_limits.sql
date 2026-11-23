CREATE OR REPLACE FUNCTION public.consume_user_quota(_email text, _quota_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content_limit int := 40;
  v_calendar_limit int := 2;
  v_content_used int;
  v_calendar_used int;
  v_used int;
  v_limit int;
BEGIN
  IF _quota_type NOT IN ('content','calendar') THEN
    RAISE EXCEPTION 'Tipo de cota invalido: %', _quota_type;
  END IF;

  SELECT count(*) INTO v_content_used FROM public.quota_usage
   WHERE email = lower(_email) AND quota_type = 'content' AND created_at > now() - interval '30 days';
  SELECT count(*) INTO v_calendar_used FROM public.quota_usage
   WHERE email = lower(_email) AND quota_type = 'calendar' AND created_at > now() - interval '30 days';

  v_used := CASE WHEN _quota_type = 'content' THEN v_content_used ELSE v_calendar_used END;
  v_limit := CASE WHEN _quota_type = 'content' THEN v_content_limit ELSE v_calendar_limit END;

  IF v_used >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', CASE WHEN _quota_type = 'content'
        THEN format('Voce atingiu o limite de %s criacoes de conteudo neste ciclo de 30 dias. O saldo renova automaticamente.', v_limit)
        ELSE format('Voce atingiu o limite de %s calendarios neste ciclo de 30 dias. O saldo renova automaticamente.', v_limit)
      END,
      'content_used', v_content_used, 'content_limit', v_content_limit,
      'calendar_used', v_calendar_used, 'calendar_limit', v_calendar_limit
    );
  END IF;

  INSERT INTO public.quota_usage (email, quota_type) VALUES (lower(_email), _quota_type);

  IF _quota_type = 'content' THEN v_content_used := v_content_used + 1;
  ELSE v_calendar_used := v_calendar_used + 1; END IF;

  RETURN jsonb_build_object(
    'allowed', true, 'reason', null,
    'content_used', v_content_used, 'content_limit', v_content_limit,
    'calendar_used', v_calendar_used, 'calendar_limit', v_calendar_limit
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_quota(_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content_limit int := 40;
  v_calendar_limit int := 2;
  v_content_used int;
  v_calendar_used int;
BEGIN
  SELECT count(*) INTO v_content_used FROM public.quota_usage
   WHERE email = lower(_email) AND quota_type = 'content' AND created_at > now() - interval '30 days';
  SELECT count(*) INTO v_calendar_used FROM public.quota_usage
   WHERE email = lower(_email) AND quota_type = 'calendar' AND created_at > now() - interval '30 days';

  RETURN jsonb_build_object(
    'content_used', v_content_used, 'content_limit', v_content_limit,
    'calendar_used', v_calendar_used, 'calendar_limit', v_calendar_limit
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_user_quota(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_quota(text) TO authenticated;