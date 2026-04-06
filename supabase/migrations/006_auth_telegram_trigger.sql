-- Обновляем trigger handle_new_user:
-- теперь он подхватывает telegram_id / telegram_username из user_metadata,
-- которые мы проставляем при создании Telegram-юзера через admin API.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url, telegram_id, telegram_username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'user_name'
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NULLIF(NEW.raw_user_meta_data->>'telegram_id', '')::bigint,
    NULLIF(NEW.raw_user_meta_data->>'telegram_username', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
