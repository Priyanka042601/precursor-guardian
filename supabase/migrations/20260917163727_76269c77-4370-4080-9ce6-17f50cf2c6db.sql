CREATE TABLE public.safety_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT NOT NULL UNIQUE,
  report_date DATE NOT NULL,
  site TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'HSSE',
  report_type TEXT NOT NULL,
  activity TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_reports TO anon, authenticated;
GRANT ALL ON public.safety_reports TO service_role;
ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Safety reports are readable and editable in the prototype" ON public.safety_reports FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.safety_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.safety_reports(id) ON DELETE CASCADE,
  sif_potential BOOLEAN NOT NULL,
  sif_level TEXT NOT NULL DEFAULT 'Medium',
  life_saving_rule TEXT NOT NULL DEFAULT 'Not mapped',
  activity TEXT NOT NULL DEFAULT 'Unknown',
  location TEXT NOT NULL DEFAULT 'Unknown',
  hazard TEXT NOT NULL DEFAULT 'Unknown',
  barrier_failure TEXT NOT NULL DEFAULT 'Unknown',
  potential_consequence TEXT NOT NULL DEFAULT 'Unknown',
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  explanation TEXT NOT NULL DEFAULT 'Assessment pending HSE review.',
  recommended_focus TEXT NOT NULL DEFAULT 'Review the report with the local HSE team.',
  model TEXT NOT NULL DEFAULT 'Prototype ruleset',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(report_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_analyses TO anon, authenticated;
GRANT ALL ON public.safety_analyses TO service_role;
ALTER TABLE public.safety_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Safety analyses are readable and editable in the prototype" ON public.safety_analyses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.safety_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.safety_reports(id) ON DELETE CASCADE,
  classification TEXT NOT NULL CHECK (classification IN ('SIF', 'NON_SIF', 'NEEDS_REVIEW')),
  reviewed_by TEXT NOT NULL DEFAULT 'HSE User',
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_reviews TO anon, authenticated;
GRANT ALL ON public.safety_reviews TO service_role;
ALTER TABLE public.safety_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Safety reviews are readable and editable in the prototype" ON public.safety_reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.life_saving_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.life_saving_rules TO anon, authenticated;
GRANT ALL ON public.life_saving_rules TO service_role;
ALTER TABLE public.life_saving_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Life-saving rules are readable and editable in the prototype" ON public.life_saving_rules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_safety_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER update_safety_reports_updated_at BEFORE UPDATE ON public.safety_reports FOR EACH ROW EXECUTE FUNCTION public.update_safety_updated_at();
CREATE TRIGGER update_safety_analyses_updated_at BEFORE UPDATE ON public.safety_analyses FOR EACH ROW EXECUTE FUNCTION public.update_safety_updated_at();

INSERT INTO public.life_saving_rules (name, description) VALUES
('Energy Isolation', 'Control hazardous energy before work begins.'),
('Hot Work', 'Manage ignition sources, atmosphere, and fire controls.'),
('Confined Space', 'Control entry, atmosphere, rescue, and attendant requirements.'),
('Line of Fire', 'Keep people clear of moving, dropped, released, or pressurized energy.'),
('Working at Height', 'Prevent falls and dropped objects when working at height.'),
('Lifting Operations', 'Plan lifting activities and control suspended loads.'),
('Driving and Road Safety', 'Control vehicle movement, seatbelts, speed, and interaction.'),
('Permit to Work', 'Use the right permit and verify controls before work starts.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.safety_reports (report_id, report_date, site, department, report_type, activity, description) VALUES
('OIL-SYN-0001','2026-01-04','Site A','Operations','Near Miss','Compressor Maintenance','During compressor maintenance, the electrical isolator was not locked before a technician began work. A second technician noticed the energized indicator and stopped the job.'),
('OIL-SYN-0002','2026-01-07','Site B','Projects','Unsafe Condition','Hot Work','Welding was planned near a hydrocarbon drain. The gas test had not been repeated after a break and the fire hose was not positioned at the work area.'),
('OIL-SYN-0003','2026-01-10','Site C','Operations','Near Miss','Tank Cleaning','A worker entered a tank before the confined-space entry checklist was fully signed. The attendant stopped the entry and the atmosphere was tested.'),
('OIL-SYN-0004','2026-01-12','Site D','Maintenance','Unsafe Act','Valve Replacement','A worker stood in front of a pressurized line while loosening bolts. The line was later found to contain trapped pressure.'),
('OIL-SYN-0005','2026-01-15','Site A','Projects','Unsafe Condition','Scaffold Inspection','A scaffold access gate was missing and the inspection tag was not current. No one had climbed the scaffold when it was reported.'),
('OIL-SYN-0006','2026-01-18','Site B','Logistics','Near Miss','Crane Lifting','A suspended pipe section rotated unexpectedly because the tag line was too short. The lifting supervisor stopped the lift before anyone entered the swing radius.'),
('OIL-SYN-0007','2026-01-20','Site C','Transport','Unsafe Act','Vehicle Movement','A light vehicle reversed near a pedestrian route without a banksman. The driver stopped when a pedestrian sounded a warning.'),
('OIL-SYN-0008','2026-01-23','Site D','Maintenance','Incident','Electrical Testing','A tester received a minor hand shock while checking a panel. The panel had been identified incorrectly and the isolation boundary was unclear.'),
('OIL-SYN-0009','2026-01-26','Site A','Operations','Unsafe Condition','Housekeeping','Loose packaging and small tools were left beside a marked walkway. The items were removed during the same shift.'),
('OIL-SYN-0010','2026-01-29','Site B','Operations','Unsafe Act','Manual Handling','A worker lifted a small valve without gloves. No injury occurred and the supervisor provided a PPE reminder.'),
('OIL-SYN-0011','2026-02-02','Site C','Projects','Near Miss','Pipeline Maintenance','A line break was started under a permit that did not show the latest isolation point. The permit issuer halted the task for revalidation.'),
('OIL-SYN-0012','2026-02-05','Site D','Operations','Unsafe Condition','Confined Space','The rescue tripod was available but the retrieval line was not connected before a vessel entry briefing.'),
('OIL-SYN-0013','2026-02-08','Site A','Projects','Near Miss','Hot Work','A spark from grinding travelled beyond the temporary screen toward stored packaging. Work stopped and the area was cleared.'),
('OIL-SYN-0014','2026-02-11','Site B','Maintenance','Unsafe Act','Working at Height','A technician accessed a pipe rack using a ladder without connecting the required lanyard. The task was stopped from the ground.'),
('OIL-SYN-0015','2026-02-14','Site C','Logistics','Near Miss','Forklift Operations','A forklift carrying a tall load entered an intersection with a blocked view. A spotter intervened before contact with a person or asset.'),
('OIL-SYN-0016','2026-02-17','Site D','Operations','Unsafe Condition','Chemical Transfer','A transfer hose had an overdue inspection label. The transfer had not started and the hose was removed from service.'),
('OIL-SYN-0017','2026-02-20','Site A','Maintenance','Incident','Pump Maintenance','A pump started briefly while guards were being refitted. The worker was clear of the coupling and the stop button was used.'),
('OIL-SYN-0018','2026-02-23','Site B','Projects','Unsafe Condition','Excavation','An excavation edge was not barricaded beside a frequently used route. No person entered the excavation.'),
('OIL-SYN-0019','2026-02-26','Site C','Operations','Near Miss','Pressure Testing','A temporary pressure-test hose separated from its fitting during a low-pressure check. Personnel were outside the exclusion zone.'),
('OIL-SYN-0020','2026-03-01','Site D','Transport','Unsafe Act','Driving','A seatbelt was not worn during a short movement inside the yard. The vehicle was stopped and the driver corrected the behavior.'),
('OIL-SYN-0021','2026-03-04','Site A','Operations','Near Miss','Compressor Maintenance','A maintenance crew began work before the zero-energy check was documented. The supervisor paused the task and confirmed isolation.'),
('OIL-SYN-0022','2026-03-07','Site B','Projects','Near Miss','Hot Work','Hot work started before the combustible materials were fully removed from the adjacent bay. The fire watch stopped the activity.'),
('OIL-SYN-0023','2026-03-10','Site C','Maintenance','Unsafe Condition','Tank Cleaning','Ventilation was reduced during vessel cleaning and the gas monitor alarmed. The entrant exited and the permit was suspended.'),
('OIL-SYN-0024','2026-03-13','Site D','Operations','Near Miss','Valve Replacement','A flange was opened before trapped pressure was confirmed released. A small pressure release was observed and the work stopped.'),
('OIL-SYN-0025','2026-03-16','Site A','Projects','Unsafe Condition','Lifting Operations','The exclusion zone for a crane lift was incomplete at one corner. The lift had not commenced.'),
('OIL-SYN-0026','2026-03-19','Site B','Maintenance','Unsafe Act','Electrical Maintenance','A technician reached toward a panel before proving dead. A colleague intervened and the correct test sequence was completed.'),
('OIL-SYN-0027','2026-03-22','Site C','Operations','Unsafe Condition','Housekeeping','An oily patch was found beside a pump walkway. It was barricaded, cleaned, and reported for follow-up.'),
('OIL-SYN-0028','2026-03-25','Site D','Logistics','Near Miss','Vehicle Interaction','A truck crossed a pedestrian route while the warning beacon was not working. The route was closed until the beacon was repaired.'),
('OIL-SYN-0029','2026-03-28','Site A','Operations','Unsafe Act','PPE Observation','A worker was not wearing eye protection during a low-risk visual inspection. The observation was corrected immediately.'),
('OIL-SYN-0030','2026-03-31','Site B','Projects','Near Miss','Work at Height','A tool was left unsecured on a platform above an active walkway. The area was isolated and the tool was removed.')
ON CONFLICT (report_id) DO NOTHING;

INSERT INTO public.safety_analyses (report_id, sif_potential, sif_level, life_saving_rule, activity, location, hazard, barrier_failure, potential_consequence, evidence, explanation, recommended_focus, model)
SELECT r.id, x.sif_potential, x.sif_level, x.life_saving_rule, r.activity, r.site, x.hazard, x.barrier_failure, x.potential_consequence, x.evidence::jsonb, x.explanation, x.recommended_focus, 'Prototype seed assessment'
FROM public.safety_reports r
JOIN (VALUES
('OIL-SYN-0001',true,'High','Energy Isolation','Electrical energy','Isolation and zero-energy verification','Potential serious injury or fatality from energized equipment','["Electrical isolator was not locked","Energized indicator was visible"]','The report describes maintenance beginning before the electrical source was secured, creating credible exposure to hazardous energy.','Verify lockout, tagout, and zero-energy checks before maintenance.'),
('OIL-SYN-0002',true,'High','Hot Work','Hydrocarbon vapour and ignition','Gas testing and fire controls','Fire or explosion with serious injury potential','["Gas test was not repeated","Fire hose was not positioned"]','Hot work was planned near a hydrocarbon drain without confirmed atmospheric and fire controls.','Confirm gas testing, area preparation, and fire watch controls before hot work.'),
('OIL-SYN-0003',true,'High','Confined Space','Atmospheric hazard','Confined space entry controls','Serious injury or fatality from hazardous atmosphere','["Entry checklist was incomplete","Entry was stopped before completion"]','The report indicates a confined-space entry was attempted before required controls were fully verified.','Require completed entry checklist, atmosphere testing, attendant, and rescue readiness.'),
('OIL-SYN-0004',true,'High','Line of Fire','Trapped pressure','Pressurized line break','Serious injury from stored pressure release','["Worker stood in front of the line","Trapped pressure was present"]','The worker was positioned in the line of fire while stored pressure remained possible.','Verify depressurization and keep personnel outside the release path.'),
('OIL-SYN-0013',true,'High','Hot Work','Sparks and combustible material','Hot work exclusion zone','Fire and serious injury potential','["Sparks travelled beyond the screen","Packaging was nearby"]','Sparks crossed the intended boundary toward combustible material, showing an ineffective exclusion barrier.','Strengthen hot-work screening, housekeeping, and fire-watch controls.'),
('OIL-SYN-0014',true,'High','Working at Height','Fall from height','Pipe rack access','Serious injury from a fall','["Lanyard was not connected","Access was stopped"]','The worker accessed height without the required fall-protection connection.','Verify anchor points and fall-protection use before access.'),
('OIL-SYN-0017',true,'High','Energy Isolation','Unexpected mechanical movement','Pump maintenance','Serious injury from rotating equipment','["Pump started briefly","Guards were being refitted"]','Unexpected equipment movement occurred during maintenance, indicating isolation was not fully effective.','Confirm isolation and try-start checks before guards or couplings are handled.'),
('OIL-SYN-0021',true,'High','Energy Isolation','Stored mechanical energy','Compressor maintenance','Serious injury from unexpected start-up','["Zero-energy check was not documented","Supervisor paused the task"]','The work began before zero-energy status was documented, leaving a credible exposure to unexpected start-up.','Make zero-energy verification a release point before maintenance begins.'),
('OIL-SYN-0022',true,'High','Hot Work','Ignition near combustibles','Hot work preparation','Fire or explosion with serious injury potential','["Combustibles remained nearby","Fire watch stopped the activity"]','Hot work controls were incomplete when ignition sources were introduced near combustible materials.','Clear combustibles and verify fire watch before ignition.'),
('OIL-SYN-0023',true,'High','Confined Space','Reduced ventilation and atmosphere','Vessel cleaning','Serious injury from hazardous atmosphere','["Gas monitor alarmed","Ventilation was reduced"]','The atmosphere changed during confined-space work and triggered an alarm, indicating loss of a critical barrier.','Maintain ventilation, continuous monitoring, and immediate exit criteria.'),
('OIL-SYN-0024',true,'High','Line of Fire','Trapped pressure','Flange opening','Serious injury from pressure release','["Flange was opened before pressure release was confirmed","Pressure release occurred"]','The report describes a pressure release while the flange was being opened, creating direct line-of-fire exposure.','Confirm isolation and zero pressure before breaking containment.'),
('OIL-SYN-0026',true,'High','Energy Isolation','Electrical energy','Electrical panel maintenance','Serious injury from electrical exposure','["Technician reached toward panel","Prove-dead sequence was not complete"]','The worker approached an electrical panel before the safe test sequence was completed.','Require isolation, prove-dead, and peer verification before electrical work.'),
('OIL-SYN-0030',true,'High','Working at Height','Dropped object','Platform work above walkway','Serious injury from a dropped object','["Tool was unsecured","Active walkway was below"]','An unsecured tool was positioned above people, creating credible dropped-object potential.','Secure tools and isolate areas below elevated work.'),
('OIL-SYN-0005',false,'Low','Working at Height','Fall hazard','Scaffold access','Potential fall exposure if accessed','["Access gate was missing","Inspection tag was not current"]','The scaffold condition requires correction, but no exposure occurred before it was reported.','Correct scaffold access and inspection controls before use.'),
('OIL-SYN-0006',true,'Medium','Lifting Operations','Suspended load','Crane lifting area','Serious injury from load movement','["Load rotated unexpectedly","Swing radius was controlled"]','Unexpected load movement occurred during lifting, with controls preventing personnel exposure.','Reconfirm lift plan, tag-line suitability, and exclusion zones.'),
('OIL-SYN-0007',true,'Medium','Driving and Road Safety','Vehicle-pedestrian interaction','Site road','Serious injury from vehicle contact','["No banksman was present","Pedestrian route was nearby"]','Vehicle movement occurred near pedestrians without the expected control person.','Separate routes and use a banksman for reversing near pedestrians.'),
('OIL-SYN-0008',true,'High','Energy Isolation','Electrical energy','Electrical panel testing','Serious injury from electrical exposure','["Minor shock occurred","Isolation boundary was unclear"]','A shock during testing indicates the electrical isolation and identification controls were not reliable.','Verify panel identity, isolation boundary, and test method.'),
('OIL-SYN-0011',true,'High','Permit to Work','Hazardous energy','Pipeline maintenance','Serious injury from unexpected release','["Permit did not show latest isolation","Task was halted"]','The permit did not reflect the current isolation state, weakening a critical barrier before line work.','Revalidate permits against field isolation points before work.'),
('OIL-SYN-0012',true,'Medium','Confined Space','Rescue readiness','Confined space entry','Potential serious consequence if an entrant becomes incapacitated','["Retrieval line was not connected","Entry had not started"]','A required rescue barrier was missing before entry, but exposure was prevented.','Verify rescue equipment is connected and ready before entry.'),
('OIL-SYN-0015',true,'Medium','Driving and Road Safety','Vehicle-pedestrian interaction','Forklift intersection','Serious injury from vehicle contact','["Forklift view was blocked","Spotter intervened"]','A blocked view at an intersection created credible vehicle interaction risk.','Control blind intersections and use spotters for restricted visibility.'),
('OIL-SYN-0019',true,'High','Line of Fire','Stored pressure','Pressure testing','Serious injury from hose separation','["Hose separated","Personnel were outside the exclusion zone"]','A pressure-test component failed, demonstrating credible stored-energy release potential.','Verify fittings, barriers, and exclusion zones before pressure testing.'),
('OIL-SYN-0025',false,'Medium','Lifting Operations','Suspended load','Crane lifting area','Potential struck-by exposure','["Exclusion zone was incomplete","Lift had not commenced"]','The lifting control gap was identified before the load was moved.','Complete the exclusion zone before commencing the lift.'),
('OIL-SYN-0028',true,'Medium','Driving and Road Safety','Vehicle-pedestrian interaction','Site road','Serious injury from vehicle contact','["Truck crossed pedestrian route","Warning beacon was not working"]','A vehicle entered a pedestrian route while a warning control was unavailable.','Repair vehicle warnings and physically separate pedestrian routes.'),
('OIL-SYN-0009',false,'Low','Not mapped','Slip, trip, and housekeeping','Walkway','Minor injury potential','["Tools were beside walkway","Items were removed"]','The observation describes a housekeeping issue without a credible SIF pathway in the reported circumstances.','Maintain clear walkways and close housekeeping actions promptly.'),
('OIL-SYN-0010',false,'Low','Not mapped','Manual handling','Work area','Minor hand injury potential','["Gloves were not worn","No injury occurred"]','The report describes a PPE observation with no indication of serious injury or fatality potential.','Reinforce task-appropriate PPE expectations.'),
('OIL-SYN-0016',false,'Medium','Permit to Work','Chemical transfer','Transfer area','Exposure or release potential','["Inspection label was overdue","Transfer had not started"]','The hose control was overdue, but the transfer was stopped before exposure occurred.','Keep hose inspection status current before transfer work.'),
('OIL-SYN-0018',false,'Medium','Line of Fire','Excavation edge','Excavation route','Fall into excavation','["Edge was not barricaded","No person entered"]','A missing barricade created a hazard, but the report does not indicate actual SIF exposure.','Barricade excavation edges before work or access.'),
('OIL-SYN-0020',false,'Low','Driving and Road Safety','Vehicle movement','Site yard','Low-speed vehicle exposure','["Seatbelt was not worn","Behavior was corrected"]','The report describes a corrected driving behavior with limited reported consequence potential.','Reinforce seatbelt use for every vehicle movement.'),
('OIL-SYN-0027',false,'Low','Not mapped','Housekeeping','Pump walkway','Slip hazard','["Oily patch was found","Area was barricaded and cleaned"]','The housekeeping issue was controlled before an event occurred.','Maintain spill response and inspect pump walkways routinely.'),
('OIL-SYN-0029',false,'Low','Not mapped','Visual inspection','Work area','Eye exposure','["Eye protection was absent","Observation was corrected"]','The observation indicates a PPE gap without a credible SIF pathway in context.','Use task-specific eye protection consistently.')
) AS x(report_id,sif_potential,sif_level,life_saving_rule,hazard,barrier_failure,potential_consequence,evidence,explanation,recommended_focus) ON x.report_id = r.report_id
ON CONFLICT (report_id) DO NOTHING;