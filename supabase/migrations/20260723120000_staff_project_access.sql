-- Staff (admin/support) can open customer projects from the admin cabinet.
-- Without these policies, getProjectById() returns null under RLS for non-owners.

create or replace function public.is_staff_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and (
        p.role in ('admin', 'super_admin', 'support', 'analyst', 'prompt_manager')
        or lower(p.email) in ('tvtska@gmail.com', 'd.pishalkin@gmail.com')
      )
  );
$$;

revoke all on function public.is_staff_user() from public;
grant execute on function public.is_staff_user() to authenticated;

create or replace function public.staff_can_access_project(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_staff_user()
    and exists (select 1 from public.projects p where p.id = p_project_id);
$$;

revoke all on function public.staff_can_access_project(uuid) from public;
grant execute on function public.staff_can_access_project(uuid) to authenticated;

-- ─── Core project tables ─────────────────────────────────────────────────────

create policy "Staff manage all projects"
  on public.projects for all
  using (public.is_staff_user())
  with check (public.is_staff_user());

create policy "Staff manage project contexts"
  on public.project_contexts for all
  using (public.staff_can_access_project(project_id))
  with check (public.staff_can_access_project(project_id));

create policy "Staff manage project events"
  on public.project_events for all
  using (public.staff_can_access_project(project_id))
  with check (public.staff_can_access_project(project_id));

create policy "Staff manage project insights"
  on public.project_insights for all
  using (public.staff_can_access_project(project_id))
  with check (public.staff_can_access_project(project_id));

create policy "Staff manage hypotheses"
  on public.hypotheses for all
  using (public.staff_can_access_project(project_id))
  with check (public.staff_can_access_project(project_id));

create policy "Staff manage project memories"
  on public.project_memories for all
  using (public.staff_can_access_project(project_id))
  with check (public.staff_can_access_project(project_id));

create policy "Staff manage project memory updates"
  on public.project_memory_updates for all
  using (public.staff_can_access_project(project_id))
  with check (public.staff_can_access_project(project_id));

create policy "Staff manage project files"
  on public.project_files for all
  using (public.staff_can_access_project(project_id))
  with check (public.staff_can_access_project(project_id));

create policy "Staff manage commercial metrics"
  on public.commercial_metrics for all
  using (public.staff_can_access_project(project_id))
  with check (public.staff_can_access_project(project_id));

create policy "Staff manage project plans"
  on public.project_plans for all
  using (public.staff_can_access_project(project_id))
  with check (public.staff_can_access_project(project_id));

-- ─── Competitor intelligence ─────────────────────────────────────────────────

create policy "Staff manage competitor profiles"
  on public.competitor_profiles for all
  using (public.staff_can_access_project(project_id))
  with check (public.staff_can_access_project(project_id));

create policy "Staff read competitor audits"
  on public.competitor_audits for select
  using (public.staff_can_access_project(project_id));

create policy "Staff read niche snapshots"
  on public.niche_snapshots for select
  using (public.staff_can_access_project(project_id));

create policy "Staff manage competitor change alerts"
  on public.competitor_change_alerts for all
  using (public.staff_can_access_project(project_id))
  with check (public.staff_can_access_project(project_id));

-- ─── Predictive model ────────────────────────────────────────────────────────

create policy "Staff manage predictive models"
  on public.predictive_models for all
  using (public.staff_can_access_project(project_id))
  with check (public.staff_can_access_project(project_id));

create policy "Staff manage predictive categories"
  on public.predictive_categories for all
  using (
    exists (
      select 1
      from public.predictive_models m
      where m.id = predictive_categories.model_id
        and public.staff_can_access_project(m.project_id)
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_models m
      where m.id = predictive_categories.model_id
        and public.staff_can_access_project(m.project_id)
    )
  );

create policy "Staff manage predictive metrics"
  on public.predictive_metrics for all
  using (
    exists (
      select 1
      from public.predictive_categories c
      join public.predictive_models m on m.id = c.model_id
      where c.id = predictive_metrics.category_id
        and public.staff_can_access_project(m.project_id)
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_categories c
      join public.predictive_models m on m.id = c.model_id
      where c.id = predictive_metrics.category_id
        and public.staff_can_access_project(m.project_id)
    )
  );

create policy "Staff manage predictive periods"
  on public.predictive_periods for all
  using (
    exists (
      select 1
      from public.predictive_models m
      where m.id = predictive_periods.model_id
        and public.staff_can_access_project(m.project_id)
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_models m
      where m.id = predictive_periods.model_id
        and public.staff_can_access_project(m.project_id)
    )
  );

create policy "Staff manage predictive plan values"
  on public.predictive_plan_values for all
  using (
    exists (
      select 1
      from public.predictive_metrics mt
      join public.predictive_categories c on c.id = mt.category_id
      join public.predictive_models m on m.id = c.model_id
      where mt.id = predictive_plan_values.metric_id
        and public.staff_can_access_project(m.project_id)
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_metrics mt
      join public.predictive_categories c on c.id = mt.category_id
      join public.predictive_models m on m.id = c.model_id
      where mt.id = predictive_plan_values.metric_id
        and public.staff_can_access_project(m.project_id)
    )
  );

create policy "Staff manage predictive fact values"
  on public.predictive_fact_values for all
  using (
    exists (
      select 1
      from public.predictive_metrics mt
      join public.predictive_categories c on c.id = mt.category_id
      join public.predictive_models m on m.id = c.model_id
      where mt.id = predictive_fact_values.metric_id
        and public.staff_can_access_project(m.project_id)
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_metrics mt
      join public.predictive_categories c on c.id = mt.category_id
      join public.predictive_models m on m.id = c.model_id
      where mt.id = predictive_fact_values.metric_id
        and public.staff_can_access_project(m.project_id)
    )
  );

create policy "Staff manage predictive calculated values"
  on public.predictive_calculated_values for all
  using (
    exists (
      select 1
      from public.predictive_metrics mt
      join public.predictive_categories c on c.id = mt.category_id
      join public.predictive_models m on m.id = c.model_id
      where mt.id = predictive_calculated_values.metric_id
        and public.staff_can_access_project(m.project_id)
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_metrics mt
      join public.predictive_categories c on c.id = mt.category_id
      join public.predictive_models m on m.id = c.model_id
      where mt.id = predictive_calculated_values.metric_id
        and public.staff_can_access_project(m.project_id)
    )
  );

create policy "Staff manage predictive metric dependencies"
  on public.predictive_metric_dependencies for all
  using (
    exists (
      select 1
      from public.predictive_models m
      where m.id = predictive_metric_dependencies.model_id
        and public.staff_can_access_project(m.project_id)
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_models m
      where m.id = predictive_metric_dependencies.model_id
        and public.staff_can_access_project(m.project_id)
    )
  );

create policy "Staff manage predictive comments"
  on public.predictive_comments for all
  using (
    exists (
      select 1
      from public.predictive_models m
      where m.id = predictive_comments.model_id
        and public.staff_can_access_project(m.project_id)
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_models m
      where m.id = predictive_comments.model_id
        and public.staff_can_access_project(m.project_id)
    )
  );

create policy "Staff manage predictive alerts"
  on public.predictive_alerts for all
  using (
    exists (
      select 1
      from public.predictive_models m
      where m.id = predictive_alerts.model_id
        and public.staff_can_access_project(m.project_id)
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_models m
      where m.id = predictive_alerts.model_id
        and public.staff_can_access_project(m.project_id)
    )
  );

create policy "Staff manage predictive action items"
  on public.predictive_action_items for all
  using (
    exists (
      select 1
      from public.predictive_models m
      where m.id = predictive_action_items.model_id
        and public.staff_can_access_project(m.project_id)
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_models m
      where m.id = predictive_action_items.model_id
        and public.staff_can_access_project(m.project_id)
    )
  );

-- ─── Storage: project file blobs live under the owner's user_id prefix ───────

create policy "project-files select staff"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'project-files' and public.is_staff_user());

create policy "project-files insert staff"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'project-files' and public.is_staff_user());

create policy "project-files update staff"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'project-files' and public.is_staff_user())
  with check (bucket_id = 'project-files' and public.is_staff_user());

create policy "project-files delete staff"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'project-files' and public.is_staff_user());
