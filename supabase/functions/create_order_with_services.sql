create or replace function create_order_with_services(
  order_data json,
  services_data json[],
  use_coupon boolean
) returns json language plpgsql as $$
declare
  new_order_id uuid;
begin
  -- Inserisci l'ordine
  insert into orders select * from json_populate_record(null::orders, order_data)
  returning id into new_order_id;

  -- Inserisci il colore della card
  update orders
  set color_card = order_data->>'color_card'
  where id = new_order_id;

  -- Inserisci i servizi collegati
  insert into order_services (order_id, service_id, price, servizio)
  select new_order_id, (s->>'service_id')::uuid, (s->>'price')::numeric, s->>'servizio'
  from unnest(services_data) as s;

  -- Gestisci il coupon se necessario
  if use_coupon then
    delete from customer_coupons
    where customer_id = (order_data->>'customer_uuid')::uuid
    limit 1;
  end if;

  return json_build_object('id', new_order_id, 'status', 'success');
end;
$$;
