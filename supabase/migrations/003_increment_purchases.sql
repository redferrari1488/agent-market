-- RPC-функция для атомарного увеличения счётчика покупок агента
CREATE OR REPLACE FUNCTION increment_purchases_count(agent_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE agents
  SET purchases_count = purchases_count + 1,
      updated_at = now()
  WHERE id = agent_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
