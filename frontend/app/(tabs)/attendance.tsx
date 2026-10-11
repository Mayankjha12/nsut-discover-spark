import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Badge, Button, Card, Empty, Loading, Message, Page, ui } from "@/src/components/campus";
import { attendancePlan, freshness, overall, percentage, validCounts } from "@/src/domain/academic";
import { useAcademic } from "@/src/use-academic";
import { ProgressRing } from "@/src/components/progress-ring";
export default function Attendance() {
  const { data, target, loading, error } = useAcademic(), router = useRouter();
  const [attention, setAttention] = useState(false), [plan, setPlan] = useState<Record<string, { attend: number; miss: number }>>({});
  const subjects = data.attendance?.data ?? [], total = overall(subjects);
  const shown = subjects.filter(s => !attention || (s.percent !== null && s.percent < target));
  return <Page title="Attendance" subtitle="Subject-wise records and class estimates." testID="attendance-root" action={<Button label="Open IMS" icon="refresh-cw" onPress={() => router.push('/login')}/> }>
    {error ? <Message>{error}</Message> : null}{loading ? <Loading/> : null}
    {!data.attendance && !loading ? <Empty icon="activity" title="No attendance saved yet" message="IMS has not returned a supported attendance report yet. Open IMS and check the selected semester."><Button label="Connect to IMS" onPress={() => router.push('/login')}/></Empty> : null}
    {data.attendance ? <><Card><View style={ui.row}><ProgressRing percent={total} size={120} color="#78DCC8"/><View style={{ flex: 1, minWidth: 160, gap: 8 }}><Text style={ui.h2}>Overall attendance</Text><Text style={ui.muted}>{total === null ? 'Overall unavailable: complete class counts are required for every subject.' : 'Calculated from attended ÷ held classes across all subjects.'}</Text><Text style={ui.small}>{freshness(data.attendance.capturedAt)} · {data.attendance.source === 'ims-page' ? 'IMS page' : 'Personal backup'}</Text></View></View></Card>
    <View style={ui.row}><Badge tone="info">Personal target: {target}%</Badge><Text style={ui.small}>Your target for planning classes; check your course’s attendance rule.</Text><Button label="Change target" secondary onPress={() => router.push('/(tabs)/more')}/></View>
    <View style={ui.row}><Button label="All subjects" secondary={attention} onPress={() => setAttention(false)}/><Button label="Below my target" secondary={!attention} onPress={() => setAttention(true)}/>{Object.values(plan).some(p => p.attend || p.miss) ? <Button label="Reset estimates" secondary onPress={() => setPlan({})}/> : null}</View>
    {!shown.length ? <Empty title="No subjects in this view" message="Try All subjects. Missing percentages are not classified as below target."/> : null}
    {shown.map(s => {
      const scenario = plan[s.code] ?? { attend: 0, miss: 0 }, change = scenario.attend + scenario.miss, counts = validCounts(s.present, s.total);
      const projectedA = counts ? s.present! + scenario.attend : null, projectedT = counts ? s.total! + change : null;
      const pct = change ? percentage(projectedA, projectedT) : s.percent, estimate = attendancePlan(projectedA, projectedT, target);
      const color = pct === null ? '#AEB5C3' : pct < target ? '#F6BE72' : '#78DCC8';
      return <Card key={s.code}><View style={ui.row}><View style={{ flex: 1, minWidth: 140 }}><Text style={ui.h2}>{s.name}</Text><Text style={ui.small}>{s.code}</Text></View><Text style={{ color, fontSize: 30, fontWeight: '700' }}>{pct === null ? '—' : `${pct.toFixed(1)}%`}</Text></View>
        <View accessibilityLabel={`${s.name}: ${pct === null ? 'unknown attendance' : pct.toFixed(1) + ' percent'}`} style={{ height: 6, backgroundColor: '#2A303C', borderRadius: 4 }}><View style={{ height: 6, width: `${pct ?? 0}%`, backgroundColor: color, borderRadius: 4 }}/></View>
        <Text style={ui.muted}>{counts ? `${s.present} attended · ${s.total! - s.present!} missed · ${s.total} held` : 'Complete counts not provided; class-planning estimates unavailable.'}</Text>
        {estimate ? <><Text style={ui.text}>{estimate.kind === 'unreachable' ? '100% cannot be reached after a missed class in this running total.' : estimate.kind === 'can-miss' ? `Estimated allowance: ${estimate.count} future ${estimate.count === 1 ? 'class' : 'classes'} at your ${target}% target.` : `Attend the next ${estimate.count} classes to reach your ${target}% target.`}</Text><View style={ui.row}><Button label={`Plan attend · ${s.code}`} secondary onPress={() => setPlan({ ...plan, [s.code]: { ...scenario, attend: Math.min(1000, scenario.attend + 1) } })}/><Button label={`Plan miss · ${s.code}`} secondary onPress={() => setPlan({ ...plan, [s.code]: { ...scenario, miss: Math.min(1000, scenario.miss + 1) } })}/></View>{change ? <Badge tone="info">What-if only: {scenario.attend} attended + {scenario.miss} missed future classes</Badge> : null}</> : null}
      </Card>;
    })}
    {data.history.length >= 2 ? <Card><Text style={ui.h2}>Saved attendance trend</Text><Text style={ui.small}>Each bar is a successful saved overall snapshot, not a daily observation.</Text>{data.history.slice(-7).map((h,i) => <View key={`${h.at}-${i}`} style={{ gap: 5 }}><Text style={ui.small}>{new Date(h.at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} · {h.percent.toFixed(1)}%</Text><View style={{ backgroundColor: '#26303B', height: 8, borderRadius: 4 }}><View style={{ width: `${h.percent}%`, height: 8, backgroundColor: '#78DCC8', borderRadius: 4 }}/></View></View>)}</Card> : null}
    </> : null}
  </Page>;
}
